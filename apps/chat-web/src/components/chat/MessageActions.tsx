import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Pencil, Trash2, Pin, MoreHorizontal, Smile } from 'lucide-react';
import type { Message } from '../../types';

// Common emoji set for quick reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export interface MessageActionsProps {
  message: Message;
  isOwn: boolean;
  onOpenThread: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onPin?: (message: Message) => void;
  onUnpin?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onClose?: () => void; // Close the entire action menu
  hideThreadAction?: boolean; // Hide "Reply in thread" button (e.g., when already in thread view)
}

export function MessageActions({
  message,
  isOwn,
  onOpenThread,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onToggleReaction,
  onClose,
  hideThreadAction,
}: MessageActionsProps) {
  const [showMore, setShowMore] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close emoji picker after 1 second
  useEffect(() => {
    if (showEmoji) {
      autoCloseTimerRef.current = setTimeout(() => {
        setShowEmoji(false);
      }, 1000);
    }
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [showEmoji]);

  const closeAllMenus = () => {
    setShowMore(false);
    setShowEmoji(false);
    // Also close the parent menu (MessageItem hover state)
    onClose?.();
  };

  const hasOpenMenu = showMore || showEmoji;

  const isPinned = message.isPinned;

  const handleEmojiSelect = (emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(message.id, emoji);
    }
    setShowEmoji(false);
  };

  return (
    <>
      {/* Transparent overlay to block hover on other messages and close menu on click */}
      {hasOpenMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeAllMenus}
        />
      )}

      <div className="absolute top-0 right-5 -translate-y-1/2 flex items-center gap-0.5 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-sm px-1 py-0.5 z-50">
        {/* Add Reaction */}
        {onToggleReaction && (
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
              title="Add reaction"
            >
              <Smile size={16} />
            </button>

            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-1 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg p-1.5 z-50">
                <div className="flex gap-0.5">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-custom-background-80 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reply in thread - hidden when already in thread view */}
        {!hideThreadAction && (
          <button
            onClick={() => onOpenThread(message)}
            className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare size={16} />
          </button>
        )}

        {/* More actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
            title="More actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMore && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg py-1 z-50">
              {/* Edit - only for own messages */}
              {isOwn && onEdit && (
                <button
                  onClick={() => {
                    onEdit(message);
                    setShowMore(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-custom-text-200 hover:bg-custom-background-80 flex items-center gap-2"
                >
                  <Pencil size={14} />
                  Edit message
                </button>
              )}

              {/* Pin/Unpin */}
              {isPinned ? (
                onUnpin && (
                  <button
                    onClick={() => {
                      onUnpin(message);
                      setShowMore(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-custom-text-200 hover:bg-custom-background-80 flex items-center gap-2"
                  >
                    <Pin size={14} />
                    Unpin message
                  </button>
                )
              ) : (
                onPin && (
                  <button
                    onClick={() => {
                      onPin(message);
                      setShowMore(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-custom-text-200 hover:bg-custom-background-80 flex items-center gap-2"
                  >
                    <Pin size={14} />
                    Pin message
                  </button>
                )
              )}

              {/* Delete - only for own messages */}
              {isOwn && onDelete && (
                <button
                  onClick={() => {
                    onDelete(message);
                    setShowMore(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-custom-background-80 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete message
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
