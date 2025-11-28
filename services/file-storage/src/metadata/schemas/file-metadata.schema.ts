import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
