import { Hash, Lock } from 'lucide-react';
import type { Room } from '../../types';
import { UnreadBadge } from './UnreadBadge';
import { ChannelSettingsDropdown } from './ChannelSettingsDropdown';

export interface ChannelItemProps {
  room: Room;
  selected: boolean;
  onClick: () => void;
  displayName: string;
  unreadCount?: number;
  isOwner?: boolean;
  onRoomUpdated?: (room: Room) => void;
  onRoomDeleted?: (roomId: string) => void;
  onRoomArchived?: (roomId: string) => void;
  onLeftRoom?: (roomId: string) => void;
}

export function ChannelItem({
  room,
  selected,
  onClick,
  displayName,
  unreadCount = 0,
  isOwner = false,
  onRoomUpdated,
  onRoomDeleted,
  onRoomArchived,
  onLeftRoom,
}: ChannelItemProps) {
  const hasUnread = unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-pointer transition-all
        ${selected
          ? 'bg-custom-primary-100/10 text-custom-text-100 font-medium'
          : hasUnread
            ? 'text-custom-text-100 font-medium hover:bg-custom-background-80'
            : 'text-custom-text-200 hover:bg-custom-background-80'
        }
      `}
    >
      <span className={`flex-shrink-0 ${selected ? 'text-custom-primary-100' : 'text-custom-text-300'}`}>
        {room.isPrivate ? <Lock size={15} /> : <Hash size={15} />}
      </span>
      <span className="truncate text-sm flex-1">{displayName}</span>
      <div className="flex items-center gap-1">
        <UnreadBadge count={unreadCount} />
        <div onClick={(e) => e.stopPropagation()}>
          <ChannelSettingsDropdown
            room={room}
            isOwner={isOwner}
            onRoomUpdated={onRoomUpdated}
            onRoomDeleted={onRoomDeleted}
            onRoomArchived={onRoomArchived}
            onLeftRoom={onLeftRoom}
          />
        </div>
      </div>
    </div>
  );
}
