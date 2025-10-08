"use client";

const BASE_URL = (process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:40500").replace(/\/+$/, "");

function authHeadersFromLocalStorage() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const uid = localStorage.getItem("x-user-id");
  const oid = localStorage.getItem("x-org-id");
  if (uid) h["x-user-id"] = uid;
  if (oid) h["x-org-id"] = oid;
  return h;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers || {}), ...authHeadersFromLocalStorage() },
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? (await res.json()) as T : (await res.text() as any);
}

export type Room = { id: string; org_id: string; is_private: boolean; name: string | null;}; // tối thiểu

export function listRooms(): Promise<{ items: Room[], pagingState: any }> {
  return request<{ items: Room[], pagingState: any }>("/rooms");
}

export function createRoom(payload: { is_private: boolean; name?: string }) {
  return request<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
