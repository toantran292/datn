import { Hash, Lock, Info, Search } from 'lucide-react';
import type { Room } from '../../types';

export interface ChatHeaderProps {
  room: Room;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function ChatHeader({ room, sidebarOpen, onToggleSidebar }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-custom-border-200 bg-custom-background-100">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-custom-text-200">
          {room.type === 'dm' ? null : (room.isPrivate ? <Lock size={18} /> : <Hash size={18} />)}
        </span>
        <h2 className="font-semibold text-lg text-custom-text-100 truncate">
          {room.name || 'Direct Message'}
        </h2>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
          title="Search in channel"
        >
          <Search size={18} />
        </button>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`
              p-2 rounded-lg transition-colors
              ${sidebarOpen
                ? 'bg-custom-primary-100/10 text-custom-primary-100'
                : 'text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80'
              }
            `}
            title="Channel details"
          >
            <Info size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
