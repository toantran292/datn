import { useState, useCallback, useEffect, useRef } from 'react';
import type { JitsiConference } from '@/types/jitsi';
import type { CaptionEvent } from './types';

interface UseCaptionsOptions {
  conference: JitsiConference | null;
  isJoined: boolean;
  displayName: string;
  onFinalCaption?: (caption: CaptionEvent) => void;
}

interface UseCaptionsReturn {
  captions: CaptionEvent[];
  isCaptionsEnabled: boolean;
  toggleCaptions: () => void;
  sendCaption: (text: string, isFinal: boolean) => void;
  addRemoteCaption: (caption: CaptionEvent) => void;
}

/**
 * Hook to manage live captions
 */
export function useCaptions({
  conference,
  isJoined,
  displayName,
  onFinalCaption,
}: UseCaptionsOptions): UseCaptionsReturn {
  const [captions, setCaptions] = useState<CaptionEvent[]>([]);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;
  const onFinalCaptionRef = useRef(onFinalCaption);
  onFinalCaptionRef.current = onFinalCaption;

  const toggleCaptions = useCallback(() => {
    setIsCaptionsEnabled(prev => !prev);
  }, []);

  const sendCaption = useCallback((text: string, isFinal: boolean) => {
    if (!conference || !text.trim() || !isJoined) {
      return;
    }

    try {
      const captionData = JSON.stringify({
        text: text.trim(),
        isFinal,
        timestamp: Date.now(),
      });

      try {
        conference.setLocalParticipantProperty('caption', captionData);
      } catch {
        return;
      }

      // Add local caption to display
      const captionEvent: CaptionEvent = {
        id: `${Date.now()}-local-${isFinal ? 'final' : 'interim'}`,
        participantId: 'local',
        participantName: displayNameRef.current,
        text: text.trim(),
        timestamp: Date.now(),
        isFinal,
      };

      setCaptions(prev => {
        if (!isFinal) {
          // For interim: remove old interim from local, add new interim
          const filtered = prev.filter(c =>
            !(c.participantId === 'local' && !c.isFinal)
          );
          return [...filtered, captionEvent];
        }
        // For final: find matching interim and replace it, or add new
        const interimIndex = prev.findIndex(c =>
          c.participantId === 'local' && !c.isFinal
        );
        if (interimIndex !== -1) {
          // Replace interim with final (same position)
          const newCaptions = [...prev];
          newCaptions[interimIndex] = captionEvent;
          return newCaptions.slice(-20);
        }
        // No interim found, just add final
        return [...prev.slice(-20), captionEvent];
      });

      // Notify callback for final captions (for transcript saving)
      if (isFinal && onFinalCaptionRef.current) {
        onFinalCaptionRef.current(captionEvent);
      }
    } catch (err) {
      console.error('[useCaptions] Error sending caption:', err);
    }
  }, [conference, isJoined]);

  const addRemoteCaption = useCallback((caption: CaptionEvent) => {
    setCaptions(prev => {
      if (!caption.isFinal) {
        // For interim: remove old interim from this participant, add new interim
        const filtered = prev.filter(c =>
          !(c.participantId === caption.participantId && !c.isFinal)
        );
        return [...filtered, caption];
      }
      // For final: find matching interim and replace it, or add new
      const interimIndex = prev.findIndex(c =>
        c.participantId === caption.participantId && !c.isFinal
      );
      if (interimIndex !== -1) {
        // Replace interim with final (same position)
        const newCaptions = [...prev];
        newCaptions[interimIndex] = caption;
        return newCaptions.slice(-20);
      }
      // No interim found, just add final
      return [...prev.slice(-20), caption];
    });

    // Notify callback for final captions (for transcript saving)
    if (caption.isFinal && onFinalCaptionRef.current) {
      onFinalCaptionRef.current(caption);
    }
  }, []);

  // Clear old captions periodically
  useEffect(() => {
    if (!isCaptionsEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCaptions(prev => prev.filter(c => now - c.timestamp < 10000));
    }, 5000);

    return () => clearInterval(interval);
  }, [isCaptionsEnabled]);

  return {
    captions,
    isCaptionsEnabled,
    toggleCaptions,
    sendCaption,
    addRemoteCaption,
  };
}
