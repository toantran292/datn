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

  // Update activeCaptions when new captions arrive - show up to maxSpeakers
  useEffect(() => {
    if (!isEnabled) return;
    if (captions.length === 0) return;

    // Debug: log all captions
    console.log('[CaptionDisplay] All captions:', captions.map(c => ({
      participant: c.participantName,
      text: c.text.substring(0, 20),
      isFinal: c.isFinal
    })));

    // Group captions by participant, keeping only the most recent for each
    const captionsByParticipant = new Map<string, Caption>();
    for (const caption of captions) {
      const existing = captionsByParticipant.get(caption.participantId);
      if (!existing || caption.timestamp > existing.timestamp) {
        captionsByParticipant.set(caption.participantId, caption);
      }
    }

    console.log('[CaptionDisplay] Unique participants:', captionsByParticipant.size);

    // Sort by timestamp (oldest first so newest appears at bottom) and take top maxSpeakers
    const sortedCaptions = Array.from(captionsByParticipant.values())
      .sort((a, b) => b.timestamp - a.timestamp) // Get most recent speakers
      .slice(0, maxSpeakers)
      .sort((a, b) => a.timestamp - b.timestamp); // Then reverse so newest is at bottom

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
          background: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid var(--ts-border)',
          boxShadow: isDragging ? '0 4px 16px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Drag handle + popout button */}
        <div
          className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <span className="text-white/50 text-[10px] flex items-center gap-1.5">
            <GripHorizontal className="w-3 h-3 text-white/40" />
            Live Captions
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openPopout();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded hover:bg-white/10"
            title="Open in separate window"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Captions for each active speaker */}
        <div className="divide-y divide-white/5">
          {activeCaptions.length > 0 ? (
            activeCaptions.map((caption) => (
              <div key={caption.participantId} className="px-3 py-2">
                <span className="text-ts-orange font-medium text-xs mr-2">
                  {caption.participantName}:
                </span>
                <span className="text-white text-sm">
                  {caption.text}
                  {!caption.isFinal && (
                    <span className="inline-block w-0.5 h-3 bg-white/50 ml-0.5 animate-pulse align-middle" />
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-white/40 text-sm text-center">
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

  // Keep ref in sync
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.warn('[Caption] Speech Recognition not supported in this browser');
      setIsSupported(false);
      return;
    }

    if (!isEnabled) {
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
    recognition.lang = 'vi-VN'; // Vietnamese, can be changed to 'en-US'

    recognition.onstart = () => {
      console.log('[Caption] Speech recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('[Caption] Speech recognition ended');
      setIsListening(false);

      // Restart if still enabled (with small delay to prevent rapid restarts)
      if (isEnabledRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (isEnabledRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.log('[Caption] Could not restart recognition:', err);
            }
          }
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      // Ignore 'aborted' error - this happens when we stop recognition intentionally
      if (event.error === 'aborted' || event.error === 'no-speech') {
        console.log('[Caption] Speech recognition:', event.error);
        return;
      }
      console.error('[Caption] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsSupported(false);
      }
    };

    recognition.onresult = (event) => {
      console.log('[Caption] Got speech result event');
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log('[Caption] Transcript:', transcript, 'isFinal:', event.results[i].isFinal);
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('[Caption] Calling onResult with final:', finalTranscript);
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        console.log('[Caption] Calling onResult with interim:', interimTranscript);
        onResult(interimTranscript, false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('[Caption] Failed to start speech recognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isEnabled, onResult]);

  return { isListening, isSupported };
}
