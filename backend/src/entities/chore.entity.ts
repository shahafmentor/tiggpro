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

@Entity('chores')
export class Chore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ name: 'points_reward' })
  pointsReward: number;

  @Column({ name: 'gaming_time_minutes' })
  gamingTimeMinutes: number;

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

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'created_by' })
  creator: any;

  @OneToMany('ChoreAssignment', 'chore')
  assignments: any[];
}
