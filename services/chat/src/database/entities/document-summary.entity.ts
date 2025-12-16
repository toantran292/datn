import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('document_summaries')
@Index(['attachmentId'], { unique: true })
@Index(['roomId'])
export class DocumentSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attachment_id', type: 'uuid' })
  attachmentId: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'summary', type: 'text' })
  summary: string;

  @Column({ name: 'transcription', type: 'text', nullable: true })
  transcription: string | null;

  @Column({ name: 'generated_by', type: 'uuid' })
  generatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
