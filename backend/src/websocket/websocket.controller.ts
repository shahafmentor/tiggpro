import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import { RealtimeEventsService } from './realtime-events.service';
import type { ApiResponse } from '@tiggpro/shared';

@ApiTags('WebSocket Testing')
@ApiBearerAuth()
@Controller('tenants/:tenantId/test-realtime')
// @UseGuards(JwtAuthGuard, TenantMembershipGuard) // Temporarily disabled for testing
export class WebSocketController {
  constructor(private readonly realtimeEventsService: RealtimeEventsService) {}

  @Post('chore-assigned')
  @ApiOperation({ summary: 'Test chore assigned event' })
  async testChoreAssigned(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string; email: string; displayName: string } },
  ): Promise<ApiResponse> {
    this.realtimeEventsService.emitChoreAssigned(
      tenantId,
      {
        assignmentId: 'test-assignment-123',
        choreId: 'test-chore-123',
        choreTitle: 'Test Chore - Clean Room',
        assignedTo: {
          id: 'test-child-id',
          displayName: 'Test Child',
          email: 'child@test.com',
        },
        assignedBy: {
          id: req.user.id,
          displayName: req.user.displayName,
          email: req.user.email,
        },
        dueDate: new Date().toISOString(),
        priority: 'medium',
        pointsReward: 10,
      },
      req.user.id, // Exclude the sender
    );

    return {
      success: true,
      message: 'Test chore assigned event emitted',
    };
  }

  @Post('assignment-submitted')
  @ApiOperation({ summary: 'Test assignment submitted event' })
  async testAssignmentSubmitted(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string; email: string; displayName: string } },
  ): Promise<ApiResponse> {
    this.realtimeEventsService.emitAssignmentSubmitted(
      tenantId,
      {
        submissionId: 'test-submission-123',
        assignmentId: 'test-assignment-123',
        choreTitle: 'Test Chore - Clean Room',
        submittedBy: {
          id: req.user.id,
          displayName: req.user.displayName,
          email: req.user.email,
        },
        submissionNotes: 'I cleaned my room thoroughly!',
        mediaUrls: [],
      },
      req.user.id, // Exclude the sender
    );

    return {
      success: true,
      message: 'Test assignment submitted event emitted',
    };
  }

  @Post('assignment-reviewed')
  @ApiOperation({ summary: 'Test assignment reviewed event' })
  async testAssignmentReviewed(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string; email: string; displayName: string } },
  ): Promise<ApiResponse> {
    this.realtimeEventsService.emitAssignmentReviewed(
      tenantId,
      {
        submissionId: 'test-submission-123',
        assignmentId: 'test-assignment-123',
        choreTitle: 'Test Chore - Clean Room',
        reviewStatus: 'approved',
        reviewFeedback: 'Great job!',
        pointsAwarded: 10,
        reviewedBy: {
          id: req.user.id,
          displayName: req.user.displayName,
          email: req.user.email,
        },
        submittedBy: {
          id: 'test-child-id',
          displayName: 'Test Child',
          email: 'child@test.com',
        },
      },
      req.user.id, // Exclude the sender
    );

    return {
      success: true,
      message: 'Test assignment reviewed event emitted',
    };
  }

  @Post('reward-requested')
  @ApiOperation({ summary: 'Test reward requested event' })
  async testRewardRequested(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string; email: string; displayName: string } },
  ): Promise<ApiResponse> {
    this.realtimeEventsService.emitRewardRequested(
      tenantId,
      {
        redemptionId: 'test-redemption-123',
        rewardType: 'gaming_time',
        rewardAmount: 60,
        pointsCost: 50,
        requestedBy: {
          id: req.user.id,
          displayName: req.user.displayName,
          email: req.user.email,
        },
        description: 'I want 1 hour of gaming time',
      },
      req.user.id, // Exclude the sender
    );

    return {
      success: true,
      message: 'Test reward requested event emitted',
    };
  }
}