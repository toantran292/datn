import { useState, useEffect } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useAppPresence } from '@uts/design-system/ui';

interface Member {
  userId: string;
  displayName?: string;
  avatarUrl?: string | null;
  status?: 'online' | 'offline';
}

interface MembersTabProps {
  roomId: string;
  onLoadMembers?: () => Promise<Member[]>;
}

// Avatar component with image support
function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const getAvatarColor = (str: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
    ];
    const index = str.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
      />
    );
  }

  return (
    <div className={`
      w-9 h-9 ${getAvatarColor(name)}
      rounded-lg flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold
    `}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function MembersTab({ roomId, onLoadMembers }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Get real-time presence from notification service
  const { isUserOnline, enabled: presenceEnabled } = useAppPresence();

  useEffect(() => {
    loadMembers();
  }, [roomId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      if (onLoadMembers) {
        const data = await onLoadMembers();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get member's online status - prefer real-time presence, fallback to cached status
  const getMemberStatus = (member: Member): 'online' | 'offline' => {
    if (presenceEnabled) {
      return isUserOnline(member.userId) ? 'online' : 'offline';
    }
    return member.status || 'offline';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
          <p className="text-sm text-custom-text-400">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300">
          <Users size={14} />
          <span>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
              <Users size={24} className="text-custom-text-300" />
            </div>
            <p className="text-sm text-custom-text-400">No members found</p>
          </div>
        ) : (
          <div className="p-2">
            {members.map((member) => {
              const displayName = member.displayName || `User ${member.userId.slice(0, 8)}`;
              const status = getMemberStatus(member);
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-custom-background-80 transition-colors cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar name={displayName} avatarUrl={member.avatarUrl} />
                    {/* Online indicator */}
                    <div
                      className={`
                        absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-custom-background-100
                        ${status === 'online' ? 'bg-green-500' : 'bg-custom-text-400'}
                      `}
                      title={status === 'online' ? 'Online' : 'Offline'}
                    />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-custom-text-100 truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-custom-text-400 truncate">
                      {status === 'online' ? 'Active now' : 'Offline'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-custom-border-200">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-custom-primary-100 text-white rounded-lg
                     text-sm font-medium hover:bg-custom-primary-200 transition-colors"
          onClick={() => alert('Add member functionality - TODO')}
        >
          <UserPlus size={16} />
          Add Members
        </button>
      </div>
    </div>
  );
}
