import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

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

export interface TranscriptEntry {
  speakerId: string;
  speakerName?: string;
  text: string;
  translatedText?: string;
  translatedLang?: string;
  timestamp: string;
  isFinal: boolean;
}

export interface SaveTranscriptDto {
  meetingId: string;
  roomId: string;
  entries: TranscriptEntry[];
  uploadedBy?: string;
  orgId?: string;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'FILE_STORAGE_URL',
      'http://file-storage-api:3000',
    );
  }

  /**
   * Create presigned URL for upload
   */
  async createPresignedUrl(dto: CreatePresignedUrlRequest): Promise<CreatePresignedUrlResponse> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to create presigned URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Confirm upload completion
   */
  async confirmUpload(assetId: string): Promise<FileMetadata> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to confirm upload: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFile(id: string): Promise<FileMetadata> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get presigned download URL
   */
  async getPresignedGetUrl(id: string, expirySeconds = 3600): Promise<PresignedGetUrlResponse> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get presigned URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(id: string): Promise<void> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload transcript/caption to S3
   * Creates a JSON file with all transcript entries
   */
  async uploadTranscript(dto: SaveTranscriptDto): Promise<FileMetadata> {
    this.logger.log(`Uploading transcript for meeting ${dto.meetingId}`);

    // Create transcript JSON content
    const transcriptContent = JSON.stringify(
      {
        meetingId: dto.meetingId,
        roomId: dto.roomId,
        createdAt: new Date().toISOString(),
        entryCount: dto.entries.length,
        entries: dto.entries,
      },
      null,
      2,
    );

    const contentBuffer = Buffer.from(transcriptContent, 'utf-8');
    const fileName = `transcript-${dto.meetingId}-${Date.now()}.json`;

    // Create presigned URL for upload
    const presigned = await this.createPresignedUrl({
      originalName: fileName,
      mimeType: 'application/json',
      size: contentBuffer.length,
      service: 'meeting',
      modelType: 'Transcript',
      subjectId: dto.meetingId,
      uploadedBy: dto.uploadedBy,
      orgId: dto.orgId,
      tags: ['transcript', 'caption'],
      metadata: {
        roomId: dto.roomId,
        entryCount: dto.entries.length,
      },
    });

    // Upload content directly to presigned URL
    const uploadResponse = await fetch(presigned.presignedUrl, {
      method: 'PUT',
      body: contentBuffer,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!uploadResponse.ok) {
      throw new HttpException(
        'Failed to upload transcript to storage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Confirm upload
    const fileMetadata = await this.confirmUpload(presigned.assetId);

    this.logger.log(`Transcript uploaded successfully: ${fileMetadata.id}`);
    return fileMetadata;
  }

  /**
   * Upload recording file to S3
   */
  async uploadRecording(
    meetingId: string,
    filePath: string,
    uploadedBy?: string,
    orgId?: string,
  ): Promise<FileMetadata> {
    this.logger.log(`Uploading recording for meeting ${meetingId} from ${filePath}`);

    // Get file info
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();

    // Determine mime type
    const mimeTypeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
    };
    const mimeType = mimeTypeMap[ext] || 'video/mp4';

    // Create presigned URL
    const presigned = await this.createPresignedUrl({
      originalName: fileName,
      mimeType,
      size: stats.size,
      service: 'meeting',
      modelType: 'Recording',
      subjectId: meetingId,
      uploadedBy,
      orgId,
      tags: ['recording', 'video'],
      metadata: {
        originalPath: filePath,
        duration: null, // Can be extracted from video metadata
      },
    });

    // Upload file
    const fileStream = fs.createReadStream(filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk as Buffer);
    }
    const fileBuffer = Buffer.concat(chunks);

    const uploadResponse = await fetch(presigned.presignedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': mimeType,
      },
    });

    if (!uploadResponse.ok) {
      throw new HttpException(
        'Failed to upload recording to storage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Confirm upload
    const fileMetadata = await this.confirmUpload(presigned.assetId);

    this.logger.log(`Recording uploaded successfully: ${fileMetadata.id}`);
    return fileMetadata;
  }

  /**
   * Get transcript download URL
   */
  async getTranscriptUrl(fileId: string): Promise<string> {
    const response = await this.getPresignedGetUrl(fileId, 3600);
    return response.presignedUrl;
  }

  /**
   * Get recording download URL
   */
  async getRecordingUrl(fileId: string): Promise<string> {
    const response = await this.getPresignedGetUrl(fileId, 7200); // 2 hours for recordings
    return response.presignedUrl;
  }

  /**
   * List files for a meeting
   */
  async listMeetingFiles(
    meetingId: string,
    modelType?: 'Transcript' | 'Recording',
  ): Promise<FileMetadata[]> {
    try {
      const params = new URLSearchParams({
        service: 'meeting',
        subjectId: meetingId,
      });
      if (modelType) {
        params.set('modelType', modelType);
      }

      const response = await fetch(`${this.baseUrl}/files?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to list files',
          response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const result = await response.json();
      return result.data.files || [];
    } catch (error) {
      this.logger.error(`Failed to list meeting files: ${error.message}`);
      throw error;
    }
  }
}
