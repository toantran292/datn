// src/app/chat/hooks/useChatSocket.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Message } from "../types/chat";

export type ChatSummaries = Record<string, { lastMessage?: Message; updatedAt?: string } | undefined>;

export function useChatSocket() {
  const [summaries, setSummaries] = useState<ChatSummaries>({});
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});

  const socketRef = useRef<Socket | null>(null);

  const WS_BASE = (process.env.NEXT_PUBLIC_CHAT_WS_BASE || "http://localhost:40500").replace(/\/+$/, "");

  useEffect(() => {
    const userId = localStorage.getItem("x-user-id") || "";
    const orgId = localStorage.getItem("x-org-id") || "";

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
      setMessagesByRoom((prev) => (prev[roomId] ? prev : { ...prev, [roomId]: [] }));
    };

    const handleLeft = ({ roomId }: { roomId: string }) => {
      setJoinedRooms((prev) => prev.filter((id) => id !== roomId));
      setMessagesByRoom((prev) => {
        const { [roomId]: _removed, ...rest } = prev;
        return rest;
      });
    };

    const handleRoomUpdated = (evt: { roomId: string; lastMessage?: Message; updatedAt?: string }) => {
      setSummaries((prev) => ({
        ...prev,
        [evt.roomId]: { lastMessage: evt.lastMessage, updatedAt: evt.updatedAt },
      }));
    };

    const handleNewMessage = (message: Message) => {
      setMessagesByRoom((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }));
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("joined_room", handleJoined);
    s.on("left_room", handleLeft);
    s.on("room:updated", handleRoomUpdated);
    s.on("new_message", handleNewMessage);

    socketRef.current = s;

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("joined_room", handleJoined);
      s.off("left_room", handleLeft);
      s.off("room:updated", handleRoomUpdated);
      s.off("new_message", handleNewMessage);
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
      socket: socketRef.current,
      connected,
    }),
    [summaries, joinRoom, leaveRoom, sendMessage, joinedRooms, messagesByRoom, connected],
  );
}
