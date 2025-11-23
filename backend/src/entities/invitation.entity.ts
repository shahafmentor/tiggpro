import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TenantMemberRole } from '@tiggpro/shared';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
}

@Entity('invitations')
@Index(['email', 'tenantId'], { unique: false }) // Allow multiple invitations for same email/tenant if previous ones expired/accepted? Or enforce one pending? Let's keep simple for now.
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  email: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: TenantMemberRole,
    default: TenantMemberRole.CHILD,
  })
  role: TenantMemberRole;

  @Column({ name: 'invited_by' })
  invitedBy: string;

  @Column({ nullable: true })
  message?: string;

  @Column()
  token: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
