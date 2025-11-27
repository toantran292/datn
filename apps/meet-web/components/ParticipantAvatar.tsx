import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';
import type { JitsiTrack } from '@/types/jitsi';

interface ParticipantAvatarProps {
  name: string;
  tracks: JitsiTrack[];
  isLocal?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function ParticipantAvatar({
  name,
  tracks,
  isLocal = false,
  isSpeaking = false,
  isMuted = false,
  size = 'medium',
  showTooltip = false,
}: ParticipantAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const videoTrack = tracks.find(t => t.getType() === 'video');
    const audioTrack = tracks.find(t => t.getType() === 'audio');

    console.log('[ParticipantAvatar]', name, 'tracks:', tracks.length, 'video:', !!videoTrack, 'audio:', !!audioTrack);

    if (videoRef.current && videoTrack) {
      try {
        videoTrack.attach(videoRef.current);
        const isMuted = videoTrack.isMuted();
        console.log('[ParticipantAvatar]', name, 'video track attached, muted:', isMuted, 'track:', videoTrack);
        // Always show video element if track exists, even if muted
        setHasVideo(true);
      } catch (err) {
        console.error('[ParticipantAvatar] Error attaching video:', err);
        setHasVideo(false);
      }
    } else {
      setHasVideo(false);
    }

    if (audioRef.current && audioTrack && !isLocal) {
      try {
        audioTrack.attach(audioRef.current);
        console.log('[ParticipantAvatar]', name, 'audio track attached');
      } catch (err) {
        console.error('[ParticipantAvatar] Error attaching audio:', err);
      }
    }

    return () => {
      if (videoRef.current && videoTrack) {
        try {
          videoTrack.detach(videoRef.current);
        } catch (err) {
          console.error('[ParticipantAvatar] Error detaching video:', err);
        }
      }
      if (audioRef.current && audioTrack) {
        try {
          audioTrack.detach(audioRef.current);
        } catch (err) {
          console.error('[ParticipantAvatar] Error detaching audio:', err);
        }
      }
    };
  }, [tracks, isLocal, name]);

  const sizeClasses = {
    tiny: 'w-16 h-16',
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const ringSize = {
    tiny: 'w-20 h-20',
    small: 'w-28 h-28',
    medium: 'w-52 h-52',
    large: 'w-68 h-68',
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div
      className="relative flex flex-col items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speaking ring animation */}
      <div className="relative">
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-0 -m-2 ${ringSize[size]} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(255, 136, 0, 0.4)',
                    '0 0 0 8px rgba(255, 136, 0, 0)',
                    '0 0 0 0px rgba(255, 136, 0, 0)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className={`${ringSize[size]} rounded-full border-[3px] border-ts-orange`}
                style={{
                  boxShadow: '0 0 20px rgba(255, 136, 0, 0.3)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar/Video container */}
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`${sizeClasses[size]} rounded-full overflow-hidden relative bg-ts-bg-card border-2 ${
            isSpeaking ? 'border-ts-orange' : 'border-gray-700'
          }`}
          style={isHovered ? { boxShadow: '0 0 20px rgba(0, 196, 171, 0.4)' } : undefined}
        >
          {hasVideo ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className="w-full h-full object-cover"
              />
              {!isLocal && <audio ref={audioRef} autoPlay />}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ts-orange/20 to-ts-teal/20">
              <div className={`font-bold text-white ${size === 'tiny' ? 'text-sm' : size === 'small' ? 'text-lg' : size === 'medium' ? 'text-4xl' : 'text-5xl'}`}>
                {getInitials()}
              </div>
            </div>
          )}

          {/* Muted indicator */}
          {isMuted && size !== 'tiny' && (
            <div className="absolute bottom-1 right-1 bg-ts-bg-card rounded-full p-1.5 border border-gray-700">
              <MicOff className="w-3 h-3 text-ts-text-secondary" />
            </div>
          )}
        </motion.div>

        {/* Tooltip on hover for compact mode */}
        <AnimatePresence>
          {showTooltip && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
            >
              <div
                className="px-3 py-1.5 rounded-lg backdrop-blur-md border border-ts-teal"
                style={{
                  background: 'rgba(0, 196, 171, 0.9)',
                  boxShadow: '0 4px 12px rgba(0, 196, 171, 0.4)',
                }}
              >
                <p className="text-sm text-white">{name}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name label - hide for tiny size or when tooltip is enabled */}
      {!showTooltip && size !== 'tiny' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 py-1.5 rounded-lg backdrop-blur-sm"
          style={{
            background: 'rgba(17, 24, 39, 0.8)',
          }}
        >
          <p className="text-sm text-white whitespace-nowrap">
            {isLocal ? `${name} (You)` : name}
          </p>
        </motion.div>
      )}

      {/* Speaking indicator label */}
      <AnimatePresence>
        {isSpeaking && size !== 'tiny' && !showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2"
          >
            <div className="px-2 py-1 rounded-full bg-ts-orange flex items-center gap-1">
              <Mic className="w-3 h-3 text-white" />
              <span className="text-xs text-white">Speaking</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
