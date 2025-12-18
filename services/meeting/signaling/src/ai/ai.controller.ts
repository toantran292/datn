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
import { LLMService, SUPPORTED_LANGUAGES, type LanguageCode, type MeetingContext } from './llm.service';
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
    private readonly llmService: LLMService,
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

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new HttpException(
        'Translation service not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const result = await this.llmService.translate(text, targetLang, sourceLang, context);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Translation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get supported languages
   */
  @Get('languages')
  getLanguages() {
    return {
      languages: this.llmService.getSupportedLanguages(),
    };
  }

  /**
   * Stream translate text to target language (SSE)
   * Streams tokens as they arrive from LLM for faster perceived response
   */
  @Sse('translate/stream')
  translateStream(
    @Query('text') text: string,
    @Query('targetLang') targetLang: LanguageCode,
    @Query('sourceLang') sourceLang?: LanguageCode,
    @Query('meetingId') meetingId?: string,
  ): Observable<SSEMessage> {
    // Validate input
    if (!text || !targetLang) {
      return new Observable(subscriber => {
        subscriber.next({ data: JSON.stringify({ type: 'error', error: 'Missing required fields: text and targetLang' }) });
        subscriber.complete();
      });
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      return new Observable(subscriber => {
        subscriber.next({ data: JSON.stringify({ type: 'error', error: `Unsupported target language: ${targetLang}` }) });
        subscriber.complete();
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Observable(subscriber => {
        subscriber.next({ data: JSON.stringify({ type: 'error', error: 'Translation service not configured' }) });
        subscriber.complete();
      });
    }

    return new Observable(subscriber => {
      const context: MeetingContext | undefined = meetingId ? { meetingId } : undefined;
      const generator = this.llmService.translateStream(text, targetLang, sourceLang, context);

      (async () => {
        try {
          let fullTranslation = '';
          for await (const token of generator) {
            fullTranslation += token;
            subscriber.next({ data: JSON.stringify({ type: 'token', token }) });
          }
          subscriber.next({ data: JSON.stringify({ type: 'done', translation: fullTranslation }) });
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
}
