import { useState, useEffect } from 'react';
import { MessageSquare, Search, X, Check } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth, Button, Input } from '@uts/design-system/ui';
import { api } from '../../services/api';

interface User {
  userId: string;
  email: string;
  displayName: string;
  disabled: boolean;
}

interface CreateDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (userIds: string[]) => Promise<void>;
  currentUserId: string;
}

// Avatar component
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

export function CreateDMModal({ isOpen, onClose, onCreate, currentUserId }: CreateDMModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const orgUsers = await api.listOrgUsers();
      // Filter out current user and disabled users
      const filteredUsers = orgUsers.filter(
        (u) => u.userId !== currentUserId && !u.disabled
      );
      setUsers(filteredUsers);
    } catch (err) {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.size === 0) {
      setError('Vui lòng chọn ít nhất một người');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(Array.from(selectedUserIds));
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo cuộc trò chuyện');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUserIds(new Set());
    setError(null);
    onClose();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUsers = users.filter((u) => selectedUserIds.has(u.userId));

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
              <MessageSquare size={20} className="text-custom-primary-100" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-custom-text-100">Tin nhắn mới</h2>
              <p className="text-sm text-custom-text-400">
                Bắt đầu cuộc trò chuyện với thành viên
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
                    onClick={() => toggleUser(user.userId)}
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
              placeholder="Tìm kiếm..."
              className="w-full pl-10"
              disabled={isCreating || isLoading}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
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
              <p className="text-sm font-medium text-custom-text-200 mb-1">Không tìm thấy người dùng</p>
              <p className="text-xs text-custom-text-400">
                Thử điều chỉnh từ khóa tìm kiếm
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
                    onClick={() => toggleUser(user.userId)}
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
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isCreating}
              disabled={selectedUserIds.size === 0}
            >
              {isCreating ? 'Đang tạo...' : 'Bắt đầu trò chuyện'}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
}
