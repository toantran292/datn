import React from "react";


type Props = { onClose?: () => void };


export default function RightPanel({ onClose }: Props) {
  return (
    <aside className="hidden md:flex flex-col border-l border-zinc-200/70 dark:border-zinc-800 min-w-0">
      <div className="h-12 px-4 border-b border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between">
        <span className="font-semibold">About #general</span>
        <button
          className="rounded-md px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Topic</div>
          <div className="text-sm">Team chat and quick updates.</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Members</div>
          <ul className="mt-1 text-sm space-y-1">
            <li>• Alice</li>
            <li>• Bob</li>
            <li>• You</li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Pinned</div>
          <div className="text-sm text-zinc-500">No pinned items yet.</div>
        </div>
      </div>
    </aside>
  );
}