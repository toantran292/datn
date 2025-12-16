'use client';

import { motion } from 'motion/react';
import { Circle } from 'lucide-react';
import { formatDuration } from '@/hooks/useRecording';

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration: number;
  status?: string | null;
}

export function RecordingIndicator({ isRecording, duration, status }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  const isPending = status === 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-xl border"
        style={{
          background: 'rgba(239, 68, 68, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
        }}
      >
        {/* Recording dot with pulse animation */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Circle className="w-3 h-3 fill-white text-white" />
        </motion.div>

        {/* Status text */}
        <span className="text-white font-medium text-sm">
          {isPending ? 'Starting...' : 'Recording'}
        </span>

        {/* Duration */}
        {!isPending && (
          <span className="text-white/90 font-mono text-sm">
            {formatDuration(duration)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
