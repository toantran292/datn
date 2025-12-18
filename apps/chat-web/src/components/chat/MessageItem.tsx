import { useState, useMemo } from 'react';
import { MessageSquare, Pin } from 'lucide-react';
import type { Message } from '../../types';
import { MessageActions } from './MessageActions';
import { MessageReactions } from './MessageReactions';
import { AttachmentList } from './FileAttachment';
import type { UserInfo } from '../../contexts/ChatContext';

// Process message content to render mentions as styled spans
function processMessageContent(html: string, usersCache?: Map<string, UserInfo>): string {
  if (!html.includes('mention-component')) return html;

  // Replace <mention-component entity_identifier="userId" entity_name="user_mention"></mention-component>
  // with styled span
  return html.replace(
    /<mention-component[^>]*entity_identifier="([^"]*)"[^>]*entity_name="user_mention"[^>]*>(?:<\/mention-component>)?/gi,
    (_match, userId) => {
      const user = usersCache?.get(userId);
      const displayName = user?.displayName || `User ${userId.slice(0, 6)}`;
      return `<span class="inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 font-medium">@${displayName}</span>`;
    }
  );
}

export interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onOpenThread: (message: Message) => void;
  senderName?: string;
  senderAvatarUrl?: string | null;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onPin?: (message: Message) => void;
  onUnpin?: (message: Message) => void;
  onAddReaction?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  hideThreadAction?: boolean; // Hide "Reply in thread" button (e.g., when in thread view)
  hideReplyCount?: boolean; // Hide reply count (e.g., when in thread view)
  usersCache?: Map<string, UserInfo>; // For rendering @mentions with display names
  roomId?: string; // For AI features like document summary
}

// Generate avatar color based on name
function getAvatarColor(str: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
    'bg-amber-500', 'bg-cyan-500'
  ];
  const index = str.charCodeAt(0) % colors.length;
  return colors[index];
}

export function MessageItem({
  message,
  isOwn,
  onOpenThread,
  senderName,
  senderAvatarUrl,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onAddReaction,
  onToggleReaction,
  hideThreadAction,
  hideReplyCount,
  usersCache,
  roomId,
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayName = senderName || (isOwn ? 'You' : `User ${message.userId.slice(0, 6)}`);

  // Process message content to render mentions
  const processedContent = useMemo(
    () => processMessageContent(message.content, usersCache),
    [message.content, usersCache]
  );
  const timestamp = new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;
  const isPinned = !!message.isPinned;

  // Don't render deleted messages with full content
  if (isDeleted) {
    return (
      <div className="group relative flex gap-3 px-5 py-1.5 -mx-5 opacity-60">
        {/* Avatar placeholder */}
        <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-custom-background-80" />

        {/* Deleted message indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-custom-text-300 text-[15px]">
              {displayName}
            </span>
            <span className="text-xs text-custom-text-400">
              {timestamp}
            </span>
          </div>
          <div className="text-custom-text-400 text-[15px] italic">
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`
        group relative flex gap-3 px-5 py-1.5 -mx-5
        hover:bg-custom-background-90 transition-colors
        ${isPinned ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {senderAvatarUrl ? (
        <img
          src={senderAvatarUrl}
          alt={displayName}
          className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
        />
      ) : (
        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(displayName)}`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header: Name + Timestamp + Indicators */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-custom-text-100 text-[15px]">
            {displayName}
          </span>
          <span className="text-xs text-custom-text-400">
            {timestamp}
          </span>
          {isEdited && (
            <span className="text-xs text-custom-text-400">(đã sửa)</span>
          )}
          {isPinned && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <Pin size={12} />
              Đã ghim
            </span>
          )}
        </div>

        {/* Message text - render as HTML for rich text support */}
        <div
          className="prose prose-sm max-w-none text-custom-text-100 text-[15px] leading-relaxed break-words
            prose-p:my-0 prose-p:leading-relaxed
            prose-strong:text-custom-text-100 prose-strong:font-semibold
            prose-em:text-custom-text-100
            prose-ul:my-1 prose-ul:pl-4 prose-ol:my-1 prose-ol:pl-4
            prose-li:my-0.5
            prose-blockquote:my-1 prose-blockquote:pl-3 prose-blockquote:border-l-2 prose-blockquote:border-custom-border-300 prose-blockquote:text-custom-text-200 prose-blockquote:not-italic
            prose-code:bg-custom-background-80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:text-custom-text-200 prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-custom-background-80 prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-1
            prose-a:text-custom-primary-100 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentList attachments={message.attachments} roomId={roomId} />
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && onToggleReaction && (
          <MessageReactions
            reactions={message.reactions}
            onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
          />
        )}

        {/* Thread reply count - hidden when in thread view */}
        {!hideReplyCount && message.replyCount != null && message.replyCount > 0 && (
          <button
            onClick={() => onOpenThread(message)}
            className="mt-1 flex items-center gap-1.5 text-custom-primary-100 text-xs font-medium hover:underline"
          >
            <MessageSquare size={14} />
            {message.replyCount} phản hồi
          </button>
        )}
      </div>

      {/* Actions toolbar - show on hover */}
      {isHovered && (
        <MessageActions
          message={message}
          isOwn={isOwn}
          onOpenThread={onOpenThread}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
          onUnpin={onUnpin}
          onToggleReaction={onToggleReaction}
          onClose={() => setIsHovered(false)}
          hideThreadAction={hideThreadAction}
        />
      )}
    </div>
  );
}
