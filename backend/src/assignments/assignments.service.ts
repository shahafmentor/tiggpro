import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ChoreAssignment,
  ChoreSubmission,
  TenantMember,
  Chore,
  User,
} from '@/entities';
import { SubmitAssignmentDto, ReviewSubmissionDto } from './dto';
import {
  AssignmentStatus,
  ReviewStatus,
  TenantMemberRole,
} from '@tiggpro/shared';
import { PointsService } from '@/gamification/services/points.service';
import { RealtimeEventsService } from '@/websocket/realtime-events.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(ChoreAssignment)
    private assignmentRepository: Repository<ChoreAssignment>,
    @InjectRepository(ChoreSubmission)
    private submissionRepository: Repository<ChoreSubmission>,
    @InjectRepository(TenantMember)
    private tenantMemberRepository: Repository<TenantMember>,
    @InjectRepository(Chore)
    private choreRepository: Repository<Chore>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private pointsService: PointsService,
    private realtimeEventsService: RealtimeEventsService,
  ) {}

  async getUserAssignments(
    tenantId: string,
    userId: string,
  ): Promise<ChoreAssignment[]> {
    // Verify user is member of tenant
    await this.verifyUserMembership(tenantId, userId);

    return this.assignmentRepository.find({
      where: { assignedTo: userId },
      relations: ['chore'],
      order: { dueDate: 'ASC' },
    });
  }

  async getAssignmentById(
    assignmentId: string,
    tenantId: string,
    userId: string,
  ): Promise<ChoreAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['chore'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify the chore belongs to the tenant
    const chore = await this.choreRepository.findOne({
      where: { id: assignment.choreId, tenantId },
    });

    if (!chore) {
      throw new NotFoundException('Assignment not found in this tenant');
    }

    // Verify user has access (assigned user, or admin/parent)
    const userRole = await this.getUserRole(tenantId, userId);
    if (
      assignment.assignedTo !== userId &&
      ![TenantMemberRole.ADMIN, TenantMemberRole.PARENT].includes(userRole)
    ) {
      throw new ForbiddenException('You can only view your own assignments');
    }

    return assignment;
  }

  async submitAssignment(
    assignmentId: string,
    tenantId: string,
    submitDto: SubmitAssignmentDto,
    userId: string,
  ): Promise<ChoreSubmission> {
    const assignment = await this.getAssignmentById(
      assignmentId,
      tenantId,
      userId,
    );

    // Verify user is the assignee
    if (assignment.assignedTo !== userId) {
      throw new ForbiddenException('You can only submit your own assignments');
    }

    // Verify assignment can be submitted (pending or rejected for resubmission)
    if (assignment.status !== AssignmentStatus.PENDING && assignment.status !== AssignmentStatus.REJECTED) {
      throw new BadRequestException('This assignment cannot be submitted');
    }

    // Check if there's already a pending submission
    const existingSubmission = await this.submissionRepository.findOne({
      where: { assignmentId, reviewStatus: ReviewStatus.PENDING },
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'There is already a pending submission for this assignment',
      );
    }

    // Create submission
    const submission = this.submissionRepository.create({
      assignmentId,
      submittedBy: userId,
      submissionNotes: submitDto.submissionNotes,
      mediaUrls: submitDto.mediaUrls || [],
      reviewStatus: ReviewStatus.PENDING,
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // Update assignment status (always set to SUBMITTED for new submissions)
    assignment.status = AssignmentStatus.SUBMITTED;
    await this.assignmentRepository.save(assignment);

    // Get user details and chore details for real-time event
    const [submittedByUser, chore] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.choreRepository.findOne({ where: { id: assignment.choreId } }),
    ]);

    if (submittedByUser && chore) {
      // Emit real-time event for assignment submission
      this.realtimeEventsService.emitAssignmentSubmitted(
        chore.tenantId,
        {
          submissionId: savedSubmission.id,
          assignmentId: assignment.id,
          choreTitle: chore.title,
          submittedBy: {
            id: submittedByUser.id,
            displayName: submittedByUser.displayName,
            email: submittedByUser.email,
          },
          submissionNotes: savedSubmission.submissionNotes,
          mediaUrls: savedSubmission.mediaUrls,
        },
        userId, // Exclude the submitter from receiving the notification
      );
    }

    return savedSubmission;
  }

  async reviewSubmission(
    submissionId: string,
    tenantId: string,
    reviewDto: ReviewSubmissionDto,
    reviewerId: string,
  ): Promise<ChoreSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'assignment.chore'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Verify the submission belongs to this tenant
    if (submission.assignment.chore.tenantId !== tenantId) {
      throw new NotFoundException('Submission not found in this tenant');
    }

    // Verify user has permission to review (ADMIN or PARENT)
    await this.verifyUserPermission(tenantId, reviewerId, [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ]);

    // Verify submission is pending review
    if (submission.reviewStatus !== ReviewStatus.PENDING) {
      throw new BadRequestException(
        'This submission has already been reviewed',
      );
    }

    // Update submission with review
    submission.reviewStatus = reviewDto.reviewStatus;
    submission.reviewFeedback = reviewDto.reviewFeedback;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();

    // Set points (use chore defaults if not specified)
    if (reviewDto.reviewStatus === ReviewStatus.APPROVED) {
      submission.pointsAwarded =
        reviewDto.pointsAwarded ?? submission.assignment.chore.pointsReward;
    } else {
      submission.pointsAwarded = 0;
    }

    const savedSubmission = await this.submissionRepository.save(submission);

    // Update assignment status
    const assignment = submission.assignment;
    assignment.status =
      reviewDto.reviewStatus === ReviewStatus.APPROVED
        ? AssignmentStatus.APPROVED
        : AssignmentStatus.REJECTED;
    await this.assignmentRepository.save(assignment);

    // 🎮 AWARD POINTS AND TRIGGER ACHIEVEMENTS if approved
    if (
      reviewDto.reviewStatus === ReviewStatus.APPROVED &&
      (savedSubmission.pointsAwarded || 0) > 0
    ) {
      try {
        await this.pointsService.awardPoints(
          submission.assignment.assignedTo,
          tenantId,
          savedSubmission,
        );
      } catch (error) {
        // Log error but don't fail the review if points award fails
        console.error(
          'Failed to award points for submission:',
          savedSubmission.id,
          error,
        );
      }
    }

    // Get user details for real-time event
    const [reviewedByUser, submittedByUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: reviewerId } }),
      this.userRepository.findOne({ where: { id: submission.submittedBy } }),
    ]);

    if (reviewedByUser && submittedByUser) {
      // Emit real-time event for assignment review
      this.realtimeEventsService.emitAssignmentReviewed(
        tenantId,
        {
          submissionId: savedSubmission.id,
          assignmentId: savedSubmission.assignmentId,
          choreTitle: submission.assignment.chore.title,
          reviewStatus: savedSubmission.reviewStatus as 'approved' | 'rejected',
          reviewFeedback: savedSubmission.reviewFeedback,
          pointsAwarded: savedSubmission.pointsAwarded,
          reviewedBy: {
            id: reviewedByUser.id,
            displayName: reviewedByUser.displayName,
            email: reviewedByUser.email,
          },
          submittedBy: {
            id: submittedByUser.id,
            displayName: submittedByUser.displayName,
            email: submittedByUser.email,
          },
        },
        reviewerId, // Exclude the reviewer from receiving the notification
      );
    }

    return savedSubmission;
  }

  async getPendingSubmissions(
    tenantId: string,
    userId: string,
  ): Promise<ChoreSubmission[]> {
    // Verify user has permission to view submissions (ADMIN or PARENT)
    await this.verifyUserPermission(tenantId, userId, [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ]);

    // First get all assignments for this tenant
    const tenantAssignments = await this.assignmentRepository.find({
      where: {
        chore: {
          tenantId: tenantId
        }
      },
      select: ['id']
    });

    const assignmentIds = tenantAssignments.map(a => a.id);

    const submissions = await this.submissionRepository.find({
      where: {
        reviewStatus: ReviewStatus.PENDING,
        assignmentId: In(assignmentIds)
      },
      relations: [
        'assignment',
        'assignment.chore',
        'assignment.assignee',  // Include the assigned user data
        'assignment.assigner'   // Include the assigner user data
      ],
      order: { submittedAt: 'ASC' },
    });

    return submissions;
  }

  private async verifyUserMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantMember> {
    const membership = await this.tenantMemberRepository.findOne({
      where: { tenantId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this tenant');
    }

    return membership;
  }

  private async verifyUserPermission(
    tenantId: string,
    userId: string,
    allowedRoles: TenantMemberRole[],
  ): Promise<void> {
    const membership = await this.verifyUserMembership(tenantId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }
  }

  private async getUserRole(
    tenantId: string,
    userId: string,
  ): Promise<TenantMemberRole> {
    const membership = await this.verifyUserMembership(tenantId, userId);
    return membership.role;
  }
}
