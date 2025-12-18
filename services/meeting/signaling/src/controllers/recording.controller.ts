import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordingService } from '../services/recording.service';
import { AuthorizationService } from '../services/authorization.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'recordings');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('recordings')
export class RecordingController {
  private readonly logger = new Logger(RecordingController.name);

  constructor(
    private readonly recordingService: RecordingService,
    private readonly authService: AuthorizationService,
  ) {}

  /**
   * Start recording
   */
  @Post('start')
  async startRecording(
    @Body()
    body: {
      meeting_id: string;
      user_id: string;
      session_id?: string;
    },
  ) {
    const { meeting_id, user_id, session_id } = body;

    if (!meeting_id || !user_id) {
      throw new BadRequestException('meeting_id and user_id required');
    }

    // Check if user is moderator or host
    const isModerator = await this.authService.isModerator(user_id, meeting_id);
    if (!isModerator) {
      throw new ForbiddenException('Only moderators can start recording');
    }

    const recording = await this.recordingService.startRecording({
      meetingId: meeting_id,
      startedBy: user_id,
      sessionId: session_id,
    });

    return {
      recording_id: recording.id,
      session_id: recording.sessionId,
      status: recording.status,
      started_at: recording.startedAt,
    };
  }

  /**
   * Stop recording
   */
  @Post(':recordingId/stop')
  async stopRecording(
    @Param('recordingId') recordingId: string,
    @Body('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id required');
    }

    const recording = await this.recordingService.getRecording(recordingId);

    // Check if user is moderator or host
    const isModerator = await this.authService.isModerator(userId, recording.meetingId);
    if (!isModerator) {
      throw new ForbiddenException('Only moderators can stop recording');
    }

    const updated = await this.recordingService.stopRecording({
      recordingId,
      stoppedBy: userId,
    });

    return {
      recording_id: updated.id,
      status: updated.status,
      duration: updated.duration,
      stopped_at: updated.stoppedAt,
    };
  }

  /**
   * Get recording details
   */
  @Get(':recordingId')
  async getRecording(@Param('recordingId') recordingId: string) {
    const recording = await this.recordingService.getRecording(recordingId);

    return {
      recording_id: recording.id,
      session_id: recording.sessionId,
      meeting_id: recording.meetingId,
      status: recording.status,
      started_by: recording.startedBy,
      stopped_by: recording.stoppedBy,
      started_at: recording.startedAt,
      stopped_at: recording.stoppedAt,
      duration: recording.duration,
      file_path: recording.filePath,
      file_size: recording.fileSize,
      s3_url: recording.s3Url,
      error: recording.error,
    };
  }

  /**
   * Get all recordings for a meeting
   */
  @Get('meeting/:meetingId')
  async getMeetingRecordings(@Param('meetingId') meetingId: string) {
    const recordings = await this.recordingService.getMeetingRecordings(meetingId);

    return {
      recordings: recordings.map((r) => ({
        recording_id: r.id,
        session_id: r.sessionId,
        status: r.status,
        started_by: r.startedBy,
        started_at: r.startedAt,
        duration: r.duration,
        s3_url: r.s3Url,
      })),
    };
  }

  /**
   * Get user's recordings
   */
  @Get('user/:userId')
  async getUserRecordings(@Param('userId') userId: string) {
    const recordings = await this.recordingService.getUserMeetingRecordings(userId);

    return {
      recordings: recordings.map((r) => ({
        recording_id: r.id,
        session_id: r.sessionId,
        meeting_id: r.meetingId,
        status: r.status,
        started_at: r.startedAt,
        duration: r.duration,
        s3_url: r.s3Url,
      })),
    };
  }

  /**
   * Delete recording
   */
  @Delete(':recordingId')
  async deleteRecording(
    @Param('recordingId') recordingId: string,
    @Body('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id required');
    }

    const recording = await this.recordingService.getRecording(recordingId);

    // Only allow deletion by host or recording starter
    const isHost = await this.authService.isHost(userId, recording.meetingId);
    const isRecordingStarter = recording.startedBy === userId;

    if (!isHost && !isRecordingStarter) {
      throw new ForbiddenException('Only host or recording starter can delete');
    }

    await this.recordingService.deleteRecording(recordingId);

    return { success: true };
  }

  /**
   * Webhook endpoint for Jibri callbacks
   */
  @Post('webhook/jibri')
  async jibriWebhook(
    @Body()
    body: {
      session_id: string;
      status: 'started' | 'stopped' | 'failed';
      file_path?: string;
      file_size?: number;
      error?: string;
    },
  ) {
    const { session_id, status, file_path, file_size, error } = body;

    if (!session_id || !status) {
      throw new BadRequestException('session_id and status required');
    }

    await this.recordingService.processJibriWebhook({
      sessionId: session_id,
      status,
      filePath: file_path,
      fileSize: file_size,
      error,
    });

    return { success: true };
  }

  /**
   * Update recording metadata (for manual updates)
   */
  @Put(':recordingId/metadata')
  async updateRecordingMetadata(
    @Param('recordingId') recordingId: string,
    @Body()
    body: {
      user_id: string;
      status?: string;
      s3_bucket?: string;
      s3_key?: string;
      s3_url?: string;
    },
  ) {
    const { user_id } = body;

    if (!user_id) {
      throw new BadRequestException('user_id required');
    }

    const recording = await this.recordingService.getRecording(recordingId);

    // Check authorization
    const isHost = await this.authService.isHost(user_id, recording.meetingId);
    if (!isHost) {
      throw new ForbiddenException('Only host can update recording metadata');
    }

    const updated = await this.recordingService.updateRecording({
      recordingId,
      status: body.status as any,
      s3Bucket: body.s3_bucket,
      s3Key: body.s3_key,
      s3Url: body.s3_url,
    });

    return {
      recording_id: updated.id,
      status: updated.status,
      s3_url: updated.s3Url,
    };
  }

  /**
   * Upload client-side recording
   * Accepts multipart form data with video file
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.webm';
          callback(null, `recording-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
      },
      fileFilter: (req, file, callback) => {
        // Accept video files
        if (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream') {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only video files are allowed'), false);
        }
      },
    }),
  )
  async uploadRecording(
    @UploadedFile() file: Express.Multer.File,
    @Body('meeting_id') meetingId: string,
    @Body('user_id') userId: string,
    @Body('duration') duration: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!meetingId || !userId) {
      throw new BadRequestException('meeting_id and user_id required');
    }

    this.logger.log(`Received recording upload: ${file.filename} (${file.size} bytes) for meeting ${meetingId}`);

    // Create a recording record in the database
    const sessionId = `client-rec-${meetingId}-${Date.now()}`;
    const filePath = join(UPLOAD_DIR, file.filename);
    const durationSec = parseInt(duration) || 0;

    try {
      // Create recording entry
      const recording = await this.recordingService.startRecording({
        meetingId,
        startedBy: userId,
        sessionId,
      });

      // Update with file info and mark as completed
      const updated = await this.recordingService.updateRecording({
        recordingId: recording.id,
        status: 'COMPLETED',
        filePath,
        fileSize: file.size,
      });

      // If duration provided, update it
      if (durationSec > 0) {
        await this.recordingService.updateRecording({
          recordingId: recording.id,
          // Duration is stored when stopping, so we need to stop it properly
        });
      }

      this.logger.log(`Recording saved: ${recording.id}`);

      // Generate URL for accessing the recording
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 40600}`;
      const fileUrl = `${baseUrl}/recordings/file/${file.filename}`;

      return {
        success: true,
        recording_id: updated.id,
        session_id: sessionId,
        file_path: filePath,
        file_size: file.size,
        url: fileUrl,
        duration: durationSec,
      };
    } catch (error: any) {
      this.logger.error(`Failed to save recording: ${error.message}`);
      throw new BadRequestException(`Failed to save recording: ${error.message}`);
    }
  }

  /**
   * Serve recording file
   */
  @Get('file/:filename')
  async getRecordingFile(@Param('filename') filename: string) {
    const filePath = join(UPLOAD_DIR, filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Recording file not found');
    }

    // Return file path for streaming (handled by NestJS static file serving or custom middleware)
    return {
      file_path: filePath,
      filename,
    };
  }
}
