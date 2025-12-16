import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import type { Message } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';

interface ThreadViewProps {
  parentMessage: Message;
  threadMessages: Message[];
  currentUserId: string;
  onSendReply: (content: string) => void;
  onClose: () => void;
  onLoadThread: (messageId: string) => void;
  usersCache?: Map<string, UserInfo>;
}

// Avatar component with image support
function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const getAvatarColor = (str: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
    ];
    const index = str.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-lg flex-shrink-0 object-cover`}
      />
    );
  }

  return (
    <div className={`
      ${sizeClasses[size]} ${getAvatarColor(name)}
      rounded-lg flex-shrink-0 flex items-center justify-center text-white font-semibold
    `}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ThreadView({
  parentMessage,
  threadMessages,
  currentUserId,
  onSendReply,
  onLoadThread,
  usersCache,
}: ThreadViewProps) {
  const [replyInput, setReplyInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  useEffect(() => {
    if (parentMessage) {
      onLoadThread(parentMessage.id);
    }
  }, [parentMessage.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onSendReply(replyInput);
    setReplyInput('');
    inputRef.current?.focus();
  };

  const renderMessage = (msg: Message, isParent = false) => {
    const userInfo = usersCache?.get(msg.userId);
    const senderName = userInfo?.displayName || `User ${msg.userId.slice(0, 6)}`;
    const avatarUrl = userInfo?.avatarUrl;
    const timestamp = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div
        key={msg.id}
        className={`
          flex gap-3 p-3 rounded-lg
          ${isParent ? 'bg-custom-background-90 border-l-4 border-custom-primary-100' : 'hover:bg-custom-background-90'}
        `}
      >
        <Avatar name={senderName} avatarUrl={avatarUrl} size={isParent ? 'md' : 'sm'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-custom-text-100 text-sm">
              {senderName}
            </span>
            <span className="text-xs text-custom-text-400">
              {timestamp}
            </span>
          </div>
          <div className="text-custom-text-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-custom-background-100">
      {/* Thread Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300">
          <MessageSquare size={14} />
          <span>
            {threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 vertical-scrollbar scrollbar-sm">
        {/* Parent Message */}
        {renderMessage(parentMessage, true)}

        {/* Replies */}
        <div className="ml-4 space-y-1">
          {threadMessages.length === 0 ? (
            <p className="text-custom-text-400 text-sm text-center py-6">
              No replies yet. Be the first to reply!
            </p>
          ) : (
            threadMessages.map((msg) => renderMessage(msg))
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="p-3 border-t border-custom-border-200">
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            ref={inputRef}
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            placeholder="Reply in thread..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-custom-background-100 border border-custom-border-200 rounded-lg
                       focus:outline-none focus:border-custom-primary-100 focus:ring-1 focus:ring-custom-primary-100/20
                       text-custom-text-100 placeholder:text-custom-text-400 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!replyInput.trim()}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${replyInput.trim()
                  ? 'bg-custom-primary-100 text-white hover:bg-custom-primary-200'
                  : 'bg-custom-background-80 text-custom-text-400 cursor-not-allowed'
                }
              `}
            >
              <Send size={14} />
              Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
