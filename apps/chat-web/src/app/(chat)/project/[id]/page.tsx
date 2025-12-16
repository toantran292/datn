"use client";

import { ChatApp } from "@/components/ChatApp";

export default function ChatProjectPage() {
  // ChatApp will automatically use currentProjectId from AppHeaderContext
  // AppHeaderContext reads projectId from URL via initialProjectId or auto-detection
  return <ChatApp />;
}
