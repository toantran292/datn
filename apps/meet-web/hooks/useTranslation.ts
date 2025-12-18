import { useState, useEffect, useRef, useCallback } from 'react';
import {
  translateTextStream,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type MeetingContext,
} from '@/lib/translation';
import type { CaptionEvent } from '@/hooks/useJitsiConference';

// Debounce time for interim translations (ms) - reduced since streaming is faster
const INTERIM_DEBOUNCE_MS = 150;

interface TranslatedCaption extends CaptionEvent {
  originalText: string;
  translatedText: string;
  isTranslating: boolean;
}

interface UseTranslationOptions {
  enabled: boolean;
  targetLang: LanguageCode;
  captions: CaptionEvent[];
  meetingId?: string | null;
  meetingTopic?: string;
}

interface UseTranslationReturn {
  translatedCaptions: TranslatedCaption[];
  isTranslating: boolean;
  targetLang: LanguageCode;
  setTargetLang: (lang: LanguageCode) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

/**
 * Hook to manage real-time caption translation
 * Shows original text immediately, updates with translation when ready
 * Note: Transcript saving is handled separately by useTranscriptSaver
 */
export function useTranslation({
  enabled,
  targetLang: propTargetLang,
  captions,
  meetingId,
  meetingTopic,
}: UseTranslationOptions): UseTranslationReturn {
  const [targetLang, setTargetLang] = useState<LanguageCode>(propTargetLang);
  const [translatedCaptions, setTranslatedCaptions] = useState<TranslatedCaption[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Sync targetLang when prop changes
  useEffect(() => {
    setTargetLang(propTargetLang);
  }, [propTargetLang]);

  // Cache for translations
  const translationCache = useRef<Map<string, string>>(new Map());

  // Build meeting context for better translations
  const meetingContext = useRef<MeetingContext>({
    meetingId: meetingId || undefined,
    topic: meetingTopic,
  });

  // Update context ref when values change
  useEffect(() => {
    meetingContext.current = { meetingId: meetingId || undefined, topic: meetingTopic };
  }, [meetingId, meetingTopic]);

  // Track pending interim translations
  const interimTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Translate a single caption using streaming for faster updates
  const translateCaption = useCallback(async (
    caption: CaptionEvent,
    index: number,
    isCancelled: { current: boolean }
  ) => {
    const cacheKey = `${meetingId || ''}|${caption.text}|${targetLang}`;

    // Check cache first
    const cached = translationCache.current.get(cacheKey);
    if (cached) {
      if (!isCancelled.current) {
        setTranslatedCaptions((prev) =>
          prev.map((c, idx) =>
            idx === index ? { ...c, translatedText: cached, isTranslating: false } : c
          )
        );
      }
      return;
    }

    try {
      // Use streaming translation - updates UI as tokens arrive
      const translation = await translateTextStream(
        caption.text,
        targetLang,
        undefined,
        meetingContext.current,
        // onToken callback - update UI progressively
        (_token, accumulated) => {
          if (!isCancelled.current) {
            setTranslatedCaptions((prev) =>
              prev.map((c, idx) =>
                idx === index ? { ...c, translatedText: accumulated, isTranslating: true } : c
              )
            );
          }
        }
      );
      translationCache.current.set(cacheKey, translation);

      if (!isCancelled.current) {
        setTranslatedCaptions((prev) =>
          prev.map((c, idx) =>
            idx === index ? { ...c, translatedText: translation, isTranslating: false } : c
          )
        );
      }
    } catch (error) {
      console.error('[useTranslation] Failed:', error);
      if (!isCancelled.current) {
        setTranslatedCaptions((prev) =>
          prev.map((c, idx) =>
            idx === index ? { ...c, isTranslating: false } : c
          )
        );
      }
    }
  }, [meetingId, targetLang]);

  // Process captions when they change
  useEffect(() => {
    if (!enabled || captions.length === 0) {
      setTranslatedCaptions([]);
      return;
    }

    // Immediately show captions with original text while translating
    const initialCaptions: TranslatedCaption[] = captions.map((caption) => {
      const cacheKey = `${meetingId || ''}|${caption.text}|${targetLang}`;
      const cached = translationCache.current.get(cacheKey);
      return {
        ...caption,
        originalText: caption.text,
        translatedText: cached || '',
        // Show translating state if not cached
        isTranslating: !cached,
      };
    });
    setTranslatedCaptions(initialCaptions);

    const isCancelled = { current: false };

    const processTranslations = async () => {
      setIsTranslating(true);

      for (let i = 0; i < captions.length; i++) {
        if (isCancelled.current) break;

        const caption = captions[i];
        const cacheKey = `${meetingId || ''}|${caption.text}|${targetLang}`;

        // Skip if already cached
        if (translationCache.current.get(cacheKey)) {
          continue;
        }

        // Clear any pending timeout for this participant
        const existingTimeout = interimTimeouts.current.get(caption.participantId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (caption.isFinal) {
          // Translate final captions immediately
          await translateCaption(caption, i, isCancelled);
        } else {
          // Debounce interim captions (300ms) to avoid too many API calls
          const timeout = setTimeout(() => {
            if (!isCancelled.current) {
              translateCaption(caption, i, isCancelled);
            }
          }, INTERIM_DEBOUNCE_MS);
          interimTimeouts.current.set(caption.participantId, timeout);
        }
      }

      if (!isCancelled.current) {
        setIsTranslating(false);
      }
    };

    // Check if any caption needs translation
    const needsTranslation = captions.some((caption) => {
      const cacheKey = `${meetingId || ''}|${caption.text}|${targetLang}`;
      return !translationCache.current.get(cacheKey);
    });

    if (needsTranslation) {
      processTranslations();
    }

    return () => {
      isCancelled.current = true;
      // Clear all pending timeouts
      interimTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      interimTimeouts.current.clear();
    };
  }, [enabled, captions, targetLang, meetingId, translateCaption]);

  // Clear cache when target language changes
  useEffect(() => {
    translationCache.current.clear();
  }, [targetLang]);

  return {
    translatedCaptions,
    isTranslating,
    targetLang,
    setTargetLang,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

export { SUPPORTED_LANGUAGES, type LanguageCode };
