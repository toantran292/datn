import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import type { AuthenticatedSocket } from "../../common/types/socket.types";
import { MessagesRepository } from "./repositories/messages.repository";
import { types } from "cassandra-driver";

@Injectable()
export class ChatService {
  constructor(private readonly messagesRepo: MessagesRepository) { }

  applyAuthMiddleware(server: Server) {
    server.use((socket: AuthenticatedSocket, next) => {
      const userId = socket.handshake.headers["x-user-id"];
      const orgId = socket.handshake.headers["x-org-id"];
      if (!userId || !orgId) return next(new Error("Unauthorized"));
      (socket as any).userId = userId;
      (socket as any).orgId = orgId;
      next();
    });
  }

  async sendMessage(client: AuthenticatedSocket, body: { roomId: types.TimeUuid; text: string }) {
    const saved = await this.messagesRepo.create({
      roomId: body.roomId,
      text: body.text,
      userId: client.userId!,
      orgId: client.orgId!,
      sentAt: new Date(),
    });
    return saved;
  }

  async joinRoom(client: AuthenticatedSocket, roomId: types.TimeUuid) {
    client.join(roomId.toString());
    client.emit("joined_room", roomId);
  }

  async leaveRoom(client: AuthenticatedSocket, roomId: types.TimeUuid) {
    client.leave(roomId.toString());
    client.emit("left_room", roomId);
  }
}
