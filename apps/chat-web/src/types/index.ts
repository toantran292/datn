export interface RoomMember {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

export interface Room {
  id: string;
  name?: string | null; // Backend may return undefined
  orgId: string;
  isPrivate: boolean;
  type: 'channel' | 'dm';
  projectId?: string | null; // null = org-level, string = project-specific
  members?: RoomMember[]; // For DMs - list of other members (excluding current user)
  createdBy?: string; // User ID of who created the room
  description?: string | null; // Channel description
}

export type MessageType = 'text' | 'file' | 'system' | 'huddle_started' | 'huddle_ended';

export interface HuddleMetadata {
  meetingId: string;
  meetingRoomId: string;
  duration?: number; // seconds
  participantCount?: number;
  hasTranscript?: boolean; // Whether meeting has transcript/captions
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  type: MessageType | string;
  content: string;
  sentAt: string;
  threadId?: string | null; // null = main message, string = reply in thread
  replyCount?: number; // Number of replies in thread (for main messages)
  editedAt?: string | null; // When message was edited
  deletedAt?: string | null; // When message was soft deleted
  isPinned?: boolean; // Whether message is pinned
  reactions?: Reaction[]; // Message reactions
  attachments?: Attachment[]; // File attachments
  metadata?: HuddleMetadata; // Metadata for huddle messages
}

// Reaction on a message
export interface Reaction {
  emoji: string;
  count: number;
  users: ReactionUser[];
  hasReacted: boolean; // Whether current user has reacted with this emoji
}

export interface ReactionUser {
  userId: string;
  displayName?: string;
}

// File attachment on a message
export interface Attachment {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

// Unread count for a room
export interface UnreadCount {
  roomId: string;
  count: number;
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
