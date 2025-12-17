import { useRef, useCallback, useEffect } from 'react';
import {
  saveTranscriptBatch,
  translateText,
  type TranscriptEntry,
  type LanguageCode,
  type MeetingContext,
} from '@/lib/translation';
import type { CaptionEvent } from '@/hooks/useJitsiConference';

interface UseTranscriptSaverOptions {
  meetingId?: string | null;
  enabled: boolean;
  translateToLang?: LanguageCode;
  meetingTopic?: string;
  currentUserId?: string | null; // Real user ID to replace 'local'
}

/**
 * Hook to save all final captions to database
 * Handles translation and batching automatically
 */
export function useTranscriptSaver({
  meetingId,
  enabled,
  translateToLang,
  meetingTopic,
  currentUserId,
}: UseTranscriptSaverOptions) {
  // Queue for batch saving
  const transcriptQueue = useRef<TranscriptEntry[]>([]);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track saved captions to avoid duplicates
  const savedKeys = useRef<Set<string>>(new Set());

  // Meeting context for translation
  const contextRef = useRef<MeetingContext>({ meetingId: meetingId || undefined, topic: meetingTopic });
  useEffect(() => {
    contextRef.current = { meetingId: meetingId || undefined, topic: meetingTopic };
  }, [meetingId, meetingTopic]);

  // Flush queue to database
  const flushQueue = useCallback(async () => {
    if (!meetingId || transcriptQueue.current.length === 0) return;

    const entries = [...transcriptQueue.current];
    transcriptQueue.current = [];

    try {
      const result = await saveTranscriptBatch(meetingId, entries);
      console.log('[TranscriptSaver] Saved', result.count, 'entries');
    } catch (error) {
      console.error('[TranscriptSaver] Failed to save:', error);
      // Re-add to queue on failure
      transcriptQueue.current = [...entries, ...transcriptQueue.current];
    }
  }, [meetingId]);

  // Save a final caption
  const saveCaption = useCallback(
    async (caption: CaptionEvent) => {
      if (!enabled || !meetingId || !caption.isFinal) return;

      // Generate unique key
      const key = `${caption.participantId}|${caption.text}|${caption.timestamp}`;
      if (savedKeys.current.has(key)) {
        return; // Already saved
      }
      savedKeys.current.add(key);

      // Translate if needed
      let translatedText: string | undefined;
      if (translateToLang) {
        try {
          translatedText = await translateText(
            caption.text,
            translateToLang,
            undefined,
            contextRef.current
          );
        } catch (error) {
          console.warn('[TranscriptSaver] Translation failed:', error);
        }
      }

      // Create entry - replace 'local' with actual userId
      const speakerId = caption.participantId === 'local'
        ? (currentUserId || 'unknown')
        : caption.participantId;

      const entry: TranscriptEntry = {
        speakerId,
        speakerName: caption.participantName,
        originalText: caption.text,
        translatedText,
        translatedLang: translatedText ? translateToLang : undefined,
        startTime: new Date(caption.timestamp).toISOString(),
        isFinal: true,
      };

      transcriptQueue.current.push(entry);
      console.log('[TranscriptSaver] Queued caption:', caption.text.substring(0, 30));

      // Debounce save - flush after 2 seconds of inactivity
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        flushQueue();
      }, 2000);
    },
    [enabled, meetingId, translateToLang, flushQueue, currentUserId]
  );

  // Cleanup: flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      flushQueue();
    };
  }, [flushQueue]);

  // Manual flush
  const flush = useCallback(async () => {
    await flushQueue();
  }, [flushQueue]);

  return {
    saveCaption,
    flush,
    queueLength: transcriptQueue.current.length,
  };
}
