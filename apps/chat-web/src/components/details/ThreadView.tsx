import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Message } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';
import { MessageItem } from '../chat/MessageItem';
import { MessageComposer } from '../chat/MessageComposer';

interface ThreadViewProps {
  parentMessage: Message;
  threadMessages: Message[];
  currentUserId: string;
  onSendReply: (content: string, mentionedUserIds?: string[]) => void;
  onClose: () => void;
  onLoadThread: (messageId: string) => void;
  usersCache?: Map<string, UserInfo>;
  // Message actions
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
  onPinMessage?: (message: Message) => void;
  onUnpinMessage?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  roomId?: string; // For AI features like document summary
}

export function ThreadView({
  parentMessage,
  threadMessages,
  currentUserId,
  onSendReply,
  onLoadThread,
  usersCache,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  onToggleReaction,
  roomId,
}: ThreadViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  useEffect(() => {
    if (parentMessage) {
      onLoadThread(parentMessage.id);
    }
  }, [parentMessage.id]);

  const parentUserInfo = usersCache?.get(parentMessage.userId);

  return (
    <div className="flex flex-col h-full bg-custom-background-100">
      {/* Thread Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300">
          <MessageSquare size={14} />
          <span>
            {threadMessages.length} phản hồi
          </span>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 vertical-scrollbar scrollbar-sm">
        {/* Parent Message - highlighted */}
        <div className="border-l-4 border-custom-primary-100 bg-custom-background-90/50 rounded-r-lg -mx-3 px-3">
          <MessageItem
            message={parentMessage}
            isOwn={parentMessage.userId === currentUserId}
            onOpenThread={() => {}} // Already in thread view
            senderName={parentUserInfo?.displayName}
            senderAvatarUrl={parentUserInfo?.avatarUrl}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onPin={onPinMessage}
            onUnpin={onUnpinMessage}
            onToggleReaction={onToggleReaction}
            hideThreadAction // Hide "Reply in thread" - already in thread
            hideReplyCount // Hide reply count - already in thread
            usersCache={usersCache}
            roomId={roomId}
          />
        </div>

        {/* Replies */}
        <div className="ml-4 space-y-0.5">
          {threadMessages.length === 0 ? (
            <p className="text-custom-text-400 text-sm text-center py-6">
              Chưa có phản hồi. Hãy là người đầu tiên phản hồi!
            </p>
          ) : (
            threadMessages.map((msg) => {
              const userInfo = usersCache?.get(msg.userId);
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={msg.userId === currentUserId}
                  onOpenThread={() => {}} // Thread replies don't have nested threads
                  senderName={userInfo?.displayName}
                  senderAvatarUrl={userInfo?.avatarUrl}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  onPin={onPinMessage}
                  onUnpin={onUnpinMessage}
                  onToggleReaction={onToggleReaction}
                  hideThreadAction // Hide "Reply in thread" - already in thread
                  hideReplyCount // Hide reply count - replies don't have nested threads
                  usersCache={usersCache}
                  roomId={roomId}
                />
              );
            })
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input - using MessageComposer for mention support */}
      <div className="border-t border-custom-border-200">
        <MessageComposer
          room={null}
          onSendMessage={onSendReply}
          placeholder="Phản hồi trong thread..."
          members={usersCache}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
