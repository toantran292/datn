import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Maximize2, X } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

interface CompactHuddleProps {
  participants: Participant[];
  onExpand: () => void;
  onClose: () => void;
}

export function CompactHuddle({ participants, onExpand, onClose }: CompactHuddleProps) {
  // Show max 4 participants in compact mode
  const visibleParticipants = participants.slice(0, 4);
  const extraCount = Math.max(0, participants.length - 4);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50"
      drag
      dragMomentum={false}
      dragElastic={0}
    >
      <div
        className="rounded-2xl backdrop-blur-xl border border-[var(--ts-border)] overflow-hidden"
        style={{
          background: 'rgba(17, 24, 39, 0.95)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--ts-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="w-2 h-2 rounded-full bg-[var(--ts-teal)]"
            />
            <span className="text-white">Huddle Active</span>
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onExpand}
              className="p-1.5 rounded-lg hover:bg-[var(--ts-card-surface)] transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-[var(--ts-text-secondary)]" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--ts-card-surface)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--ts-text-secondary)]" />
            </motion.button>
          </div>
        </div>

        {/* Participants */}
        <div className="p-4 flex items-center gap-3">
          {visibleParticipants.map((participant) => (
            <div key={participant.id} className="relative">
              {/* Speaking ring */}
              <AnimatePresence>
                {participant.isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 -m-1"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 0 0px rgba(255, 136, 0, 0.4)',
                          '0 0 0 4px rgba(255, 136, 0, 0)',
                        ],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      className="w-full h-full rounded-full border-2 border-[var(--ts-orange)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                  participant.isSpeaking ? 'border-[var(--ts-orange)]' : 'border-[var(--ts-border)]'
                }`}
              >
                <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
              </div>

              {/* Muted indicator */}
              {participant.isMuted && (
                <div className="absolute -bottom-1 -right-1 bg-[var(--ts-card-surface)] rounded-full p-1 border border-[var(--ts-border)]">
                  <MicOff className="w-2.5 h-2.5 text-[var(--ts-text-secondary)]" />
                </div>
              )}
            </div>
          ))}

          {/* Extra participants count */}
          {extraCount > 0 && (
            <div className="w-12 h-12 rounded-full bg-[var(--ts-card-surface)] border-2 border-[var(--ts-border)] flex items-center justify-center">
              <span className="text-[var(--ts-text-secondary)]">+{extraCount}</span>
            </div>
          )}
        </div>

        {/* Caption */}
        <AnimatePresence>
          {visibleParticipants.some((p) => p.isSpeaking) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--ts-border)] overflow-hidden"
            >
              <div className="px-4 py-2">
                <p className="text-[var(--ts-text-secondary)] text-[13px]">
                  {visibleParticipants.find((p) => p.isSpeaking)?.name} is speaking...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
