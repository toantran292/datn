import { useState, useCallback, useRef } from 'react';
import type { JitsiConference } from '@/types/jitsi';
import type { ReactionEvent } from './types';

interface UseReactionsOptions {
  conference: JitsiConference | null;
  isJoined: boolean;
  displayName: string;
}

interface UseReactionsReturn {
  reactions: ReactionEvent[];
  sendReaction: (emoji: string) => void;
  removeReaction: (reactionId: string) => void;
  addRemoteReaction: (reaction: ReactionEvent) => void;
}

/**
 * Hook to manage meeting reactions
 */
export function useReactions({
  conference,
  isJoined,
  displayName,
}: UseReactionsOptions): UseReactionsReturn {
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const sendReaction = useCallback((emoji: string) => {
    if (!conference || !isJoined) return;

    try {
      const reactionData = JSON.stringify({
        emoji,
        timestamp: Date.now(),
      });

      try {
        conference.setLocalParticipantProperty('reaction', reactionData);
      } catch {
        return;
      }

      // Add local reaction to display
      const reactionEvent: ReactionEvent = {
        id: `${Date.now()}-local`,
        emoji,
        participantId: 'local',
        participantName: displayNameRef.current,
        timestamp: Date.now(),
      };

      setReactions(prev => [...prev, reactionEvent]);

      // Clear the property after a short delay to allow re-sending same reaction
      setTimeout(() => {
        try {
          conference.setLocalParticipantProperty('reaction', '');
        } catch {
          // Ignore
        }
      }, 100);
    } catch (err) {
      console.error('[useReactions] Error sending reaction:', err);
    }
  }, [conference, isJoined]);

  const removeReaction = useCallback((reactionId: string) => {
    setReactions(prev => prev.filter(r => r.id !== reactionId));
  }, []);

  const addRemoteReaction = useCallback((reaction: ReactionEvent) => {
    setReactions(prev => [...prev, reaction]);
  }, []);

  return {
    reactions,
    sendReaction,
    removeReaction,
    addRemoteReaction,
  };
}
