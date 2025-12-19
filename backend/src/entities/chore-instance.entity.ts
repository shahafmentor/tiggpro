import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { DifficultyLevel } from '@tiggpro/shared';
import type { RecurrencePattern } from '@tiggpro/shared';
import type { Chore } from './chore.entity';
import type { User } from './user.entity';
import type { ChoreAssignment } from './chore-assignment.entity';

@Entity('chore_instances')
export class ChoreInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'template_chore_id', nullable: true })
  templateChoreId: string | null;

  // Snapshot fields (copied from template chore at assignment time)
  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column({ name: 'points_reward' })
  pointsReward: number;

  @Column({
    name: 'difficulty_level',
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.MEDIUM,
  })
  difficultyLevel: DifficultyLevel;

  @Column({ name: 'estimated_duration_minutes' })
  estimatedDurationMinutes: number;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrence_pattern', type: 'jsonb', nullable: true })
  recurrencePattern?: RecurrencePattern;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;

  @ManyToOne('Chore')
  @JoinColumn({ name: 'template_chore_id' })
  templateChore?: Chore;

  @ManyToOne('User')
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @OneToMany('ChoreAssignment', 'choreInstance')
  assignments?: ChoreAssignment[];
}

