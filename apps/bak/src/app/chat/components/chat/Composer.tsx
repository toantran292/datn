import React from "react";
import { IconPlus, IconAt, IconSmile, IconPaperclip, IconLightning } from "../icons";


type Props = {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  canSend: boolean;
};


export default function Composer({ placeholder, value, onChange, onSend, onKeyDown, canSend }: Props) {
  return (
    <div className="border-t border-zinc-200/70 dark:border-zinc-800 p-3">
      <div className="rounded-2xl border border-zinc-300 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/60">
        <div className="px-3 py-2">
<textarea
  value={value}
  onChange={(e) => onChange(e.target.value)}
  onKeyDown={onKeyDown}
  placeholder={`Message #${placeholder}`}
  rows={1}
  className="w-full resize-none bg-transparent outline-none text-sm leading-6 placeholder:text-zinc-400"
/>
        </div>
        <div className="flex items-center justify-between px-2 py-1 border-t border-zinc-200/70 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <IconPlus />
            <IconAt />
            <IconSmile />
            <IconPaperclip />
            <IconLightning />
          </div>
          <button
            onClick={onSend}
            disabled={!canSend}
            className={`px-3 py-1.5 text-sm rounded-md font-medium ${
              canSend
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">Press Enter to send • Shift+Enter for new line</p>
    </div>
  );
}