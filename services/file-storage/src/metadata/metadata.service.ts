import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    tags?: string[];
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
    if (query.tags && query.tags.length > 0) filter.tags = { $in: query.tags };

    const [docs, total] = await Promise.all([
      this.fileMetadataModel
        .find(filter)
        .sort({ createdAt: -1 })
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

  /**
   * Get total storage usage for an organization
   */
  async getStorageUsage(orgId: string): Promise<{ usedBytes: number; fileCount: number }> {
    const result = await this.fileMetadataModel.aggregate([
      {
        $match: {
          orgId,
          uploadStatus: 'completed',
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
   */
  async getRecentFiles(
    orgId: string,
    limit: number = 5,
  ): Promise<FileMetadataType[]> {
    const docs = await this.fileMetadataModel
      .find({
        orgId,
        uploadStatus: 'completed',
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
      tags: doc.tags,
      metadata: doc.metadata,
      uploadStatus: doc.uploadStatus as 'pending' | 'completed' | 'failed',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
