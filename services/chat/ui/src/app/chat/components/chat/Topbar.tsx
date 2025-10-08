import React from "react";


export default function Topbar() {
  return (
    <div className="h-10 border-b border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600" />
        <span className="font-semibold">My Workspace</span>
        <span className="text-xs text-zinc-500">•</span>
        <span className="text-xs text-zinc-500">Chat UI</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">Ctrl</kbd>
        <span className="text-xs">+</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">K</kbd>
      </div>
    </div>
  );
}