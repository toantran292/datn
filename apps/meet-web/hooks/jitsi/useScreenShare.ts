import { useState, useCallback, useRef } from 'react';
import type { JitsiConference, JitsiTrack } from '@/types/jitsi';
import { createDesktopTrack } from '@/lib/jitsi';
import { getOriginalStream } from './utils';

interface UseScreenShareOptions {
  conference: JitsiConference | null;
}

interface UseScreenShareReturn {
  isScreenSharing: boolean;
  screenShareTrack: JitsiTrack | null;
  screenShareParticipantId: string | null;
  toggleScreenShare: () => Promise<void>;
  setRemoteScreenShare: (track: JitsiTrack | null, participantId: string | null) => void;
  clearScreenShare: () => void;
}

/**
 * Hook to manage screen sharing
 */
export function useScreenShare({
  conference,
}: UseScreenShareOptions): UseScreenShareReturn {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareTrack, setScreenShareTrack] = useState<JitsiTrack | null>(null);
  const [screenShareParticipantId, setScreenShareParticipantId] = useState<string | null>(null);
  const conferenceRef = useRef(conference);
  conferenceRef.current = conference;

  const toggleScreenShare = useCallback(async () => {
    if (!conferenceRef.current) return;

    try {
      if (isScreenSharing && screenShareTrack) {
        // Stop screen sharing
        await conferenceRef.current.removeTrack(screenShareTrack);
        screenShareTrack.dispose();
        setScreenShareTrack(null);
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const desktopTracks = await createDesktopTrack();
        const desktopTrack = desktopTracks.find(t => t.getType() === 'video');

        if (desktopTrack) {
          // Listen for track ended (user clicks stop sharing in browser)
          const stream = getOriginalStream(desktopTrack);
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.addEventListener('ended', () => {
                if (conferenceRef.current) {
                  conferenceRef.current.removeTrack(desktopTrack).catch(() => {});
                }
                desktopTrack.dispose();
                setScreenShareTrack(null);
                setIsScreenSharing(false);
              });
            }
          }

          await conferenceRef.current.addTrack(desktopTrack);
          setScreenShareTrack(desktopTrack);
          setIsScreenSharing(true);
        }
      }
    } catch (err) {
      console.error('[useScreenShare] Error toggling screen share:', err);
      setIsScreenSharing(false);
      setScreenShareTrack(null);
    }
  }, [isScreenSharing, screenShareTrack]);

  const setRemoteScreenShare = useCallback((track: JitsiTrack | null, participantId: string | null) => {
    setScreenShareTrack(track);
    setScreenShareParticipantId(participantId);
  }, []);

  const clearScreenShare = useCallback(() => {
    setScreenShareTrack(null);
    setIsScreenSharing(false);
    setScreenShareParticipantId(null);
  }, []);

  return {
    isScreenSharing,
    screenShareTrack,
    screenShareParticipantId,
    toggleScreenShare,
    setRemoteScreenShare,
    clearScreenShare,
  };
}
