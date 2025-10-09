"use client";

import { io, Socket } from "socket.io-client";

const WS_BASE = (process.env.NEXT_PUBLIC_CHAT_WS_BASE || "http://localhost:40500").replace(/\/+$/, "");

export function createChatSocket(): Socket {
  const userId = localStorage.getItem("x-user-id") || "";
  const orgId  = localStorage.getItem("x-org-id") || "";

  const s = io(`${WS_BASE}/chat`, {
    transports: ["websocket"],
    withCredentials: true,
    auth: { userId, orgId },
  });
  return s;
}
