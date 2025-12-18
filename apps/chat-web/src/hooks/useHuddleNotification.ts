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

      // 3-second notification sound with pleasant rising tones
      // First tone - C5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 523.25; // C5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.8);
      osc1.start(currentTime);
      osc1.stop(currentTime + 0.8);

      // Second tone - E5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 659.25; // E5
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, currentTime + 0.4);
      gain2.gain.linearRampToValueAtTime(0.3, currentTime + 0.45);
      gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.2);
      osc2.start(currentTime + 0.4);
      osc2.stop(currentTime + 1.2);

      // Third tone - G5
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.frequency.value = 783.99; // G5
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0, currentTime + 0.8);
      gain3.gain.linearRampToValueAtTime(0.28, currentTime + 0.85);
      gain3.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.6);
      osc3.start(currentTime + 0.8);
      osc3.stop(currentTime + 1.6);

      // Fourth tone - C6 (octave up)
      const osc4 = ctx.createOscillator();
      const gain4 = ctx.createGain();
      osc4.connect(gain4);
      gain4.connect(ctx.destination);
      osc4.frequency.value = 1046.5; // C6
      osc4.type = 'sine';
      gain4.gain.setValueAtTime(0, currentTime + 1.2);
      gain4.gain.linearRampToValueAtTime(0.25, currentTime + 1.25);
      gain4.gain.exponentialRampToValueAtTime(0.01, currentTime + 2.0);
      osc4.start(currentTime + 1.2);
      osc4.stop(currentTime + 2.0);

      // Fifth tone - E6 (final flourish)
      const osc5 = ctx.createOscillator();
      const gain5 = ctx.createGain();
      osc5.connect(gain5);
      gain5.connect(ctx.destination);
      osc5.frequency.value = 1318.51; // E6
      osc5.type = 'sine';
      gain5.gain.setValueAtTime(0, currentTime + 1.6);
      gain5.gain.linearRampToValueAtTime(0.22, currentTime + 1.65);
      gain5.gain.exponentialRampToValueAtTime(0.01, currentTime + 2.5);
      osc5.start(currentTime + 1.6);
      osc5.stop(currentTime + 2.5);

      // Sixth tone - G6 (ending high note)
      const osc6 = ctx.createOscillator();
      const gain6 = ctx.createGain();
      osc6.connect(gain6);
      gain6.connect(ctx.destination);
      osc6.frequency.value = 1567.98; // G6
      osc6.type = 'sine';
      gain6.gain.setValueAtTime(0, currentTime + 2.0);
      gain6.gain.linearRampToValueAtTime(0.2, currentTime + 2.05);
      gain6.gain.exponentialRampToValueAtTime(0.01, currentTime + 3.0);
      osc6.start(currentTime + 2.0);
      osc6.stop(currentTime + 3.0);

      console.log('[HuddleNotification] Sound played');
    } catch (err) {
      console.warn('[HuddleNotification] Failed to play sound:', err);
    }
  }, []);

  return { playHuddleSound };
}
