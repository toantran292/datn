import { useRef, useEffect } from 'react';
import { Hash, Lock } from 'lucide-react';
import type { Message, Room } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';
import { MessageItem } from './MessageItem';
import { HuddleMessage } from './HuddleMessage';

export interface MessageListProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onOpenThread: (message: Message) => void;
  usersCache?: Map<string, UserInfo>;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
  onPinMessage?: (message: Message) => void;
  onUnpinMessage?: (message: Message) => void;
  onAddReaction?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  lastSeenMessageId?: string | null;
}

// Unread divider component
function UnreadDivider() {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-red-500/50" />
      <span className="text-xs font-medium text-red-500 uppercase tracking-wide">Mới</span>
      <div className="flex-1 h-px bg-red-500/50" />
    </div>
  );
}

export function MessageList({
  room,
  messages,
  currentUserId,
  onOpenThread,
  usersCache,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  onAddReaction,
  onToggleReaction,
  lastSeenMessageId,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter out thread replies for main view
  const mainMessages = messages.filter(msg => !msg.threadId);

  if (mainMessages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-4 vertical-scrollbar scrollbar-sm">
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
            {room?.type === 'dm' ? null : (room?.isPrivate ? <Lock size={24} className="text-custom-text-300" /> : <Hash size={24} className="text-custom-text-300" />)}
          </div>
          <h3 className="font-semibold text-custom-text-100 mb-1">
            {room?.type === 'channel' ? `Chào mừng đến #${room.name}` : 'Bắt đầu cuộc trò chuyện'}
          </h3>
          <p className="text-sm text-custom-text-300 max-w-xs">
            {room?.type === 'channel'
              ? 'Đây là khởi đầu của kênh. Gửi tin nhắn để bắt đầu!'
              : 'Gửi tin nhắn để bắt đầu cuộc trò chuyện.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Find the index after which to show the unread divider
  // The divider should appear after the last seen message
  // Only show divider if lastSeenMessageId exists and there are newer messages after it
  let unreadDividerIndex = -2; // -2 means no divider
  let hasUnreadMessages = false;

  if (lastSeenMessageId) {
    unreadDividerIndex = mainMessages.findIndex(msg => msg.id === lastSeenMessageId);
    // Only show divider if lastSeenMessage exists in the list and there are messages after it
    hasUnreadMessages = unreadDividerIndex !== -1 && unreadDividerIndex < mainMessages.length - 1;
  }
  // Note: If lastSeenMessageId is null (user never read any messages), we don't show the divider
  // This prevents showing "New" for all historical messages when a user first joins a room

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5 py-4 vertical-scrollbar scrollbar-sm">
      <div className="space-y-0.5">
        {mainMessages.map((msg, index) => {
          // Check if we should show the unread divider before this message
          const showUnreadDivider = hasUnreadMessages && index === unreadDividerIndex + 1;

          // Render huddle messages with special component
          if (msg.type === 'huddle_started' || msg.type === 'huddle_ended') {
            return (
              <div key={msg.id}>
                {showUnreadDivider && <UnreadDivider />}
                <HuddleMessage
                  message={msg}
                  currentUserId={currentUserId}
                />
              </div>
            );
          }

          const userInfo = usersCache?.get(msg.userId);
          return (
            <div key={msg.id}>
              {showUnreadDivider && <UnreadDivider />}
              <MessageItem
                message={msg}
                isOwn={msg.userId === currentUserId}
                onOpenThread={onOpenThread}
                senderName={userInfo?.displayName}
                senderAvatarUrl={userInfo?.avatarUrl}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onPin={onPinMessage}
                onUnpin={onUnpinMessage}
                onAddReaction={onAddReaction}
                onToggleReaction={onToggleReaction}
                usersCache={usersCache}
                roomId={room?.id}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
