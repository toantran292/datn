// Translation service for real-time caption translation
// Calls meeting service AI endpoint

const MEET_API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';

export const SUPPORTED_LANGUAGES = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  th: 'ไทย',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface MeetingContext {
  meetingId?: string;
  topic?: string;
  domain?: string;
  recentMessages?: string[];
}

export interface TranscriptEntry {
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

// Client-side translation cache
const clientCache = new Map<string, { translation: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(text: string, targetLang: string, meetingId?: string): string {
  return `${meetingId || ''}|${text}|${targetLang}`;
}

/**
 * Translate text to target language with optional meeting context
 * Uses server-side API to call OpenAI
 */
export async function translateText(
  text: string,
  targetLang: LanguageCode,
  sourceLang?: LanguageCode,
  context?: MeetingContext
): Promise<string> {
  if (!text.trim()) return text;

  // Check client cache first
  const cacheKey = getCacheKey(text, targetLang, context?.meetingId);
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.translation;
  }

  try {
    const response = await fetch(`${MEET_API_URL}/ai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
        context,
      }),
    });

    if (!response.ok) {
      console.warn('[Translation] API error:', response.status);
      return text; // Return original text on error
    }

    const data = await response.json();
    const translation = data.translation || text;

    // Cache locally
    clientCache.set(cacheKey, {
      translation,
      timestamp: Date.now(),
    });

    return translation;
  } catch (error) {
    console.warn('[Translation] Failed:', error);
    return text; // Return original text on error
  }
}

/**
 * Batch translate multiple texts
 * More efficient for translating multiple captions at once
 */
export async function translateBatch(
  texts: string[],
  targetLang: LanguageCode,
  sourceLang?: LanguageCode
): Promise<string[]> {
  // Filter out empty texts and check cache
  const results: string[] = new Array(texts.length);
  const toTranslate: { index: number; text: string }[] = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text.trim()) {
      results[i] = text;
      continue;
    }

    const cacheKey = getCacheKey(text, targetLang);
    const cached = clientCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results[i] = cached.translation;
    } else {
      toTranslate.push({ index: i, text });
    }
  }

  // Translate uncached texts in parallel (but limited)
  if (toTranslate.length > 0) {
    const translations = await Promise.all(
      toTranslate.map(({ text }) => translateText(text, targetLang, sourceLang))
    );

    translations.forEach((translation, idx) => {
      results[toTranslate[idx].index] = translation;
    });
  }

  return results;
}

/**
 * Detect language of text (simple heuristic)
 * For more accurate detection, use server-side API
 */
export function detectLanguage(text: string): LanguageCode | null {
  // Simple heuristics based on character ranges
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const chineseRegex = /[\u4e00-\u9fff]/;
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanRegex = /[\uac00-\ud7af\u1100-\u11ff]/;
  const arabicRegex = /[\u0600-\u06ff]/;
  const thaiRegex = /[\u0e00-\u0e7f]/;
  const hindiRegex = /[\u0900-\u097f]/;

  if (vietnameseRegex.test(text)) return 'vi';
  if (japaneseRegex.test(text)) return 'ja';
  if (koreanRegex.test(text)) return 'ko';
  if (chineseRegex.test(text)) return 'zh';
  if (arabicRegex.test(text)) return 'ar';
  if (thaiRegex.test(text)) return 'th';
  if (hindiRegex.test(text)) return 'hi';

  // Default to null (let server auto-detect)
  return null;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  clientCache.clear();
}

/**
 * Streaming translation - yields tokens as they arrive from LLM
 * Much faster perceived response than waiting for full translation
 */
export async function translateTextStream(
  text: string,
  targetLang: LanguageCode,
  sourceLang?: LanguageCode,
  context?: MeetingContext,
  onToken?: (token: string, accumulated: string) => void
): Promise<string> {
  if (!text.trim()) return text;

  // Check client cache first
  const cacheKey = getCacheKey(text, targetLang, context?.meetingId);
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Yield cached result immediately
    if (onToken) onToken(cached.translation, cached.translation);
    return cached.translation;
  }

  return new Promise((resolve) => {
    // Build URL with query params
    const params = new URLSearchParams({
      text,
      targetLang,
    });
    if (sourceLang) params.set('sourceLang', sourceLang);
    if (context?.meetingId) params.set('meetingId', context.meetingId);

    const url = `${MEET_API_URL}/ai/translate/stream?${params.toString()}`;
    const eventSource = new EventSource(url);
    let accumulated = '';

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'token') {
          accumulated += data.token;
          if (onToken) onToken(data.token, accumulated);
        } else if (data.type === 'done') {
          eventSource.close();
          // Cache the result
          clientCache.set(cacheKey, {
            translation: data.translation,
            timestamp: Date.now(),
          });
          resolve(data.translation);
        } else if (data.type === 'error') {
          eventSource.close();
          console.warn('[Translation Stream] Error:', data.error);
          resolve(text); // Return original on error
        }
      } catch (e) {
        console.warn('[Translation Stream] Parse error:', e);
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      console.warn('[Translation Stream] Connection error:', error);
      resolve(text); // Return original on error
    };
  });
}

// ==================== TRANSCRIPT STORAGE ====================

/**
 * Save a single transcript entry to the database
 */
export async function saveTranscript(
  meetingId: string,
  entry: TranscriptEntry
): Promise<{ success: boolean; id?: string }> {
  try {
    const response = await fetch(`${MEET_API_URL}/ai/meetings/${meetingId}/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      console.warn('[Transcript] Save failed:', response.status);
      return { success: false };
    }

    return await response.json();
  } catch (error) {
    console.warn('[Transcript] Save error:', error);
    return { success: false };
  }
}

/**
 * Save multiple transcript entries in batch (more efficient)
 */
export async function saveTranscriptBatch(
  meetingId: string,
  entries: TranscriptEntry[]
): Promise<{ success: boolean; count?: number }> {
  if (entries.length === 0) return { success: true, count: 0 };

  try {
    const response = await fetch(`${MEET_API_URL}/ai/meetings/${meetingId}/transcript/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ captions: entries }),
    });

    if (!response.ok) {
      console.warn('[Transcript] Batch save failed:', response.status);
      return { success: false };
    }

    return await response.json();
  } catch (error) {
    console.warn('[Transcript] Batch save error:', error);
    return { success: false };
  }
}

/**
 * Get transcript for a meeting
 */
export async function getTranscript(
  meetingId: string,
  options?: {
    limit?: number;
    offset?: number;
    lang?: string;
    format?: 'json' | 'text';
  }
): Promise<{ entries?: TranscriptEntry[]; total?: number; text?: string } | null> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.lang) params.set('lang', options.lang);
    if (options?.format) params.set('format', options.format);

    const url = `${MEET_API_URL}/ai/meetings/${meetingId}/transcript?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[Transcript] Get failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[Transcript] Get error:', error);
    return null;
  }
}
