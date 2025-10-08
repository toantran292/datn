// src/app/chat/hooks/useChatSocket.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Message } from "../types/chat";

export type ChatSummaries = Record<string, { lastMessage?: Message; updatedAt?: string } | undefined>;

export type RoomSummary = {
  id: string;
  orgId: string;
  name?: string | null;
  isPrivate: boolean;
};

const toMessage = (input: any): Message | null => {
  if (!input) return null;
  const at = input.sentAt
    ? new Date(input.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const userId = input.userId || input.user_id;
  if (!userId) return null;
  return {
    id: input.id,
    roomId: input.roomId,
    userId,
    text: input.content ?? input.text ?? "",
    at,
  };
};

export function useChatSocket(onRoomEvent?: (room: RoomSummary) => void) {
  const roomEventRef = useRef(onRoomEvent);
  roomEventRef.current = onRoomEvent;

  const [summaries, setSummaries] = useState<ChatSummaries>({});
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);

  const socketRef = useRef<Socket | null>(null);

  const WS_BASE = (process.env.NEXT_PUBLIC_CHAT_WS_BASE || "http://localhost:40500").replace(/\/+$/, "");

  useEffect(() => {
    const userId = localStorage.getItem("x-user-id") || "";
    const orgId = localStorage.getItem("x-org-id") || "";

    setCurrentUserId(userId || undefined);

    const s = io(`${WS_BASE}/chat`, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { "x-user-id": userId, "x-org-id": orgId },
    });

    const handleConnect = () => {
      console.log("[WS] connected", s.id);
      setConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log("[WS] disconnected:", reason);
      setConnected(false);
      setJoinedRooms([]);
      setMessagesByRoom({});
      setSummaries({});
    };

    const handleJoined = ({ roomId }: { roomId: string }) => {
      console.log("[WS] joined_room", roomId);
      setJoinedRooms((prev) => (prev.includes(roomId) ? prev : [...prev, roomId]));
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: [] }));
    };

    const handleLeft = ({ roomId }: { roomId: string }) => {
      setJoinedRooms((prev) => prev.filter((id) => id !== roomId));
      setMessagesByRoom((prev) => {
        const { [roomId]: _removed, ...rest } = prev;
        return rest;
      });
    };

    const handleRoomUpdated = (evt: { roomId: string; lastMessage?: any; updatedAt?: string }) => {
      const mapped = toMessage(evt.lastMessage);
      setSummaries((prev) => ({
        ...prev,
        [evt.roomId]: { lastMessage: mapped ?? prev[evt.roomId]?.lastMessage, updatedAt: evt.updatedAt },
      }));
    };

    const handleNewMessage = (message: any) => {
      const mapped = toMessage(message);
      if (!mapped) return;
      setMessagesByRoom((prev) => ({
        ...prev,
        [mapped.roomId]: [...(prev[mapped.roomId] || []), mapped],
      }));
    };

    const emitRoomEvent = (room: RoomSummary) => {
      roomEventRef.current?.(room);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("joined_room", handleJoined);
    s.on("left_room", handleLeft);
    s.on("room:updated", handleRoomUpdated);
    s.on("message:new", handleNewMessage);
    s.on("room:member_joined", emitRoomEvent);
    s.on("room:created", emitRoomEvent);
    s.on("rooms:bootstrap", (list: RoomSummary[] = []) => {
      setRooms(list);
    });

    socketRef.current = s;

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("joined_room", handleJoined);
      s.off("left_room", handleLeft);
      s.off("room:updated", handleRoomUpdated);
      s.off("message:new", handleNewMessage);
      s.off("room:member_joined", emitRoomEvent);
      s.off("room:created", emitRoomEvent);
      s.off("rooms:bootstrap", setRooms as any);
      socketRef.current = null;
      setConnected(false);
      setJoinedRooms([]);
      setSummaries({});
      setMessagesByRoom({});
      s.close();
    };
  }, [WS_BASE]);

  const joinRoom = useCallback((roomId: string) => {
    const s = socketRef.current;
    if (!s || !roomId) return;
    console.log("[WS] emit join_room", roomId);
    s.emit("join_room", { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    const s = socketRef.current;
    if (!s || !roomId) return;
    console.log("[WS] emit leave_room", roomId);
    s.emit("leave_room", { roomId });
  }, []);

  const sendMessage = useCallback((payload: { roomId: string; content: string }) => {
    const s = socketRef.current;
    console.log("sendMessage", payload);

    const trimmed = payload.content?.trim();
    if (!s || !payload.roomId || !trimmed) return;
    s.emit("send_message", { roomId: payload.roomId, content: trimmed });
  }, []);

  return useMemo(
    () => ({
      summaries,
      joinRoom,
      leaveRoom,
      sendMessage,
      joinedRooms,
      messagesByRoom,
      currentUserId,
      rooms,
      socket: socketRef.current,
      connected,
    }),
    [summaries, joinRoom, leaveRoom, sendMessage, joinedRooms, messagesByRoom, currentUserId, rooms, connected],
  );
}
