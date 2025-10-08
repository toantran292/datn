import React from "react";

export default function MessageItem({
  userId,
  time,
  text,
  isOwn,
}: {
  userId: string;
  time: string;
  text: string;
  isOwn?: boolean;
}) {
  const displayName = userId?.slice(0, 8) || "Unknown";

  return (
    <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">
        {displayName}
      </span>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${isOwn ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800"
          }`}
      >
        {text}
      </div>
      <span className="text-[10px] text-zinc-400">{time}</span>
    </div>
  );
}