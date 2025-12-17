import { useState, useCallback } from 'react';
import type { JitsiTrack } from '@/types/jitsi';
import { isCameraTrack } from './utils';

interface UseMediaControlsOptions {
  localTracks: JitsiTrack[];
}

interface UseMediaControlsReturn {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  setAudioMuted: (muted: boolean) => void;
  setVideoMuted: (muted: boolean) => void;
}

/**
 * Hook to manage local media controls (audio/video mute)
 */
export function useMediaControls({
  localTracks,
}: UseMediaControlsOptions): UseMediaControlsReturn {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const toggleAudio = useCallback(async () => {
    const audioTrack = localTracks.find(t => t.getType() === 'audio');
    if (!audioTrack) return;

    try {
      if (isAudioMuted) {
        await audioTrack.unmute();
        setIsAudioMuted(false);
      } else {
        await audioTrack.mute();
        setIsAudioMuted(true);
      }
    } catch (err) {
      console.error('[useMediaControls] Error toggling audio:', err);
    }
  }, [localTracks, isAudioMuted]);

  const toggleVideo = useCallback(async () => {
    const videoTrack = localTracks.find(t => isCameraTrack(t));
    if (!videoTrack) return;

    try {
      if (isVideoMuted) {
        await videoTrack.unmute();
        setIsVideoMuted(false);
      } else {
        await videoTrack.mute();
        setIsVideoMuted(true);
      }
    } catch (err) {
      console.error('[useMediaControls] Error toggling video:', err);
    }
  }, [localTracks, isVideoMuted]);

  return {
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    setAudioMuted: setIsAudioMuted,
    setVideoMuted: setIsVideoMuted,
  };
}
