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
import { RoomMembersRepository } from "../rooms/repositories/room-members.repository";
import { RoomsService } from "../rooms/rooms.service";
import { PresenceService } from "../common/presence/presence.service";
import { WsException } from '@nestjs/websockets';

// Simple UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

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
    const orgIds = await this.roomMembersRepo.findOrgIdStringsByUser(client.userId);
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
    const { items } = await this.roomsService.listJoinedRooms(client.userId, client.orgId, { limit: 100 });
    const rooms = items.map(room => ({
      id: room.id,
      orgId: room.orgId,
      name: room.name ?? null,
      isPrivate: room.isPrivate,
      type: room.type || 'channel', // Include type field
      projectId: room.projectId || null, // Include projectId
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
      const orgIds = await this.roomMembersRepo.findOrgIdStringsByUser(client.userId);

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
      attachmentIds?: string[];
      mentionedUserIds?: string[]; // User IDs mentioned in the message
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId || !client.orgId) throw new WsException('Unauthenticated');

    if (!isValidUuid(data.roomId)) {
      throw new WsException('Invalid roomId');
    }

    // Validate threadId if provided
    if (data.threadId && !isValidUuid(data.threadId)) {
      throw new WsException('Invalid threadId');
    }

    // Check if user is a member of the room
    const isMember = await this.roomMembersRepo.isMember(data.roomId, client.userId);
    if (!isMember) {
      throw new WsException('You must join this room before sending messages');
    }

    const message = await this.chatsService.createMessage({
      roomId: data.roomId,
      userId: client.userId,
      orgId: client.orgId,
      content: data.content,
      threadId: data.threadId,
    });

    // Confirm attachments if any
    const attachments: Array<{
      id: string;
      fileId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      downloadUrl?: string;
    }> = [];

    if (data.attachmentIds?.length) {
      for (const assetId of data.attachmentIds) {
        try {
          const attachment = await this.chatsService.confirmAttachmentUpload(
            message.id,
            assetId,
            client.userId
          );
          attachments.push(attachment);
        } catch (err) {
          console.error(`Failed to confirm attachment ${assetId}:`, err.message);
        }
      }
    }

    // Include attachments in the emitted message
    const messageWithAttachments = {
      ...message,
      attachments,
    };

    const roomChannel = `room:${message.roomId}`;
    this.io.to(roomChannel).emit('message:new', messageWithAttachments);

    // Handle thread replies vs main messages differently
    if (data.threadId) {
      // Thread reply: emit thread:new-reply with updated reply count
      const replyCount = await this.chatsService.getThreadReplyCount(data.roomId, data.threadId);
      this.io.to(roomChannel).emit('thread:new-reply', {
        threadId: data.threadId,
        roomId: message.roomId,
        message: messageWithAttachments,
        replyCount,
      });
    } else {
      // Main message: emit room:updated
      this.io.to(`org:${message.orgId}`).emit('room:updated', {
        roomId: message.roomId,
        lastMessage: messageWithAttachments,
        updatedAt: message.sentAt,
      });
    }

    await this.roomMembersRepo.updateLastSeen(data.roomId, client.userId, message.id, client.orgId);

    // Send mention notifications if there are mentioned users
    if (data.mentionedUserIds?.length) {
      await this.chatsService.sendMentionNotifications({
        messageId: message.id,
        roomId: data.roomId,
        senderId: client.userId,
        mentionedUserIds: data.mentionedUserIds,
        messagePreview: data.content.substring(0, 200),
        orgId: client.orgId,
      });
    }
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

    const roomId = payload?.roomId ?? '';
    if (!isValidUuid(roomId)) {
      throw new WsException('Invalid roomId');
    }

    const isMember = await this.roomMembersRepo.isMember(roomId, client.userId);
    if (!isMember) {
      throw new WsException('FORBIDDEN_NOT_A_MEMBER');
    }

    const roomName = `room:${roomId}`;
    await client.join(roomName);
    client.emit('joined_room', {
      roomId: roomId,
      joinedAt: Date.now(),
      userId: client.userId,
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

  notifyRoomUpdated(orgId: string, data: { id: string; name?: string; description?: string; isPrivate?: boolean }) {
    this.io.to(`org:${orgId}`).emit('room:updated', data);
  }

  notifyRoomArchived(orgId: string, roomId: string) {
    this.io.to(`org:${orgId}`).emit('room:archived', { roomId });
  }

  notifyRoomDeleted(orgId: string, roomId: string) {
    this.io.to(`org:${orgId}`).emit('room:deleted', { roomId });
  }

  notifyMemberRemoved(orgId: string, roomId: string, userId: string) {
    this.io.to(`org:${orgId}`).emit('room:member_removed', { roomId, userId });
  }

  notifyMemberRoleChanged(orgId: string, roomId: string, userId: string, newRole: string) {
    this.io.to(`org:${orgId}`).emit('room:member_role_changed', { roomId, userId, role: newRole });
  }
}
