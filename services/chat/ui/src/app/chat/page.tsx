"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "./components/chat/Topbar";
import Sidebar from "./components/chat/Sidebar";
import ChannelHeader from "./components/chat/ChannelHeader";
import MessageList from "./components/chat/MessageList";
import Composer from "./components/chat/Composer";
import { useDragSidebar } from "./hooks/useDragSidebar";
import RightPanel from "./components/chat/RightPanel";
import { useChatSocket } from "./hooks/useChatSocket";

export default function Page() {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showRight, setShowRight] = useState(true);

  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState<string | undefined>(undefined);

  const { messagesByRoom, joinRoom, leaveRoom, sendMessage, connected } = useChatSocket();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { handleMouseDown } = useDragSidebar({
    containerRef,
    onWidthChange: setSidebarWidth,
    min: 200,
    rightPadding: 360,
  });


  const activeMsgs = roomId ? messagesByRoom[roomId] || [] : [];

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [activeMsgs]);


  const canSend = input.trim().length > 0;


  const onSend = () => {
    if (!canSend || !roomId) return;

    sendMessage({ roomId, content: input });
    setInput("");
  };


  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  const header = useMemo(
    () => (
      <ChannelHeader
        title={roomId ? `#${roomId.slice(0, 8)}` : "#general"}
        onToggleRight={() => setShowRight((s) => !s)}
      />
    ),
    [roomId],
  );

  useEffect(() => {
    if (!roomId) return;
    joinRoom(roomId);
    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <Topbar />

      <div className="flex h-[calc(100vh-40px)]">
        <aside
          style={{ width: sidebarWidth }}
          className="shrink-0 border-r border-zinc-200/70 dark:border-zinc-800 flex flex-col"
        >
          <Sidebar currentRoomId={roomId}
            onOpenRoom={(id) => setRoomId(id)} />
        </aside>

        <div onMouseDown={handleMouseDown} className="w-1 cursor-col-resize hover:bg-indigo-500/30" title="Drag to resize" />

        <div className="flex-1 grid" style={{ gridTemplateColumns: showRight ? "1fr 320px" : "1fr" }}>
          <div className="flex flex-col min-w-0">
            {header}

            <MessageList listRef={listRef} msgs={activeMsgs} />

            <Composer
              placeholder={roomId ? roomId.slice(0, 8) : "general"}
              value={input}
              onChange={setInput}
              onSend={onSend}
              onKeyDown={handleKey}
              canSend={canSend && !!roomId && connected}
            />
          </div>

          {showRight && <RightPanel onClose={() => setShowRight(false)} />}
        </div>
      </div>
    </div>
  );
}