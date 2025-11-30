'use client';
import { useEffect, useRef, memo } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface VideoProps {
  videoTrack?: JitsiTrack;
  autoPlay?: boolean;
  className?: string;
  muted?: boolean;
  id?: string;
}

function VideoComponent({
  videoTrack,
  autoPlay = true,
  className = '',
  muted = true,
  id
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedTrackRef = useRef<JitsiTrack | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Detach previous track if different
    if (attachedTrackRef.current && attachedTrackRef.current !== videoTrack) {
      try {
        attachedTrackRef.current.detach(el);
        console.log('[Video] Detached old track:', attachedTrackRef.current.getId());
        attachedTrackRef.current = null;
      } catch (err) {
        console.error('[Video] Detach error:', err);
      }
    }

    // Attach new track
    if (videoTrack && attachedTrackRef.current !== videoTrack) {
      try {
        console.log('[Video] Attaching new track:', videoTrack.getId());
        videoTrack.attach(el);
        attachedTrackRef.current = videoTrack;
        el.volume = 0;

        setTimeout(() => {
          if (el && autoPlay) {
            el.play().catch(() => {});
          }
        }, 100);
      } catch (err) {
        console.error('[Video] Attach error:', err);
      }
    }
  }, [videoTrack, autoPlay]);

  // Separate effect for cleanup on unmount only
  useEffect(() => {
    return () => {
      const el = videoRef.current;
      if (el && attachedTrackRef.current) {
        try {
          attachedTrackRef.current.detach(el);
          console.log('[Video] Detached on unmount');
        } catch (err) {}
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      playsInline
      muted={muted}
      className={className}
      id={id}
    />
  );
}

// Memo to prevent unnecessary re-renders
export const Video = memo(VideoComponent, (prev, next) => {
  // Compare track objects directly, not IDs
  return prev.videoTrack === next.videoTrack &&
         prev.className === next.className;
});
