import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type {AuthenticatedSocket} from "../common/types/socket.types";

type MessageBody = {roomId: string, text: string}

@WebSocketGateway({
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  handleConnection(client: AuthenticatedSocket) {
    const userId = (client as any).userId;
    console.log(`[WS] Connected: ${client.id} user: ${userId}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[WS] Disconnected: ${client.id}`);
  }

  afterInit(server: Server){
    server.use((socket: AuthenticatedSocket, next) => {
      const userId = socket.handshake.headers["x-user-id"]
      const orgId = socket.handshake.headers["x-org-id"]

      if (!userId || !orgId) {
        return next(new Error('Unauthorized: Missing headers'));
      }

      (socket as any).userId = userId;
      (socket as any).orgId = orgId;

      next();
    })

  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() payload: MessageBody,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    this.io.to(payload.roomId).emit('new_message', {
      from: client.id,
      text: payload.text,
      at: Date.now(),
    });
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(roomId);
    client.emit('joined_room', roomId)
  }

  @SubscribeMessage('leave_room')
  leave(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.leave(roomId);
    client.emit('left_room', roomId);
  }
}