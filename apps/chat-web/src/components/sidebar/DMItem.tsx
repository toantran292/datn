import type { Room, RoomMember } from '../../types';
import { useAppPresence } from '@uts/design-system/ui';

export interface DMItemProps {
  room: Room;
  selected: boolean;
  onClick: () => void;
  displayName: string;
}

// Generate avatar color based on name/id
function getAvatarColor(str: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
  ];
  const index = str.charCodeAt(0) % colors.length;
  return colors[index];
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

// Avatar component for a single member
function MemberAvatar({ member, size = 'sm' }: { member: RoomMember; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-xs';

  return member.avatarUrl ? (
    <img
      src={member.avatarUrl}
      alt={member.displayName}
      className={`${sizeClass} rounded-full object-cover`}
    />
  ) : (
    <div className={`${sizeClass} rounded-full ${getAvatarColor(member.displayName)} flex items-center justify-center text-white font-medium`}>
      {getInitial(member.displayName)}
    </div>
  );
}

export function DMItem({ room, selected, onClick, displayName }: DMItemProps) {
  const members = room.members || [];
  const memberCount = members.length;
  const firstMember = members[0];

  // Get real-time presence from notification service
  const { isUserOnline, enabled: presenceEnabled } = useAppPresence();

  // For single DM, check online status - prefer real-time presence, fallback to cached status
  const isOnline = memberCount === 1 && firstMember && (
    presenceEnabled ? isUserOnline(firstMember.userId) : firstMember.isOnline
  );

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
      {/* Avatar section */}
      <div className="relative flex-shrink-0">
        {memberCount === 0 ? (
          // Fallback when no members info
          <div className={`w-5 h-5 rounded-full ${getAvatarColor(room.id)} flex items-center justify-center text-white text-xs font-medium`}>
            {getInitial(displayName)}
          </div>
        ) : memberCount === 1 ? (
          // Single member DM - show avatar with online badge
          <>
            <MemberAvatar member={firstMember} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-custom-background-100 ${
                isOnline ? 'bg-green-500' : 'bg-custom-text-400'
              }`}
            />
          </>
        ) : (
          // Group DM - show first avatar with member count badge
          <>
            <MemberAvatar member={firstMember} />
            <span className="absolute -bottom-0.5 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-custom-text-300 text-white text-[9px] font-medium flex items-center justify-center border border-custom-background-100">
              {memberCount}
            </span>
          </>
        )}
      </div>

      <span className="truncate text-sm">{displayName}</span>
    </div>
  );
}
