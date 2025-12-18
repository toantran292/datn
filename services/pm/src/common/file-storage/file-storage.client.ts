import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CreatePresignedUrlRequest {
  originalName: string;
  mimeType: string;
  size: number;
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy?: string;
  orgId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreatePresignedUrlResponse {
  assetId: string;
  presignedUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url?: string;
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  uploadStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PresignedGetUrlResponse {
  id: string;
  presignedUrl: string;
  expiresIn: number;
}

@Injectable()
export class FileStorageClient {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('FILE_STORAGE_URL', 'http://localhost:41111');
  }

  async createPresignedUrl(dto: CreatePresignedUrlRequest): Promise<CreatePresignedUrlResponse> {
    const response = await fetch(`${this.baseUrl}/files/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HttpException(
        error.message || 'Failed to create presigned URL',
        response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const result = await response.json();
    return result.data;
  }

  async confirmUpload(assetId: string): Promise<FileMetadata> {
    const response = await fetch(`${this.baseUrl}/files/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HttpException(
        error.message || 'Failed to confirm upload',
        response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const result = await response.json();
    return result.data;
  }

  async getFile(id: string): Promise<FileMetadata> {
    const response = await fetch(`${this.baseUrl}/files/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HttpException(
        error.message || 'File not found',
        response.status || HttpStatus.NOT_FOUND,
      );
    }

    const result = await response.json();
    return result.data;
  }

  async getPresignedGetUrl(id: string, expirySeconds = 3600): Promise<PresignedGetUrlResponse> {
    const response = await fetch(`${this.baseUrl}/files/presigned-get-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, expirySeconds }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HttpException(
        error.message || 'Failed to get presigned URL',
        response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const result = await response.json();
    return result.data;
  }

  async deleteFile(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/files/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HttpException(
        error.message || 'Failed to delete file',
        response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
