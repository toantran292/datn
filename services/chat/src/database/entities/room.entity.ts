import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RoomMember } from './room-member.entity';
import { Message } from './message.entity';

export type RoomType = 'channel' | 'dm';
export type RoomStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

@Entity('rooms')
@Index(['orgId'])
@Index(['orgId', 'projectId'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'org_id' })
  orgId: string;

  @Column('uuid', { name: 'project_id', nullable: true })
  projectId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'channel',
  })
  type: RoomType;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVE',
  })
  status: RoomStatus;

  @Column({ type: 'varchar', name: 'avatar_url', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => RoomMember, (member) => member.room)
  members: RoomMember[];

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];
}
