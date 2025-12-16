import type { Reaction } from '../../types';

export interface MessageReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
}

export function MessageReactions({ reactions, onToggleReaction }: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggleReaction(reaction.emoji)}
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
            border transition-colors
            ${reaction.hasReacted
              ? 'bg-custom-primary-100/10 border-custom-primary-100/30 text-custom-primary-100'
              : 'bg-custom-background-80 border-custom-border-200 text-custom-text-200 hover:bg-custom-background-90'
            }
          `}
          title={reaction.users.map(u => u.displayName || u.userId).join(', ')}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
