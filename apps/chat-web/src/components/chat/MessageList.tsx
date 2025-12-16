import { useRef, useEffect } from 'react';
import { Hash, Lock } from 'lucide-react';
import type { Message, Room } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';
import { MessageItem } from './MessageItem';

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
    <div className="flex-1 overflow-y-auto px-5 py-4 vertical-scrollbar scrollbar-sm">
      <div className="space-y-0.5">
        {mainMessages.map((msg) => {
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
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
