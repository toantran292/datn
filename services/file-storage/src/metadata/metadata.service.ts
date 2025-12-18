import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FileMetadata,
  FileMetadataDocument,
} from './schemas/file-metadata.schema';
import { FileMetadata as FileMetadataType } from '../types/file.types';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(
    @InjectModel(FileMetadata.name)
    private fileMetadataModel: Model<FileMetadataDocument>,
  ) {}

  async create(
    data: Omit<FileMetadataType, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FileMetadataType> {
    const created = new this.fileMetadataModel(data);
    const saved = await created.save();

    this.logger.log(`Metadata created for file: ${saved._id}`);

    return this.toFileMetadata(saved);
  }

  async findById(id: string): Promise<FileMetadataType> {
    const doc = await this.fileMetadataModel.findById(id).exec();

    if (!doc) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    return this.toFileMetadata(doc);
  }

  async findAll(query: {
    service?: string;
    modelType?: string;
    subjectId?: string;
    uploadedBy?: string;
    orgId?: string;
    workspaceId?: string;
    folderId?: string | null;
    search?: string;
    mimeType?: string;
    tags?: string[];
    sortBy?: 'name' | 'size' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    files: FileMetadataType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.service) filter.service = query.service;
    if (query.modelType) filter.modelType = query.modelType;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.uploadedBy) filter.uploadedBy = query.uploadedBy;
    if (query.orgId) filter.orgId = query.orgId;
    if (query.workspaceId) filter.workspaceId = query.workspaceId;
    if (query.tags && query.tags.length > 0) filter.tags = { $in: query.tags };

    // Folder filtering (UC14)
    if (query.folderId !== undefined) {
      if (query.folderId === null || query.folderId === 'null' || query.folderId === '') {
        filter.folderId = null;
      } else {
        filter.folderId = new Types.ObjectId(query.folderId);
      }
    }

    // Search by filename (UC14)
    if (query.search) {
      filter.originalName = { $regex: query.search, $options: 'i' };
    }

    // Filter by mimeType prefix (e.g., 'image', 'application/pdf')
    if (query.mimeType) {
      filter.mimeType = { $regex: `^${query.mimeType}`, $options: 'i' };
    }

    // Only show completed uploads by default
    filter.uploadStatus = 'completed';

    // Sorting (UC14)
    const sortField = query.sortBy === 'name' ? 'originalName' : (query.sortBy || 'createdAt');
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.fileMetadataModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.fileMetadataModel.countDocuments(filter).exec(),
    ]);

    return {
      files: docs.map((doc) => this.toFileMetadata(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Move file to a different folder (UC14)
   */
  async moveToFolder(fileId: string, folderId: string | null): Promise<FileMetadataType> {
    const updated = await this.fileMetadataModel
      .findByIdAndUpdate(
        fileId,
        { folderId: folderId ? new Types.ObjectId(folderId) : null },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`File with ID "${fileId}" not found`);
    }

    this.logger.log(`File ${fileId} moved to folder ${folderId || 'root'}`);
    return this.toFileMetadata(updated);
  }

  /**
   * Get files in a folder for counting (UC14)
   */
  async countFilesInFolder(workspaceId: string, folderId: string | null): Promise<number> {
    const filter: any = {
      workspaceId,
      uploadStatus: 'completed',
    };

    if (folderId) {
      filter.folderId = new Types.ObjectId(folderId);
    } else {
      filter.folderId = null;
    }

    return this.fileMetadataModel.countDocuments(filter).exec();
  }

  /**
   * Move all files from a folder (for folder deletion) (UC14)
   */
  async moveFilesFromFolder(folderId: string, newFolderId: string | null): Promise<number> {
    const result = await this.fileMetadataModel.updateMany(
      { folderId: new Types.ObjectId(folderId) },
      { folderId: newFolderId ? new Types.ObjectId(newFolderId) : null },
    );

    this.logger.log(`Moved ${result.modifiedCount} files from folder ${folderId}`);
    return result.modifiedCount;
  }

  async update(
    id: string,
    data: Partial<FileMetadataType>,
  ): Promise<FileMetadataType> {
    const updated = await this.fileMetadataModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    this.logger.log(`Metadata updated for file: ${id}`);
    return this.toFileMetadata(updated);
  }

  async delete(id: string): Promise<void> {
    const result = await this.fileMetadataModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    this.logger.log(`Metadata deleted for file: ${id}`);
  }

  async deleteBySubject(
    service: string,
    modelType: string,
    subjectId: string,
  ): Promise<number> {
    const result = await this.fileMetadataModel
      .deleteMany({ service, modelType, subjectId })
      .exec();

    this.logger.log(
      `Deleted ${result.deletedCount} files for ${service}/${modelType}/${subjectId}`,
    );

    return result.deletedCount;
  }

  // Tags that should be excluded from quota calculation
  private readonly EXCLUDED_QUOTA_TAGS = ['logo', 'avatar', 'profile_picture', 'thumbnail'];

  /**
   * Get total storage usage for an organization
   * Excludes system files like logos, avatars, etc. from quota
   */
  async getStorageUsage(orgId: string): Promise<{ usedBytes: number; fileCount: number }> {
    const result = await this.fileMetadataModel.aggregate([
      {
        $match: {
          orgId,
          uploadStatus: 'completed',
          // Exclude files with system tags (logo, avatar, etc.)
          tags: { $nin: this.EXCLUDED_QUOTA_TAGS },
        },
      },
      {
        $group: {
          _id: null,
          usedBytes: { $sum: '$size' },
          fileCount: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { usedBytes: 0, fileCount: 0 };
    }

    return {
      usedBytes: result[0].usedBytes,
      fileCount: result[0].fileCount,
    };
  }

  /**
   * Get recent files for an organization
   * Excludes system files like logos, avatars, etc.
   */
  async getRecentFiles(
    orgId: string,
    limit: number = 5,
  ): Promise<FileMetadataType[]> {
    const docs = await this.fileMetadataModel
      .find({
        orgId,
        uploadStatus: 'completed',
        // Exclude system files (logo, avatar, etc.)
        tags: { $nin: this.EXCLUDED_QUOTA_TAGS },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => this.toFileMetadata(doc));
  }

  private toFileMetadata(doc: FileMetadataDocument): FileMetadataType {
    return {
      id: doc._id.toString(),
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      bucket: doc.bucket,
      objectKey: doc.objectKey,
      url: doc.url,
      service: doc.service,
      modelType: doc.modelType,
      subjectId: doc.subjectId,
      uploadedBy: doc.uploadedBy,
      orgId: doc.orgId,
      workspaceId: doc.workspaceId,
      folderId: doc.folderId?.toString() || null,
      tags: doc.tags,
      metadata: doc.metadata,
      uploadStatus: doc.uploadStatus as 'pending' | 'completed' | 'failed',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
