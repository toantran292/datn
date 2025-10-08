// MessageList.tsx
import React from "react";
import MessageItem from "./MessageItem";
import EmptyState from "./EmptyState";
import type { Message } from "../../types/chat";

type ScrollRef =
  | React.RefObject<HTMLDivElement>
  | React.MutableRefObject<HTMLDivElement | null>;

export default function MessageList({
  listRef,
  msgs,
}: {
  listRef: ScrollRef;
  msgs: Message[];
}) {
  return (
    <div ref={listRef as any} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {msgs.length === 0 ? (
        <EmptyState />
      ) : (
        msgs.map((m) => (
          <MessageItem key={m.id} author={m.author} time={m.at} text={m.text} />
        ))
      )}
    </div>
  );
}
