import { motion, AnimatePresence } from 'motion/react';
import { ParticipantAvatar } from './ParticipantAvatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface Participant {
  id: string;
  name: string;
  tracks: JitsiTrack[];
  isSpeaking?: boolean;
  isMuted?: boolean;
}

interface MeetingGridProps {
  participants: Participant[];
  localParticipant: {
    name: string;
    tracks: JitsiTrack[];
  };
}

export function MeetingGrid({ participants, localParticipant }: MeetingGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Combine local + remote participants
  const allParticipants = useMemo(() => [
    {
      id: 'local',
      name: localParticipant.name,
      tracks: localParticipant.tracks,
      isSpeaking: false,
      isMuted: localParticipant.tracks.find(t => t.getType() === 'audio')?.isMuted() || false,
    },
    ...Array.from(participants).map(p => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks,
      isSpeaking: false,
      isMuted: p.tracks.find(t => t.getType() === 'audio')?.isMuted() || false,
    }))
  ], [localParticipant, participants]);

  // Determine grid layout based on participant count
  const getGridConfig = () => {
    const count = allParticipants.length;
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
  const totalPages = Math.ceil(allParticipants.length / config.perPage);
  const startIndex = currentPage * config.perPage;
  const endIndex = Math.min(startIndex + config.perPage, allParticipants.length);
  const currentParticipants = allParticipants.slice(startIndex, endIndex);
  const slideVariants = {
    initial: (direction: string) => ({
      opacity: 0,
      x: direction === 'right' ? 100 : -100,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: string) => ({
      opacity: 0,
      x: direction === 'right' ? -100 : 100,
    }),
  };

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

  return (
    <div className="w-full h-full flex items-center justify-center p-8 relative">
      {/* Main grid container */}
      <div className="relative w-full max-w-6xl">
       <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentPage}
            custom={slideDirection}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`grid ${gridColsClass} gap-8 md:gap-12`}
          >
            {currentParticipants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-center"
              >
                <ParticipantAvatar
                  name={participant.name}
                  tracks={participant.tracks}
                  isLocal={participant.id === 'local'}
                  isSpeaking={participant.isSpeaking || false}
                  isMuted={participant.isMuted || false}
                  size={config.size}
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
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-3 rounded-full backdrop-blur-md border border-gray-700"
                style={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <ChevronLeft className="w-6 h-6 text-ts-teal" />
              </motion.button>
            )}

            {currentPage < totalPages - 1 && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextPage}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-3 rounded-full backdrop-blur-md border border-gray-700"
                style={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <ChevronRight className="w-6 h-6 text-ts-teal" />
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
          className="fixed bottom-32 right-8 px-4 py-2 rounded-xl backdrop-blur-md border border-gray-700"
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <p className="text-ts-text-secondary text-sm">
            Page {currentPage + 1} of {totalPages}
          </p>
        </motion.div>
      )}

      {/* Pagination dots */}
      {totalPages > 1 && totalPages <= 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border border-gray-700"
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
    </div>
  );
}
