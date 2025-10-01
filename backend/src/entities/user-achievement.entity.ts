import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { User } from './user.entity';
import type { Achievement } from './achievement.entity';
import type { Tenant } from './tenant.entity';

@Entity('user_achievements')
@Index(['userId', 'achievementId', 'tenantId'], { unique: true }) // Prevent duplicate achievements
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'achievement_id' })
  achievementId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'earned_at' })
  earnedAt: Date;

  // Relations
  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne('Achievement', 'userAchievements')
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;

  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;
}
