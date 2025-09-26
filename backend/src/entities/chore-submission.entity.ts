import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewStatus } from '@tiggpro/shared';

@Entity('chore_submissions')
export class ChoreSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'submitted_by' })
  submittedBy: string;

  @Column({ name: 'submission_notes', type: 'text', nullable: true })
  submissionNotes?: string;

  @Column({ name: 'media_urls', type: 'jsonb', default: [] })
  mediaUrls: string[];

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy?: string;

  @Column({
    name: 'review_status',
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  reviewStatus: ReviewStatus;

  @Column({ name: 'review_feedback', type: 'text', nullable: true })
  reviewFeedback?: string;

  @Column({ name: 'points_awarded', nullable: true })
  pointsAwarded?: number;


  // Relations
  @ManyToOne('ChoreAssignment', 'submissions')
  @JoinColumn({ name: 'assignment_id' })
  assignment: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'submitted_by' })
  submitter: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: any;
}
