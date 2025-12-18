import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook to play notification sound when huddle starts
 * Uses Web Audio API to generate a pleasant notification tone
 */
export function useHuddleNotification() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  const playHuddleSound = useCallback(() => {
    // Debounce: don't play if played within last 2 seconds
    const now = Date.now();
    if (now - lastPlayedRef.current < 2000) {
      return;
    }
    lastPlayedRef.current = now;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const currentTime = ctx.currentTime;

      // First tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 880;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
      osc1.start(currentTime);
      osc1.stop(currentTime + 0.3);

      // Second tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1174.66;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(0.3, currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
      osc2.start(currentTime + 0.1);
      osc2.stop(currentTime + 0.5);

      // Third tone
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.frequency.value = 1318.51;
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0, currentTime + 0.25);
      gain3.gain.linearRampToValueAtTime(0.25, currentTime + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.7);
      osc3.start(currentTime + 0.25);
      osc3.stop(currentTime + 0.7);

      console.log('[HuddleNotification] Sound played');
    } catch (err) {
      console.warn('[HuddleNotification] Failed to play sound:', err);
    }
  }, []);

  return { playHuddleSound };
}
