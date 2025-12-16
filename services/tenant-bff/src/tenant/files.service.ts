import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

interface ListFilesOptions {
  page: number;
  limit: number;
  search?: string;
  type?: string;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly fileStorageBaseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.fileStorageBaseUrl = this.config.get(
      'FILE_STORAGE_URL',
      'http://file-storage-api:3000',
    );
  }

  async listFiles(orgId: string, options: ListFilesOptions) {
    const url = `${this.fileStorageBaseUrl}/files`;

    try {
      const params: Record<string, any> = {
        page: options.page,
        limit: options.limit,
      };

      if (options.search) {
        params.search = options.search;
      }

      if (options.type && options.type !== 'all') {
        params.mimeTypePrefix = this.getMimeTypePrefix(options.type);
      }

      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
          params,
        }),
      );

      const data = res.data?.data || {};

      // Transform to frontend format
      return {
        items: (data.items || []).map((file: any) => this.transformFile(file)),
        total: data.total || 0,
        page: data.page || options.page,
        limit: data.limit || options.limit,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / options.limit),
      };
    } catch (err) {
      this.logger.error(`Failed to list files: ${err.message}`);
      return {
        items: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        totalPages: 0,
      };
    }
  }

  async getStorageUsage(orgId: string) {
    const url = `${this.fileStorageBaseUrl}/files/storage/usage`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );

      return res.data?.data || { usedBytes: 0, fileCount: 0 };
    } catch (err) {
      this.logger.error(`Failed to get storage usage: ${err.message}`);
      return { usedBytes: 0, fileCount: 0 };
    }
  }

  async uploadFile(
    orgId: string,
    userId: string,
    file: any,
    metadata: { tags?: string[]; description?: string },
  ) {
    const url = `${this.fileStorageBaseUrl}/files/upload`;

    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      formData.append('service', 'tenant');
      formData.append('modelType', 'file');
      formData.append('subjectId', orgId);

      if (metadata.tags?.length) {
        formData.append('tags', JSON.stringify(metadata.tags));
      }

      if (metadata.description) {
        formData.append('metadata', JSON.stringify({ description: metadata.description }));
      }

      const res = await firstValueFrom(
        this.http.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
            'X-User-Id': userId,
          },
        }),
      );

      return {
        success: true,
        file: this.transformFile(res.data?.data),
      };
    } catch (err) {
      this.logger.error(`Failed to upload file: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  async getPresignedUploadUrl(
    orgId: string,
    userId: string,
    fileInfo: { fileName: string; mimeType: string; size: number },
  ) {
    const url = `${this.fileStorageBaseUrl}/files/presigned-url`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          {
            originalName: fileInfo.fileName,
            mimeType: fileInfo.mimeType,
            size: fileInfo.size,
            service: 'tenant',
            modelType: 'file',
            subjectId: orgId,
          },
          {
            headers: {
              'X-Internal-Call': 'bff',
              'X-Org-Id': orgId,
              'X-User-Id': userId,
            },
          },
        ),
      );

      return res.data?.data;
    } catch (err) {
      this.logger.error(`Failed to get presigned URL: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  async confirmUpload(assetId: string) {
    const url = `${this.fileStorageBaseUrl}/files/confirm-upload`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          { assetId },
          {
            headers: {
              'X-Internal-Call': 'bff',
            },
          },
        ),
      );

      return {
        success: true,
        file: this.transformFile(res.data?.data),
      };
    } catch (err) {
      this.logger.error(`Failed to confirm upload: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  async getPresignedDownloadUrl(fileId: string) {
    const url = `${this.fileStorageBaseUrl}/files/presigned-get-url`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          { id: fileId, expirySeconds: 3600 },
          {
            headers: {
              'X-Internal-Call': 'bff',
            },
          },
        ),
      );

      return res.data?.data;
    } catch (err) {
      this.logger.error(`Failed to get download URL: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  async deleteFile(orgId: string, fileId: string) {
    const url = `${this.fileStorageBaseUrl}/files/${fileId}`;

    try {
      await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );

      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to delete file: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  private transformFile(file: any) {
    if (!file) return null;

    return {
      id: file.id,
      name: file.originalName,
      type: this.getFileType(file.mimeType),
      mimeType: file.mimeType,
      size: file.size,
      sizeFormatted: this.formatSize(file.size),
      uploadedBy: file.uploadedBy || 'Unknown',
      uploadedAt: file.createdAt,
      url: file.url,
      tags: file.tags || [],
      metadata: file.metadata || {},
    };
  }

  private getFileType(mimeType: string): string {
    if (!mimeType) return 'other';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv'))
      return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return 'presentation';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    return 'other';
  }

  private getMimeTypePrefix(type: string): string {
    switch (type) {
      case 'image':
        return 'image/';
      case 'pdf':
        return 'application/pdf';
      case 'document':
        return 'application/';
      case 'spreadsheet':
        return 'application/vnd';
      default:
        return '';
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
