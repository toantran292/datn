import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SUPPORTED_LANGUAGES = {
  vi: 'Vietnamese',
  en: 'English',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  th: 'Thai',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  id: 'Indonesian',
  ms: 'Malay',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface MeetingContext {
  meetingId?: string;
  topic?: string;
  domain?: string;
  recentMessages?: string[];
}

// Meeting context cache
const meetingContexts = new Map<string, string[]>();
const MAX_CONTEXT_MESSAGES = 10;

// Translation cache
const translationCache = new Map<string, { translation: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class RagClient implements OnModuleInit {
  private readonly logger = new Logger(RagClient.name);
  private baseUrl: string;
  private enabled: boolean = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.baseUrl = this.configService.get<string>('RAG_SERVICE_URL', 'http://rag-api:3000');
    this.enabled = this.configService.get<boolean>('RAG_ENABLED', true);

    if (this.enabled) {
      this.logger.log(`RAG client initialized with URL: ${this.baseUrl}`);
    } else {
      this.logger.warn('RAG client is disabled');
    }
  }

  /**
   * Add message to meeting context for better translations
   */
  addToContext(meetingId: string, text: string) {
    if (!meetingContexts.has(meetingId)) {
      meetingContexts.set(meetingId, []);
    }
    const context = meetingContexts.get(meetingId)!;
    context.push(text);
    if (context.length > MAX_CONTEXT_MESSAGES) {
      context.shift();
    }
  }

  /**
   * Get meeting context
   */
  getContext(meetingId: string): string[] {
    return meetingContexts.get(meetingId) || [];
  }

  /**
   * Clear meeting context (call when meeting ends)
   */
  clearContext(meetingId: string) {
    meetingContexts.delete(meetingId);
    // Also clear related cache entries
    for (const key of translationCache.keys()) {
      if (key.startsWith(`${meetingId}|`)) {
        translationCache.delete(key);
      }
    }
  }

  /**
   * Translate text to target language with meeting context
   */
  async translate(
    text: string,
    targetLang: LanguageCode,
    sourceLang?: LanguageCode,
    context?: MeetingContext,
  ): Promise<{ translation: string; cached: boolean }> {
    if (!text.trim()) {
      return { translation: text, cached: false };
    }

    const meetingId = context?.meetingId || 'default';

    // Check cache
    const cacheKey = `${meetingId}|${text}|${targetLang}|${sourceLang || 'auto'}`;
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { translation: cached.translation, cached: true };
    }

    // Clean old cache entries periodically
    if (translationCache.size > 1000) {
      this.cleanCache();
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: SUPPORTED_LANGUAGES[targetLang],
          sourceLanguage: sourceLang ? SUPPORTED_LANGUAGES[sourceLang] : undefined,
          config: {
            temperature: 0.1,
            maxTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.translation || text;

      // Cache the result
      translationCache.set(cacheKey, {
        translation,
        timestamp: Date.now(),
      });

      // Add to context for future translations
      if (context?.meetingId) {
        this.addToContext(context.meetingId, text);
      }

      return { translation, cached: false };
    } catch (error) {
      this.logger.error(`Translation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of translationCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        translationCache.delete(key);
      }
    }
  }

  /**
   * Summarize meeting transcript
   * Returns a concise summary of the meeting discussion
   * Uses RAG service's /llm/summarize/transcription endpoint
   */
  async summarizeMeeting(
    transcript: string,
    options?: {
      language?: LanguageCode;
      maxLength?: number;
      includeActionItems?: boolean;
    },
  ): Promise<string> {
    if (!transcript.trim()) {
      return '';
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: transcript,
          fileName: 'meeting-transcript',
          config: {
            temperature: 0.3,
            maxTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      const data = await response.json();
      return data.summary || '';
    } catch (error) {
      this.logger.error(`Summarization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Stream meeting summary
   * Returns SSE stream URL for client to connect
   */
  getSummaryStreamUrl(meetingId: string, language?: LanguageCode): string {
    const langParam = language ? `&lang=${language}` : '';
    return `${this.baseUrl}/llm/summarize/stream?meetingId=${meetingId}${langParam}`;
  }

  /**
   * Stream meeting summary using async generator
   * Uses RAG service's /llm/summarize/transcription endpoint with stream=true
   */
  async *summarizeMeetingStream(
    transcript: string,
    options?: {
      language?: LanguageCode;
      maxLength?: number;
      includeActionItems?: boolean;
    },
  ): AsyncGenerator<string, void, unknown> {
    if (!transcript.trim()) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: transcript,
          fileName: 'meeting-transcript',
          stream: true,
          config: {
            temperature: 0.3,
            maxTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE format
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  yield parsed.text;
                }
              } catch {
                // Not JSON, yield raw data
                yield data;
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Streaming summarization failed: ${error}`);
      throw error;
    }
  }

}
