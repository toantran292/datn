import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FolderDocument = Folder & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true, collection: 'folders' })
export class Folder {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null, index: true })
  parentId: Types.ObjectId | null;

  @Prop({ required: true, index: true })
  orgId: string;

  @Prop({ required: true, index: true })
  workspaceId: string;

  @Prop({ index: true })
  createdBy: string;

  @Prop({ type: [String], default: [] })
  path: string[]; // Array of parent folder IDs for breadcrumb
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

// Compound indexes for efficient queries
FolderSchema.index({ orgId: 1, workspaceId: 1, parentId: 1 });
FolderSchema.index({ orgId: 1, workspaceId: 1, name: 1 });
FolderSchema.index({ path: 1 });
