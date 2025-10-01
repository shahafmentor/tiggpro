import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RequirementType } from '@tiggpro/shared';
import type { UserAchievement } from './user-achievement.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  @Column({ name: 'badge_color' })
  badgeColor: string;

  @Column({
    name: 'requirement_type',
    type: 'enum',
    enum: RequirementType,
  })
  requirementType: RequirementType;

  @Column({ name: 'requirement_value' })
  requirementValue: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relations
  @OneToMany('UserAchievement', 'achievement')
  userAchievements?: UserAchievement[];
}
