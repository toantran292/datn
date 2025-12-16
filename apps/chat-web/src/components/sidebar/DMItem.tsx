import type { Room } from '../../types';

export interface DMItemProps {
  room: Room;
  selected: boolean;
  onClick: () => void;
  displayName: string;
}

// Generate avatar color based on id
function getAvatarColor(id: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

export function DMItem({ room, selected, onClick, displayName }: DMItemProps) {
  const initial = displayName.charAt(0).toUpperCase();

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
      {/* Avatar */}
      <div className={`
        w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-medium
        ${getAvatarColor(room.id)}
      `}>
        {initial}
      </div>
      <span className="truncate text-sm">{displayName}</span>
    </div>
  );
}
