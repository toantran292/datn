export interface Room {
  id: string;
  name?: string | null; // Backend may return undefined
  orgId: string;
  isPrivate: boolean;
  type: 'channel' | 'dm';
  projectId?: string | null; // null = org-level, string = project-specific
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  type: string;
  content: string;
  sentAt: string;
  threadId?: string | null; // null = main message, string = reply in thread
  replyCount?: number; // Number of replies in thread (for main messages)
}

export interface User {
  userId: string;
  orgId: string;
  roles?: string[];
}

export interface RoomUpdatedPayload {
  roomId: string;
  lastMessage: Message;
  updatedAt: string;
}
