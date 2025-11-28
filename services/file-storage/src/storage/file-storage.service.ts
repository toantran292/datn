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

  private generateObjectKey(originalName: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = originalName.split('.').pop();
    return `${timestamp}-${uuid}.${ext}`;
  }
}
