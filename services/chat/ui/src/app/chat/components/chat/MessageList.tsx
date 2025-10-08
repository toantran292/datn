import React from "react";
import MessageItem from "./MessageItem";
import EmptyState from "./EmptyState";
import type { Message } from "../../types/chat";

type ScrollRef = React.RefObject<HTMLDivElement | null>;

export default function MessageList({
  listRef,
  msgs,
  loading,
  onLoadMore,
  currentUserId,
}: {
  listRef: ScrollRef;
  msgs: Message[];
  loading?: boolean;
  onLoadMore?: () => void;
  currentUserId?: string;
}) {

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 pb-20 space-y-4">
      {loading && (
        <div className="flex justify-center">
          <button
            className="px-3 py-1 text-xs rounded-full border border-indigo-500 text-indigo-500"
            disabled
          >
            Loading history…
          </button>
        </div>
      )}
      {onLoadMore && !loading && msgs.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            className="px-3 py-1 text-xs rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Load older messages
          </button>
        </div>
      )}
      {msgs.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        msgs.map((m) => (
          <MessageItem
            key={m.id}
            userId={m.userId}
            time={m.at}
            text={m.text}
            isOwn={currentUserId ? m.userId === currentUserId : false}
          />
        ))
      )}
    </div>
  );
}
