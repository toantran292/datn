import { MessageSquare } from 'lucide-react';
import type { Message } from '../../types';

export interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onOpenThread: (message: Message) => void;
  senderName?: string;
  senderAvatarUrl?: string | null;
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

export function MessageItem({ message, isOwn, isHovered, onHover, onOpenThread, senderName, senderAvatarUrl }: MessageItemProps) {
  const displayName = senderName || (isOwn ? 'You' : `User ${message.userId.slice(0, 6)}`);
  const timestamp = new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`
        group relative flex gap-3 px-5 py-1.5 -mx-5
        hover:bg-custom-background-90 transition-colors
      `}
      onMouseEnter={() => onHover(message.id)}
      onMouseLeave={() => onHover(null)}
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
        {/* Header: Name + Timestamp */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-custom-text-100 text-[15px]">
            {displayName}
          </span>
          <span className="text-xs text-custom-text-400">
            {timestamp}
          </span>
        </div>

        {/* Message text */}
        <div className="text-custom-text-100 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Thread reply count */}
        {message.replyCount != null && message.replyCount > 0 && (
          <button
            onClick={() => onOpenThread(message)}
            className="mt-1 flex items-center gap-1.5 text-custom-primary-100 text-xs font-medium hover:underline"
          >
            <MessageSquare size={14} />
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Hover actions */}
      {isHovered && (
        <div className="absolute top-0 right-5 -translate-y-1/2 flex items-center gap-0.5 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-sm px-1 py-0.5">
          <button
            onClick={() => onOpenThread(message)}
            className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
