import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_reactions')
@Unique(['messageId', 'userId', 'emoji'])
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'message_id' })
  messageId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column({ length: 50 })
  emoji: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Message, (message) => message.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}
