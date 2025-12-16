import { useRef } from 'react';
import { Send } from 'lucide-react';
import type { Room } from '../../types';

export interface MessageInputProps {
  room: Room | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function MessageInput({ room, value, onChange, onSubmit, placeholder }: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit();
    inputRef.current?.focus();
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (!room) return 'Write a message...';
    return `Message ${room.type === 'channel' ? '#' + (room.name || 'channel') : room.name || 'conversation'}`;
  };

  return (
    <div className="px-5 pb-5 pt-2">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-1 pl-4 bg-custom-background-100 border border-custom-border-200 rounded-xl focus-within:border-custom-primary-100 focus-within:ring-1 focus-within:ring-custom-primary-100/20 transition-all"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 py-2.5 bg-transparent text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none text-[15px]"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className={`
            p-2.5 rounded-lg transition-all
            ${value.trim()
              ? 'bg-custom-primary-100 text-white hover:bg-custom-primary-200'
              : 'bg-custom-background-80 text-custom-text-400 cursor-not-allowed'
            }
          `}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
