import { motion, AnimatePresence } from 'motion/react';
import { Pin, Mic, MicOff, MessageSquare } from 'lucide-react';

interface ParticipantPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  isMuted: boolean;
  onPin: () => void;
  onToggleMute: () => void;
  onChatPrivately: () => void;
}

export function ParticipantPopover({
  isOpen,
  onClose,
  participantName,
  isMuted,
  onPin,
  onToggleMute,
  onChatPrivately,
}: ParticipantPopoverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 rounded-xl backdrop-blur-xl border overflow-hidden"
            style={{
              background: 'rgba(17, 24, 39, 0.95)',
              borderColor: 'var(--ts-border)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '200px',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--ts-border)' }}>
              <p className="text-white" style={{ fontSize: '14px', fontWeight: 600 }}>
                {participantName}
              </p>
            </div>

            {/* Actions */}
            <div className="py-2">
              <PopoverButton
                icon={<Pin className="w-4 h-4" />}
                label="Pin to Focus"
                onClick={() => {
                  onPin();
                  onClose();
                }}
              />
              <PopoverButton
                icon={isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                label={isMuted ? 'Ask to Unmute' : 'Mute'}
                onClick={() => {
                  onToggleMute();
                  onClose();
                }}
              />
              <PopoverButton
                icon={<MessageSquare className="w-4 h-4" />}
                label="Chat Privately"
                onClick={() => {
                  onChatPrivately();
                  onClose();
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface PopoverButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function PopoverButton({ icon, label, onClick }: PopoverButtonProps) {
  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(0, 196, 171, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors"
      style={{ color: 'var(--ts-text-primary)' }}
    >
      <span style={{ color: 'var(--ts-teal)' }}>{icon}</span>
      <span style={{ fontSize: '14px' }}>{label}</span>
    </motion.button>
  );
}
