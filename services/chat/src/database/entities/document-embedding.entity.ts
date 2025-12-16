import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from './room.entity';

export type EmbeddingSourceType = 'message' | 'attachment' | 'document';

@Entity('document_embeddings')
@Index(['roomId'])
@Index(['orgId'])
@Index(['sourceType', 'sourceId'])
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'source_type',
  })
  sourceType: EmbeddingSourceType;

  @Column('uuid', { name: 'source_id' })
  sourceId: string;

  @Column('uuid', { name: 'room_id' })
  roomId: string;

  @Column('uuid', { name: 'org_id' })
  orgId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'chunk_index', type: 'int', default: 0 })
  chunkIndex: number;

  @Column({ name: 'chunk_total', type: 'int', default: 1 })
  chunkTotal: number;

  // Vector embedding - stored as array, pgvector will handle it
  // Using 1536 dimensions for text-embedding-3-small
  @Column('float', { array: true, nullable: true })
  embedding: number[] | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
