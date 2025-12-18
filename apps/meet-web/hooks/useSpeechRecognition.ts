'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseSpeechRecognitionOptions {
  /** Language for speech recognition (default: 'vi-VN') */
  lang?: string;
  /** Delay before starting recognition to let WebRTC stabilize (default: 2000ms) */
  startDelay?: number;
  /** Base delay for restart on failure (default: 1000ms) */
  restartDelay?: number;
  /** Max delay for exponential backoff (default: 10000ms) */
  maxRetryDelay?: number;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
}

/**
 * Hook to use Web Speech API for local speech recognition
 * Handles WebRTC conflicts with exponential backoff
 */
export function useSpeechRecognition(
  isEnabled: boolean,
  onResult: (text: string, isFinal: boolean) => void,
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'vi-VN',
    startDelay = 2000,
    restartDelay = 1000,
    maxRetryDelay = 10000,
  } = options;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const isEnabledRef = useRef(isEnabled);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestartingRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastSuccessRef = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  // Function to safely start recognition
  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isRestartingRef.current) return;

    isRestartingRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (err: unknown) {
      // If already started, ignore the error
      if (err instanceof Error && err.name !== 'InvalidStateError') {
        console.error('[SpeechRecognition] Failed to start:', err);
      }
    }
    // Reset restarting flag after a short delay
    setTimeout(() => {
      isRestartingRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      return;
    }

    if (!isEnabled) {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsListening(false);
      }
      return;
    }

    // Create recognition instance
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      lastSuccessRef.current = Date.now();
      retryCountRef.current = 0;
    };

    recognition.onend = () => {
      const timeSinceStart = Date.now() - lastSuccessRef.current;
      const wasQuickFailure = timeSinceStart < 500;

      setIsListening(false);

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      // Restart if still enabled
      if (isEnabledRef.current && recognitionRef.current) {
        let delay = restartDelay;
        if (wasQuickFailure) {
          retryCountRef.current++;
          delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), maxRetryDelay);
        }

        restartTimeoutRef.current = setTimeout(() => {
          if (isEnabledRef.current && recognitionRef.current) {
            startRecognition();
          }
        }, delay);
      }
    };

    recognition.onerror = (event) => {
      // Ignore common non-critical errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      // Handle audio-capture error
      if (event.error === 'audio-capture') {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          if (isEnabledRef.current && recognitionRef.current) {
            startRecognition();
          }
        }, 2000);
        return;
      }

      if (event.error === 'not-allowed') {
        setIsSupported(false);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    recognitionRef.current = recognition;

    // Delay starting to let WebRTC stabilize
    const startDelayTimeout = setTimeout(() => {
      if (!isEnabledRef.current || !recognitionRef.current) return;

      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('[SpeechRecognition] Failed to start:', err);
      }
    }, startDelay);

    return () => {
      clearTimeout(startDelayTimeout);
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isEnabled, onResult, startRecognition, lang, startDelay, restartDelay, maxRetryDelay]);

  return { isListening, isSupported };
}
