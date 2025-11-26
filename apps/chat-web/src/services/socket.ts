import { io, Socket } from 'socket.io-client';
import type { Room, Message, RoomUpdatedPayload } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export type SocketEventHandlers = {
  onRoomsBootstrap?: (rooms: Room[]) => void;
  onRoomCreated?: (room: Room) => void;
  onRoomUpdated?: (payload: RoomUpdatedPayload) => void;
  onMessageNew?: (message: Message) => void;
  onJoinedRoom?: (data: { roomId: string; userId: string; joinedAt: number }) => void;
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

    this.socket = io(`${WS_URL}/chat`, {
      auth: {
        'x-user-id': userId,
        'x-org-id': orgId,
      },
      transports: ['websocket', 'polling'],
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

  sendMessage(roomId: string, content: string) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('send_message', { roomId, content });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
