import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse as ApiDoc,
} from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { SubmitAssignmentDto, ReviewSubmissionDto } from './dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import type { ApiResponse } from '@tiggpro/shared';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('tenants/:tenantId/assignments')
@UseGuards(JwtAuthGuard, TenantMembershipGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user assignments',
    description: 'Retrieves all assignments for the current user in a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiDoc({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async getUserAssignments(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const assignments = await this.assignmentsService.getUserAssignments(
        tenantId,
        req.user.id,
      );

      return {
        success: true,
        data: assignments.map((assignment) => ({
          id: assignment.id,
          choreInstanceId: assignment.choreInstanceId,
          dueDate: assignment.dueDate,
          priority: assignment.priority,
          status: assignment.status,
          createdAt: assignment.createdAt,
          chore: assignment.choreInstance
            ? {
                id: assignment.choreInstanceId,
                title: assignment.choreInstance.title,
                description: assignment.choreInstance.description,
                pointsReward: assignment.choreInstance.pointsReward,
                difficultyLevel: assignment.choreInstance.difficultyLevel,
                estimatedDurationMinutes:
                  assignment.choreInstance.estimatedDurationMinutes,
              }
            : undefined,
          submissions: assignment.submissions?.map((submission) => ({
            id: submission.id,
            submittedAt: submission.submittedAt,
            reviewStatus: submission.reviewStatus,
            reviewFeedback: submission.reviewFeedback,
            pointsAwarded: submission.pointsAwarded,
            reviewedAt: submission.reviewedAt,
            reviewer: submission.reviewer
              ? {
                  id: submission.reviewer.id,
                  displayName: submission.reviewer.displayName,
                }
              : undefined,
          })),
        })),
        message: 'Assignments retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get assignments',
      };
    }
  }

  @Get('calendar')
  @ApiOperation({
    summary: 'Get assignments by date range',
    description: 'Retrieves assignments within a date range for calendar view',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiDoc({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async getCalendarAssignments(
    @Param('tenantId') tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('childId') childId: string | undefined,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      // Validate date parameters
      if (!from || !to) {
        return {
          success: false,
          error: 'Both "from" and "to" query parameters are required',
        };
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return {
          success: false,
          error: 'Invalid date format. Please use ISO date format (YYYY-MM-DD)',
        };
      }

      const assignments =
        await this.assignmentsService.getAssignmentsByDateRange(
          tenantId,
          req.user.id,
          fromDate,
          toDate,
          childId,
        );

      return {
        success: true,
        data: assignments.map((assignment) => ({
          id: assignment.id,
          choreInstanceId: assignment.choreInstanceId,
          dueDate: assignment.dueDate,
          priority: assignment.priority,
          status: assignment.status,
          createdAt: assignment.createdAt,
          assignedTo: assignment.assignee
            ? {
                id: assignment.assignee.id,
                displayName: assignment.assignee.displayName,
                avatarUrl: assignment.assignee.avatarUrl,
              }
            : undefined,
          chore: assignment.choreInstance
            ? {
                id: assignment.choreInstanceId,
                title: assignment.choreInstance.title,
                description: assignment.choreInstance.description,
                pointsReward: assignment.choreInstance.pointsReward,
                difficultyLevel: assignment.choreInstance.difficultyLevel,
                estimatedDurationMinutes:
                  assignment.choreInstance.estimatedDurationMinutes,
                isRecurring: assignment.choreInstance.isRecurring,
              }
            : undefined,
        })),
        message: 'Calendar assignments retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get calendar assignments',
      };
    }
  }

  @Get(':assignmentId')
  @ApiOperation({
    summary: 'Get specific assignment',
    description: 'Retrieves a specific assignment by ID',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiDoc({ status: 200, description: 'Assignment retrieved successfully' })
  @ApiDoc({ status: 404, description: 'Assignment not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async getAssignment(
    @Param('tenantId') tenantId: string,
    @Param('assignmentId') assignmentId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const assignment = await this.assignmentsService.getAssignmentById(
        assignmentId,
        tenantId,
        req.user.id,
      );

      return {
        success: true,
        data: {
          id: assignment.id,
          choreInstanceId: assignment.choreInstanceId,
          dueDate: assignment.dueDate,
          priority: assignment.priority,
          status: assignment.status,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
          chore: assignment.choreInstance
            ? {
                id: assignment.choreInstanceId,
                title: assignment.choreInstance.title,
                description: assignment.choreInstance.description,
                pointsReward: assignment.choreInstance.pointsReward,
                difficultyLevel: assignment.choreInstance.difficultyLevel,
                estimatedDurationMinutes:
                  assignment.choreInstance.estimatedDurationMinutes,
              }
            : undefined,
        },
        message: 'Assignment retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get assignment',
      };
    }
  }

  @Post(':assignmentId/submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit assignment',
    description: 'Submit an assignment with optional notes and media',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiDoc({ status: 201, description: 'Assignment submitted successfully' })
  @ApiDoc({ status: 404, description: 'Assignment not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async submitAssignment(
    @Param('tenantId') tenantId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() submitDto: SubmitAssignmentDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const submission = await this.assignmentsService.submitAssignment(
        assignmentId,
        tenantId,
        submitDto,
        req.user.id,
      );

      return {
        success: true,
        data: submission,
        message: 'Assignment submitted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to submit assignment',
      };
    }
  }

  @Put('submissions/:submissionId/review')
  @ApiOperation({
    summary: 'Review submission',
    description: 'Review and approve/reject a chore submission',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'submissionId', description: 'Submission ID' })
  @ApiDoc({ status: 200, description: 'Submission reviewed successfully' })
  @ApiDoc({ status: 404, description: 'Submission not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async reviewSubmission(
    @Param('tenantId') tenantId: string,
    @Param('submissionId') submissionId: string,
    @Body() reviewDto: ReviewSubmissionDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const submission = await this.assignmentsService.reviewSubmission(
        submissionId,
        tenantId,
        reviewDto,
        req.user.id,
      );

      return {
        success: true,
        data: submission,
        message: 'Submission reviewed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to review submission',
      };
    }
  }

  @Get('submissions/pending')
  @ApiOperation({
    summary: 'Get pending submissions',
    description: 'Retrieves all pending submissions for review in a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiDoc({
    status: 200,
    description: 'Pending submissions retrieved successfully',
  })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async getPendingSubmissions(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const submissions = await this.assignmentsService.getPendingSubmissions(
        tenantId,
        req.user.id,
      );

      return {
        success: true,
        data: submissions.map((submission) => ({
          id: submission.id,
          assignmentId: submission.assignmentId,
          submissionNotes: submission.submissionNotes,
          mediaUrls: submission.mediaUrls,
          submittedAt: submission.submittedAt,
          submittedBy: submission.submittedBy,
          reviewStatus: submission.reviewStatus,
          assignment: submission.assignment
            ? {
                id: submission.assignment.id,
                dueDate: submission.assignment.dueDate,
                priority: submission.assignment.priority,
                assignedTo: submission.assignment.assignee
                  ? {
                      id: submission.assignment.assignee.id,
                      email: submission.assignment.assignee.email,
                      displayName: submission.assignment.assignee.displayName,
                      avatarUrl: submission.assignment.assignee.avatarUrl,
                    }
                  : undefined,
                assignedBy: submission.assignment.assigner
                  ? {
                      id: submission.assignment.assigner.id,
                      email: submission.assignment.assigner.email,
                      displayName: submission.assignment.assigner.displayName,
                      avatarUrl: submission.assignment.assigner.avatarUrl,
                    }
                  : undefined,
                chore: submission.assignment.choreInstance
                  ? {
                      id: submission.assignment.choreInstanceId,
                      title: submission.assignment.choreInstance.title,
                      pointsReward:
                        submission.assignment.choreInstance.pointsReward,
                    }
                  : undefined,
              }
            : undefined,
        })),
        message: 'Pending submissions retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get pending submissions',
      };
    }
  }
}
