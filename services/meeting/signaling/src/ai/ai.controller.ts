import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RagClient, SUPPORTED_LANGUAGES, type LanguageCode, type MeetingContext } from '../common/rag';
import { TranscriptService, SaveTranscriptDto } from './transcript.service';

interface SSEMessage {
  data: string;
}

interface TranslateRequest {
  text: string;
  targetLang: LanguageCode;
  sourceLang?: LanguageCode;
  context?: MeetingContext;
}

interface SaveCaptionRequest {
  speakerId: string;
  speakerName?: string;
  originalText: string;
  originalLang?: string;
  translatedText?: string;
  translatedLang?: string;
  startTime: string; // ISO string
  endTime?: string;
  isFinal?: boolean;
}

interface SaveCaptionsBatchRequest {
  captions: SaveCaptionRequest[];
}

@Controller('ai')
export class AIController {
  constructor(
    private readonly ragClient: RagClient,
    private readonly transcriptService: TranscriptService,
  ) {}

  /**
   * Translate text to target language with optional meeting context
   */
  @Post('translate')
  async translate(@Body() body: TranslateRequest) {
    const { text, targetLang, sourceLang, context } = body;

    // Validate input
    if (!text || !targetLang) {
      throw new HttpException(
        'Missing required fields: text and targetLang',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      throw new HttpException(
        `Unsupported target language: ${targetLang}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.ragClient.translate(text, targetLang, sourceLang, context);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Translation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Stream translation (SSE) - for real-time caption translation
   */
  @Sse('translate/stream')
  streamTranslate(
    @Query('text') text: string,
    @Query('targetLang') targetLang: LanguageCode,
    @Query('sourceLang') sourceLang?: LanguageCode,
    @Query('meetingId') meetingId?: string,
  ): Observable<SSEMessage> {
    return new Observable(subscriber => {
      (async () => {
        try {
          if (!text || !targetLang) {
            subscriber.next({ data: JSON.stringify({ type: 'error', error: 'Missing required fields: text and targetLang' }) });
            subscriber.complete();
            return;
          }

          if (!SUPPORTED_LANGUAGES[targetLang]) {
            subscriber.next({ data: JSON.stringify({ type: 'error', error: `Unsupported target language: ${targetLang}` }) });
            subscriber.complete();
            return;
          }

          const result = await this.ragClient.translate(text, targetLang, sourceLang, { meetingId });
          // Return 'done' type to match frontend expectation
          subscriber.next({ data: JSON.stringify({ type: 'done', translation: result.translation, cached: result.cached }) });
          subscriber.complete();
        } catch (error) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Translation failed',
            }),
          });
          subscriber.complete();
        }
      })();
    });
  }

  /**
   * Get supported languages
   */
  @Get('languages')
  getLanguages() {
    return {
      languages: this.ragClient.getSupportedLanguages(),
    };
  }

  // ==================== TRANSCRIPT ENDPOINTS ====================

  /**
   * Save a single caption/transcript entry
   */
  @Post('meetings/:meetingId/transcript')
  async saveCaption(
    @Param('meetingId') meetingId: string,
    @Body() body: SaveCaptionRequest,
  ) {
    if (!body.speakerId || !body.originalText || !body.startTime) {
      throw new HttpException(
        'Missing required fields: speakerId, originalText, startTime',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const dto: SaveTranscriptDto = {
        meetingId,
        speakerId: body.speakerId,
        speakerName: body.speakerName,
        originalText: body.originalText,
        originalLang: body.originalLang,
        translatedText: body.translatedText,
        translatedLang: body.translatedLang,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        isFinal: body.isFinal ?? true,
      };

      const result = await this.transcriptService.saveTranscript(dto);
      return { success: true, id: result.id };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to save caption',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Save multiple captions in batch (more efficient)
   */
  @Post('meetings/:meetingId/transcript/batch')
  async saveCaptionsBatch(
    @Param('meetingId') meetingId: string,
    @Body() body: SaveCaptionsBatchRequest,
  ) {
    if (!body.captions || !Array.isArray(body.captions) || body.captions.length === 0) {
      throw new HttpException(
        'Missing or empty captions array',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const dtos: SaveTranscriptDto[] = body.captions.map((caption) => ({
        meetingId,
        speakerId: caption.speakerId,
        speakerName: caption.speakerName,
        originalText: caption.originalText,
        originalLang: caption.originalLang,
        translatedText: caption.translatedText,
        translatedLang: caption.translatedLang,
        startTime: new Date(caption.startTime),
        endTime: caption.endTime ? new Date(caption.endTime) : undefined,
        isFinal: caption.isFinal ?? true,
      }));

      const count = await this.transcriptService.saveTranscriptBatch(dtos);
      return { success: true, count };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to save captions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get transcript for a meeting
   */
  @Get('meetings/:meetingId/transcript')
  async getTranscript(
    @Param('meetingId') meetingId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('lang') lang?: string,
    @Query('format') format?: 'json' | 'text',
  ) {
    try {
      if (format === 'text') {
        const text = await this.transcriptService.getTranscriptText(meetingId, {
          useTranslation: !!lang,
          lang,
        });
        return { text };
      }

      const result = await this.transcriptService.getTranscript(meetingId, {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        lang,
      });

      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get transcript',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== SUMMARY ENDPOINTS ====================

  /**
   * Get AI summary of meeting transcript
   */
  @Get('meetings/:meetingId/summary')
  async getMeetingSummary(
    @Param('meetingId') meetingId: string,
    @Query('lang') lang?: LanguageCode,
  ) {
    if (!process.env.OPENAI_API_KEY) {
      throw new HttpException(
        'AI service not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      // Get transcript text first
      const transcript = await this.transcriptService.getTranscriptText(meetingId);

      if (!transcript || transcript.trim() === '') {
        throw new HttpException(
          'No transcript available for this meeting',
          HttpStatus.NOT_FOUND,
        );
      }

      // Generate summary
      const summary = await this.ragClient.summarizeMeeting(transcript, {
        language: lang,
        includeActionItems: true,
      });

      return { summary, meetingId };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to generate summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Stream AI summary of meeting transcript (SSE)
   */
  @Sse('meetings/:meetingId/summary/stream')
  streamMeetingSummary(
    @Param('meetingId') meetingId: string,
    @Query('lang') lang?: LanguageCode,
  ): Observable<SSEMessage> {
    if (!process.env.OPENAI_API_KEY) {
      return new Observable(subscriber => {
        subscriber.next({ data: JSON.stringify({ type: 'error', error: 'AI service not configured' }) });
        subscriber.complete();
      });
    }

    return new Observable(subscriber => {
      (async () => {
        try {
          // Get transcript text first
          const transcript = await this.transcriptService.getTranscriptText(meetingId);

          if (!transcript || transcript.trim() === '') {
            subscriber.next({ data: JSON.stringify({ type: 'error', error: 'No transcript available for this meeting' }) });
            subscriber.complete();
            return;
          }

          // Stream summary
          const generator = this.ragClient.summarizeMeetingStream(transcript, {
            language: lang,
            includeActionItems: true,
          });

          let fullSummary = '';
          for await (const token of generator) {
            fullSummary += token;
            subscriber.next({ data: JSON.stringify({ type: 'token', token }) });
          }
          subscriber.next({ data: JSON.stringify({ type: 'done', summary: fullSummary }) });
          subscriber.complete();
        } catch (error) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Failed to generate summary',
            }),
          });
          subscriber.complete();
        }
      })();
    });
  }
}
