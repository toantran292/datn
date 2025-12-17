'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';

export type ControlButtonColor = 'orange' | 'teal' | 'recording';

interface ControlButtonProps {
  icon: React.ReactElement;
  active?: boolean;
  onClick: () => void;
  activeColor?: ControlButtonColor;
  label?: string;
  disabled?: boolean;
}

const ACTIVE_STYLES: Record<ControlButtonColor, { background: string; boxShadow: string }> = {
  orange: {
    background: 'var(--ts-orange)',
    boxShadow: '0 0 20px rgba(255, 136, 0, 0.4)',
  },
  teal: {
    background: 'var(--ts-teal)',
    boxShadow: '0 0 20px rgba(0, 196, 171, 0.4)',
  },
  recording: {
    background: '#EF4444',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
  },
};

export function ControlButton({
  icon,
  active,
  onClick,
  activeColor = 'orange',
  label,
  disabled = false,
}: ControlButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
        className={`p-3 rounded-xl transition-all ${
          active
            ? 'text-white'
            : 'text-[var(--ts-text-secondary)] hover:text-white hover:bg-[var(--ts-card-surface)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={active ? ACTIVE_STYLES[activeColor] : undefined}
      >
        <span>{icon}</span>
      </motion.button>

      {/* Tooltip label */}
      {label && isHovered && !active && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs text-white whitespace-nowrap border"
          style={{
            backgroundColor: 'var(--ts-card-surface)',
            borderColor: 'var(--ts-border)',
          }}
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}
