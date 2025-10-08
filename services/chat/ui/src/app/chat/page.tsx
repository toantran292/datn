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
import { listMessages, joinRoomById, type MessageDTO } from "@/lib/api";
import type { Message } from "./types/chat";

const mapMessage = (m: MessageDTO): Message => ({
  id: m.id,
  roomId: m.roomId,
  userId: m.userId,
  text: m.content,
  at: new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
});

export default function Page() {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showRight, setShowRight] = useState(true);

  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState<string | undefined>(undefined);

  const { messagesByRoom, joinRoom, leaveRoom, sendMessage, connected, currentUserId } = useChatSocket();
  const [historyByRoom, setHistoryByRoom] = useState<Record<string, Message[]>>({});
  const [pagingStateByRoom, setPagingStateByRoom] = useState<Record<string, string | undefined>>({});
  const [loadingRoom, setLoadingRoom] = useState<string | null>(null);

  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [joining, setJoining] = useState(false);

  const joinRoomManually = async () => {
    if (!joinRoomInput.trim()) return;
    try {
      setJoining(true);
      await joinRoomById(joinRoomInput.trim());
      setRoomId(joinRoomInput.trim());
      setJoinRoomInput("");
    } catch (err) {
      alert((err as Error).message ?? "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { handleMouseDown } = useDragSidebar({
    containerRef,
    onWidthChange: setSidebarWidth,
    min: 200,
    rightPadding: 360,
  });


  const activeMsgs = roomId ? [...(historyByRoom[roomId] || []), ...(messagesByRoom[roomId] || [])] : [];

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

    // fetch initial history
    setLoadingRoom(roomId);
    listMessages({ roomId, pageSize: 50 })
      .then((r) => {
        setHistoryByRoom((prev) => ({ ...prev, [roomId]: r.items.map(mapMessage) }));
        setPagingStateByRoom((prev) => ({ ...prev, [roomId]: r.pageState }));
      })
      .catch(console.error)
      .finally(() => setLoadingRoom(null));

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
          <div className="flex flex-1 flex-col min-w-0 min-h-0 gap-2">
            {header}

            <div className="px-4 pt-2">
              <div className="flex gap-2">
                <input
                  value={joinRoomInput}
                  onChange={(e) => setJoinRoomInput(e.target.value)}
                  placeholder="Join room by ID"
                  className="flex-1 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-500/30"
                />
                <button
                  onClick={joinRoomManually}
                  disabled={joining || !joinRoomInput.trim()}
                  className="rounded-lg bg-zinc-200 dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-60"
                >
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </div>

            <MessageList listRef={listRef} msgs={activeMsgs} loading={loadingRoom === roomId} currentUserId={currentUserId} onLoadMore={() => {
              const paging = pagingStateByRoom[roomId ?? ""];
              if (!roomId || !paging) return;
              listMessages({ roomId, pageState: paging, pageSize: 50 })
                .then((r) => {
                  setHistoryByRoom((prev) => ({
                    ...prev,
                    [roomId]: [...(prev[roomId] || []), ...r.items.map(mapMessage)],
                  }));
                  setPagingStateByRoom((prev) => ({ ...prev, [roomId]: r.pageState }));
                })
                .catch(console.error);
            }} />

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