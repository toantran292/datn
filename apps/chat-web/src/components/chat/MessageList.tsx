import { useRef, useEffect, useCallback } from 'react';
import { Hash, Lock, Loader2 } from 'lucide-react';
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
  huddleParticipantCount?: number;  // Real-time participant count for active huddle
  // Infinite scroll props
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
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
  huddleParticipantCount,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
    }
  }, [messages]);

  // Reset initial load flag when room changes
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [room?.id]);

  // Handle scroll to load more (newer) messages when scrolling down
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onLoadMore || !hasMore || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Load more when scrolled near the bottom (within 100px) - to load newer messages
    if (scrollHeight - scrollTop - clientHeight < 100) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Filter out thread replies for main view
  const mainMessages = messages.filter(msg => !msg.threadId);

  if (mainMessages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 vertical-scrollbar scrollbar-sm">
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
            {room?.type === 'dm' ? null : (room?.isPrivate ? <Lock size={24} className="text-custom-text-300" /> : <Hash size={24} className="text-custom-text-300" />)}
          </div>
          <h3 className="font-semibold text-custom-text-100 mb-1">
            {room?.type === 'channel' ? `Welcome to #${room.name}` : 'Start a conversation'}
          </h3>
          <p className="text-sm text-custom-text-300 max-w-xs">
            {room?.type === 'channel'
              ? 'This is the beginning of the channel. Send a message to get started!'
              : 'Send a message to start the conversation.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto px-5 py-4 vertical-scrollbar scrollbar-sm"
      onScroll={handleScroll}
    >
      <div className="space-y-0.5">
        {mainMessages.map((msg) => {
          // Render huddle messages with special component
          if (msg.type === 'huddle_started' || msg.type === 'huddle_ended') {
            return (
              <HuddleMessage
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
                liveParticipantCount={msg.type === 'huddle_started' ? huddleParticipantCount : undefined}
                onOpenThread={onOpenThread}
                onToggleReaction={onToggleReaction}
              />
            );
          }

          const userInfo = usersCache?.get(msg.userId);
          return (
            <MessageItem
              key={msg.id}
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
          );
        })}

        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-custom-text-300" />
            <span className="ml-2 text-sm text-custom-text-300">Loading more messages...</span>
          </div>
        )}

        {/* Show "Load more" button if there are more messages */}
        {hasMore && !isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <button
              onClick={onLoadMore}
              className="text-sm text-custom-primary-100 hover:text-custom-primary-200 font-medium"
            >
              Load more messages
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
