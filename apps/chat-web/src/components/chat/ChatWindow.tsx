import { useState, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import type { Message, Room } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';
import { ChatHeader } from './ChatHeader';
import { ComposeHeader, SelectedUser } from './ComposeHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export interface ChatWindowProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
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
  onComposeSendMessage?: (content: string) => void;
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
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (room) {
      onLoadMessages();
    }
  }, [room?.id]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    if (isComposing && onComposeSendMessage) {
      onComposeSendMessage(messageInput);
    } else {
      onSendMessage(messageInput);
    }
    setMessageInput('');
  };

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
          <MessageInput
            room={room}
            value={messageInput}
            onChange={setMessageInput}
            onSubmit={handleSendMessage}
            placeholder="Write a message..."
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
      />

      <MessageList
        room={room}
        messages={messages}
        currentUserId={currentUserId}
        onOpenThread={onOpenThread}
        usersCache={usersCache}
      />

      <MessageInput
        room={room}
        value={messageInput}
        onChange={setMessageInput}
        onSubmit={handleSendMessage}
      />
    </div>
  );
}
