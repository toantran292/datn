'use client';

import { useState, useEffect } from 'react';
import { Hash, Lock, Info, Pin, ChevronDown, X, Search, Headphones, Menu } from 'lucide-react';
import type { Room, Message } from '../../types';
import { api } from '../../services/api';
import { useResponsive } from '../../hooks/useResponsive';

export interface ChatHeaderProps {
  room: Room;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  onOpenSearch?: () => void;
  onStartMeeting?: () => void;
  onCopyMeetingLink?: () => void;
  isHuddleActive?: boolean;
  huddleParticipantCount?: number;
}

export function ChatHeader({ room, sidebarOpen, onToggleSidebar, onJumpToMessage, onOpenSearch, onStartMeeting, isHuddleActive, huddleParticipantCount = 0 }: ChatHeaderProps) {
  const { isMobile, toggleSidebar, toggleDetailsPanel, detailsPanelOpen } = useResponsive();
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);

  // Load pinned messages when room changes
  useEffect(() => {
    const loadPinnedMessages = async () => {
      if (!room.id) return;
      try {
        const pins = await api.getPinnedMessages(room.id);
        setPinnedMessages(pins);
      } catch (error) {
        console.error('Failed to load pinned messages:', error);
        setPinnedMessages([]);
      }
    };

    loadPinnedMessages();
  }, [room.id]);

  const pinnedCount = pinnedMessages.length;

  return (
    <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-3 border-b border-custom-border-200 bg-custom-background-100">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors flex-shrink-0"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Channel name */}
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <span className="text-custom-text-200 flex-shrink-0">
            {room.type === 'dm' ? null : (room.isPrivate ? <Lock size={isMobile ? 16 : 18} /> : <Hash size={isMobile ? 16 : 18} />)}
          </span>
          <h2 className="font-semibold text-base md:text-lg text-custom-text-100 truncate">
            {room.name || 'Direct Message'}
          </h2>
        </div>

        {/* Pinned messages indicator - hide on small mobile */}
        {pinnedCount > 0 && (
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowPinnedDropdown(!showPinnedDropdown)}
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-md text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors text-sm"
            >
              <Pin size={14} className="text-amber-500" />
              <span>{pinnedCount}</span>
              <ChevronDown size={14} className={`transition-transform ${showPinnedDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Pinned messages dropdown */}
            {showPinnedDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPinnedDropdown(false)}
                />
                {/* Dropdown */}
                <div className="absolute top-full left-0 mt-1 w-72 md:w-80 max-h-96 overflow-y-auto bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-custom-border-200">
                    <span className="text-sm font-medium text-custom-text-100">Pinned messages</span>
                    <button
                      onClick={() => setShowPinnedDropdown(false)}
                      className="p-1 rounded hover:bg-custom-background-80 text-custom-text-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="py-1">
                    {pinnedMessages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          onJumpToMessage?.(msg.id);
                          setShowPinnedDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-custom-background-80 transition-colors"
                      >
                        <p className="text-sm text-custom-text-100 line-clamp-2">{msg.content}</p>
                        <p className="text-xs text-custom-text-400 mt-0.5">
                          {new Date(msg.sentAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 md:gap-1">
        {/* Huddle button */}
        {onStartMeeting && (
          <button
            onClick={onStartMeeting}
            className={`flex items-center gap-1 md:gap-1.5 p-2 rounded-lg transition-colors ${
              isHuddleActive
                ? 'text-teal-500 bg-teal-500/10 hover:bg-teal-500/20'
                : 'text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80'
            }`}
            title={isHuddleActive ? "Join Huddle" : "Start Huddle"}
          >
            <Headphones size={isMobile ? 18 : 18} />
            {isHuddleActive && huddleParticipantCount > 0 && (
              <span className="text-sm font-medium">{huddleParticipantCount}</span>
            )}
          </button>
        )}

        {/* Search button - icon only on mobile */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 md:gap-2 p-2 md:px-3 md:py-1.5 rounded-lg text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors text-sm"
            title="Search messages (⌘K)"
          >
            <Search size={16} />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 rounded bg-custom-background-80 text-xs font-mono">⌘K</kbd>
          </button>
        )}

        {/* Details panel toggle */}
        <button
          onClick={toggleDetailsPanel}
          className={`
            p-2 rounded-lg transition-colors
            ${detailsPanelOpen
              ? 'bg-custom-primary-100/10 text-custom-primary-100'
              : 'text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80'
            }
          `}
          title="Channel details"
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
}
