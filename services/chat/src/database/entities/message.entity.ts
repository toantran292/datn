import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Room } from './room.entity';
import { MessageReaction } from './message-reaction.entity';

export type MessageType = 'text' | 'file' | 'system';
export type MessageFormat = 'plain' | 'markdown';

@Entity('messages')
@Index(['roomId', 'createdAt'])
@Index(['threadId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'room_id' })
  roomId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'org_id' })
  orgId: string;

  @Column('uuid', { name: 'thread_id', nullable: true })
  threadId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'text',
  })
  type: MessageType;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'plain',
  })
  format: MessageFormat;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Room, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'thread_id' })
  parentMessage: Message | null;

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];
}
