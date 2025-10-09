import "@/app/globals.css";
import type { ReactNode } from "react";


export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-svh w-svw grid grid-cols-[64px_280px_1fr_380px] grid-rows-[auto_1fr] bg-background text-foreground">
      {/* Workspaces rail */}
      <aside className="row-span-2 col-start-1 bg-zinc-900 text-zinc-100 flex flex-col items-center py-3"/>


      {/* Channel list rail */}
      <aside className="row-span-2 col-start-2 border-r bg-card"/>


      {/* Top bar for main chat */}
      <header className="col-start-3 h-12 border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 flex items-center px-3"/>


      {/* Main chat area (messages + composer) */}
      <main className="col-start-3 overflow-hidden">{children}</main>


      {/* Thread pane */}
      <aside className="row-span-2 col-start-4 border-l bg-card hidden lg:block"/>
    </div>
  );
}