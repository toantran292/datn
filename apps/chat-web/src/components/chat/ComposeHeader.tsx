"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export interface SelectedUser {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

export interface ComposeHeaderProps {
  selectedUsers: SelectedUser[];
  onUserSelect: (user: SelectedUser) => void;
  onUserRemove: (userId: string) => void;
  currentUserId: string;
}

export function ComposeHeader({
  selectedUsers,
  onUserSelect,
  onUserRemove,
  currentUserId,
}: ComposeHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<SelectedUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const orgUsers = await api.listOrgUsers();
        console.log('[ComposeHeader] Raw org users:', orgUsers);
        // Don't filter by disabled - show all users except current user
        const mappedUsers = orgUsers
          .filter(u => u.userId !== currentUserId)
          .map(u => ({
            userId: u.userId,
            displayName: u.displayName || u.email?.split('@')[0] || 'Unknown',
            email: u.email,
            avatarUrl: u.avatarUrl,
            isOnline: u.isOnline ?? false,
          }));
        console.log('[ComposeHeader] Mapped users:', mappedUsers);
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, [currentUserId]);

  // Filter users based on search and already selected
  const filteredUsers = users.filter(user => {
    const isSelected = selectedUsers.some(s => s.userId === user.userId);
    if (isSelected) return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user: SelectedUser) => {
    onUserSelect(user);
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-orange-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      ref={containerRef}
      className="px-5 py-3 border-b border-custom-border-200 bg-custom-background-100"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-custom-text-300 font-medium shrink-0">To:</span>

        {/* Selected Users Pills */}
        {selectedUsers.map(user => (
          <div
            key={user.userId}
            className="flex items-center gap-1.5 px-2 py-1 bg-custom-primary-100/10 text-custom-primary-100 rounded-md text-sm"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className={`w-5 h-5 rounded-full ${getAvatarColor(user.displayName)} flex items-center justify-center text-white text-xs font-medium`}>
                {getInitial(user.displayName)}
              </div>
            )}
            <span className="font-medium">{user.displayName}</span>
            <button
              onClick={() => onUserRemove(user.userId)}
              className="ml-0.5 hover:bg-custom-primary-100/20 rounded p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Search Input */}
        <div className="relative flex-1 min-w-[150px]">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={selectedUsers.length === 0 ? "Search people..." : "Add more..."}
            className="w-full bg-transparent border-none outline-none text-custom-text-100 placeholder:text-custom-text-400 text-sm py-1"
          />

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-custom-text-300" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-custom-text-300">
                  <Search size={24} className="mb-2" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <div className="py-1">
                  {filteredUsers.map(user => (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-custom-background-80 transition-colors"
                    >
                      {/* Avatar with online badge */}
                      <div className="relative">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.displayName)} flex items-center justify-center text-white text-sm font-medium`}>
                            {getInitial(user.displayName)}
                          </div>
                        )}
                        {/* Online status badge */}
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-custom-background-100 ${
                            user.isOnline ? 'bg-green-500' : 'bg-custom-text-400'
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-custom-text-100">{user.displayName}</p>
                        <p className="text-xs text-custom-text-300">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
