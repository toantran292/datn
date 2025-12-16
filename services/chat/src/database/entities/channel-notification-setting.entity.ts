import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Room } from './room.entity';

export type NotificationLevel = 'all' | 'mentions' | 'none';

@Entity('channel_notification_settings')
@Unique(['roomId', 'userId'])
export class ChannelNotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'room_id' })
  roomId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'all',
  })
  level: NotificationLevel;

  @Column({ name: 'muted_until', type: 'timestamp', nullable: true })
  mutedUntil: Date | null;

  @Column({ name: 'sound_enabled', default: true })
  soundEnabled: boolean;

  @Column({ name: 'push_enabled', default: true })
  pushEnabled: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
