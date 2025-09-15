import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantType } from '@tiggpro/shared';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'tenant_code', unique: true })
  @Index()
  tenantCode: string;

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.FAMILY,
  })
  type: TenantType;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('User')
  @JoinColumn({ name: 'created_by' })
  creator: any;

  @OneToMany('TenantMember', 'tenant')
  members: any[];
}
