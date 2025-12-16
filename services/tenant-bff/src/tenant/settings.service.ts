import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
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

  /**
   * Get presigned URL for uploading logo (client-side upload flow)
   */
  async getUploadPresignedUrl(
    orgId: string,
    fileInfo: { originalName: string; mimeType: string; size: number },
  ): Promise<{ assetId: string; presignedUrl: string }> {
    const url = `${this.fileStorageBaseUrl}/files/presigned-url`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, {
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          service: 'identity',
          modelType: 'Organization',
          subjectId: orgId,
          orgId: orgId,
          tags: ['logo'],
        }, {
          headers: {
            'X-Internal-Call': 'bff',
          },
        }),
      );

      const { assetId, presignedUrl } = res.data?.data || {};

      if (!assetId || !presignedUrl) {
        throw new Error('Failed to get presigned URL');
      }

      return { assetId, presignedUrl };
    } catch (err) {
      this.logger.error(`Failed to get upload presigned URL: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Confirm that file upload is completed
   */
  async confirmUpload(assetId: string): Promise<void> {
    const url = `${this.fileStorageBaseUrl}/files/confirm-upload`;

    try {
      await firstValueFrom(
        this.http.post(url, { assetId }, {
          headers: {
            'X-Internal-Call': 'bff',
          },
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to confirm upload: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  async getLogoUrl(assetId: string): Promise<string | null> {
    if (!assetId) return null;

    const url = `${this.fileStorageBaseUrl}/files/presigned-get-url`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, { id: assetId }, {
          headers: {
            'X-Internal-Call': 'bff',
          },
        }),
      );

      return res.data?.data?.presignedUrl || null;
    } catch (err) {
      this.logger.error(`Failed to get logo URL: ${err.message}`);
      return null;
    }
  }

  async deleteLogo(orgId: string): Promise<void> {
    const url = `${this.fileStorageBaseUrl}/files/subject/identity/organization/${orgId}`;

    try {
      await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to delete logo: ${err.message}`);
      // Don't throw - logo deletion is optional
    }
  }
}
