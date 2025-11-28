import { useEffect, useRef } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface VideoTrackProps {
  track: JitsiTrack | undefined;
  className?: string;
  muted?: boolean;
}

export function VideoTrack({ track, className, muted = true }: VideoTrackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!track || !videoElement) return;

    console.log('[VideoTrack] Attaching track:', track.getId());

    try {
      // Attach track to video element
      track.attach(videoElement);

      // Ensure playback
      videoElement.play().catch((err: any) => {
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          console.error('[VideoTrack] Playback error:', err);
        }
      });

      console.log('[VideoTrack] Track attached and playing');
    } catch (error) {
      console.error('[VideoTrack] Attach error:', error);
    }

    return () => {
      if (videoElement && track) {
        try {
          track.detach(videoElement);
          console.log('[VideoTrack] Track detached');
        } catch (error) {
          console.error('[VideoTrack] Detach error:', error);
        }
      }
    };
  }, [track]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!track || !videoElement) return;

    track.attach(videoElement);
    videoElement.play().catch(() => {});

    return () => {
        track.detach(videoElement);
    };
  }, [track?.getId()]);


  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}
