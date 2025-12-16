import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationCategory {
  ORGANIZATION = 'ORGANIZATION',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export enum StoredNotificationType {
  // Organization
  ORG_INVITATION = 'ORG_INVITATION',
  ORG_MEMBER_JOINED = 'ORG_MEMBER_JOINED',
  ORG_MEMBER_REMOVED = 'ORG_MEMBER_REMOVED',
  ORG_ROLE_CHANGED = 'ORG_ROLE_CHANGED',
  ORG_OWNERSHIP_TRANSFERRED = 'ORG_OWNERSHIP_TRANSFERRED',
  ORG_LOCKED = 'ORG_LOCKED',
  ORG_UNLOCKED = 'ORG_UNLOCKED',

  // User
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',

  // System
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',

  // Reports
  REPORT_COMPLETED = 'REPORT_COMPLETED',
  REPORT_FAILED = 'REPORT_FAILED',

  // Chat
  CHAT_MENTION = 'CHAT_MENTION',
}

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isRead'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid', { nullable: true })
  @Index()
  orgId: string | null;

  @Column({
    type: 'enum',
    enum: StoredNotificationType,
  })
  type: StoredNotificationType;

  @Column({ length: 255 })
  title: string;

  @Column('text', { nullable: true })
  content: string | null;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column('timestamptz', { nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;

  getCategory(): NotificationCategory {
    const type = this.type;
    if (type.startsWith('ORG_')) return NotificationCategory.ORGANIZATION;
    if (
      type.startsWith('PASSWORD_') ||
      type.startsWith('EMAIL_') ||
      type.startsWith('PROFILE_')
    )
      return NotificationCategory.USER;
    if (type.startsWith('CHAT_')) return NotificationCategory.USER;
    if (type.startsWith('SYSTEM_') || type.startsWith('REPORT_'))
      return NotificationCategory.SYSTEM;
    return NotificationCategory.SYSTEM;
  }
}
