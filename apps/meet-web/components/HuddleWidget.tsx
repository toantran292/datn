'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface Participant {
  id: string;
  name: string;
  tracks: JitsiTrack[];
  isSpeaking?: boolean;
}

interface HuddleWidgetProps {
  participants: Participant[];
  localParticipant: {
    name: string;
    tracks: JitsiTrack[];
  };
  isLocalSpeaking: boolean;
  speakingParticipants: Set<string>;
  isAudioMuted: boolean;
  onToggleMic: () => void;
  onLeave: () => void;
}

export function HuddleWidget({
  participants,
  localParticipant,
  isLocalSpeaking,
  speakingParticipants,
  isAudioMuted,
  onToggleMic,
  onLeave,
}: HuddleWidgetProps) {
  const [popoutWindow, setPopoutWindow] = useState<Window | null>(null);
  const popoutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const openPopoutRef = useRef<(() => void) | null>(null);

  // Use refs to always have latest callback references
  const onToggleMicRef = useRef(onToggleMic);
  const onLeaveRef = useRef(onLeave);

  // Update refs when callbacks change
  useEffect(() => {
    onToggleMicRef.current = onToggleMic;
    onLeaveRef.current = onLeave;
  }, [onToggleMic, onLeave]);

  // Build all participants list
  const allParticipants = [
    {
      id: 'local',
      name: localParticipant.name,
      isSpeaking: isLocalSpeaking,
      isMuted: isAudioMuted,
      isLocal: true,
    },
    ...participants.map(p => ({
      id: p.id,
      name: p.name,
      isSpeaking: speakingParticipants.has(p.id),
      isMuted: !p.tracks.some(t => t.getType() === 'audio' && !t.isMuted()),
      isLocal: false,
    })),
  ];

  // Find who is currently speaking
  const speakingPerson = allParticipants.find(p => p.isSpeaking);
  const speakingText = speakingPerson
    ? `${speakingPerson.name} is speaking...`
    : 'No one is speaking';

  // Update popout window content
  const updatePopoutContent = useCallback(() => {
    if (!popoutWindow || popoutWindow.closed) return;

    const maxVisible = 4;
    const visibleParticipants = allParticipants.slice(0, maxVisible);
    const remaining = allParticipants.length - maxVisible;

    const participantsHtml = visibleParticipants.map(p => `
      <div style="position: relative; flex-shrink: 0;">
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF8800 0%, #00C4AB 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: white;
          border: 3px solid ${p.isSpeaking ? '#FF8800' : 'transparent'};
          box-shadow: ${p.isSpeaking ? '0 0 0 3px rgba(255, 136, 0, 0.3)' : 'none'};
          transition: all 0.2s ease;
        ">
          ${p.name.charAt(0).toUpperCase()}
        </div>
        ${p.isMuted ? `
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 18px;
            height: 18px;
            background: #1f2937;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #111827;
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            </svg>
          </div>
        ` : ''}
      </div>
    `).join('');

    const remainingHtml = remaining > 0 ? `
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #374151;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 500;
        color: #9ca3af;
        border: 2px solid #4b5563;
        flex-shrink: 0;
      ">
        +${remaining}
      </div>
    ` : '';

    const contentDiv = popoutWindow.document.getElementById('huddle-content');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${participantsHtml}
          ${remainingHtml}
        </div>
        <div style="color: #9ca3af; font-size: 12px; font-style: italic; margin-top: 12px;">
          ${speakingText}
        </div>
      `;
    }

    // Update mic button state
    const micBtn = popoutWindow.document.getElementById('mic-btn');

    if (micBtn) {
      micBtn.style.background = isAudioMuted ? '#374151' : '#FF8800';
      micBtn.style.boxShadow = isAudioMuted ? 'none' : '0 0 20px rgba(255, 136, 0, 0.4)';
      micBtn.innerHTML = isAudioMuted ? `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      ` : `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      `;
    }
  }, [popoutWindow, allParticipants, speakingText, isAudioMuted]);

  // Update popout when state changes
  useEffect(() => {
    updatePopoutContent();
  }, [updatePopoutContent]);

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

  // Open huddle in popout window
  const openPopout = useCallback(() => {
    if (popoutWindow && !popoutWindow.closed) {
      popoutWindow.focus();
      return;
    }

    const width = 380;
    const height = 220;
    const left = window.screenX + window.outerWidth - width - 20;
    const top = window.screenY + window.outerHeight - height - 100;

    const newWindow = window.open(
      '',
      'HuddlePopout',
      `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    );

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Huddle</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #111827;
              color: white;
              overflow: hidden;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .header {
              padding: 10px 14px;
              display: flex;
              align-items: center;
              gap: 8px;
              border-bottom: 1px solid #374151;
              -webkit-app-region: drag;
              cursor: move;
            }
            .header::before {
              content: '';
              width: 8px;
              height: 8px;
              background: #00C4AB;
              border-radius: 50%;
            }
            .header-title {
              font-weight: 600;
              font-size: 13px;
              flex: 1;
            }
            .return-btn {
              background: linear-gradient(135deg, #FF8800 0%, #00C4AB 100%);
              border: none;
              color: white;
              padding: 6px 12px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
              transition: all 0.2s;
              -webkit-app-region: no-drag;
            }
            .return-btn:hover {
              transform: scale(1.02);
              filter: brightness(1.1);
            }
            #huddle-content {
              flex: 1;
              padding: 14px;
              overflow: hidden;
            }
            .controls {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 12px;
              padding: 12px 16px;
              border-top: 1px solid #374151;
              background: rgba(17, 24, 39, 0.9);
            }
            .control-btn {
              width: 44px;
              height: 44px;
              border-radius: 12px;
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
              -webkit-app-region: no-drag;
            }
            .control-btn:hover {
              transform: scale(1.05);
              filter: brightness(1.1);
            }
            .leave-btn {
              background: #EF4444 !important;
              padding: 0 16px;
              width: auto;
            }
            .leave-btn:hover {
              background: #DC2626 !important;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="header-title">Huddle Active</span>
            <button id="return-btn" class="return-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Return
            </button>
          </div>
          <div id="huddle-content"></div>
          <div class="controls">
            <button id="mic-btn" class="control-btn" style="background: ${isAudioMuted ? '#374151' : '#FF8800'}; box-shadow: ${isAudioMuted ? 'none' : '0 0 20px rgba(255, 136, 0, 0.4)'};">
              ${isAudioMuted ? `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ` : `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              `}
            </button>
            <button id="leave-btn" class="control-btn leave-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                <line x1="23" y1="1" x2="1" y2="23"></line>
              </svg>
            </button>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();

      // Add event listeners after DOM is ready - use refs to always get latest callbacks
      setTimeout(() => {
        const micBtn = newWindow.document.getElementById('mic-btn');
        const leaveBtn = newWindow.document.getElementById('leave-btn');
        const returnBtn = newWindow.document.getElementById('return-btn');

        if (micBtn) {
          micBtn.onclick = () => {
            console.log('[HuddleWidget] Mic button clicked');
            onToggleMicRef.current();
          };
        }
        if (leaveBtn) {
          leaveBtn.onclick = () => {
            console.log('[HuddleWidget] Leave button clicked');
            newWindow.close();
            onLeaveRef.current();
          };
        }
        if (returnBtn) {
          returnBtn.onclick = () => {
            console.log('[HuddleWidget] Return button clicked');
            // Focus the main window (opener) and close popup
            if (newWindow.opener) {
              newWindow.opener.focus();
            }
            newWindow.close();
          };
        }
      }, 100);

      setPopoutWindow(newWindow);
    }
  }, [popoutWindow, isAudioMuted]); // Include mute state for initial render

  // Store openPopout in ref for visibility change handler
  useEffect(() => {
    openPopoutRef.current = openPopout;
  }, [openPopout]);

  // Auto-open huddle when tab becomes hidden (user switches to another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && openPopoutRef.current) {
        // Tab is now hidden - open the huddle popup
        console.log('[HuddleWidget] Tab hidden, opening huddle popup');
        openPopoutRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Component doesn't render anything visible in the main page
  // The huddle opens automatically when switching tabs
  return null;
}
