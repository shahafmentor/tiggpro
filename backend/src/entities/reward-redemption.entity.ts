import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RewardType, RedemptionStatus } from '@tiggpro/shared';

@Entity('reward_redemptions')
@Index(['tenantId', 'userId'])
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: RewardType })
  type: RewardType;

  // Numeric amount when applicable (minutes or currency units)
  @Column({ type: 'int', nullable: true })
  amount: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.PENDING })
  status: RedemptionStatus;

  @CreateDateColumn({ name: 'requested_at' })
  requestedAt: Date;

  @Column({ name: 'decided_at', nullable: true })
  decidedAt?: Date;

  @Column({ name: 'decided_by', nullable: true })
  decidedBy?: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;
}


