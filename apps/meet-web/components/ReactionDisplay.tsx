'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface FloatingReaction {
  id: string;
  emoji: string;
  userName: string;
  timestamp: number;
}

interface ReactionDisplayProps {
  reactions: FloatingReaction[];
  onReactionExpired: (id: string) => void;
}

export function ReactionDisplay({ reactions, onReactionExpired }: ReactionDisplayProps) {
  return (
    <div className="fixed bottom-32 left-8 z-40 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {reactions.map((reaction, index) => (
          <ReactionBubble
            key={reaction.id}
            reaction={reaction}
            index={index}
            onExpired={() => onReactionExpired(reaction.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ReactionBubbleProps {
  reaction: FloatingReaction;
  index: number;
  onExpired: () => void;
}

function ReactionBubble({ reaction, index, onExpired }: ReactionBubbleProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onExpired();
    }, 4000); // Reaction disappears after 4 seconds

    return () => clearTimeout(timer);
  }, [onExpired]);

  // Random horizontal offset for variety
  const xOffset = Math.random() * 40 - 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: xOffset, scale: 0.5 }}
      animate={{ opacity: 1, y: -index * 60, x: xOffset, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.5 }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
      }}
      className="flex items-center gap-2 mb-2"
    >
      {/* Emoji with glow effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.5,
          repeat: 2,
          repeatType: 'reverse',
        }}
        className="text-4xl filter drop-shadow-lg"
        style={{
          textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
        }}
      >
        {reaction.emoji}
      </motion.div>

      {/* User name badge */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="px-3 py-1.5 rounded-full text-sm font-medium text-white backdrop-blur-xl border"
        style={{
          background: 'rgba(17, 24, 39, 0.8)',
          borderColor: 'var(--ts-border)',
        }}
      >
        {reaction.userName}
      </motion.div>
    </motion.div>
  );
}

// Large emoji burst animation for special emphasis (optional)
export function ReactionBurst({ emoji }: { emoji: string }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

  useEffect(() => {
    // Create burst particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      angle: (i * 360) / 8,
    }));
    setParticles(newParticles);

    // Clean up after animation
    const timer = setTimeout(() => setParticles([]), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{
              x: Math.cos((particle.angle * Math.PI) / 180) * 150,
              y: Math.sin((particle.angle * Math.PI) / 180) * 150,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute text-4xl"
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
