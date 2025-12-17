'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile } from 'lucide-react';

export interface Reaction {
  emoji: string;
  label: string;
}

export const REACTIONS: Reaction[] = [
  { emoji: '👍', label: 'Like' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🤔', label: 'Think' },
  { emoji: '👋', label: 'Wave' },
];

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  disabled?: boolean;
}

export function ReactionPicker({ onSelectReaction, disabled }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    if (disabled) return;
    onSelectReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-3 rounded-xl transition-all ${isOpen
            ? 'bg-[var(--ts-teal)] text-white'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={isOpen ? { boxShadow: '0 0 20px rgba(0, 196, 171, 0.4)' } : undefined}
      >
        <Smile className="w-5 h-5" />
      </motion.button>

      {/* Picker Popup - Fixed position in center of screen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 left-2 -translate-x-1/2 p-2 rounded-2xl backdrop-blur-xl border z-50 bg-white/95 dark:bg-gray-900/95"
            style={{
              borderColor: 'var(--ts-border)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="flex gap-1">
              {REACTIONS.map((reaction) => (
                <motion.button
                  key={reaction.emoji}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelect(reaction.emoji)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative group"
                  title={reaction.label}
                >
                  <span className="text-2xl">{reaction.emoji}</span>

                  {/* Tooltip */}
                  <span
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      borderColor: 'var(--ts-border)',
                    }}
                  >
                    {reaction.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close picker */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
