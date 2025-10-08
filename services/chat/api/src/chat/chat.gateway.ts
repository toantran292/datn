import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Server } from "socket.io";
import { ChatsService } from "./chat.service";
import type { AuthenticatedSocket } from "../../common/types/socket.types";
import { types } from "cassandra-driver";
import { RoomMembersRepository } from "../rooms/repositories/room-members.repository";
import { WsException } from '@nestjs/websockets';

type RoomSummaryPayload = {
  id: string;
  name?: string | null;
  orgId: string;
  isPrivate: boolean;
};

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:40503',
    credentials: true,
    allowedHeaders: ['x-user-id', 'x-org-id', 'content-type'],
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Namespace;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly roomMembersRepo: RoomMembersRepository,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    const userUuid = types.Uuid.fromString(client.userId);
    const orgIds = await this.roomMembersRepo.findOrgIdStringsByUser(userUuid);
    await Promise.all(orgIds.map(oid => client.join(`org:${oid}`)));
    console.log(`[WS] Connected: ${client.id}`);

    if (orgIds.length) {
      const rooms = await this.chatsService.listRoomsForOrg(orgIds[0]);
      client.emit('rooms:bootstrap', rooms);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[WS] Disconnected: ${client.id}`);
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

    const userUuid = types.Uuid.fromString(client.userId);
    const orgUuid = types.Uuid.fromString(client.orgId);

    const message = await this.chatsService.createMessage({
      roomId: roomUuid,
      userId: userUuid,
      orgId: orgUuid,
      content: data.content,
    });

    const roomChannel = `room:${message.roomId}`;
    this.io.to(roomChannel).emit('message:new', message);

    this.io.to(`org:${message.orgId}`).emit('room:updated', {
      roomId: message.roomId,
      lastMessage: message,
      updatedAt: message.sentAt,
    });

    await this.roomMembersRepo.updateLastSeen(roomUuid, userUuid, types.TimeUuid.fromString(message.id));
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

    // (Tùy chọn) bạn có thể emit số unread hoặc lastMessage tóm tắt ở đây
    // const summary = await this.chatsService.getRoomSummary(roomTid, userUuid);
    // client.emit('room:summary', { roomId: roomTid.toString(), ...summary });
  }

  notifyRoomCreated(orgId: string, room: RoomSummaryPayload) {
    this.io.to(`org:${orgId}`).emit('room:created', room);
  }

  notifyRoomJoined(orgId: string, room: RoomSummaryPayload) {
    this.io.to(`org:${orgId}`).emit('room:member_joined', room);
  }
}
