import { motion, AnimatePresence } from 'motion/react';
import { ParticipantAvatar } from './ParticipantAvatar';
import { CompactCaption } from './CompactCaption';
import { Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useJitsiConference } from '@/hooks/useJitsiConference';

interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  isSpeaking: boolean;
  isMuted: boolean;
  caption?: string;
  isLocal?: boolean;
}

interface ScreenShareViewProps {
  participants: Participant[];
  sharerName: string;
  meetingTitle: string;
  duration: string;
  isRecording?: boolean;
  viewMode?: 'default' | 'compactGrid' | 'focusView';
  showCaptions?: boolean;
  onToggleCaptions?: () => void;
  micOn?: boolean;
  videoOn?: boolean;
  screenShareOn?: boolean;
  roomId?: string;
  onParticipantsUpdate?: (participants: Participant[]) => void;
  localVideoStream?: MediaStream | null;
  localScreenStream?: MediaStream | null;
  localAudioLevel?: number;
  remoteScreenShare?: HTMLVideoElement | null;
  remoteVideoById?: Record<string, MediaStream>;
}

export function ScreenShareView({
  participants,
  sharerName,
  meetingTitle,
  duration,
  isRecording = false,
  viewMode = 'default',
  showCaptions = true,
  onToggleCaptions,
  micOn = false,
  videoOn = false,
  screenShareOn = false,
  roomId,
  onParticipantsUpdate,
  localVideoStream,
  localScreenStream,
  localAudioLevel = 0,
  remoteScreenShare,
  remoteVideoById,
}: ScreenShareViewProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const localVideoElRef = useRef<HTMLVideoElement>(null);
  const localScreenElRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  // Use passed streams instead of creating new ones
  const isSharing = !!localScreenStream;
  const { status, connect, addLocalTracks, leave, toggleVideo, toggleAudio, toggleScreenShare } = useJitsiConference(roomId || 'demo-room', {
    attachLocal: (t) => {
      try {
        const el = localVideoElRef.current;
        if (!el) return;
        t.attach(el);
      } catch { }
    },
    attachRemote: (t) => {
      try {
        const el = document.createElement('video');
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        t.attach(el);
        remoteContainerRef.current?.appendChild(el);
        if (onParticipantsUpdate) {
          const list: Participant[] = Array.from(remoteContainerRef.current?.querySelectorAll('video') || []).map((v, i) => ({
            id: String(i + 1),
            name: `User ${i + 1}`,
            avatarUrl: '',
            isSpeaking: false,
            isMuted: false,
          }));
          onParticipantsUpdate(list);
        }
      } catch { }
    },
    detachRemote: (t) => {
      try { t.detach?.(); } catch { }
      try {
        const list: Participant[] = Array.from(remoteContainerRef.current?.querySelectorAll('video') || []).map((v, i) => ({
          id: String(i + 1),
          name: `User ${i + 1}`,
          avatarUrl: '',
          isSpeaking: false,
          isMuted: false,
        }));
        onParticipantsUpdate?.(list);
      } catch { }
    },
    attachShare: (t) => {
      try {
        const el = localScreenElRef.current;
        if (!el) return;
        t.attach(el);
      } catch { }
    },
    detachShare: (t) => {
      try { t.detach?.(); } catch { }
    },
  });

  const activeSpeaker = participants.find((p) => p.isSpeaking);
  const displayParticipants = viewMode === 'focusView'
    ? participants.filter((p) => p.isSpeaking || !p.isMuted).slice(0, 8)
    : participants;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 300;
    const newPosition = direction === 'left'
      ? scrollPosition - scrollAmount
      : scrollPosition + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
    setScrollPosition(newPosition);
  };

  const showScrollButtons = displayParticipants.length > 6;

  // Attach local video stream preview
  useEffect(() => {
    const el = localVideoElRef.current;
    if (!el) return;
    if (localVideoStream) {
      el.srcObject = localVideoStream;
      el.play().catch(() => { });
    } else {
      el.srcObject = null;
    }
  }, [localVideoStream]);

  // Attach local screen share preview
  useEffect(() => {
    const el = localScreenElRef.current;
    if (!el) return;
    if (localScreenStream) {
      el.srcObject = localScreenStream;
      el.play().catch(() => { });
    } else {
      el.srcObject = null;
    }
  }, [localScreenStream]);

  // Handle remote screen share
  useEffect(() => {
    if (remoteScreenShare) {
      console.log('Remote screen share received:', remoteScreenShare);
    }
  }, [remoteScreenShare]);

  // Join room when roomId available
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    (async () => {
      try {
        await connect();
        if (!mounted) return;
        await addLocalTracks(videoOn, micOn);
      } catch { }
    })();
    return () => {
      mounted = false;
      void leave();
    };
  }, [roomId]);

  // Sync desired mic/camera state from parent
  useEffect(() => {
    (async () => {
      if (!roomId) return;
      await toggleVideo(); // toggle handles add/unmute/mute
    })();
  }, [videoOn]);

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      await toggleAudio();
    })();
  }, [micOn]);

  // Sync screen share state
  useEffect(() => {
    (async () => {
      if (!roomId) return;
      await toggleScreenShare();
    })();
  }, [screenShareOn]);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Top overlay - Meeting info */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-6 left-6 z-20 flex items-center gap-4"
      >
        <div
          className="px-4 py-2.5 rounded-xl backdrop-blur-md border border-[var(--ts-border)]"
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <h3 className="text-white">{meetingTitle}</h3>
            <span className="text-[var(--ts-text-secondary)]">•</span>
            <span className="text-[var(--ts-text-secondary)]">{duration}</span>
            {isRecording && (
              <>
                <span className="text-[var(--ts-text-secondary)]">•</span>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-[var(--ts-accent)]"
                  />
                  <span className="text-[var(--ts-accent)]">Recording</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main screen share area - Centered and elevated */}
      <div className="flex-1 flex items-center justify-center px-8 pt-24 pb-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full max-w-8xl rounded-2xl overflow-hidden relative border-2 border-[var(--ts-orange)]"
          style={{
            boxShadow: '0 0 40px rgba(255, 136, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Screen share or placeholder */}
          {isSharing ? (
            <video ref={localScreenElRef} className="w-full h-[75vh] object-contain bg-black" muted playsInline />
          ) : remoteScreenShare ? (
            <div
              className="w-full h-[75vh] bg-black"
              ref={(el) => {
                if (el && remoteScreenShare && !el.contains(remoteScreenShare)) {
                  el.appendChild(remoteScreenShare);
                }
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
              }}
            >
              <div className="text-center">
                <Monitor className="w-24 h-24 text-[var(--ts-orange)] mx-auto mb-4" />
                <h3 className="text-white mb-2">{sharerName} is sharing their screen</h3>
                <p className="text-[var(--ts-text-secondary)]">Screen content would appear here</p>
              </div>
            </div>
          )}

          {/* Gradient overlay for visual focus */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,136,0,0.03) 0%, transparent 15%, transparent 85%, rgba(0,196,171,0.03) 100%)',
            }}
          />
        </motion.div>
      </div>
      {/* Remote participants video container */}
      <div ref={remoteContainerRef} className="px-8 pb-4 grid grid-cols-6 gap-2" />

      {/* Compact caption panel */}
      <AnimatePresence>
        {showCaptions && (
          <CompactCaption
            participants={participants}
            onExpand={() => { }}
            onClose={() => onToggleCaptions && onToggleCaptions()}
          />
        )}
      </AnimatePresence>

      {/* Participants Panel - Below caption zone */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-8 pb-15"
      >
        <div className="w-full max-w-7xl mx-auto relative">
          {/* Scrollable container with navigation */}
          <div className="relative">
            {/* Left scroll button */}
            {showScrollButtons && scrollPosition > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleScroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-2 rounded-full backdrop-blur-md border border-[var(--ts-border)]"
                style={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: 'var(--ts-teal)' }} />
              </motion.button>
            )}

            {/* Right scroll button */}
            {showScrollButtons && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleScroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-2 rounded-full backdrop-blur-md border border-[var(--ts-border)]"
                style={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--ts-teal)' }} />
              </motion.button>
            )}

            {/* Participant strip */}
            <div
              className="rounded-2xl backdrop-blur-xl border-t-2 overflow-hidden pt-4"
              style={{
                background: 'rgba(17, 24, 39, 0.95)',
                borderTopColor: 'var(--ts-border)',
                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 196, 171, 0.1)',
              }}
            >
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-6 px-6 py-4 overflow-x-auto scrollbar-hide pt-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {displayParticipants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-shrink-0 group relative pt-4"
                  >
                    <ParticipantAvatar
                      name={participant.name}
                      avatarUrl={participant.avatarUrl}
                      isSpeaking={participant.isSpeaking}
                      isMuted={participant.isMuted}
                      caption=""
                      size={viewMode === 'compactGrid' ? 'small' : 'small'}
                      videoStream={participant.isLocal ? localVideoStream : remoteVideoById?.[participant.id]}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Participant count indicator */}
          {viewMode === 'compactGrid' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-8 right-0 px-3 py-1 rounded-lg backdrop-blur-md"
              style={{
                background: 'rgba(17, 24, 39, 0.8)',
                fontSize: '12px',
                color: 'var(--ts-text-secondary)',
              }}
            >
              {displayParticipants.length} participants
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
