import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';

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
  topic?: string;        // Meeting topic/title
  domain?: string;       // e.g., 'software', 'medical', 'legal', 'general'
  recentMessages?: string[]; // Recent conversation for context
}

// Simple in-memory cache - keyed by meetingId for context-aware caching
const translationCache = new Map<string, { translation: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Store recent messages per meeting for context
const meetingContexts = new Map<string, string[]>();
const MAX_CONTEXT_MESSAGES = 10;

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private model: ChatOpenAI;

  onModuleInit() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set - translation will not work');
    }

    this.model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 500,
    });

    this.logger.log('LLM Service initialized');
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
    // Keep only recent messages
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

    // Check cache (include meetingId for context-aware caching)
    const cacheKey = `${meetingId}|${text}|${targetLang}|${sourceLang || 'auto'}`;
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { translation: cached.translation, cached: true };
    }

    // Clean old cache entries periodically
    if (translationCache.size > 1000) {
      this.cleanCache();
    }

    const targetLanguageName = SUPPORTED_LANGUAGES[targetLang];
    const sourceLanguageName = sourceLang ? SUPPORTED_LANGUAGES[sourceLang] : null;

    // Build context-aware system prompt
    let systemPrompt = this.buildContextualPrompt(
      targetLanguageName,
      sourceLanguageName,
      context,
      meetingId,
    );

    try {
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(text),
      ]);

      const parser = new StringOutputParser();
      const translation = await parser.invoke(response);

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
      this.logger.error(`Translation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build a contextual prompt based on meeting context
   */
  private buildContextualPrompt(
    targetLanguageName: string,
    sourceLanguageName: string | null,
    context?: MeetingContext,
    meetingId?: string,
  ): string {
    const parts: string[] = [];

    // Base instruction
    parts.push(`You are a real-time meeting translator.`);

    // Add domain context if available
    if (context?.domain) {
      parts.push(`This is a ${context.domain} meeting.`);
    }

    // Add topic context if available
    if (context?.topic) {
      parts.push(`Meeting topic: "${context.topic}".`);
    }

    // Add recent conversation context
    const recentMessages = context?.recentMessages || (meetingId ? this.getContext(meetingId) : []);
    if (recentMessages.length > 0) {
      const contextSnippet = recentMessages.slice(-5).join(' | ');
      parts.push(`Recent conversation context: "${contextSnippet}".`);
    }

    // Translation instruction
    if (sourceLanguageName) {
      parts.push(`Translate from ${sourceLanguageName} to ${targetLanguageName}.`);
    } else {
      parts.push(`Translate to ${targetLanguageName}. Auto-detect the source language.`);
    }

    // Output instruction
    parts.push(`Keep translations natural and conversational. Preserve technical terms when appropriate. Only output the translation, nothing else.`);

    return parts.join(' ');
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
}
