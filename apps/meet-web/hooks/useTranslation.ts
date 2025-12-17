import { useState, useEffect, useRef } from 'react';
import {
  translateText,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type MeetingContext,
} from '@/lib/translation';
import type { CaptionEvent } from '@/hooks/useJitsiConference';

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

  // Debounce timer for batching rapid caption changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build meeting context for better translations
  const meetingContext = useRef<MeetingContext>({
    meetingId: meetingId || undefined,
    topic: meetingTopic,
  });

  // Update context ref when values change
  useEffect(() => {
    meetingContext.current = { meetingId: meetingId || undefined, topic: meetingTopic };
  }, [meetingId, meetingTopic]);

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
        translatedText: cached || caption.text, // Use cache if available
        isTranslating: !cached, // Mark as translating if not cached
      };
    });
    setTranslatedCaptions(initialCaptions);

    let isCancelled = false;

    const processTranslations = async () => {
      setIsTranslating(true);

      for (let i = 0; i < captions.length; i++) {
        if (isCancelled) break;

        const caption = captions[i];
        const cacheKey = `${meetingId || ''}|${caption.text}|${targetLang}`;

        // Check if already cached
        const cachedTranslation = translationCache.current.get(cacheKey);
        if (cachedTranslation) {
          continue; // Already translated
        }

        try {
          const translation = await translateText(
            caption.text,
            targetLang,
            undefined,
            meetingContext.current
          );
          translationCache.current.set(cacheKey, translation);

          // Update just this caption immediately
          if (!isCancelled) {
            setTranslatedCaptions((prev) =>
              prev.map((c, idx) =>
                idx === i ? { ...c, translatedText: translation, isTranslating: false } : c
              )
            );
          }
        } catch (error) {
          console.error('[useTranslation] Failed:', error);
        }
      }

      if (!isCancelled) {
        setIsTranslating(false);
      }
    };

    // Start translation with short delay to batch rapid changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      processTranslations();
    }, 200);

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, captions, targetLang, meetingId]);

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
