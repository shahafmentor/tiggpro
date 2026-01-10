import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Priority } from '@tiggpro/shared';
import type { RecurrencePattern } from '@tiggpro/shared';
import type { Chore } from './chore.entity';
import type { User } from './user.entity';
import type { Tenant } from './tenant.entity';

/**
 * ChoreRecurrence tracks an active recurring assignment series.
 * When a parent assigns a recurring chore, this entity stores the recurrence
 * configuration. The scheduler uses this to generate ChoreInstance + ChoreAssignment
 * records on a rolling basis (e.g., 2 weeks ahead).
 */
@Entity('chore_recurrences')
export class ChoreRecurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'template_chore_id' })
  templateChoreId: string;

  @Column({ name: 'assigned_to' })
  assignedTo: string;

  @Column({ name: 'assigned_by' })
  assignedBy: string;

  @Column({ name: 'recurrence_pattern', type: 'jsonb' })
  recurrencePattern: RecurrencePattern;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ name: 'last_generated_date', type: 'date' })
  lastGeneratedDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne('Chore')
  @JoinColumn({ name: 'template_chore_id' })
  templateChore?: Chore;

  @ManyToOne('User')
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

  @ManyToOne('User')
  @JoinColumn({ name: 'assigned_by' })
  assigner?: User;
}
