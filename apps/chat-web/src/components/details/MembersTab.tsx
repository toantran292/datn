import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Users, Shield, MoreVertical, ShieldCheck, ShieldOff, Loader2, UserPlus } from 'lucide-react';
import { useAppPresence } from '@uts/design-system/ui';
import { api } from '../../services/api';
import { AddMembersModal } from '../modals/AddMembersModal';

interface Member {
  userId: string;
  displayName?: string;
  avatarUrl?: string | null;
  status?: 'online' | 'offline';
  role?: 'ADMIN' | 'MEMBER';
}

interface MembersTabProps {
  roomId: string;
  roomName?: string;
  currentUserId?: string;
  canManageRoles?: boolean; // Only org owner or channel admin can manage roles
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

export function MembersTab({ roomId, roomName, currentUserId, canManageRoles, onLoadMembers }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get real-time presence from notification service
  const { isUserOnline, enabled: presenceEnabled } = useAppPresence();

  useEffect(() => {
    loadMembers();
  }, [roomId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleUpdateRole = async (targetUserId: string, newRole: 'ADMIN' | 'MEMBER') => {
    setUpdatingRole(targetUserId);
    try {
      await api.updateMemberRole(roomId, targetUserId, newRole);
      // Update local state
      setMembers(prev => prev.map(m =>
        m.userId === targetUserId ? { ...m, role: newRole } : m
      ));
      setMenuOpenFor(null);
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update member role. Please try again.');
    } finally {
      setUpdatingRole(null);
    }
  };

  // Count admins to prevent demoting last admin
  const adminCount = members.filter(m => m.role === 'ADMIN').length;

  // Client-side filtering based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) {
      return members;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return members.filter(
      (member) => {
        const displayName = member.displayName || `User ${member.userId.slice(0, 8)}`;
        return displayName.toLowerCase().includes(searchLower);
      }
    );
  }, [members, searchTerm]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
          <p className="text-sm text-custom-text-400">Đang tải thành viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300 mb-3">
          <Users size={14} />
          <span>
            {members.length} thành viên
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thành viên..."
            className="w-full pl-10 pr-3 py-2 text-sm bg-custom-background-100 border border-custom-border-200 rounded-lg
                       text-custom-text-100 placeholder-custom-text-400
                       focus:outline-none focus:ring-1 focus:ring-custom-primary-100 focus:border-custom-primary-100"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
              <Users size={24} className="text-custom-text-300" />
            </div>
            <p className="text-sm text-custom-text-400">
              {searchTerm ? 'Không tìm thấy thành viên' : 'Không có thành viên trong kênh này'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredMembers.map((member) => {
              const displayName = member.displayName || `User ${member.userId.slice(0, 8)}`;
              const status = getMemberStatus(member);
              const isCurrentUser = member.userId === currentUserId;
              const isAdmin = member.role === 'ADMIN';
              const isLastAdmin = isAdmin && adminCount <= 1;
              const canChangeRole = canManageRoles && !isCurrentUser;

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-custom-background-80 transition-colors group"
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
                      title={status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                    />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-custom-text-100 truncate">
                        {displayName}
                        {isCurrentUser && <span className="text-custom-text-400 ml-1">(bạn)</span>}
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-medium flex-shrink-0">
                          <Shield size={10} />
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-custom-text-400 truncate">
                      {status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </div>
                  </div>

                  {/* Role Management Menu */}
                  {canChangeRole && (
                    <div className="relative" ref={menuOpenFor === member.userId ? menuRef : null}>
                      <button
                        onClick={() => setMenuOpenFor(menuOpenFor === member.userId ? null : member.userId)}
                        className="p-1.5 rounded-md text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-90 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {updatingRole === member.userId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <MoreVertical size={16} />
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenFor === member.userId && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg z-50 py-1">
                          {isAdmin ? (
                            <button
                              onClick={() => handleUpdateRole(member.userId, 'MEMBER')}
                              disabled={isLastAdmin || updatingRole === member.userId}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                                isLastAdmin
                                  ? 'text-custom-text-400 cursor-not-allowed'
                                  : 'text-custom-text-200 hover:bg-custom-background-80'
                              }`}
                              title={isLastAdmin ? 'Cannot remove the last admin' : undefined}
                            >
                              <ShieldOff size={14} />
                              <span>Hủy quyền Admin</span>
                              {isLastAdmin && (
                                <span className="text-[10px] text-custom-text-400 ml-auto">(admin cuối)</span>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateRole(member.userId, 'ADMIN')}
                              disabled={updatingRole === member.userId}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-custom-text-200 hover:bg-custom-background-80 transition-colors"
                            >
                              <ShieldCheck size={14} className="text-amber-500" />
                              <span>Phong Admin</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
          onClick={() => setShowAddMembersModal(true)}
        >
          <UserPlus size={16} />
          Thêm thành viên
        </button>
      </div>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        roomId={roomId}
        roomName={roomName}
        currentUserId={currentUserId || ''}
        existingMemberIds={members.map(m => m.userId)}
        onMembersAdded={loadMembers}
      />
    </div>
  );
}
