import { Headphones } from 'lucide-react';
import type { Message } from '../../types';

interface HuddleMessageProps {
  message: Message;
  currentUserId: string;
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

export function HuddleMessage({ message, currentUserId }: HuddleMessageProps) {
  const isOwn = message.userId === currentUserId;
  const isStarted = message.type === 'huddle_started';
  const timestamp = new Date(message.sentAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const duration = message.metadata?.duration ?? 0;
  const participantCount = message.metadata?.participantCount ?? 1;

  return (
    <div
      id={`message-${message.id}`}
      className="px-5 py-3 -mx-5"
    >
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
                {isStarted
                  ? isOwn
                    ? 'Bạn đã tham gia cuộc họp'
                    : 'Cuộc họp đã bắt đầu'
                  : 'Đã có cuộc họp'}
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
                <>
                  Bạn là người duy nhất ở đây. Tận hưởng sự yên tĩnh, hoặc{' '}
                  <button className="text-teal-600 dark:text-teal-400 hover:underline">
                    mời ai đó
                  </button>
                  .
                </>
              ) : (
                <>
                  {participantCount === 1
                    ? 'Bạn đã ở trong cuộc họp một mình'
                    : `${participantCount} người đã trong cuộc họp`}{' '}
                  trong {formatDuration(duration)}.
                  {duration < 60 && ' Một phiên thiền ngắn '}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
