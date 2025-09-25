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
import { RewardType } from '@tiggpro/shared';

@Entity('reward_settings')
@Index(['tenantId'], { unique: true })
export class RewardSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  // Enabled reward types for this tenant
  @Column({ name: 'enabled_types', type: 'simple-array', default: '' })
  enabledTypes: RewardType[];

  // Reserved for future conversion settings (JSONB for flexibility)
  @Column({ name: 'conversion', type: 'jsonb', nullable: true })
  conversion?: {
    pointsPerMinute?: number;
    fixedCosts?: Partial<Record<string, number>>;
    spendingMoney?: { perUnit: number };
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;
}


