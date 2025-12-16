'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ExternalLink, GripHorizontal } from 'lucide-react';

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

export interface Caption {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface CaptionDisplayProps {
  captions: Caption[];
  isEnabled: boolean;
  maxSpeakers?: number; // Maximum speakers to show at once (default: 2)
}

export function CaptionDisplay({ captions, isEnabled, maxSpeakers = 2 }: CaptionDisplayProps) {
  const [activeCaptions, setActiveCaptions] = useState<Caption[]>([]);
  const [popoutWindow, setPopoutWindow] = useState<Window | null>(null);
  const popoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Track the order participants first appeared (to maintain stable positions)
  const participantOrderRef = useRef<string[]>([]);

  // Update activeCaptions when new captions arrive - show up to maxSpeakers
  useEffect(() => {
    if (!isEnabled) return;
    if (captions.length === 0) return;

    // Group captions by participant, keeping only the most recent for each
    const captionsByParticipant = new Map<string, Caption>();
    for (const caption of captions) {
      const existing = captionsByParticipant.get(caption.participantId);
      if (!existing || caption.timestamp > existing.timestamp) {
        captionsByParticipant.set(caption.participantId, caption);
      }
    }

    // Update participant order - add new participants, keep existing order
    const currentParticipants = Array.from(captionsByParticipant.keys());
    for (const pid of currentParticipants) {
      if (!participantOrderRef.current.includes(pid)) {
        participantOrderRef.current.push(pid);
      }
    }

    // Remove participants who are no longer speaking (caption expired)
    participantOrderRef.current = participantOrderRef.current.filter(pid =>
      captionsByParticipant.has(pid)
    );

    // Sort captions by participant order (stable positions)
    const sortedCaptions = Array.from(captionsByParticipant.values())
      .sort((a, b) => {
        const orderA = participantOrderRef.current.indexOf(a.participantId);
        const orderB = participantOrderRef.current.indexOf(b.participantId);
        return orderA - orderB;
      })
      .slice(0, maxSpeakers);

    // Only update if captions changed
    const hasChanged = sortedCaptions.length !== activeCaptions.length ||
      sortedCaptions.some((c, i) =>
        !activeCaptions[i] ||
        c.participantId !== activeCaptions[i].participantId ||
        c.text !== activeCaptions[i].text ||
        c.timestamp !== activeCaptions[i].timestamp
      );

    if (hasChanged) {
      setActiveCaptions(sortedCaptions);
    }
  }, [captions, isEnabled, maxSpeakers, activeCaptions]);

  // Clear activeCaptions when disabled
  useEffect(() => {
    if (!isEnabled) {
      setActiveCaptions([]);
    }
  }, [isEnabled]);

  // Update popout window content when captions change
  useEffect(() => {
    if (!popoutWindow || popoutWindow.closed) return;

    const captionsHtml = activeCaptions.map(caption => `
      <div style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span style="color: #FF8800; font-weight: 500; font-size: 12px; margin-right: 8px;">
          ${caption.participantName}:
        </span>
        <span style="color: white; font-size: 14px;">
          ${caption.text}
          ${!caption.isFinal ? '<span style="display: inline-block; width: 2px; height: 12px; background: rgba(255,255,255,0.5); margin-left: 2px; animation: blink 1s infinite;"></span>' : ''}
        </span>
      </div>
    `).join('');

    const contentDiv = popoutWindow.document.getElementById('captions-content');
    if (contentDiv) {
      contentDiv.innerHTML = captionsHtml || '<div style="padding: 12px; color: rgba(255,255,255,0.5); text-align: center;">Waiting for speech...</div>';
    }
  }, [activeCaptions, popoutWindow]);

  // Check if popout window is closed
  useEffect(() => {
    if (!popoutWindow) return;

    popoutIntervalRef.current = setInterval(() => {
      if (popoutWindow.closed) {
        setPopoutWindow(null);
        if (popoutIntervalRef.current) {
          clearInterval(popoutIntervalRef.current);
        }
      }
    }, 500);

    return () => {
      if (popoutIntervalRef.current) {
        clearInterval(popoutIntervalRef.current);
      }
    };
  }, [popoutWindow]);

  // Close popout when captions disabled
  useEffect(() => {
    if (!isEnabled && popoutWindow && !popoutWindow.closed) {
      popoutWindow.close();
      setPopoutWindow(null);
    }
  }, [isEnabled, popoutWindow]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  // Handle drag move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = dragStartRef.current.y - e.clientY;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = dragStartRef.current.y - touch.clientY;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  // Open caption in popout window
  const openPopout = useCallback(() => {
    if (popoutWindow && !popoutWindow.closed) {
      popoutWindow.focus();
      return;
    }

    const width = 400;
    const height = 200;
    const left = window.screenX + window.outerWidth - width - 20;
    const top = window.screenY + window.outerHeight - height - 100;

    const newWindow = window.open(
      '',
      'CaptionPopout',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    );

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Live Captions</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: rgba(17, 24, 39, 0.95);
              color: white;
              overflow: hidden;
            }
            .header {
              padding: 8px 12px;
              background: rgba(0, 0, 0, 0.3);
              border-bottom: 1px solid rgba(255,255,255,0.1);
              font-size: 11px;
              color: rgba(255,255,255,0.6);
              display: flex;
              align-items: center;
              gap: 6px;
              -webkit-app-region: drag;
              cursor: move;
            }
            .header::before {
              content: '●';
              color: #00C4AB;
            }
            #captions-content {
              max-height: calc(100vh - 32px);
              overflow-y: auto;
            }
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">Live Captions</div>
          <div id="captions-content">
            <div style="padding: 12px; color: rgba(255,255,255,0.5); text-align: center;">Waiting for speech...</div>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
      setPopoutWindow(newWindow);
    }
  }, [popoutWindow]);

  if (!isEnabled) return null;

  // If no captions and no popout, show nothing
  if (activeCaptions.length === 0 && (!popoutWindow || popoutWindow.closed)) return null;

  const isPopoutOpen = popoutWindow && !popoutWindow.closed;

  // If popout is open, don't show inline caption (avoid duplication)
  if (isPopoutOpen) return null;

  return (
    <div
      ref={dragRef}
      className="fixed z-50 px-4"
      style={{
        left: `calc(50% + ${position.x}px)`,
        bottom: `${position.y}px`,
        transform: 'translateX(-50%)',
        cursor: isDragging ? 'grabbing' : 'default',
        width: '500px',
        maxWidth: '90vw',
      }}
    >
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--ts-widget-bg)',
          border: '1px solid var(--ts-widget-border)',
          boxShadow: 'var(--ts-shadow)',
        }}
      >
        {/* Drag handle + popout button */}
        <div
          className="px-3 py-1.5 flex items-center justify-between select-none"
          style={{ borderBottom: '1px solid var(--ts-widget-border)', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--ts-text-secondary)' }}>
            <GripHorizontal className="w-3 h-3" />
            Live Captions
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openPopout();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="transition-colors p-1 rounded"
            style={{ color: 'var(--ts-text-secondary)' }}
            title="Open in separate window"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Captions for each active speaker */}
        <div style={{ borderColor: 'var(--ts-widget-border)' }}>
          {activeCaptions.length > 0 ? (
            activeCaptions.map((caption) => (
              <div key={caption.participantId} className="px-3 py-2" style={{ borderBottom: '1px solid var(--ts-widget-border)' }}>
                <span className="text-ts-orange font-medium text-xs mr-2">
                  {caption.participantName}:
                </span>
                <span className="text-sm" style={{ color: 'var(--ts-text-primary)' }}>
                  {caption.text}
                  {!caption.isFinal && (
                    <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse align-middle" style={{ background: 'var(--ts-text-secondary)' }} />
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-center" style={{ color: 'var(--ts-text-secondary)' }}>
              Waiting for speech...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to use Web Speech API for local speech recognition
export function useSpeechRecognition(
  isEnabled: boolean,
  onResult: (text: string, isFinal: boolean) => void
) {
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
    } catch (err: any) {
      // If already started, ignore the error
      if (err.name !== 'InvalidStateError') {
        console.error('[Caption] Failed to start speech recognition:', err);
      }
    }
    // Reset restarting flag after a short delay
    setTimeout(() => {
      isRestartingRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    console.log('[Caption] useSpeechRecognition useEffect called, isEnabled:', isEnabled);

    // Check if Web Speech API is supported
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.log('[Caption] Web Speech API NOT SUPPORTED');
      setIsSupported(false);
      return;
    }

    if (!isEnabled) {
      console.log('[Caption] isEnabled is false, stopping recognition');
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

    console.log('[Caption] Creating new SpeechRecognition instance...');
    // Create recognition instance
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN'; // Vietnamese, can be changed to 'en-US'

    recognition.onstart = () => {
      console.log('[Caption] Speech recognition STARTED');
      setIsListening(true);
      lastSuccessRef.current = Date.now();
      retryCountRef.current = 0; // Reset retry count on successful start
    };

    recognition.onend = () => {
      const timeSinceStart = Date.now() - lastSuccessRef.current;
      const wasQuickFailure = timeSinceStart < 500; // Failed within 500ms = conflict

      console.log('[Caption] Speech recognition ENDED, isEnabled:', isEnabledRef.current, 'timeSinceStart:', timeSinceStart);
      setIsListening(false);

      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      // Restart if still enabled
      if (isEnabledRef.current && recognitionRef.current) {
        // Use exponential backoff if quick failures (mic conflict)
        let delay = 1000;
        if (wasQuickFailure) {
          retryCountRef.current++;
          // Exponential backoff: 2s, 4s, 8s, max 10s
          delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000);
          console.log('[Caption] Quick failure detected, retry #', retryCountRef.current, 'delay:', delay);
        }

        console.log('[Caption] Will restart in', delay, 'ms...');
        restartTimeoutRef.current = setTimeout(() => {
          if (isEnabledRef.current && recognitionRef.current) {
            console.log('[Caption] Restarting speech recognition...');
            startRecognition();
          }
        }, delay);
      }
    };

    recognition.onerror = (event) => {
      // Ignore common non-critical errors silently
      if (event.error === 'no-speech') {
        return;
      }

      // Handle aborted error - this happens when WebRTC and Speech API conflict
      // Don't restart immediately, let onend handle it with delay
      if (event.error === 'aborted') {
        console.log('[Caption] Speech recognition aborted (likely mic conflict)');
        return;
      }

      console.log('[Caption] Speech recognition error:', event.error);

      // Handle audio-capture error - happens when mic is busy or has issues
      if (event.error === 'audio-capture') {
        console.warn('[Caption] Audio capture issue, will retry in 2s...');
        // Try to restart after a longer delay
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
        console.log('[Caption] Final transcript:', finalTranscript);
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        console.log('[Caption] Interim transcript:', interimTranscript);
        onResult(interimTranscript, false);
      }
    };

    recognitionRef.current = recognition;

    // Delay starting recognition to let WebRTC stabilize first
    console.log('[Caption] Will start recognition after 2s delay...');
    const startDelay = setTimeout(() => {
      if (!isEnabledRef.current || !recognitionRef.current) return;

      console.log('[Caption] Attempting to start recognition...');
      startRecognition();
    }, 2000); // Wait 2 seconds for WebRTC to stabilize

    return () => {
      clearTimeout(startDelay);
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isEnabled, onResult, startRecognition]);

  return { isListening, isSupported };
}
