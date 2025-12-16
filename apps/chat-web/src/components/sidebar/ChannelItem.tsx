import { Hash, Lock } from 'lucide-react';
import type { Room } from '../../types';

export interface ChannelItemProps {
  room: Room;
  selected: boolean;
  onClick: () => void;
  displayName: string;
}

export function ChannelItem({ room, selected, onClick, displayName }: ChannelItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-pointer transition-all
        ${selected
          ? 'bg-custom-primary-100/10 text-custom-text-100 font-medium'
          : 'text-custom-text-200 hover:bg-custom-background-80'
        }
      `}
    >
      <span className={`flex-shrink-0 ${selected ? 'text-custom-primary-100' : 'text-custom-text-300'}`}>
        {room.isPrivate ? <Lock size={15} /> : <Hash size={15} />}
      </span>
      <span className="truncate text-sm">{displayName}</span>
    </div>
  );
}
