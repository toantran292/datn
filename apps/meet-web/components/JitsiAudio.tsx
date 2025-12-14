'use client';

import { useEffect, useRef } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface JitsiAudioProps {
  track: JitsiTrack;
}

/**
 * Simple audio component following official Jitsi example.
 * Only for remote audio - never play local audio (echo).
 */
export function JitsiAudio({ track }: JitsiAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !track) return;

    // Simple attach - following official example
    track.attach(audioEl);

    return () => {
      // Simple detach on cleanup
      track.detach(audioEl);
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay />;
}
