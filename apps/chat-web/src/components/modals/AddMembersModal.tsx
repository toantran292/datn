import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserPlus, Search, X, Check } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth, Button, Input } from '@uts/design-system/ui';
import { api } from '../../services/api';

interface User {
  userId: string;
  email: string;
  displayName: string;
  disabled: boolean;
}

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
  currentUserId: string;
  existingMemberIds: string[];
  onMembersAdded?: () => void;
}

function Avatar({ name }: { name: string }) {
  const getAvatarColor = (str: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
    ];
    const index = str.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`
      w-9 h-9 ${getAvatarColor(name)}
      rounded-lg flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold
    `}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function AddMembersModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  currentUserId,
  existingMemberIds,
  onMembersAdded,
}: AddMembersModalProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all users once when modal opens
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orgUsers = await api.listOrgUsers();
      // Filter out current user and existing members
      const filteredUsers = orgUsers.filter(
        (u) => u.userId !== currentUserId && !existingMemberIds.includes(u.userId)
      );
      setAllUsers(filteredUsers);
    } catch {
      setError('Không thể tải danh sách người dùng');
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, existingMemberIds]);

  // Client-side filtering based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return allUsers;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return allUsers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }, [allUsers, searchTerm]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds(new Set());
      setSelectedUsers([]);
      setSearchTerm('');
      setError(null);
      loadUsers();
    }
  }, [isOpen, loadUsers]);

  const toggleUser = (user: User) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(user.userId)) {
      newSelected.delete(user.userId);
      setSelectedUsers(prev => prev.filter(u => u.userId !== user.userId));
    } else {
      newSelected.add(user.userId);
      setSelectedUsers(prev => [...prev, user]);
    }
    setSelectedUserIds(newSelected);
  };

  const removeSelectedUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    newSelected.delete(userId);
    setSelectedUserIds(newSelected);
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.size === 0) {
      setError('Vui lòng chọn ít nhất một người');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      // TODO: API invite members chưa được implement
      // Tạm thời chỉ log và đóng modal
      console.log('Selected users to invite:', Array.from(selectedUserIds));
      setError('Tính năng này chưa có sẵn. Sắp ra mắt!');
      // onMembersAdded?.();
      // handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm thành viên');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUserIds(new Set());
    setSelectedUsers([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.LG}
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-custom-border-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-custom-primary-100/10 flex items-center justify-center">
              <UserPlus size={20} className="text-custom-primary-100" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-custom-text-100">Thêm thành viên</h2>
              <p className="text-sm text-custom-text-400">
                Thêm người vào {roomName ? `#${roomName}` : 'kênh này'}
              </p>
            </div>
          </div>

          {/* Selected Users Tags */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedUsers.map((user) => (
                <span
                  key={user.userId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-custom-primary-100/10 text-custom-primary-100"
                >
                  {user.displayName}
                  <button
                    type="button"
                    onClick={() => removeSelectedUser(user.userId)}
                    className="hover:text-custom-primary-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="w-full pl-10"
              disabled={isAdding}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 mb-3 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
              <p className="text-sm text-custom-text-400">Đang tải...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
                <Search size={24} className="text-custom-text-300" />
              </div>
              <p className="text-sm font-medium text-custom-text-200 mb-1">
                {searchTerm ? 'Không tìm thấy người dùng' : 'Tất cả đều đã là thành viên'}
              </p>
              <p className="text-xs text-custom-text-400">
                {searchTerm ? 'Thử điều chỉnh từ khóa tìm kiếm' : 'Mọi người trong tổ chức đều đã ở trong kênh này'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.has(user.userId);
                return (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => toggleUser(user)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                      ${isSelected
                        ? 'bg-custom-primary-100/10'
                        : 'hover:bg-custom-background-80'
                      }
                    `}
                  >
                    <Avatar name={user.displayName} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-custom-text-100 truncate">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-custom-text-400 truncate">
                        {user.email}
                      </div>
                    </div>
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                      ${isSelected
                        ? 'bg-custom-primary-100 border-custom-primary-100'
                        : 'border-custom-border-300'
                      }
                    `}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-custom-border-200">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={handleClose}
              disabled={isAdding}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isAdding}
              disabled={selectedUserIds.size === 0}
            >
              {isAdding ? 'Đang thêm...' : `Thêm ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} thành viên`}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
}
