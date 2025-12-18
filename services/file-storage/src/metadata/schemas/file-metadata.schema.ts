import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileMetadataDocument = FileMetadata & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true, collection: 'file_metadata' })
export class FileMetadata {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  bucket: string;

  @Prop({ required: true, unique: true })
  objectKey: string;

  @Prop()
  url?: string;

  // Tracking metadata
  @Prop({ required: true, index: true })
  service: string;

  @Prop({ required: true, index: true })
  modelType: string;

  @Prop({ required: true, index: true })
  subjectId: string;

  @Prop({ index: true })
  uploadedBy?: string;

  @Prop({ index: true })
  orgId?: string;

  // Workspace and folder support (UC14)
  @Prop({ index: true })
  workspaceId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null, index: true })
  folderId?: Types.ObjectId | null;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true,
  })
  uploadStatus: string;
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);

// Create compound index for efficient queries
FileMetadataSchema.index({ service: 1, modelType: 1, subjectId: 1 });
FileMetadataSchema.index({ uploadedBy: 1, createdAt: -1 });
FileMetadataSchema.index({ tags: 1 });
FileMetadataSchema.index({ orgId: 1, createdAt: -1 });
FileMetadataSchema.index({ orgId: 1, uploadStatus: 1 });
// Workspace and folder indexes (UC14)
FileMetadataSchema.index({ workspaceId: 1, folderId: 1, createdAt: -1 });
FileMetadataSchema.index({ workspaceId: 1, originalName: 'text' });
