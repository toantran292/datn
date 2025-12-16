'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, MicOff } from 'lucide-react';
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
  onExpand?: () => void;
}

export function HuddleWidget({
  participants,
  localParticipant,
  isLocalSpeaking,
  speakingParticipants,
  isAudioMuted,
  onExpand,
}: HuddleWidgetProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Build all participants list
  const allParticipants = [
    {
      id: 'local',
      name: localParticipant.name,
      isSpeaking: isLocalSpeaking,
      isMuted: isAudioMuted,
      isLocal: true,
      tracks: localParticipant.tracks,
    },
    ...participants.map(p => ({
      id: p.id,
      name: p.name,
      isSpeaking: speakingParticipants.has(p.id) || p.isSpeaking || false,
      isMuted: !p.tracks.some(t => t.getType() === 'audio' && !t.isMuted()),
      isLocal: false,
      tracks: p.tracks,
    })),
  ];

  // Find who is currently speaking
  const speakingPerson = allParticipants.find(p => p.isSpeaking);
  const speakingText = speakingPerson
    ? `${speakingPerson.name} is speaking...`
    : '';

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Get video track for participant
  const getVideoTrack = (tracks: JitsiTrack[]) => {
    return tracks.find(t => {
      if (t.getType() !== 'video') return false;
      const tAny = t as any;
      const isDesktop = tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
      return !isDesktop;
    });
  };

  // Only show first 4 participants
  const maxVisible = 4;
  const visibleParticipants = allParticipants.slice(0, maxVisible);
  const remainingCount = allParticipants.length - maxVisible;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 left-6 z-40"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white text-sm font-medium">Huddle Active</span>
            </div>
            <div className="flex items-center gap-1">
              {onExpand && (
                <button
                  onClick={onExpand}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Expand"
                >
                  <Maximize2 className="w-4 h-4 text-white/60" />
                </button>
              )}
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Participants */}
          {isVisible && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2">
                {visibleParticipants.map((participant) => {
                  const videoTrack = getVideoTrack(participant.tracks);
                  const hasVideo = videoTrack && !videoTrack.isMuted();

                  return (
                    <div
                      key={participant.id}
                      className="relative"
                    >
                      {/* Avatar container */}
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center relative"
                        style={{
                          background: 'linear-gradient(135deg, #FF8800 0%, #00C4AB 100%)',
                          border: participant.isSpeaking
                            ? '3px solid var(--ts-orange)'
                            : '2px solid transparent',
                          boxShadow: participant.isSpeaking
                            ? '0 0 0 2px rgba(255, 136, 0, 0.3)'
                            : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {hasVideo ? (
                          <VideoAvatar track={videoTrack!} />
                        ) : (
                          <span className="text-white text-sm font-semibold">
                            {getInitials(participant.name)}
                          </span>
                        )}
                      </div>

                      {/* Mute indicator */}
                      {participant.isMuted && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            background: '#1f2937',
                            border: '2px solid rgba(17, 24, 39, 0.95)',
                          }}
                        >
                          <MicOff className="w-2.5 h-2.5 text-red-400" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Remaining count */}
                {remainingCount > 0 && (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: '#374151',
                      border: '2px solid #4b5563',
                    }}
                  >
                    <span className="text-white/70 text-sm font-medium">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Speaking indicator */}
              {speakingText && (
                <p className="text-white/50 text-xs mt-3 italic">
                  {speakingText}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Video avatar component
function VideoAvatar({ track }: { track: JitsiTrack }) {
  const videoRef = (el: HTMLVideoElement | null) => {
    if (el && track) {
      try {
        track.attach(el);
        el.play().catch(() => {});
      } catch (e) {
        // Ignore
      }
    }
  };

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
