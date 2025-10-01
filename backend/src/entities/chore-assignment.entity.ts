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
import { Priority, AssignmentStatus } from '@tiggpro/shared';
import type { Chore } from './chore.entity';
import type { User } from './user.entity';
import type { ChoreSubmission } from './chore-submission.entity';

@Entity('chore_assignments')
export class ChoreAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chore_id' })
  choreId: string;

  @Column({ name: 'assigned_to' })
  assignedTo: string;

  @Column({ name: 'assigned_by' })
  assignedBy: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Chore', 'assignments')
  @JoinColumn({ name: 'chore_id' })
  chore?: Chore;

  @ManyToOne('User')
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

  @ManyToOne('User')
  @JoinColumn({ name: 'assigned_by' })
  assigner?: User;

  @OneToMany('ChoreSubmission', 'assignment')
  submissions?: ChoreSubmission[];
}
