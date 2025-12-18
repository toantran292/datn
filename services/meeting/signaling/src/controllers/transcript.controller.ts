import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TranscriptService } from '../services/transcript.service';
import { TranscriptEntry } from '../services/file-storage.service';

interface SaveTranscriptBody {
  meetingId: string;
  entries: TranscriptEntry[];
}

@Controller('transcripts')
export class TranscriptController {
  private readonly logger = new Logger(TranscriptController.name);

  constructor(private readonly transcriptService: TranscriptService) {}

  /**
   * Save transcript for a meeting
   * POST /transcripts
   */
  @Post()
  async saveTranscript(
    @Headers('x-user-id') userId: string,
    @Body() body: SaveTranscriptBody,
  ) {
    this.logger.log(`Saving transcript for meeting ${body.meetingId} by user ${userId}`);

    if (!userId) {
      throw new NotFoundException('User ID required');
    }

    const result = await this.transcriptService.saveTranscript({
      meetingId: body.meetingId,
      entries: body.entries,
      uploadedBy: userId,
    });

    return {
      success: true,
      transcript: result,
    };
  }

  /**
   * Get transcripts for a meeting
   * GET /transcripts/meeting/:meetingId
   */
  @Get('meeting/:meetingId')
  async getMeetingTranscripts(@Param('meetingId') meetingId: string) {
    this.logger.log(`Getting transcripts for meeting ${meetingId}`);

    const transcripts = await this.transcriptService.getMeetingTranscripts(meetingId);

    return {
      success: true,
      transcripts,
    };
  }

  /**
   * Get transcript download URL
   * GET /transcripts/:fileId/download
   */
  @Get(':fileId/download')
  async getTranscriptDownloadUrl(@Param('fileId') fileId: string) {
    this.logger.log(`Getting download URL for transcript ${fileId}`);

    const downloadUrl = await this.transcriptService.getTranscriptDownloadUrl(fileId);

    return {
      success: true,
      downloadUrl,
    };
  }

  /**
   * Get transcript content (parsed JSON)
   * GET /transcripts/:fileId/content
   */
  @Get(':fileId/content')
  async getTranscriptContent(@Param('fileId') fileId: string) {
    this.logger.log(`Getting content for transcript ${fileId}`);

    const content = await this.transcriptService.getTranscriptContent(fileId);

    return {
      success: true,
      ...content,
    };
  }

  /**
   * Delete transcript
   * DELETE /transcripts/:fileId
   */
  @Delete(':fileId')
  async deleteTranscript(
    @Headers('x-user-id') userId: string,
    @Param('fileId') fileId: string,
  ) {
    this.logger.log(`Deleting transcript ${fileId} by user ${userId}`);

    await this.transcriptService.deleteTranscript(fileId);

    return {
      success: true,
      message: 'Transcript deleted',
    };
  }
}
