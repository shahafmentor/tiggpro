import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantMemberRole } from '@tiggpro/shared';
import type { Tenant } from './tenant.entity';
import type { User } from './user.entity';

@Entity('tenant_members')
@Index(['tenantId', 'userId'], { unique: true }) // Ensure unique membership
export class TenantMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TenantMemberRole,
    default: TenantMemberRole.CHILD,
  })
  role: TenantMemberRole;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  // Relations
  @ManyToOne('Tenant', 'members')
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne('User', 'tenantMemberships')
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne('User')
  @JoinColumn({ name: 'invited_by' })
  inviter?: User;
}
