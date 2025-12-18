'use client';

import { useEffect, useRef, useState } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface JitsiVideoProps {
  track: JitsiTrack;
  mirror?: boolean;
  className?: string;
}

/**
 * Simple video component following official Jitsi example.
 * Just attach track to video element.
 */
export function JitsiVideo({ track, mirror = false, className = '' }: JitsiVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStream, setHasStream] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !track) return;

    const trackId = track.getId?.() || 'unknown';
    const isLocal = track.isLocal();


    // Attach track to video element
    track.attach(videoEl);

    // Check if stream is attached
    const checkStream = () => {
      if (videoEl.srcObject) {
        setHasStream(true);

        // Try to play
        if (videoEl.paused) {
          videoEl.play().catch(err => {
          });
        }
      }
    };

    // Check immediately and after delays
    checkStream();
    const t1 = setTimeout(checkStream, 100);
    const t2 = setTimeout(checkStream, 500);
    const t3 = setTimeout(checkStream, 1000);

    // Listen for loadedmetadata
    const handleLoadedMetadata = () => {
      setHasStream(true);
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      track.detach(videoEl);
      setHasStream(false);
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: mirror ? 'scaleX(-1)' : 'none',
        display: 'block', // Ensure video is visible
      }}
    />
  );
}
