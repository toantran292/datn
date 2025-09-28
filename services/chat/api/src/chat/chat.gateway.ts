import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { ChatService } from "./chat.service";
import type { AuthenticatedSocket } from "../../common/types/socket.types";
import { types } from "cassandra-driver";

@WebSocketGateway({
  namespace: 'chat',
  pingInterval: 60000,
  pingTimeout: 120000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  constructor(private readonly chatService: ChatService) { }

  handleConnection(client: AuthenticatedSocket) {
    console.log(`[WS] Connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[WS] Disconnected: ${client.id}`);
  }

  afterInit(server: Server) {
    this.chatService.applyAuthMiddleware(server);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@MessageBody() body: { roomId: types.TimeUuid; text: string }, @ConnectedSocket() client: AuthenticatedSocket) {
    const msg = await this.chatService.sendMessage(client, body);
    this.io.to(body.roomId.toString()).emit('new_message', msg);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() { roomId }: { roomId: types.TimeUuid }, @ConnectedSocket() client: AuthenticatedSocket) {

    // await this.roomsService.ensureUserCanAccessRoom(client.userId!, roomId);
    client.join(roomId.toString());
    client.emit('joined_room', roomId);
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(@MessageBody() { roomId }: { roomId: types.TimeUuid }, @ConnectedSocket() client: AuthenticatedSocket) {
    await this.chatService.leaveRoom(client, roomId);
  }
}
