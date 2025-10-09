import { motion, AnimatePresence } from 'motion/react';
import { ParticipantAvatar } from './ParticipantAvatar';
import { CompactCaption } from './CompactCaption';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  isSpeaking: boolean;
  isMuted: boolean;
  caption?: string;
  isLocal?: boolean;
}

interface MeetingGridProps {
  participants: Participant[];
  showCaptions?: boolean;
  onToggleCaptions?: () => void;
  localVideoStream?: MediaStream | null;
}

export function MeetingGrid({ participants, showCaptions = true, onToggleCaptions, localVideoStream }: MeetingGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Determine grid layout based on participant count
  const getGridConfig = () => {
    const count = participants.length;
    if (count > 50) {
      return { perPage: 16, cols: 4, size: 'medium' as const }; // 4x4 grid
    } else if (count > 20) {
      return { perPage: 9, cols: 3, size: 'medium' as const }; // 3x3 grid
    } else if (count > 16) {
      return { perPage: 16, cols: 4, size: 'medium' as const }; // 4x4 for compactness
    } else {
      return { perPage: 9, cols: 3, size: 'large' as const }; // 3x3 with larger avatars
    }
  };

  const config = getGridConfig();
  const totalPages = Math.ceil(participants.length / config.perPage);
  const startIndex = currentPage * config.perPage;
  const endIndex = Math.min(startIndex + config.perPage, participants.length);
  const currentParticipants = participants.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setSlideDirection('left');
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setSlideDirection('right');
      setCurrentPage(currentPage + 1);
    }
  };

  const gridColsClass = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[config.cols];

  const activeSpeaker = participants.find((p) => p.isSpeaking);

  return (
    <div className="w-full h-screen flex items-center justify-center p-8 relative">
      {/* Main grid container */}
      <div className="relative w-full max-w-6xl top-auto botom-auto">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentPage}
            custom={slideDirection}
            initial={(direction) => ({
              opacity: 0,
              x: direction === 'right' ? 100 : -100,
            })}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={(direction) => ({
              opacity: 0,
              x: direction === 'right' ? -100 : 100,
            })}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`grid ${gridColsClass} gap-8 md:gap-12`}
          >
            {currentParticipants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-center"
              >
                <ParticipantAvatar
                  name={participant.name}
                  avatarUrl={participant.avatarUrl}
                  isSpeaking={participant.isSpeaking}
                  isMuted={participant.isMuted}
                  caption={showCaptions ? participant.caption : ''}
                  size={config.size}
                  videoStream={participant.isLocal ? localVideoStream : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {totalPages > 1 && (
          <>
            {currentPage > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevPage}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-3 rounded-full backdrop-blur-md border border-[var(--ts-border)]"
                style={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <ChevronLeft className="w-6 h-6" style={{ color: 'var(--ts-teal)' }} />
              </motion.button>
            )}

            {currentPage < totalPages - 1 && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextPage}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-3 rounded-full backdrop-blur-md border border-[var(--ts-border)]"
                style={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <ChevronRight className="w-6 h-6" style={{ color: 'var(--ts-teal)' }} />
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Page indicator */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 right-8 px-4 py-2 rounded-xl backdrop-blur-md border border-[var(--ts-border)]"
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <p className="text-[var(--ts-text-secondary)]" style={{ fontSize: '13px' }}>
            Page {currentPage + 1} of {totalPages}
          </p>
        </motion.div>
      )}

      {/* Pagination dots */}
      {totalPages > 1 && totalPages <= 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border border-[var(--ts-border)]"
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {Array.from({ length: totalPages }).map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSlideDirection(index > currentPage ? 'right' : 'left');
                setCurrentPage(index);
              }}
              className="rounded-full transition-all"
              style={{
                width: index === currentPage ? '24px' : '8px',
                height: '8px',
                background: index === currentPage ? 'var(--ts-teal)' : 'var(--ts-text-secondary)',
                opacity: index === currentPage ? 1 : 0.5,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Show Captions toggle */}
      {onToggleCaptions && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCaptions}
          className="fixed bottom-32 left-8 px-4 py-3 rounded-xl backdrop-blur-md border transition-all"
          style={{
            background: showCaptions
              ? 'linear-gradient(135deg, var(--ts-teal) 0%, rgba(0, 196, 171, 0.8) 100%)'
              : 'rgba(17, 24, 39, 0.95)',
            borderColor: showCaptions ? 'var(--ts-teal)' : 'var(--ts-border)',
            boxShadow: showCaptions
              ? '0 4px 16px rgba(0, 196, 171, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="text-white" style={{ fontSize: '14px', fontWeight: 600 }}>
              {showCaptions ? 'Hide Captions' : 'Show Captions'}
            </span>
          </div>
        </motion.button>
      )}

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
    </div>
  );
}
