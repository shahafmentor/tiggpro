import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';

export interface ChoreAssignedEvent {
  assignmentId: string;
  choreInstanceId: string;
  templateChoreId?: string | null;
  choreTitle: string;
  assignedTo: {
    id: string;
    displayName: string;
    email: string;
  };
  assignedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  dueDate: string;
  priority: string;
  pointsReward: number;
}

export interface AssignmentSubmittedEvent {
  submissionId: string;
  assignmentId: string;
  choreTitle: string;
  submittedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  submissionNotes?: string;
  mediaUrls?: string[];
}

export interface AssignmentReviewedEvent {
  submissionId: string;
  assignmentId: string;
  choreTitle: string;
  reviewStatus: 'approved' | 'rejected';
  reviewFeedback?: string;
  pointsAwarded?: number;
  reviewedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  submittedBy: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface RewardRequestedEvent {
  redemptionId: string;
  rewardType: string;
  rewardAmount?: number;
  pointsCost: number;
  requestedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  description?: string;
}

export interface RewardReviewedEvent {
  redemptionId: string;
  rewardType: string;
  reviewStatus: 'approved' | 'rejected';
  reviewFeedback?: string;
  reviewedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  requestedBy: {
    id: string;
    displayName: string;
    email: string;
  };
}

@Injectable()
export class RealtimeEventsService {
  private readonly logger = new Logger(RealtimeEventsService.name);

  constructor(private readonly webSocketGateway: WebSocketGateway) {}

  emitChoreAssigned(
    tenantId: string,
    event: ChoreAssignedEvent,
    excludeUserId?: string,
  ) {
    this.webSocketGateway.emitToTenant({
      type: 'chore_assigned',
      tenantId,
      data: event,
      timestamp: new Date().toISOString(),
      excludeUserId,
    });

    this.logger.log(
      `Chore assigned: ${event.choreTitle} to ${event.assignedTo.displayName} in tenant ${tenantId}`,
    );
  }

  emitAssignmentSubmitted(
    tenantId: string,
    event: AssignmentSubmittedEvent,
    excludeUserId?: string,
  ) {
    this.webSocketGateway.emitToTenant({
      type: 'assignment_submitted',
      tenantId,
      data: event,
      timestamp: new Date().toISOString(),
      excludeUserId,
    });

    this.logger.log(
      `Assignment submitted: ${event.choreTitle} by ${event.submittedBy.displayName} in tenant ${tenantId}`,
    );
  }

  emitAssignmentReviewed(
    tenantId: string,
    event: AssignmentReviewedEvent,
    excludeUserId?: string,
  ) {
    this.webSocketGateway.emitToTenant({
      type: 'assignment_reviewed',
      tenantId,
      data: event,
      timestamp: new Date().toISOString(),
      excludeUserId,
    });

    this.logger.log(
      `Assignment reviewed: ${event.choreTitle} ${event.reviewStatus} by ${event.reviewedBy.displayName} in tenant ${tenantId}`,
    );
  }

  emitRewardRequested(
    tenantId: string,
    event: RewardRequestedEvent,
    excludeUserId?: string,
  ) {
    this.webSocketGateway.emitToTenant({
      type: 'reward_requested',
      tenantId,
      data: event,
      timestamp: new Date().toISOString(),
      excludeUserId,
    });

    this.logger.log(
      `Reward requested: ${event.rewardType} by ${event.requestedBy.displayName} in tenant ${tenantId}`,
    );
  }

  emitRewardReviewed(
    tenantId: string,
    event: RewardReviewedEvent,
    excludeUserId?: string,
  ) {
    this.webSocketGateway.emitToTenant({
      type: 'reward_reviewed',
      tenantId,
      data: event,
      timestamp: new Date().toISOString(),
      excludeUserId,
    });

    this.logger.log(
      `Reward reviewed: ${event.rewardType} ${event.reviewStatus} by ${event.reviewedBy.displayName} in tenant ${tenantId}`,
    );
  }

  emitGenericEvent(
    tenantId: string,
    eventType: string,
    data: Record<string, unknown>,
    excludeUserId?: string,
  ) {
    this.webSocketGateway.emitToTenant({
      type: eventType,
      tenantId,
      data,
      timestamp: new Date().toISOString(),
      excludeUserId,
    });

    this.logger.log(
      `Generic event emitted: ${eventType} in tenant ${tenantId}`,
    );
  }
}
