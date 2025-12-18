import { useState, useCallback, useRef } from 'react';
import type { JitsiTrack } from '@/types/jitsi';
import type { Participant } from './types';
import { SPEAKING_THRESHOLD, SPEAKING_TIMEOUT } from './types';

interface UseParticipantsReturn {
  participants: Map<string, Participant>;
  speakingParticipants: Set<string>;
  dominantSpeakerId: string | null;
  addParticipant: (id: string, name: string) => void;
  removeParticipant: (id: string) => void;
  updateParticipantName: (id: string, name: string) => void;
  addTrackToParticipant: (participantId: string, track: JitsiTrack) => void;
  removeTrackFromParticipant: (participantId: string, track: JitsiTrack) => void;
  setDominantSpeaker: (id: string) => void;
  handleAudioLevel: (participantId: string, audioLevel: number) => void;
  handleParticipantMuted: (participantId: string) => void;
  clearSpeakingState: (participantId: string) => void;
  forceUpdate: () => void;
}

/**
 * Hook to manage conference participants
 */
export function useParticipants(): UseParticipantsReturn {
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());
  const [dominantSpeakerId, setDominantSpeakerId] = useState<string | null>(null);

  const speakingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const mutedParticipantsRef = useRef<Set<string>>(new Set());

  const addParticipant = useCallback((id: string, name: string) => {
    setParticipants(prev => {
      const next = new Map(prev);
      const existing = next.get(id);
      next.set(id, {
        id,
        name: name || existing?.name || 'Unknown',
        tracks: existing?.tracks || [],
      });
      return next;
    });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setParticipants(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    // Clean up speaking state
    setSpeakingParticipants(prev => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      return prev;
    });

    // Clean up timeout
    const timeout = speakingTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      speakingTimeoutsRef.current.delete(id);
    }
  }, []);

  const updateParticipantName = useCallback((id: string, name: string) => {
    setParticipants(prev => {
      const next = new Map(prev);
      const participant = next.get(id);
      if (participant) {
        next.set(id, { ...participant, name: name || 'Unknown' });
      }
      return next;
    });
  }, []);

  const addTrackToParticipant = useCallback((participantId: string, track: JitsiTrack) => {
    setParticipants(prev => {
      const next = new Map(prev);
      const participant = next.get(participantId);

      if (participant) {
        const trackExists = participant.tracks.some(t => t === track);
        if (!trackExists) {
          next.set(participantId, {
            ...participant,
            tracks: [...participant.tracks, track],
          });
        }
      } else {
        next.set(participantId, {
          id: participantId,
          name: 'Unknown',
          tracks: [track],
        });
      }

      return next;
    });
  }, []);

  const removeTrackFromParticipant = useCallback((participantId: string, track: JitsiTrack) => {
    setParticipants(prev => {
      const next = new Map(prev);
      const participant = next.get(participantId);

      if (participant) {
        next.set(participantId, {
          ...participant,
          tracks: participant.tracks.filter(t => t !== track),
        });
      }

      return next;
    });
  }, []);

  const handleAudioLevel = useCallback((participantId: string, audioLevel: number) => {
    // Skip if muted
    if (mutedParticipantsRef.current.has(participantId)) {
      const existingTimeout = speakingTimeoutsRef.current.get(participantId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        speakingTimeoutsRef.current.delete(participantId);
      }
      setSpeakingParticipants(prev => {
        if (prev.has(participantId)) {
          const next = new Set(prev);
          next.delete(participantId);
          return next;
        }
        return prev;
      });
      return;
    }

    const isSpeaking = audioLevel > SPEAKING_THRESHOLD;

    if (isSpeaking) {
      const existingTimeout = speakingTimeoutsRef.current.get(participantId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        speakingTimeoutsRef.current.delete(participantId);
      }

      setSpeakingParticipants(prev => {
        if (!prev.has(participantId)) {
          const next = new Set(prev);
          next.add(participantId);
          return next;
        }
        return prev;
      });

      const timeout = setTimeout(() => {
        setSpeakingParticipants(prev => {
          if (prev.has(participantId)) {
            const next = new Set(prev);
            next.delete(participantId);
            return next;
          }
          return prev;
        });
        speakingTimeoutsRef.current.delete(participantId);
      }, SPEAKING_TIMEOUT);

      speakingTimeoutsRef.current.set(participantId, timeout);
    }
  }, []);

  const handleParticipantMuted = useCallback((participantId: string) => {
    mutedParticipantsRef.current.add(participantId);
    setSpeakingParticipants(prev => {
      const next = new Set(prev);
      next.delete(participantId);
      return next;
    });
  }, []);

  const clearSpeakingState = useCallback((participantId: string) => {
    mutedParticipantsRef.current.delete(participantId);
  }, []);

  const forceUpdate = useCallback(() => {
    setParticipants(prev => new Map(prev));
  }, []);

  return {
    participants,
    speakingParticipants,
    dominantSpeakerId,
    addParticipant,
    removeParticipant,
    updateParticipantName,
    addTrackToParticipant,
    removeTrackFromParticipant,
    setDominantSpeaker: setDominantSpeakerId,
    handleAudioLevel,
    handleParticipantMuted,
    clearSpeakingState,
    forceUpdate,
  };
}
