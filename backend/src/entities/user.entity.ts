import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AuthProvider } from '@tiggpro/shared';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  // Provider-specific fields
  @Column({ name: 'google_id', nullable: true, unique: true })
  @Index()
  googleId?: string;

  @Column({ name: 'apple_id', nullable: true, unique: true })
  @Index()
  appleId?: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.GOOGLE,
  })
  provider: AuthProvider;

  // Metadata
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany('TenantMember', 'user')
  tenantMemberships: any[];
}
