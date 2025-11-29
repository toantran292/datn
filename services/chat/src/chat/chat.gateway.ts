import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Inject, forwardRef } from "@nestjs/common";
import { Namespace, Server } from "socket.io";
import { ChatsService } from "./chat.service";
import type { AuthenticatedSocket } from "../common/types/socket.types";
import { types } from "cassandra-driver";
import { RoomMembersRepository } from "../rooms/repositories/room-members.repository";
import { RoomsService } from "../rooms/rooms.service";
import { PresenceService } from "../common/presence/presence.service";
import { WsException } from '@nestjs/websockets';

type RoomSummaryPayload = {
  id: string;
  name?: string | null;
  orgId: string;
  isPrivate: boolean;
  projectId?: string | null; // null = org-level, string = project-specific
};

@WebSocketGateway({namespace: 'chat'})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Namespace;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly roomMembersRepo: RoomMembersRepository,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
    private readonly presenceService: PresenceService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    const userUuid = types.Uuid.fromString(client.userId);
    const orgUuid = types.Uuid.fromString(client.orgId);
    const orgIds = await this.roomMembersRepo.findOrgIdStringsByUser(userUuid);
    await Promise.all(orgIds.map(oid => client.join(`org:${oid}`)));
    console.log(`[WS] Connected: ${client.id} userId:${client.userId}`);

    // Track user as online
    const wasOffline = this.presenceService.userConnected(client.userId, client.id);
    if (wasOffline) {
      // User just came online, notify others in org
      orgIds.forEach(orgId => {
        this.io.to(`org:${orgId}`).emit('user:online', {
          userId: client.userId,
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Only send rooms that user has JOINED (not all public rooms)
    const { items } = await this.roomsService.listJoinedRooms(userUuid, orgUuid, { limit: 100 });
    const rooms = items.map(room => ({
      id: room.id.toString(),
      orgId: room.orgId.toString(),
      name: room.name ?? null,
      isPrivate: room.isPrivate,
      type: room.type || 'channel', // Include type field
      projectId: room.projectId?.toString() || null, // Include projectId
    }));

    client.emit('rooms:bootstrap', rooms);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[WS] Disconnected: ${client.id} userId:${client.userId}`);

    if (!client.userId) return;

    // Track user as offline
    const isNowOffline = this.presenceService.userDisconnected(client.userId, client.id);
    if (isNowOffline) {
      // User is fully offline (no more sockets), notify others
      const userUuid = types.Uuid.fromString(client.userId);
      const orgIds = await this.roomMembersRepo.findOrgIdStringsByUser(userUuid);

      orgIds.forEach(orgId => {
        this.io.to(`org:${orgId}`).emit('user:offline', {
          userId: client.userId,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }

  afterInit() {
    this.chatsService.applyAuthMiddleware(this.io);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: {
      roomId: string;
      content: string;
      threadId?: string; // Optional: message ID to reply to
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId || !client.orgId) throw new WsException('Unauthenticated');

    let roomUuid: types.TimeUuid;
    try {
      roomUuid = types.TimeUuid.fromString(data.roomId);
    } catch {
      throw new WsException('Invalid roomId');
    }

    // Parse threadId if provided
    let threadUuid: types.TimeUuid | undefined;
    if (data.threadId) {
      try {
        threadUuid = types.TimeUuid.fromString(data.threadId);
      } catch {
        throw new WsException('Invalid threadId');
      }
    }

    const userUuid = types.Uuid.fromString(client.userId);
    const orgUuid = types.Uuid.fromString(client.orgId);

    // Check if user is a member of the room
    const isMember = await this.roomMembersRepo.isMember(roomUuid, userUuid);
    if (!isMember) {
      throw new WsException('You must join this room before sending messages');
    }

    const message = await this.chatsService.createMessage({
      roomId: roomUuid,
      userId: userUuid,
      orgId: orgUuid,
      content: data.content,
      threadId: threadUuid,
    });

    const roomChannel = `room:${message.roomId}`;
    this.io.to(roomChannel).emit('message:new', message);

    // Only emit room:updated for main messages (not thread replies)
    if (!threadUuid) {
      this.io.to(`org:${message.orgId}`).emit('room:updated', {
        roomId: message.roomId,
        lastMessage: message,
        updatedAt: message.sentAt,
      });
    }

    await this.roomMembersRepo.updateLastSeen(roomUuid, userUuid, types.TimeUuid.fromString(message.id), orgUuid);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    console.log("Received join_room: ", payload, " from: ", client.id, "")
    if (!client.userId || !client.orgId) {
      throw new WsException('Unauthenticated');
    }

    let roomTid: types.TimeUuid;
    try {
      roomTid = types.TimeUuid.fromString(payload?.roomId ?? '');
    } catch {
      throw new WsException('Invalid roomId');
    }

    const userUuid = types.Uuid.fromString(client.userId);
    const isMember = await this.roomMembersRepo.isMember(roomTid, userUuid);
    if (!isMember) {
      throw new WsException('FORBIDDEN_NOT_A_MEMBER');
    }

    const roomName = `room:${roomTid.toString()}`;
    await client.join(roomName);
    client.emit('joined_room', {
      roomId: roomTid.toString(),
      joinedAt: Date.now(),
      userId: userUuid.toString(),
    });
  }

  notifyRoomCreated(orgId: string, room: RoomSummaryPayload) {
    this.io.to(`org:${orgId}`).emit('room:created', room);
  }

  notifyRoomJoined(orgId: string, room: RoomSummaryPayload, userId: string) {
    this.io.to(`org:${orgId}`).emit('room:member_joined', {
      ...room,
      userId, // Include userId so frontend knows who joined
    });
  }
}
