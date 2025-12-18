import { useEffect, useMemo } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import type { Message, Room } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';
import { ChatHeader } from './ChatHeader';
import { ComposeHeader, SelectedUser } from './ComposeHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import type { PendingFile } from './FilePreview';

export interface ChatWindowProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (html: string, mentionedUserIds?: string[]) => void;
  onLoadMessages: () => void;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMoreMessages?: boolean;
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
}

export function ChatWindow({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onLoadMessages,
  onLoadMoreMessages,
  hasMoreMessages,
  isLoadingMoreMessages,
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
}: ChatWindowProps) {
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
      <div className="flex-1 flex flex-col bg-custom-background-100 min-w-0">
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
          />
        ) : composeUsers.length > 0 ? (
          // Show "beginning" message when users are selected but no messages
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-custom-primary-100/20 to-custom-primary-200/20 flex items-center justify-center">
              <Sparkles size={32} className="text-custom-primary-100" />
            </div>
            <h3 className="text-lg font-semibold text-custom-text-100 mb-2">
              This is the very beginning
            </h3>
            <p className="text-sm text-custom-text-300 text-center max-w-sm">
              Start a new conversation with {composeUsers.map(u => u.displayName).join(', ')}
            </p>
          </div>
        ) : (
          // Empty state when no users selected
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
              <MessageSquare size={32} className="text-custom-text-300" />
            </div>
            <h3 className="text-lg font-semibold text-custom-text-100 mb-1">
              New message
            </h3>
            <p className="text-sm text-custom-text-300 text-center">
              Search for people to start a conversation
            </p>
          </div>
        )}

        {/* Only show input when users are selected */}
        {composeUsers.length > 0 && (
          <MessageComposer
            room={room}
            onSendMessage={handleSendMessage}
            placeholder="Write a message..."
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
      <div className="flex-1 flex items-center justify-center bg-custom-background-100">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
            <MessageSquare size={32} className="text-custom-text-300" />
          </div>
          <h3 className="text-lg font-semibold text-custom-text-100 mb-1">
            Select a conversation
          </h3>
          <p className="text-sm text-custom-text-300">
            Choose a channel or direct message to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-custom-background-100 min-w-0">
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
        huddleParticipantCount={huddleParticipantCount}
        onLoadMore={onLoadMoreMessages}
        hasMore={hasMoreMessages}
        isLoadingMore={isLoadingMoreMessages}
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
