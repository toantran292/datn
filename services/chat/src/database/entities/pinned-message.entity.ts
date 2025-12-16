import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { Message } from './message.entity';

@Entity('pinned_messages')
export class PinnedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'room_id' })
  roomId: string;

  @Column('uuid', { name: 'message_id' })
  messageId: string;

  @Column('uuid', { name: 'pinned_by' })
  pinnedBy: string;

  @CreateDateColumn({ name: 'pinned_at' })
  pinnedAt: Date;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}
