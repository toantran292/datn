import React from "react";
import { IconSearch } from "../icons";


type Props = { title: string; onToggleRight?: () => void };


export default function ChannelHeader({ title, onToggleRight }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800 px-4 h-12">
      <div className="flex items-center gap-2 truncate">
        <span className="text-xl">#</span>
        <h1 className="font-semibold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <IconSearch />
        <button
          className="rounded-md px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={onToggleRight}
          title="Toggle details"
        >
          Details
        </button>
      </div>
    </div>
  );
}