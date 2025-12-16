import { useRef, useEffect } from 'react';

// Common emoji set for quick reactions
const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '🎉', '🔥', '👏', '💯', '✅', '❌',
  '👀', '🤔', '💪', '🙏', '⭐', '💡',
];

export interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  position?: { top: number; left: number };
}

export function EmojiPicker({ isOpen, onClose, onSelect, position }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-custom-background-100 border border-custom-border-200 rounded-xl shadow-lg p-2"
      style={position ? { top: position.top, left: position.left } : { bottom: '100%', left: 0, marginBottom: 8 }}
    >
      <div className="grid grid-cols-6 gap-1">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-custom-background-80 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
