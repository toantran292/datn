import { Injectable } from "@nestjs/common";
import { Namespace } from "socket.io";
import { MessagesRepository } from "./repositories/messages.repository";
import { types } from "cassandra-driver";
import { RoomsRepository } from "../rooms/repositories/room.repository";

export type CreatedMessage = {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  threadId?: string | null;
  type: string;
  content: string;
  sentAt: string;
  replyCount?: number;
};

@Injectable()
export class ChatsService {
  constructor(
    private readonly messagesRepo: MessagesRepository,
    private readonly roomsRepo: RoomsRepository,
  ) { }

  applyAuthMiddleware(nsp: Namespace) {
    nsp.use((socket: any, next) => {
      const auth = socket.handshake?.auth ?? {};
      const headers = socket.handshake?.headers ?? {};

      const userId =
        auth["x-user-id"] || auth.userId || (headers["x-user-id"] as string | undefined);
      const orgId =
        auth["x-org-id"] || auth.orgId || (headers["x-org-id"] as string | undefined);

      if (!userId || !orgId) return next(new Error("Unauthorized"));

      try {
        types.Uuid.fromString(userId);
        types.Uuid.fromString(orgId);

        socket.userId = userId;
        socket.orgId = orgId;
        return next();
      } catch {
        return next(new Error("Unauthorized"));
      }
    });
  }

  async createMessage(body: {
    roomId: types.TimeUuid;
    userId: types.Uuid;
    orgId: types.Uuid;
    content: string;
    threadId?: types.TimeUuid;
  }): Promise<CreatedMessage> {
    const entity = await this.messagesRepo.create({
      roomId: body.roomId,
      content: body.content,
      userId: body.userId,
      orgId: body.orgId,
      threadId: body.threadId,
      type: "text",
      sendAt: new Date(),
    });

    return {
      id: entity.id.toString(),
      roomId: entity.roomId.toString(),
      userId: entity.userId.toString(),
      orgId: entity.orgId.toString(),
      threadId: entity.threadId?.toString() ?? null,
      type: entity.type,
      content: entity.content,
      sentAt: entity.sendAt.toISOString(),
    };
  }

  async listMessages(roomId: string, paging?: { pageSize?: number; pageState?: string }) {
    const tid = types.TimeUuid.fromString(roomId);
    const rs = await this.messagesRepo.listByRoom(tid, paging);

    // Calculate reply counts for main messages (those with threadId = null)
    const replyCountMap = new Map<string, number>();

    // Count replies for each parent message
    rs.items.forEach(msg => {
      if (msg.threadId) {
        const parentId = msg.threadId.toString();
        replyCountMap.set(parentId, (replyCountMap.get(parentId) || 0) + 1);
      }
    });

    return {
      items: rs.items.map(m => ({
        id: m.id.toString(),
        roomId: m.roomId.toString(),
        userId: m.userId.toString(),
        orgId: m.orgId.toString(),
        threadId: m.threadId?.toString() ?? null,
        type: m.type,
        content: m.content,
        sentAt: m.sendAt.toISOString(),
        replyCount: m.threadId ? undefined : (replyCountMap.get(m.id.toString()) || 0), // Only for main messages
      })),
      pageState: rs.pageState,
    };
  }

  async listThreadMessages(roomId: string, threadId: string, paging?: { pageSize?: number; pageState?: string }) {
    const tid = types.TimeUuid.fromString(roomId);
    const rs = await this.messagesRepo.listByRoom(tid, paging);

    // Filter messages that belong to this thread
    const threadItems = rs.items.filter(m => m.threadId?.toString() === threadId);

    return {
      items: threadItems.map(m => ({
        id: m.id.toString(),
        roomId: m.roomId.toString(),
        userId: m.userId.toString(),
        orgId: m.orgId.toString(),
        threadId: m.threadId?.toString() ?? null,
        type: m.type,
        content: m.content,
        sentAt: m.sendAt.toISOString(),
      })),
      pageState: rs.pageState,
    };
  }

  async listRoomsForOrg(orgId: string) {
    const oid = types.Uuid.fromString(orgId);
    const { items } = await this.roomsRepo.listByOrg(oid, { limit: 100 });
    return items.map((room) => ({
      id: room.id.toString(),
      orgId: room.orgId.toString(),
      name: room.name,
      isPrivate: room.isPrivate,
    }));
  }
}
