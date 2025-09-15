import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '@tiggpro/shared';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({ name: 'is_read', default: false })
  @Index()
  isRead: boolean;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;

  @Column({ name: 'read_at', nullable: true })
  readAt?: Date;

  // Relations
  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Tenant')
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;
}
