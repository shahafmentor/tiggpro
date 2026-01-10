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

    return this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.choreInstance', 'choreInstance')
      .leftJoinAndSelect('assignment.submissions', 'submissions')
      .leftJoinAndSelect('submissions.reviewer', 'reviewer')
      .where('assignment.assignedTo = :userId', { userId })
      .andWhere('choreInstance.tenantId = :tenantId', { tenantId })
      .orderBy('assignment.dueDate', 'ASC')
      .addOrderBy('submissions.submittedAt', 'DESC')
      .getMany();
  }

  async getAssignmentById(
    assignmentId: string,
    tenantId: string,
    userId: string,
  ): Promise<ChoreAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['choreInstance'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify the assignment belongs to the tenant (via snapshot instance)
    if (!assignment.choreInstance || assignment.choreInstance.tenantId !== tenantId) {
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
    if (
      assignment.status !== AssignmentStatus.PENDING &&
      assignment.status !== AssignmentStatus.REJECTED
    ) {
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

    // Get user details and chore instance details for real-time event
    const submittedByUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (submittedByUser && assignment.choreInstance) {
      // Emit real-time event for assignment submission
      this.realtimeEventsService.emitAssignmentSubmitted(
        tenantId,
        {
          submissionId: savedSubmission.id,
          assignmentId: assignment.id,
          choreTitle: assignment.choreInstance.title,
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
      relations: ['assignment', 'assignment.choreInstance'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Verify the submission belongs to this tenant
    if (
      !submission.assignment?.choreInstance ||
      submission.assignment.choreInstance.tenantId !== tenantId
    ) {
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

    // Set points (use chore instance snapshot defaults if not specified)
    if (reviewDto.reviewStatus === ReviewStatus.APPROVED) {
      submission.pointsAwarded =
        reviewDto.pointsAwarded ??
        submission.assignment?.choreInstance?.pointsReward ??
        0;
    } else {
      submission.pointsAwarded = 0;
    }

    const savedSubmission = await this.submissionRepository.save(submission);

    // Update assignment status
    if (submission.assignment) {
      submission.assignment.status =
        reviewDto.reviewStatus === ReviewStatus.APPROVED
          ? AssignmentStatus.APPROVED
          : AssignmentStatus.REJECTED;
      await this.assignmentRepository.save(submission.assignment);
    }

    // 🎮 AWARD POINTS AND TRIGGER ACHIEVEMENTS if approved
    if (
      reviewDto.reviewStatus === ReviewStatus.APPROVED &&
      (savedSubmission.pointsAwarded || 0) > 0 &&
      submission.assignment?.assignedTo
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

    if (
      reviewedByUser &&
      submittedByUser &&
      submission.assignment?.choreInstance
    ) {
      // Emit real-time event for assignment review
      this.realtimeEventsService.emitAssignmentReviewed(
        tenantId,
        {
          submissionId: savedSubmission.id,
          assignmentId: savedSubmission.assignmentId,
          choreTitle: submission.assignment.choreInstance.title,
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

    // First get all assignments for this tenant (via instance snapshot)
    const tenantAssignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.choreInstance', 'choreInstance')
      .select('assignment.id', 'id')
      .where('choreInstance.tenantId = :tenantId', { tenantId })
      .getRawMany<{ id: string }>();

    const assignmentIds = tenantAssignments.map((a) => a.id);
    if (assignmentIds.length === 0) {
      return [];
    }

    const submissions = await this.submissionRepository.find({
      where: {
        reviewStatus: ReviewStatus.PENDING,
        assignmentId: In(assignmentIds),
      },
      relations: [
        'assignment',
        'assignment.choreInstance',
        'assignment.assignee', // Include the assigned user data
        'assignment.assigner', // Include the assigner user data
      ],
      order: { submittedAt: 'ASC' },
    });

    return submissions;
  }

  /**
   * Get assignments for a date range (calendar view).
   * Parents/Admins can see all assignments in the tenant.
   * Children can only see their own assignments.
   */
  async getAssignmentsByDateRange(
    tenantId: string,
    userId: string,
    fromDate: Date,
    toDate: Date,
    childId?: string, // Optional: filter by specific child (for parents)
  ): Promise<ChoreAssignment[]> {
    const userRole = await this.getUserRole(tenantId, userId);
    const isParentOrAdmin = [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ].includes(userRole);

    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.choreInstance', 'choreInstance')
      .leftJoinAndSelect('assignment.assignee', 'assignee')
      .where('choreInstance.tenantId = :tenantId', { tenantId })
      .andWhere('assignment.dueDate >= :fromDate', { fromDate })
      .andWhere('assignment.dueDate <= :toDate', { toDate });

    if (isParentOrAdmin) {
      // Parents can optionally filter by child
      if (childId) {
        queryBuilder.andWhere('assignment.assignedTo = :childId', { childId });
      }
    } else {
      // Children can only see their own assignments
      queryBuilder.andWhere('assignment.assignedTo = :userId', { userId });
    }

    return queryBuilder
      .orderBy('assignment.dueDate', 'ASC')
      .addOrderBy('assignment.createdAt', 'ASC')
      .getMany();
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
