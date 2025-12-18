import { useState } from 'react';
import { Headphones, MessageSquare } from 'lucide-react';
import type { Message } from '../../types';
import { MessageActions } from './MessageActions';

interface HuddleMessageProps {
  message: Message;
  currentUserId: string;
  liveParticipantCount?: number;  // Real-time participant count from WebSocket
  participantNames?: string[];    // Names of participants in the huddle
  onOpenThread?: (message: Message) => void;  // Callback to open thread panel
  onToggleReaction?: (messageId: string, emoji: string) => void;  // Callback for reactions
}

// Format duration in seconds to human readable string
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function HuddleMessage({ message, currentUserId, liveParticipantCount, participantNames, onOpenThread, onToggleReaction }: HuddleMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isOwn = message.userId === currentUserId;
  const isStarted = message.type === 'huddle_started';
  const timestamp = new Date(message.sentAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const duration = message.metadata?.duration ?? 0;
  const participantCount = message.metadata?.participantCount ?? 1;

  // For active huddle, use live count; for ended huddle, use metadata count
  const displayParticipantCount = isStarted ? (liveParticipantCount ?? 1) : participantCount;

  // Generate subtitle for active huddle based on participant count
  const getActiveHuddleSubtitle = () => {
    if (displayParticipantCount <= 1) {
      return (
        <>
          Bạn là người duy nhất ở đây. Tận hưởng sự yên tĩnh, hoặc{' '}
          <button className="text-teal-600 dark:text-teal-400 hover:underline">
            mời ai đó
          </button>
          .
        </>
      );
    }

    // Show participant names if available, otherwise show count
    if (participantNames && participantNames.length > 0) {
      const otherNames = participantNames.slice(0, 3); // Show max 3 names
      const remaining = displayParticipantCount - otherNames.length;

      if (remaining > 0) {
        return `${otherNames.join(', ')} và ${remaining} người khác đã có mặt.`;
      }
      return `${otherNames.join(', ')} đã có mặt.`;
    }

    return `${displayParticipantCount} người đang trong cuộc họp.`;
  };

  // Generate title based on state
  const getTitle = () => {
    if (!isStarted) {
      return 'Đã có cuộc họp';
    }
    if (displayParticipantCount > 1) {
      return 'Cuộc họp đang diễn ra';
    }
    return isOwn ? 'Bạn đã tham gia cuộc họp' : 'Cuộc họp đã bắt đầu';
  };

  return (
    <div
      id={`message-${message.id}`}
      className="px-5 py-3 -mx-5 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover actions toolbar */}
      {isHovered && onOpenThread && (
        <MessageActions
          message={message}
          isOwn={isOwn}
          onOpenThread={onOpenThread}
          onToggleReaction={onToggleReaction}
          onClose={() => setIsHovered(false)}
        />
      )}

      <div className="bg-teal-50 dark:bg-[#1a2e2a] rounded-lg border-l-4 border-teal-500 p-4">
        <div className="flex items-start gap-3">
          {/* Headphones icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-600/30 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {getTitle()}
              </span>

              {/* LIVE badge for active huddle */}
              {isStarted && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white uppercase">
                  Trực tiếp
                </span>
              )}

              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{timestamp}</span>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isStarted ? (
                getActiveHuddleSubtitle()
              ) : (
                <>
                  {participantCount === 1
                    ? 'Bạn đã ở trong cuộc họp một mình'
                    : `${participantCount} người đã trong cuộc họp`}{' '}
                  trong {formatDuration(duration)}.
                  {duration < 60 && ' Một cuộc họp ngắn!'}
                </>
              )}
            </p>

            {/* Thread reply count */}
            {message.replyCount != null && message.replyCount > 0 && onOpenThread && (
              <button
                onClick={() => onOpenThread(message)}
                className="mt-2 flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-medium hover:underline"
              >
                <MessageSquare size={14} />
                {message.replyCount} phản hồi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
