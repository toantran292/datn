import React from "react";


export default function MessageItem({
                                      author,
                                      time,
                                      text,
                                    }: {
  author: string;
  time: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-md bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 shrink-0" />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{author}</span>
          <span className="text-[11px] text-zinc-500">{time}</span>
        </div>
        <div className="text-sm whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  );
}