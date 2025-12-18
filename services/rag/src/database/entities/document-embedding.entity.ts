import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EmbeddingSourceType = 'message' | 'attachment' | 'document' | 'file';

@Entity('document_embeddings')
@Index(['namespaceId'])
@Index(['sourceType', 'sourceId'])
@Index(['orgId'])
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Namespace for isolating embeddings (e.g., roomId, projectId, workspaceId)
   * This allows different services to have their own isolated embedding spaces
   */
  @Column('uuid', { name: 'namespace_id' })
  namespaceId: string;

  /**
   * Type of namespace (room, project, workspace, etc.)
   * Helps with organizing and querying embeddings
   */
  @Column({
    type: 'varchar',
    length: 50,
    name: 'namespace_type',
    default: 'room',
  })
  namespaceType: string;

  /**
   * Organization ID for multi-tenancy support
   */
  @Column('uuid', { name: 'org_id' })
  orgId: string;

  /**
   * Source type of the embedded content
   */
  @Column({
    type: 'varchar',
    length: 50,
    name: 'source_type',
  })
  sourceType: EmbeddingSourceType;

  /**
   * ID of the source document/message/file
   */
  @Column('uuid', { name: 'source_id' })
  sourceId: string;

  /**
   * The actual text content that was embedded
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * Chunk index for large documents split into multiple embeddings
   */
  @Column({ name: 'chunk_index', type: 'int', default: 0 })
  chunkIndex: number;

  /**
   * Total number of chunks for this document
   */
  @Column({ name: 'chunk_total', type: 'int', default: 1 })
  chunkTotal: number;

  /**
   * Vector embedding - stored as float array
   * Using 1536 dimensions for text-embedding-3-small
   */
  @Column('float', { array: true, nullable: true })
  embedding: number[] | null;

  /**
   * Additional metadata about the source
   */
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
