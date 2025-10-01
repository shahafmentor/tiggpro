import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { User } from './user.entity';
import type { Tenant } from './tenant.entity';

@Entity('user_points')
@Index(['userId', 'tenantId'], { unique: true }) // One points record per user per tenant
export class UserPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'total_points', default: 0 })
  totalPoints: number;

  @Column({ name: 'available_points', default: 0 })
  availablePoints: number;

  @Column({ name: 'spent_points', default: 0 })
  spentPoints: number;

  @Column({ name: 'current_streak_days', default: 0 })
  currentStreakDays: number;

  @Column({ name: 'longest_streak_days', default: 0 })
  longestStreakDays: number;

  @Column({ default: 1 })
  level: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;
}
