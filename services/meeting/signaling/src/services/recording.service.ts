import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Recording, RecordingStatus } from '@prisma/client';
import { FileStorageService } from './file-storage.service';
import { MediaProcessorService } from './media-processor.service';

export interface StartRecordingDto {
  meetingId: string;
  startedBy: string;
  sessionId?: string;
}

export interface StopRecordingDto {
  recordingId: string;
  stoppedBy: string;
}

export interface UpdateRecordingDto {
  recordingId: string;
  status?: RecordingStatus;
  filePath?: string;
  fileSize?: number;
  s3Bucket?: string;
  s3Key?: string;
  s3Url?: string;
  audioFileId?: string; // ID of extracted audio file in file-storage
  error?: string;
}

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
    private readonly mediaProcessor: MediaProcessorService,
  ) {}

  /**
   * Start a new recording
   */
  async startRecording(dto: StartRecordingDto): Promise<Recording> {
    // Check if meeting exists
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: dto.meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== 'ACTIVE') {
      throw new BadRequestException('Meeting is not active');
    }

    // Check if there's already an active recording
    const activeRecording = await this.prisma.recording.findFirst({
      where: {
        meetingId: dto.meetingId,
        status: { in: ['PENDING', 'RECORDING'] },
      },
    });

    if (activeRecording) {
      throw new BadRequestException('Recording already in progress');
    }

    // Generate session ID if not provided
    const sessionId = dto.sessionId || `rec-${dto.meetingId}-${Date.now()}`;

    this.logger.log(`Starting recording ${sessionId} for meeting ${dto.meetingId}`);

    const recording = await this.prisma.recording.create({
      data: {
        meetingId: dto.meetingId,
        sessionId,
        startedBy: dto.startedBy,
        status: 'PENDING',
      },
    });

    // Create event
    await this.createMeetingEvent(dto.meetingId, 'recording_started', dto.startedBy, {
      recordingId: recording.id,
      sessionId,
    });

    // TODO: Trigger Jibri recording via XMPP or REST API
    // This would integrate with your Jitsi/Jibri setup
    await this.triggerJibriRecording(meeting.roomId, sessionId);

    return recording;
  }

  /**
   * Stop a recording
   */
  async stopRecording(dto: StopRecordingDto): Promise<Recording> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: dto.recordingId },
      include: { meeting: true },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.status !== 'RECORDING' && recording.status !== 'PENDING') {
      throw new BadRequestException('Recording is not active');
    }

    this.logger.log(`Stopping recording ${recording.id}`);

    const stoppedAt = new Date();
    const duration = Math.floor(
      (stoppedAt.getTime() - recording.startedAt.getTime()) / 1000,
    );

    const updated = await this.prisma.recording.update({
      where: { id: dto.recordingId },
      data: {
        status: 'STOPPED',
        stoppedBy: dto.stoppedBy,
        stoppedAt,
        duration,
      },
    });

    // Create event
    await this.createMeetingEvent(recording.meetingId, 'recording_stopped', dto.stoppedBy, {
      recordingId: recording.id,
      duration,
    });

    // TODO: Stop Jibri recording
    await this.stopJibriRecording(recording.sessionId);

    return updated;
  }

  /**
   * Update recording metadata (called by Jibri webhook)
   */
  async updateRecording(dto: UpdateRecordingDto): Promise<Recording> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: dto.recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    const data: any = {};

    if (dto.status) data.status = dto.status;
    if (dto.filePath) data.filePath = dto.filePath;
    if (dto.fileSize) data.fileSize = dto.fileSize;
    if (dto.s3Bucket) data.s3Bucket = dto.s3Bucket;
    if (dto.s3Key) data.s3Key = dto.s3Key;
    if (dto.s3Url) data.s3Url = dto.s3Url;
    if (dto.error) data.error = dto.error;

    // If uploading to S3, set uploadedAt
    if (dto.s3Url && !recording.uploadedAt) {
      data.uploadedAt = new Date();
    }

    const updated = await this.prisma.recording.update({
      where: { id: dto.recordingId },
      data,
    });

    this.logger.log(`Updated recording ${dto.recordingId} with status ${dto.status}`);

    return updated;
  }

  /**
   * Update recording by session ID (for Jibri webhooks)
   */
  async updateRecordingBySessionId(
    sessionId: string,
    updates: Partial<UpdateRecordingDto>,
  ): Promise<Recording> {
    const recording = await this.prisma.recording.findUnique({
      where: { sessionId },
    });

    if (!recording) {
      throw new NotFoundException(`Recording with session ${sessionId} not found`);
    }

    return this.updateRecording({
      recordingId: recording.id,
      ...updates,
    });
  }

  /**
   * Get recording by ID
   */
  async getRecording(recordingId: string): Promise<Recording> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        meeting: true,
      },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    return recording;
  }

  /**
   * Get recording by session ID
   */
  async getRecordingBySessionId(sessionId: string): Promise<Recording> {
    const recording = await this.prisma.recording.findUnique({
      where: { sessionId },
      include: {
        meeting: true,
      },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    return recording;
  }

  /**
   * Get all recordings for a meeting
   */
  async getMeetingRecordings(meetingId: string): Promise<Recording[]> {
    return this.prisma.recording.findMany({
      where: { meetingId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get user's recordings (where they started the recording)
   */
  async getUserRecordings(userId: string): Promise<Recording[]> {
    return this.prisma.recording.findMany({
      where: { startedBy: userId },
      include: {
        meeting: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get recordings for user's meetings
   */
  async getUserMeetingRecordings(userId: string): Promise<Recording[]> {
    return this.prisma.recording.findMany({
      where: {
        meeting: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        meeting: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    // TODO: Delete from S3 if uploaded
    if (recording.s3Key) {
      await this.deleteFromS3(recording.s3Bucket!, recording.s3Key);
    }

    await this.prisma.recording.delete({
      where: { id: recordingId },
    });

    this.logger.log(`Deleted recording ${recordingId}`);
  }

  /**
   * Trigger Jibri recording (to be implemented with actual Jibri integration)
   */
  private async triggerJibriRecording(roomId: string, sessionId: string): Promise<void> {
    // TODO: Implement actual Jibri trigger
    // This would use XMPP to send recording command to Jibri
    // Or use Jitsi REST API if available

    this.logger.debug(`Would trigger Jibri recording for room ${roomId}, session ${sessionId}`);

    // Example integration points:
    // 1. XMPP stanza to Prosody
    // 2. REST API to Jicofo
    // 3. Direct XMPP connection to Jibri component

    // For now, just update status to RECORDING after a delay
    setTimeout(async () => {
      try {
        await this.updateRecordingBySessionId(sessionId, {
          status: 'RECORDING',
        });
      } catch (error) {
        this.logger.error(`Failed to update recording status: ${error.message}`);
      }
    }, 2000);
  }

  /**
   * Stop Jibri recording
   */
  private async stopJibriRecording(sessionId: string): Promise<void> {
    // TODO: Implement actual Jibri stop command
    this.logger.debug(`Would stop Jibri recording for session ${sessionId}`);

    // After stopping, Jibri would call webhook with file path
    // Then we'd upload to S3 and update the recording
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(bucket: string, key: string): Promise<void> {
    // TODO: Implement S3 deletion
    this.logger.debug(`Would delete s3://${bucket}/${key}`);
  }

  /**
   * Create meeting event
   */
  private async createMeetingEvent(
    meetingId: string,
    eventType: string,
    userId?: string,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.meetingEvent.create({
      data: {
        meetingId,
        eventType,
        userId,
        metadata,
      },
    });
  }

  /**
   * Process Jibri webhook (called when recording is complete)
   */
  async processJibriWebhook(payload: {
    sessionId: string;
    status: 'started' | 'stopped' | 'failed';
    filePath?: string;
    fileSize?: number;
    error?: string;
  }): Promise<void> {
    this.logger.log(`Processing Jibri webhook for session ${payload.sessionId}`);

    const statusMap: Record<string, RecordingStatus> = {
      started: 'RECORDING',
      stopped: 'PROCESSING',
      failed: 'FAILED',
    };

    const updates: Partial<UpdateRecordingDto> = {
      status: statusMap[payload.status],
    };

    if (payload.filePath) updates.filePath = payload.filePath;
    if (payload.fileSize) updates.fileSize = payload.fileSize;
    if (payload.error) updates.error = payload.error;

    await this.updateRecordingBySessionId(payload.sessionId, updates);

    // If stopped successfully, trigger S3 upload
    if (payload.status === 'stopped' && payload.filePath) {
      await this.uploadToS3(payload.sessionId, payload.filePath);
    }
  }

  /**
   * Upload recording to S3 and extract audio for AI analysis
   */
  private async uploadToS3(sessionId: string, filePath: string): Promise<void> {
    this.logger.log(`Processing recording ${sessionId} from ${filePath}`);

    try {
      // Get recording to find meeting info
      const recording = await this.prisma.recording.findUnique({
        where: { sessionId },
        include: { meeting: true },
      });

      if (!recording) {
        throw new Error(`Recording ${sessionId} not found`);
      }

      // 1. Upload video file to S3
      this.logger.log(`Uploading video for session ${sessionId}`);
      const videoFile = await this.fileStorage.uploadRecording(
        recording.meetingId,
        filePath,
        recording.startedBy,
        recording.meeting.orgId || undefined,
      );

      // 2. Extract audio from video for AI analysis
      this.logger.log(`Extracting audio for session ${sessionId}`);
      const audioResult = await this.mediaProcessor.extractAudio(filePath, {
        format: 'mp3',
        sampleRate: 16000, // Optimized for speech recognition
        channels: 1, // Mono for better speech analysis
        bitrate: '128k',
      });

      // 3. Upload extracted audio to S3
      this.logger.log(`Uploading audio for session ${sessionId}`);
      const audioFile = await this.fileStorage.uploadRecording(
        recording.meetingId,
        audioResult.audioPath,
        recording.startedBy,
        recording.meeting.orgId || undefined,
      );

      // 4. Update recording with file storage IDs
      await this.updateRecordingBySessionId(sessionId, {
        status: 'COMPLETED',
        s3Bucket: videoFile.bucket,
        s3Key: videoFile.objectKey,
        s3Url: videoFile.url,
        audioFileId: audioFile.id,
      });

      // 5. Create event for recording processed
      await this.createMeetingEvent(recording.meetingId, 'recording_processed', recording.startedBy, {
        recordingId: recording.id,
        videoFileId: videoFile.id,
        audioFileId: audioFile.id,
        duration: audioResult.duration,
      });

      // 6. Cleanup temp audio file
      await this.mediaProcessor.cleanup([audioResult.audioPath]);

      this.logger.log(`Recording ${sessionId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process recording ${sessionId}: ${error}`);
      await this.updateRecordingBySessionId(sessionId, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get audio file URL for AI analysis
   */
  async getAudioFileUrl(recordingId: string): Promise<string | null> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    // Get audioFileId from metadata or dedicated field
    const audioFileId = (recording as any).audioFileId;
    if (!audioFileId) {
      return null;
    }

    return this.fileStorage.getRecordingUrl(audioFileId);
  }

  /**
   * Get video file URL
   */
  async getVideoFileUrl(recordingId: string): Promise<string | null> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (!recording.s3Url) {
      return null;
    }

    // If we have a file storage ID, get fresh presigned URL
    // Otherwise return the stored URL
    return recording.s3Url;
  }
}
