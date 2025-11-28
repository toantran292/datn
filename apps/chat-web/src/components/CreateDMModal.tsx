import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  userId: string;
  email: string;
  displayName: string;
  disabled: boolean;
}

interface CreateDMModalProps {
  onClose: () => void;
  onCreate: (userIds: string[]) => Promise<void>;
  currentUserId: string;
}

export function CreateDMModal({ onClose, onCreate, currentUserId }: CreateDMModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const orgUsers = await api.listOrgUsers();
      // Filter out current user and disabled users
      const filteredUsers = orgUsers.filter(
        (u) => u.userId !== currentUserId && !u.disabled
      );
      setUsers(filteredUsers);
    } catch (err) {
      setError('Failed to load users');
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
      setError('Please select at least one person');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(Array.from(selectedUserIds));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUsers = users.filter((u) => selectedUserIds.has(u.userId));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">New Message</h2>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.userId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {user.displayName}
                  <button
                    type="button"
                    onClick={() => toggleUser(user.userId)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating || isLoading}
              autoFocus
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md mb-4">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No users found</div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.has(user.userId);
                  return (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => toggleUser(user.userId)}
                      className={`w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating || selectedUserIds.size === 0}
            >
              {isCreating ? 'Creating...' : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

