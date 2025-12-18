import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MetadataService } from '../metadata/metadata.service';
import {
  FileMetadata,
  UploadFileRequest,
  CreatePresignedUrlRequest,
  CreatePresignedUrlResponse,
} from '../types/file.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly PRESIGNED_URL_EXPIRY = 3600; // 1 hour

  constructor(
    private readonly minioService: MinioService,
    private readonly metadataService: MetadataService,
  ) {}

  /**
   * Create presigned URL for client-side upload
   * This is the NEW recommended flow
   */
  async createPresignedUrl(
    request: CreatePresignedUrlRequest,
  ): Promise<CreatePresignedUrlResponse> {
    this.logger.log(
      `Creating presigned URL for "${request.originalName}" (${request.service}/${request.modelType}/${request.subjectId})`,
    );

    // Generate unique object key
    const objectKey = this.generateObjectKey(request.originalName);

    // Create metadata record with pending status
    const metadata = await this.metadataService.create({
      originalName: request.originalName,
      mimeType: request.mimeType,
      size: request.size,
      bucket: 'files', // default bucket
      objectKey,
      service: request.service,
      modelType: request.modelType,
      subjectId: request.subjectId,
      uploadedBy: request.uploadedBy,
      orgId: request.orgId,
      workspaceId: request.workspaceId,
      folderId: request.folderId,
      tags: request.tags,
      metadata: request.metadata,
      uploadStatus: 'pending',
    });

    // Generate presigned PUT URL
    const presignedUrl = await this.minioService.getPresignedPutUrl(
      objectKey,
      'files',
      this.PRESIGNED_URL_EXPIRY,
    );

    this.logger.log(
      `Presigned URL created for asset ${metadata.id} (expires in ${this.PRESIGNED_URL_EXPIRY}s)`,
    );

    return {
      assetId: metadata.id,
      presignedUrl,
      objectKey,
      expiresIn: this.PRESIGNED_URL_EXPIRY,
    };
  }

  /**
   * Confirm that file upload is completed
   */
  async confirmUpload(assetId: string): Promise<FileMetadata> {
    this.logger.log(`Confirming upload for asset ${assetId}`);

    const metadata = await this.metadataService.findById(assetId);

    if (metadata.uploadStatus === 'completed') {
      this.logger.warn(`Asset ${assetId} already marked as completed`);
      return metadata;
    }

    // Verify file exists in MinIO
    try {
      const stats = await this.minioService.getFileStats(
        metadata.objectKey,
        metadata.bucket,
      );

      // Update metadata with actual size and mark as completed
      const url = await this.minioService.getFileUrl(
        metadata.objectKey,
        metadata.bucket,
        7 * 24 * 3600, // 7 days
      );

      const updated = await this.metadataService.update(assetId, {
        uploadStatus: 'completed',
        size: stats.size,
        url,
      });

      this.logger.log(`Upload confirmed for asset ${assetId}`);

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to confirm upload for asset ${assetId}: ${error.message}`,
        error.stack,
      );

      // Mark as failed
      await this.metadataService.update(assetId, {
        uploadStatus: 'failed',
      });

      throw new NotFoundException(
        `File not found in storage for asset ${assetId}`,
      );
    }
  }

  /**
   * Legacy method - direct upload via multipart/form-data
   * Keep for backward compatibility
   */
  async uploadFile(
    file: Express.Multer.File,
    request: UploadFileRequest,
  ): Promise<FileMetadata> {
    this.logger.log(
      `Uploading file "${file.originalname}" for ${request.service}/${request.modelType}/${request.subjectId}`,
    );

    // Upload to MinIO
    const { bucket, objectKey } = await this.minioService.uploadFile(file);

    // Generate presigned URL
    const url = await this.minioService.getFileUrl(objectKey, bucket, 7 * 24 * 3600); // 7 days

    // Save metadata
    const metadata = await this.metadataService.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucket,
      objectKey,
      url,
      service: request.service,
      modelType: request.modelType,
      subjectId: request.subjectId,
      uploadedBy: request.uploadedBy,
      orgId: request.orgId,
      tags: request.tags,
      metadata: request.metadata,
      uploadStatus: 'completed',
    });

    this.logger.log(`File uploaded successfully: ${metadata.id}`);

    return metadata;
  }

  async getFile(fileId: string): Promise<FileMetadata> {
    const metadata = await this.metadataService.findById(fileId);

    // Refresh URL if needed
    if (!metadata.url || this.isUrlExpiringSoon(metadata.updatedAt)) {
      const newUrl = await this.minioService.getFileUrl(
        metadata.objectKey,
        metadata.bucket,
      );
      await this.metadataService.update(fileId, { url: newUrl });
      metadata.url = newUrl;
    }

    return metadata;
  }

  async downloadFile(fileId: string): Promise<{
    buffer: Buffer;
    metadata: FileMetadata;
  }> {
    const metadata = await this.metadataService.findById(fileId);
    const buffer = await this.minioService.downloadFile(
      metadata.objectKey,
      metadata.bucket,
    );

    return { buffer, metadata };
  }

  async listFiles(query: {
    service?: string;
    modelType?: string;
    subjectId?: string;
    uploadedBy?: string;
    orgId?: string;
    workspaceId?: string;
    folderId?: string | null;
    search?: string;
    mimeType?: string;
    sortBy?: 'name' | 'size' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{
    files: FileMetadata[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.metadataService.findAll(query);
  }

  /**
   * Move file to a different folder (UC14)
   */
  async moveFile(fileId: string, folderId: string | null): Promise<FileMetadata> {
    this.logger.log(`Moving file ${fileId} to folder ${folderId || 'root'}`);
    return this.metadataService.moveToFolder(fileId, folderId);
  }

  async deleteFile(fileId: string): Promise<void> {
    const metadata = await this.metadataService.findById(fileId);

    // Delete from MinIO
    await this.minioService.deleteFile(metadata.objectKey, metadata.bucket);

    // Delete metadata
    await this.metadataService.delete(fileId);

    this.logger.log(`File deleted: ${fileId}`);
  }

  async deleteFilesBySubject(
    service: string,
    modelType: string,
    subjectId: string,
  ): Promise<number> {
    const result = await this.metadataService.findAll({
      service,
      modelType,
      subjectId,
    });

    let deletedCount = 0;

    for (const file of result.files) {
      try {
        await this.minioService.deleteFile(file.objectKey, file.bucket);
        await this.metadataService.delete(file.id);
        deletedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to delete file ${file.id}: ${error.message}`,
          error.stack,
        );
      }
    }

    this.logger.log(
      `Deleted ${deletedCount} files for ${service}/${modelType}/${subjectId}`,
    );

    return deletedCount;
  }

  async updateMetadata(
    fileId: string,
    updates: Partial<FileMetadata>,
  ): Promise<FileMetadata> {
    // Only allow updating certain fields
    const allowedUpdates: Partial<FileMetadata> = {};

    if (updates.tags !== undefined) allowedUpdates.tags = updates.tags;
    if (updates.metadata !== undefined)
      allowedUpdates.metadata = updates.metadata;

    return this.metadataService.update(fileId, allowedUpdates);
  }

  private isUrlExpiringSoon(lastUpdated: Date): boolean {
    const now = new Date();
    const hoursSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    // Refresh if URL is older than 6 days (we generate 7-day URLs)
    return hoursSinceUpdate > 144;
  }

  /**
   * Generate presigned GET URL for a single file by ID
   */
  async getPresignedGetUrl(
    fileId: string,
    expirySeconds: number = 3600,
  ): Promise<{ id: string; presignedUrl: string; expiresIn: number }> {
    this.logger.log(`Generating presigned GET URL for file ${fileId}`);

    const metadata = await this.metadataService.findById(fileId);

    if (metadata.uploadStatus !== 'completed') {
      throw new NotFoundException(
        `File ${fileId} is not available (status: ${metadata.uploadStatus})`,
      );
    }

    const presignedUrl = await this.minioService.getFileUrl(
      metadata.objectKey,
      metadata.bucket,
      expirySeconds,
    );

    this.logger.log(
      `Presigned GET URL generated for file ${fileId} (expires in ${expirySeconds}s)`,
    );

    return {
      id: fileId,
      presignedUrl,
      expiresIn: expirySeconds,
    };
  }

  /**
   * Generate presigned GET URLs for multiple files by IDs
   */
  async getPresignedGetUrls(
    fileIds: string[],
    expirySeconds: number = 3600,
  ): Promise<{ urls: Array<{ id: string; presignedUrl: string; expiresIn: number }> }> {
    this.logger.log(
      `Generating presigned GET URLs for ${fileIds.length} files`,
    );

    const results = await Promise.allSettled(
      fileIds.map((id) => this.getPresignedGetUrl(id, expirySeconds)),
    );

    const urls = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.logger.warn(
            `Failed to generate presigned URL for file ${fileIds[index]}: ${result.reason?.message}`,
          );
          return null;
        }
      })
      .filter((url): url is { id: string; presignedUrl: string; expiresIn: number } => url !== null);

    this.logger.log(
      `Generated ${urls.length}/${fileIds.length} presigned GET URLs`,
    );

    return { urls };
  }

  private generateObjectKey(originalName: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = originalName.split('.').pop();
    return `${timestamp}-${uuid}.${ext}`;
  }

  /**
   * Get storage usage for an organization
   */
  async getStorageUsage(orgId: string): Promise<{ usedBytes: number; fileCount: number }> {
    return this.metadataService.getStorageUsage(orgId);
  }

  /**
   * Get recent files for an organization
   */
  async getRecentFiles(orgId: string, limit: number = 5): Promise<FileMetadata[]> {
    return this.metadataService.getRecentFiles(orgId, limit);
  }
}
