import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Video, VideoOff, Monitor, Users, Settings, PhoneOff, MessageSquare, Captions, CaptionsOff, Circle, Square } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';

interface ControlsToolbarProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  isCaptionsOn?: boolean;
  isScreenSharing?: boolean;
  isRecording?: boolean;
  isChatOpen?: boolean;
  unreadCount?: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleCaptions?: () => void;
  onToggleScreenShare?: () => void;
  onToggleRecording?: () => void;
  onToggleChat?: () => void;
  onShowParticipants?: () => void;
  onShowSettings?: () => void;
  onSendReaction?: (emoji: string) => void;
  onLeave: () => void;
}

export function ControlsToolbar({
  isMicOn,
  isVideoOn,
  isCaptionsOn = false,
  isScreenSharing = false,
  isRecording = false,
  isChatOpen = false,
  unreadCount = 0,
  onToggleMic,
  onToggleVideo,
  onToggleCaptions,
  onToggleScreenShare,
  onToggleRecording,
  onToggleChat,
  onShowParticipants,
  onShowSettings,
  onSendReaction,
  onLeave,
}: ControlsToolbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const bottomThreshold = windowHeight - 150; // Show when mouse is within 150px of bottom

      if (e.clientY > bottomThreshold) {
        setIsVisible(true);

        // Clear existing timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }

        // Set new timeout to hide after 3 seconds
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
        setHideTimeout(timeout);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  return (
    <>
      {/* Main Toolbar - Auto-hide */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-8 z-50"
            style={{
              left: '40%',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border"
              style={{
                background: 'rgba(17, 24, 39, 0.9)',
                borderColor: 'var(--ts-border)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 196, 171, 0.2)',
              }}
            >
              {/* Mic control */}
              <ControlButton
                icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                active={isMicOn}
                onClick={onToggleMic}
                activeColor="orange"
                label="Mic"
              />

              {/* Video control */}
              <ControlButton
                icon={isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                active={isVideoOn}
                onClick={onToggleVideo}
                activeColor="teal"
                label="Camera"
              />

              {/* Captions toggle */}
              {onToggleCaptions && (
                <ControlButton
                  icon={isCaptionsOn ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5" />}
                  active={isCaptionsOn}
                  onClick={onToggleCaptions}
                  activeColor="teal"
                  label="Captions"
                />
              )}

              {/* Screen share */}
              {onToggleScreenShare && (
                <ControlButton
                  icon={<Monitor className="w-5 h-5" />}
                  active={isScreenSharing}
                  onClick={onToggleScreenShare}
                  activeColor="orange"
                  label="Share"
                />
              )}

              {/* Recording */}
              {onToggleRecording && (
                <ControlButton
                  icon={isRecording ? <Square className="w-4 h-4 fill-current" /> : <Circle className="w-5 h-5 fill-current" />}
                  active={isRecording}
                  onClick={onToggleRecording}
                  activeColor="recording"
                  label={isRecording ? "Stop" : "Record"}
                />
              )}

              {/* Reactions */}
              {onSendReaction && (
                <ReactionPicker onSelectReaction={onSendReaction} />
              )}

              {/* Divider */}
              <div className="w-px h-8" style={{ backgroundColor: 'var(--ts-border)' }} />

              {/* Chat toggle with badge */}
              {onToggleChat && (
                <div className="relative">
                  <ControlButton
                    icon={<MessageSquare className="w-5 h-5" />}
                    active={isChatOpen}
                    onClick={onToggleChat}
                    activeColor="teal"
                    label="Chat"
                  />
                  {unreadCount > 0 && !isChatOpen && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                      style={{
                        backgroundColor: 'var(--ts-accent)',
                        boxShadow: '0 2px 8px rgba(255, 59, 105, 0.4)',
                      }}
                    >
                      <span className="text-[10px] text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Participants */}
              {onShowParticipants && (
                <ControlButton
                  icon={<Users className="w-5 h-5" />}
                  onClick={onShowParticipants}
                  label="People"
                />
              )}

              {/* Settings */}
              {onShowSettings && (
                <ControlButton
                  icon={<Settings className="w-5 h-5" />}
                  onClick={onShowSettings}
                  label="Settings"
                />
              )}

              {/* Divider */}
              <div className="w-px h-8" style={{ backgroundColor: 'var(--ts-border)' }} />

              {/* Leave button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLeave}
                className="px-4 py-2.5 rounded-xl hover:bg-[#DC2626] transition-colors relative group"
                style={{ backgroundColor: '#EF4444' }}
              >
                <PhoneOff className="w-5 h-5 text-white" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border"
                  style={{ backgroundColor: 'var(--ts-card-surface)', borderColor: 'var(--ts-border)', color: 'var(--ts-text-primary)' }}
                >
                  Leave
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface ControlButtonProps {
  icon: React.ReactElement;
  active?: boolean;
  onClick: () => void;
  activeColor?: 'orange' | 'teal' | 'recording';
  label?: string;
}

function ControlButton({ icon, active, onClick, activeColor = 'orange', label }: ControlButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const activeStyles = {
    orange: {
      background: 'var(--ts-orange)',
      boxShadow: '0 0 20px rgba(255, 136, 0, 0.4)',
    },
    teal: {
      background: 'var(--ts-teal)',
      boxShadow: '0 0 20px rgba(0, 196, 171, 0.4)',
    },
    recording: {
      background: '#EF4444',
      boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
    },
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`p-3 rounded-xl transition-all ${active ? 'text-white' : 'text-[var(--ts-text-secondary)] hover:text-white hover:bg-[var(--ts-card-surface)]'
          }`}
        style={active ? activeStyles[activeColor] : undefined}
      >
        <span>{icon}</span>
      </motion.button>

      {/* Tooltip label */}
      {label && isHovered && !active && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap border"
          style={{
            backgroundColor: 'var(--ts-card-surface)',
            borderColor: 'var(--ts-border)',
            color: 'var(--ts-text-primary)',
          }}
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}
