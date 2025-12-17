import { useEffect, useRef, useState, useCallback } from 'react';
import type { JitsiTrack } from '@/types/jitsi';
import { LOCAL_AUDIO_THRESHOLD } from './types';
import { getOriginalStream } from './utils';

interface UseLocalAudioOptions {
  localTracks: JitsiTrack[];
  isAudioMuted: boolean;
}

interface UseLocalAudioReturn {
  isLocalSpeaking: boolean;
}

/**
 * Hook to detect local user speaking using Web Audio API
 */
export function useLocalAudio({
  localTracks,
  isAudioMuted,
}: UseLocalAudioOptions): UseLocalAudioReturn {
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    const audioTrack = localTracks.find(t => t.getType() === 'audio');
    if (!audioTrack) {
      cleanup();
      return;
    }

    const stream = getOriginalStream(audioTrack);
    if (!stream) {
      cleanup();
      return;
    }

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (isAudioMuted || !analyserRef.current) {
          setIsLocalSpeaking(false);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const isSpeaking = average > LOCAL_AUDIO_THRESHOLD;

        if (isSpeaking) {
          setIsLocalSpeaking(true);

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            setIsLocalSpeaking(false);
          }, 500);
        }
      };

      intervalRef.current = setInterval(checkAudioLevel, 100);
    } catch (err) {
      console.error('[useLocalAudio] Failed to setup audio analysis:', err);
    }

    return cleanup;
  }, [localTracks, isAudioMuted, cleanup]);

  return { isLocalSpeaking };
}
