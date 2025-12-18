import { useState, useEffect, useMemo } from 'react';
import { Pin, MessageSquare } from 'lucide-react';
import type { Message } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';

interface PinnedTabProps {
  roomId: string;
  currentUserId?: string;
  usersCache?: Map<string, UserInfo>;
  onLoadPinnedMessages?: () => Promise<Message[]>;
  onUnpinMessage?: (message: Message) => void;
  onScrollToMessage?: (messageId: string) => void;
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

// Process message content to render mentions as styled spans
function processMessageContent(html: string, usersCache?: Map<string, UserInfo>): string {
  if (!html.includes('mention-component')) return html;

  return html.replace(
    /<mention-component[^>]*entity_identifier="([^"]*)"[^>]*entity_name="user_mention"[^>]*>(?:<\/mention-component>)?/gi,
    (_match, userId) => {
      const user = usersCache?.get(userId);
      const displayName = user?.displayName || `User ${userId.slice(0, 6)}`;
      return `<span class="inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 font-medium">@${displayName}</span>`;
    }
  );
}

// Avatar component
function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-lg flex-shrink-0 object-cover"
      />
    );
  }

  return (
    <div className={`
      w-8 h-8 ${getAvatarColor(name)}
      rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold
    `}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function PinnedTab({
  roomId,
  currentUserId,
  usersCache,
  onLoadPinnedMessages,
  onUnpinMessage,
  onScrollToMessage,
}: PinnedTabProps) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPinnedMessages();
  }, [roomId]);

  const loadPinnedMessages = async () => {
    setLoading(true);
    try {
      if (onLoadPinnedMessages) {
        const data = await onLoadPinnedMessages();
        setPinnedMessages(data);
      }
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (message: Message) => {
    if (onUnpinMessage) {
      onUnpinMessage(message);
      // Optimistically remove from list
      setPinnedMessages(prev => prev.filter(m => m.id !== message.id));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
          <p className="text-sm text-custom-text-400">Đang tải tin nhắn đã ghim...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300">
          <Pin size={14} />
          <span>
            {pinnedMessages.length} tin nhắn đã ghim
          </span>
        </div>
      </div>

      {/* Pinned Messages List */}
      <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {pinnedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
              <Pin size={24} className="text-custom-text-300" />
            </div>
            <p className="text-sm font-medium text-custom-text-200 mb-1">Chưa có tin nhắn đã ghim</p>
            <p className="text-xs text-custom-text-400">
              Ghim các tin nhắn quan trọng để tìm kiếm dễ dàng
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {pinnedMessages.map((message) => (
              <PinnedMessageItem
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                usersCache={usersCache}
                onUnpin={() => handleUnpin(message)}
                onScrollToMessage={onScrollToMessage ? () => onScrollToMessage(message.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PinnedMessageItemProps {
  message: Message;
  currentUserId?: string;
  usersCache?: Map<string, UserInfo>;
  onUnpin: () => void;
  onScrollToMessage?: () => void;
}

function PinnedMessageItem({
  message,
  currentUserId,
  usersCache,
  onUnpin,
  onScrollToMessage,
}: PinnedMessageItemProps) {
  const user = usersCache?.get(message.userId);
  const displayName = user?.displayName || `User ${message.userId.slice(0, 6)}`;
  const isOwn = message.userId === currentUserId;

  const processedContent = useMemo(
    () => processMessageContent(message.content, usersCache),
    [message.content, usersCache]
  );

  const timestamp = new Date(message.sentAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-3 rounded-lg bg-custom-background-90 border border-custom-border-100 hover:border-custom-border-200 transition-colors group">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={displayName} avatarUrl={user?.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-custom-text-100 truncate">
            {displayName} {isOwn && <span className="text-custom-text-400">(bạn)</span>}
          </div>
          <div className="text-xs text-custom-text-400">
            {timestamp}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Pin size={12} className="text-amber-500" />
        </div>
      </div>

      {/* Message Content */}
      <div
        className="text-sm text-custom-text-200 line-clamp-3 prose prose-sm max-w-none
                   prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-custom-border-100">
        {onScrollToMessage && (
          <button
            onClick={onScrollToMessage}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 rounded transition-colors"
          >
            <MessageSquare size={12} />
            <span>Xem trong chat</span>
          </button>
        )}
        <button
          onClick={onUnpin}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-custom-text-300 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors ml-auto"
        >
          <Pin size={12} />
          <span>Bỏ ghim</span>
        </button>
      </div>
    </div>
  );
}
