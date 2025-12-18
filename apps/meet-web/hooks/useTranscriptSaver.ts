import { useRef, useCallback, useEffect } from 'react';
import {
  saveTranscriptBatch,
  translateText,
  getTranscript,
  type TranscriptEntry,
  type LanguageCode,
  type MeetingContext,
} from '@/lib/translation';
import { uploadTranscriptToS3, type TranscriptS3Entry } from '@/lib/api';
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

  // Upload all transcripts to S3 (called when leaving meeting)
  const uploadToS3 = useCallback(async () => {
    if (!meetingId || !currentUserId) {
      console.log('[TranscriptSaver] No meetingId or userId, skipping S3 upload');
      return { success: false };
    }

    // First flush any pending entries to DB
    await flushQueue();

    // Get all transcripts from DB
    const result = await getTranscript(meetingId);
    if (!result?.entries || result.entries.length === 0) {
      console.log('[TranscriptSaver] No transcripts to upload to S3');
      return { success: true };
    }

    // Convert to S3 format
    const s3Entries: TranscriptS3Entry[] = result.entries.map(entry => ({
      speakerId: entry.speakerId,
      speakerName: entry.speakerName,
      text: entry.originalText,
      translatedText: entry.translatedText,
      translatedLang: entry.translatedLang,
      timestamp: entry.startTime,
      isFinal: entry.isFinal ?? true,
    }));

    console.log('[TranscriptSaver] Uploading', s3Entries.length, 'entries to S3');
    const uploadResult = await uploadTranscriptToS3(meetingId, s3Entries, currentUserId);
    console.log('[TranscriptSaver] S3 upload result:', uploadResult);

    return uploadResult;
  }, [meetingId, currentUserId, flushQueue]);

  return {
    saveCaption,
    flush,
    uploadToS3,
    queueLength: transcriptQueue.current.length,
  };
}
