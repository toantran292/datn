import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  FileStorageService,
  TranscriptEntry,
  FileMetadata,
} from './file-storage.service';

export interface SaveTranscriptDto {
  meetingId: string;
  entries: TranscriptEntry[];
  uploadedBy: string;
}

export interface TranscriptResponse {
  id: string;
  meetingId: string;
  fileId: string;
  fileName: string;
  entryCount: number;
  downloadUrl?: string;
  createdAt: Date;
}

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
  ) {}

  /**
   * Save transcript to S3 and create database record
   */
  async saveTranscript(dto: SaveTranscriptDto): Promise<TranscriptResponse> {
    this.logger.log(`Saving transcript for meeting ${dto.meetingId} with ${dto.entries.length} entries`);

    // Get meeting to get roomId and orgId
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: dto.meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Upload transcript to S3
    const fileMetadata = await this.fileStorage.uploadTranscript({
      meetingId: dto.meetingId,
      roomId: meeting.roomId,
      entries: dto.entries,
      uploadedBy: dto.uploadedBy,
      orgId: meeting.orgId || undefined,
    });

    // Create meeting event for transcript saved
    await this.prisma.meetingEvent.create({
      data: {
        meetingId: dto.meetingId,
        eventType: 'transcript_saved',
        userId: dto.uploadedBy,
        metadata: {
          fileId: fileMetadata.id,
          entryCount: dto.entries.length,
        },
      },
    });

    this.logger.log(`Transcript saved successfully: ${fileMetadata.id}`);

    return {
      id: fileMetadata.id,
      meetingId: dto.meetingId,
      fileId: fileMetadata.id,
      fileName: fileMetadata.originalName,
      entryCount: dto.entries.length,
      createdAt: fileMetadata.createdAt,
    };
  }

  /**
   * Get transcripts for a meeting
   */
  async getMeetingTranscripts(meetingId: string): Promise<TranscriptResponse[]> {
    // Get transcript files from file storage
    const files = await this.fileStorage.listMeetingFiles(meetingId, 'Transcript');

    return files.map((file) => ({
      id: file.id,
      meetingId,
      fileId: file.id,
      fileName: file.originalName,
      entryCount: file.metadata?.entryCount || 0,
      createdAt: file.createdAt,
    }));
  }

  /**
   * Get transcript download URL
   */
  async getTranscriptDownloadUrl(fileId: string): Promise<string> {
    return this.fileStorage.getTranscriptUrl(fileId);
  }

  /**
   * Get transcript content (download and parse)
   */
  async getTranscriptContent(fileId: string): Promise<{
    meetingId: string;
    roomId: string;
    entries: TranscriptEntry[];
  }> {
    // Get download URL
    const downloadUrl = await this.fileStorage.getTranscriptUrl(fileId);

    // Download and parse JSON
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new NotFoundException('Failed to download transcript');
    }

    const content = await response.json();
    return {
      meetingId: content.meetingId,
      roomId: content.roomId,
      entries: content.entries || [],
    };
  }

  /**
   * Delete transcript
   */
  async deleteTranscript(fileId: string): Promise<void> {
    await this.fileStorage.deleteFile(fileId);
    this.logger.log(`Transcript deleted: ${fileId}`);
  }
}
