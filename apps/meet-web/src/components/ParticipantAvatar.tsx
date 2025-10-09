import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ParticipantAvatarProps {
  name: string;
  avatarUrl: string;
  isSpeaking: boolean;
  isMuted: boolean;
  caption?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  videoStream?: MediaStream | null;
}

export function ParticipantAvatar({
  name,
  avatarUrl,
  isSpeaking,
  isMuted,
  caption,
  size = 'medium',
  showTooltip = false,
  videoStream,
}: ParticipantAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (videoStream) {
      try {
        el.srcObject = videoStream;
        void el.play();
      } catch { }
    } else {
      try { el.srcObject = null; } catch { }
    }
  }, [videoStream]);

  const sizeClasses = {
    tiny: 'w-12 h-12',
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-40 h-40',
  };

  const ringSize = {
    tiny: 'w-16 h-16',
    small: 'w-20 h-20',
    medium: 'w-36 h-36',
    large: 'w-44 h-44',
  };

  return (
    <div
      className="relative flex flex-col items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speaking ring animation (không ảnh hưởng size avatar) */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* RING: bám đúng kích thước wrapper */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 w-full h-full rounded-full"
            >
              <motion.div
                className="w-full h-full rounded-full border-[3px] border-[var(--ts-orange)]"
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(255,136,0,0.45)',
                    '0 0 0 10px rgba(255,136,0,0)',
                    '0 0 0 0px rgba(255,136,0,0)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 20px rgba(255,136,0,0.35)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AVATAR: fill 100% wrapper, không đổi size khi speaking */}
        <motion.div
          animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`w-full h-full rounded-full overflow-hidden relative bg-[var(--ts-card-surface)] border-[2px] ${isSpeaking ? 'border-[var(--ts-orange)]' : 'border-[var(--ts-border)]'
            }`}
          style={isHovered && !isSpeaking ? { boxShadow: '0 0 20px rgba(0,196,171,0.4)' } : undefined}
        >
          {isMuted && size !== 'tiny' && (
            <div className="absolute bottom-1 right-1 bg-[var(--ts-card-surface)] rounded-full p-1.5 border border-[var(--ts-border)]">
              <MicOff className="w-3 h-3 text-[var(--ts-text-secondary)]" />
            </div>
          )}
          {videoStream ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          )}
        </motion.div>
      </div>

      {/* Name label */}
      {!showTooltip && size !== 'tiny' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-1.5 rounded-lg backdrop-blur-sm" style={{ background: 'rgba(17,24,39,0.8)' }}>
          <p className="text-[13px] text-white whitespace-nowrap">{name}</p>
        </motion.div>
      )}

      {/* Speaking pill */}
      <AnimatePresence>
        {isSpeaking && !showTooltip && (
          <motion.div initial={{ opacity: 0, scale: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1 }} className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="px-2 py-1 rounded-full bg-[var(--ts-orange)] flex items-center gap-1">
              <Mic className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
