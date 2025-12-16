import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Room } from './room.entity';

export type MemberRole = 'ADMIN' | 'MEMBER';

@Entity('room_members')
@Unique(['roomId', 'userId'])
@Index(['userId', 'orgId'])
export class RoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'room_id' })
  roomId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'org_id' })
  orgId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'MEMBER',
  })
  role: MemberRole;

  @Column('uuid', { name: 'last_seen_message_id', nullable: true })
  lastSeenMessageId: string | null;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column('uuid', { name: 'invited_by', nullable: true })
  invitedBy: string | null;

  @ManyToOne(() => Room, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
