export interface Room {
  id: string;
  name: string | null;
  orgId: string;
  isPrivate: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  type: string;
  content: string;
  sentAt: string;
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
