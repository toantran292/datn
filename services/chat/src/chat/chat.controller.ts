import { Controller, Get, Post, Put, Delete, Query, Param, Body } from "@nestjs/common";
import { ChatsService } from "./chat.service";
import { Ctx, type RequestContext } from "../common/context/context.decorator";

@Controller("messages")
export class ChatsController {
  constructor(private readonly chats: ChatsService) { }

  @Get()
  async list(
    @Ctx() ctx: RequestContext,
    @Query("roomId") roomId: string,
    @Query("pageSize") pageSize?: string,
    @Query("pageState") pageState?: string,
  ) {
    const size = pageSize ? Number(pageSize) : undefined;
    return this.chats.listMessages(roomId, ctx.userId, { pageSize: size, pageState });
  }

  @Get("thread")
  async listThread(
    @Query("roomId") roomId: string,
    @Query("threadId") threadId: string,
    @Query("pageSize") pageSize?: string,
    @Query("pageState") pageState?: string,
  ) {
    if (!roomId || !threadId) {
      throw new Error('roomId and threadId are required');
    }
    const size = pageSize ? Number(pageSize) : undefined;
    return this.chats.listThreadMessages(roomId, threadId, { pageSize: size, pageState });
  }

  // ============== UC06: Thread Info ==============

  @Get("thread/info")
  async getThreadInfo(
    @Ctx() ctx: RequestContext,
    @Query("roomId") roomId: string,
    @Query("threadId") threadId: string,
  ) {
    if (!roomId || !threadId) {
      throw new Error('roomId and threadId are required');
    }
    return this.chats.getThreadInfo(roomId, threadId, ctx.userId);
  }

  // ============== UC07: Message Interactions ==============

  @Put(":messageId")
  async editMessage(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
    @Body("content") content: string,
  ) {
    return this.chats.editMessage(messageId, ctx.userId, content);
  }

  @Delete(":messageId")
  async deleteMessage(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
  ) {
    return this.chats.deleteMessage(messageId, ctx.userId, ctx.orgId);
  }

  // Reactions
  @Get(":messageId/reactions")
  async getReactions(
    @Param("messageId") messageId: string,
  ) {
    return this.chats.getReactions(messageId);
  }

  @Post(":messageId/reactions")
  async addReaction(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
    @Body("emoji") emoji: string,
  ) {
    return this.chats.addReaction(messageId, ctx.userId, emoji);
  }

  @Delete(":messageId/reactions/:emoji")
  async removeReaction(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
    @Param("emoji") emoji: string,
  ) {
    return this.chats.removeReaction(messageId, ctx.userId, emoji);
  }

  // Pin messages
  @Post(":messageId/pin")
  async pinMessage(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
  ) {
    return this.chats.pinMessage(messageId, ctx.userId, ctx.orgId);
  }

  @Delete(":messageId/pin")
  async unpinMessage(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
  ) {
    return this.chats.unpinMessage(messageId, ctx.userId, ctx.orgId);
  }

  @Get("pinned")
  async getPinnedMessages(
    @Ctx() ctx: RequestContext,
    @Query("roomId") roomId: string,
  ) {
    return this.chats.getPinnedMessages(roomId, ctx.userId);
  }

  // ============== UC08/09: File Attachments ==============

  @Post("attachments/presigned-url")
  async createAttachmentUploadUrl(
    @Ctx() ctx: RequestContext,
    @Body() body: { roomId: string; originalName: string; mimeType: string; size: number },
  ) {
    return this.chats.createAttachmentUploadUrl(body.roomId, ctx.userId, ctx.orgId, {
      originalName: body.originalName,
      mimeType: body.mimeType,
      size: body.size,
    });
  }

  @Post(":messageId/attachments/confirm")
  async confirmAttachmentUpload(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
    @Body("assetId") assetId: string,
  ) {
    return this.chats.confirmAttachmentUpload(messageId, assetId, ctx.userId);
  }

  @Get(":messageId/attachments")
  async getMessageAttachments(
    @Ctx() ctx: RequestContext,
    @Param("messageId") messageId: string,
  ) {
    return this.chats.getMessageAttachments(messageId, ctx.userId);
  }

  @Get("attachments/:attachmentId/download")
  async getAttachmentDownloadUrl(
    @Ctx() ctx: RequestContext,
    @Param("attachmentId") attachmentId: string,
  ) {
    return this.chats.getAttachmentDownloadUrl(attachmentId, ctx.userId);
  }

  @Delete("attachments/:attachmentId")
  async deleteAttachment(
    @Ctx() ctx: RequestContext,
    @Param("attachmentId") attachmentId: string,
  ) {
    return this.chats.deleteAttachment(attachmentId, ctx.userId);
  }

  // ============== UC10: Search ==============

  @Get("search")
  async searchAllRooms(
    @Ctx() ctx: RequestContext,
    @Query("q") query: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("roomId") roomId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("fromUserId") fromUserId?: string,
  ) {
    // If roomId is provided, search in specific room only
    if (roomId) {
      return this.chats.searchInRoom(roomId, ctx.userId, ctx.orgId, query, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        startDate,
        endDate,
        fromUserId,
      });
    }

    return this.chats.searchAllRooms(ctx.userId, ctx.orgId, query, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      startDate,
      endDate,
      fromUserId,
    });
  }

  @Get("search/room/:roomId")
  async searchInRoom(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
    @Query("q") query: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("fromUserId") fromUserId?: string,
  ) {
    return this.chats.searchInRoom(roomId, ctx.userId, ctx.orgId, query, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      startDate,
      endDate,
      fromUserId,
    });
  }

  // ============== UC15: Notification Settings ==============

  @Get("notifications/settings/:roomId")
  async getNotificationSettings(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
  ) {
    return this.chats.getNotificationSettings(roomId, ctx.userId);
  }

  @Put("notifications/settings/:roomId")
  async updateNotificationSettings(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
    @Body() body: { level?: 'all' | 'mentions' | 'none'; soundEnabled?: boolean; pushEnabled?: boolean },
  ) {
    return this.chats.updateNotificationSettings(roomId, ctx.userId, body);
  }

  @Post("notifications/mute/:roomId")
  async muteRoom(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
    @Body("duration") duration?: number,
  ) {
    return this.chats.muteRoom(roomId, ctx.userId, duration);
  }

  @Post("notifications/unmute/:roomId")
  async unmuteRoom(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
  ) {
    return this.chats.unmuteRoom(roomId, ctx.userId);
  }

  @Get("notifications/unread/:roomId")
  async getUnreadCount(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
  ) {
    return this.chats.getUnreadCount(roomId, ctx.userId);
  }

  @Get("notifications/unread")
  async getAllUnreadCounts(
    @Ctx() ctx: RequestContext,
  ) {
    return this.chats.getAllUnreadCounts(ctx.userId, ctx.orgId);
  }

  @Post("notifications/read/:roomId")
  async markAsRead(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
    @Body("messageId") messageId: string,
  ) {
    return this.chats.markAsRead(roomId, ctx.userId, messageId);
  }

  @Post("notifications/read-all/:roomId")
  async markAllAsRead(
    @Ctx() ctx: RequestContext,
    @Param("roomId") roomId: string,
  ) {
    return this.chats.markAllAsRead(roomId, ctx.userId);
  }
}


