"use client";

import { useEffect, useState } from "react";
import { listRooms, type Room, createRoom } from "@/lib/api";
import { useChatSocket } from "../../hooks/useChatSocket";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="px-2 text-[11px] uppercase tracking-wide text-zinc-500 mb-1.5">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  name, active, dot, onClick,
}: { name: string; active?: boolean; dot?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2",
        active
          ? "bg-indigo-600 text-white"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-100",
      ].join(" ")}
    >
      {dot && <span className="size-2 rounded-full bg-emerald-500" />}
      <span className="truncate text-sm">{name}</span>
    </button>
  );
}

export default function Sidebar({
  currentRoomId,
  onOpenRoom,
}: {
  currentRoomId?: string;
  onOpenRoom: (roomId: string) => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { summaries, joinRoom, joinedRooms, rooms: socketRooms } = useChatSocket((room) => {
    if (!room?.id) return;
    setRooms((prev) => {
      if (prev.some((r) => r.id === room.id)) return prev;
      return [{
        id: room.id,
        org_id: room.orgId,
        is_private: room.isPrivate,
        name: room.name ?? null,
      }, ...prev];
    });
  });

  // create-room state
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listRooms()
      .then((result: any) => {
        const items = Array.isArray(result) ? result : result.items;
        setRooms(items || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socketRooms?.length) return;
    setRooms((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      for (const room of socketRooms) {
        map.set(room.id, {
          id: room.id,
          org_id: room.orgId,
          is_private: room.isPrivate,
          name: room.name ?? null,
        });
      }
      return Array.from(map.values());
    });
  }, [socketRooms]);

  // Auto-join khi currentRoomId thay đổi (reload hoặc mở từ URL)
  useEffect(() => {
    if (currentRoomId) joinRoom(currentRoomId);
  }, [currentRoomId, joinRoom]);

  async function onCreate() {
    try {
      setCreating(true);
      const payload: { is_private: boolean; name?: string } = {
        is_private: isPrivate,
      };
      if (name.trim()) payload.name = name.trim();
      const room = await createRoom(payload);
      setRooms(prev => [room, ...prev]);
      setName("");
      setIsPrivate(false);
      // mở & join luôn phòng mới tạo (tuỳ bạn)
      onOpenRoom(room.id);
      joinRoom(room.id);
    } catch (e: any) {
      alert(e.message ?? "Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="p-3 space-y-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New channel name"
              className="flex-1 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-500/30"
            />
            <label className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                className="accent-indigo-500"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Private
            </label>
          </div>
          <button
            onClick={onCreate}
            disabled={creating || (!name.trim() && !isPrivate)}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400/60"
          >
            {creating ? "Creating…" : "Create channel"}
          </button>
        </div>
      </div>

      <nav className="px-2 pb-2 overflow-y-auto">
        <Section title="Channels">
          {rooms.map((r) => {
            const sum = summaries[r.id];
            const label = `# ${r.name ?? r.id.slice(0, 6)}`;
            const alreadyJoined = joinedRooms?.includes?.(r.id);
            return (
              <SidebarItem
                key={r.id}
                name={label}
                active={currentRoomId === r.id}
                dot={!!sum?.lastMessage}
                onClick={() => {
                  onOpenRoom(r.id);
                  joinRoom(r.id); // <-- join room khi click
                }}
              />
            );
          })}
        </Section>
      </nav>
    </>
  );
}
