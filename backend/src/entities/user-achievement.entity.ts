import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

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
  user: any;

  @ManyToOne('Achievement', 'userAchievements')
  @JoinColumn({ name: 'achievement_id' })
  achievement: any;

  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;
}
