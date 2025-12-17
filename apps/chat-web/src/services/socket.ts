import { io, Socket } from 'socket.io-client';
import type { Room, Message, RoomUpdatedPayload } from '../types';

// Connect through edge (nginx) at port 8080, which proxies /chat to chat service
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

export type SocketEventHandlers = {
  onRoomsBootstrap?: (rooms: Room[]) => void;
  onRoomCreated?: (room: Room) => void;
  onRoomMemberJoined?: (data: { id: string; name?: string | null; orgId: string; isPrivate: boolean; userId: string }) => void;
  onRoomUpdated?: (payload: RoomUpdatedPayload) => void;
  onMessageNew?: (message: Message) => void;
  onJoinedRoom?: (data: { roomId: string; userId: string; joinedAt: number }) => void;
  onUserOnline?: (data: { userId: string; timestamp: string }) => void;
  onUserOffline?: (data: { userId: string; timestamp: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string, orgId: string, handlers: SocketEventHandlers = {}) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('[Socket] WS_URL:', WS_URL);
    console.log('[Socket] Connecting with path /chat/socket.io to namespace /chat');

    // Connect to base URL with custom path and namespace
    // This will make requests to: ws://localhost:8080/chat/socket.io/?EIO=4
    // Then connect to namespace /chat
    this.socket = io(`${WS_URL}/chat`, {
      path: '/chat/socket.io',  // Custom path for Socket.IO engine
      auth: {
        'x-user-id': userId,
        'x-org-id': orgId,
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id);
      handlers.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      handlers.onDisconnect?.();
    });

    this.socket.on('rooms:bootstrap', (rooms: Room[]) => {
      console.log('[WS] Rooms bootstrap:', rooms);
      handlers.onRoomsBootstrap?.(rooms);
    });

    this.socket.on('room:created', (room: Room) => {
      console.log('[WS] Room created:', room);
      handlers.onRoomCreated?.(room);
    });

    this.socket.on('room:member_joined', (data: { id: string; name?: string | null; orgId: string; isPrivate: boolean; userId: string }) => {
      console.log('[WS] Member joined room:', data);
      handlers.onRoomMemberJoined?.(data);
    });

    this.socket.on('room:updated', (payload: RoomUpdatedPayload) => {
      console.log('[WS] Room updated:', payload);
      handlers.onRoomUpdated?.(payload);
    });

    this.socket.on('message:new', (message: Message) => {
      console.log('[WS] New message:', message);
      handlers.onMessageNew?.(message);
    });

    this.socket.on('joined_room', (data) => {
      console.log('[WS] Joined room:', data);
      handlers.onJoinedRoom?.(data);
    });

    this.socket.on('user:online', (data: { userId: string; timestamp: string }) => {
      console.log('[WS] User online:', data);
      handlers.onUserOnline?.(data);
    });

    this.socket.on('user:offline', (data: { userId: string; timestamp: string }) => {
      console.log('[WS] User offline:', data);
      handlers.onUserOffline?.(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('join_room', { roomId });
  }

  sendMessage(
    roomId: string,
    content: string,
    threadId?: string,
    attachmentIds?: string[],
    mentionedUserIds?: string[]
  ) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('send_message', { roomId, content, threadId, attachmentIds, mentionedUserIds });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
