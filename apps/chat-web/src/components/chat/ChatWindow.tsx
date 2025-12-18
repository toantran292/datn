import { useEffect, useMemo } from 'react';
import { MessageSquare, Sparkles, Menu } from 'lucide-react';
import type { Message, Room } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';
import { ChatHeader } from './ChatHeader';
import { ComposeHeader, SelectedUser } from './ComposeHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import type { PendingFile } from './FilePreview';
import { useResponsive } from '../../hooks/useResponsive';

export interface ChatWindowProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (html: string, mentionedUserIds?: string[]) => void;
  onLoadMessages: () => void;
  onOpenThread: (message: Message) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  usersCache?: Map<string, UserInfo>;
  // Compose mode props
  isComposing?: boolean;
  composeUsers?: SelectedUser[];
  onComposeUserSelect?: (user: SelectedUser) => void;
  onComposeUserRemove?: (userId: string) => void;
  onComposeSendMessage?: (html: string, mentionedUserIds?: string[]) => void;
  // Message actions
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
  onPinMessage?: (message: Message) => void;
  onUnpinMessage?: (message: Message) => void;
  onAddReaction?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  // File upload
  pendingFiles?: PendingFile[];
  onFilesSelect?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  // Search
  onOpenSearch?: () => void;
  // Meeting
  onStartMeeting?: () => void;
  onCopyMeetingLink?: () => void;
  // Huddle participant count (real-time from WebSocket)
  huddleParticipantCounts?: Map<string, number>;
  // Unread divider
  lastSeenMessageId?: string | null;
}

export function ChatWindow({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onLoadMessages,
  onOpenThread,
  onToggleSidebar,
  sidebarOpen,
  usersCache,
  isComposing = false,
  composeUsers = [],
  onComposeUserSelect,
  onComposeUserRemove,
  onComposeSendMessage,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  onAddReaction,
  onToggleReaction,
  pendingFiles = [],
  onFilesSelect,
  onFileRemove,
  onOpenSearch,
  onStartMeeting,
  onCopyMeetingLink,
  huddleParticipantCounts,
  lastSeenMessageId,
}: ChatWindowProps) {
  const { isMobile, toggleSidebar } = useResponsive();

  useEffect(() => {
    if (room) {
      onLoadMessages();
    }
  }, [room?.id]);

  const handleSendMessage = (html: string, mentionedUserIds?: string[]) => {
    if (isComposing && onComposeSendMessage) {
      onComposeSendMessage(html, mentionedUserIds);
    } else {
      onSendMessage(html, mentionedUserIds);
    }
  };

  // Check if there's an active huddle (huddle_started without matching huddle_ended)
  // Must be called before any early returns to maintain hooks order
  const { isHuddleActive, huddleParticipantCount } = useMemo(() => {
    // Find the last huddle_started or huddle_ended message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'huddle_ended') {
        return { isHuddleActive: false, huddleParticipantCount: 0 };
      }
      if (messages[i].type === 'huddle_started') {
        // Use real-time count from WebSocket if available, otherwise fallback to message metadata
        const realtimeCount = room?.id ? huddleParticipantCounts?.get(room.id) : undefined;
        const count = realtimeCount ?? messages[i].metadata?.participantCount ?? 1;
        return { isHuddleActive: true, huddleParticipantCount: count };
      }
    }
    return { isHuddleActive: false, huddleParticipantCount: 0 };
  }, [messages, room?.id, huddleParticipantCounts]);

  // Compose mode - show compose header and message area
  if (isComposing) {
    return (
      <div className="flex-1 flex flex-col bg-custom-background-100 min-w-0 overflow-hidden h-full">
        <ComposeHeader
          selectedUsers={composeUsers}
          onUserSelect={onComposeUserSelect || (() => {})}
          onUserRemove={onComposeUserRemove || (() => {})}
          currentUserId={currentUserId}
        />

        {/* Message area for compose mode */}
        {messages.length > 0 ? (
          // Show existing messages if DM already exists
          <MessageList
            room={room}
            messages={messages}
            currentUserId={currentUserId}
            onOpenThread={onOpenThread}
            usersCache={usersCache}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onPinMessage={onPinMessage}
            onUnpinMessage={onUnpinMessage}
            onAddReaction={onAddReaction}
            onToggleReaction={onToggleReaction}
            lastSeenMessageId={lastSeenMessageId}
          />
        ) : composeUsers.length > 0 ? (
          // Show "beginning" message when users are selected but no messages
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-custom-primary-100/20 to-custom-primary-200/20 flex items-center justify-center">
              <Sparkles size={32} className="text-custom-primary-100" />
            </div>
            <h3 className="text-lg font-semibold text-custom-text-100 mb-2">
              Đây là khởi đầu
            </h3>
            <p className="text-sm text-custom-text-300 text-center max-w-sm">
              Bắt đầu cuộc trò chuyện mới với {composeUsers.map(u => u.displayName).join(', ')}
            </p>
          </div>
        ) : (
          // Empty state when no users selected
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
              <MessageSquare size={32} className="text-custom-text-300" />
            </div>
            <h3 className="text-lg font-semibold text-custom-text-100 mb-1">
              Tin nhắn mới
            </h3>
            <p className="text-sm text-custom-text-300 text-center">
              Tìm kiếm người để bắt đầu cuộc trò chuyện
            </p>
          </div>
        )}

        {/* Only show input when users are selected */}
        {composeUsers.length > 0 && (
          <MessageComposer
            room={room}
            onSendMessage={handleSendMessage}
            placeholder="Viết tin nhắn..."
            members={usersCache}
            currentUserId={currentUserId}
          />
        )}
      </div>
    );
  }

  // Empty state - no room selected
  if (!room) {
    return (
      <div className="flex-1 flex flex-col bg-custom-background-100">
        {/* Mobile header with hamburger menu */}
        {isMobile && (
          <div className="flex items-center px-3 py-2 border-b border-custom-border-200">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
              title="Mở menu"
            >
              <Menu size={20} />
            </button>
            <span className="ml-2 font-semibold text-custom-text-100">Tin nhắn</span>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
              <MessageSquare size={32} className="text-custom-text-300" />
            </div>
            <h3 className="text-lg font-semibold text-custom-text-100 mb-1">
              Chọn cuộc trò chuyện
            </h3>
            <p className="text-sm text-custom-text-300">
              Chọn kênh hoặc tin nhắn riêng để bắt đầu trò chuyện
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-custom-background-100 min-w-0 overflow-hidden h-full">
      <ChatHeader
        room={room}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onOpenSearch={onOpenSearch}
        onStartMeeting={onStartMeeting}
        isHuddleActive={isHuddleActive}
        huddleParticipantCount={huddleParticipantCount}
      />

      <MessageList
        room={room}
        messages={messages}
        currentUserId={currentUserId}
        onOpenThread={onOpenThread}
        usersCache={usersCache}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
        onPinMessage={onPinMessage}
        onUnpinMessage={onUnpinMessage}
        onAddReaction={onAddReaction}
        onToggleReaction={onToggleReaction}
        lastSeenMessageId={lastSeenMessageId}
      />

      <MessageComposer
        room={room}
        onSendMessage={handleSendMessage}
        pendingFiles={pendingFiles}
        onFilesSelect={onFilesSelect}
        onFileRemove={onFileRemove}
        members={usersCache}
        currentUserId={currentUserId}
      />
    </div>
  );
}
