import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { Namespace } from "socket.io";
import { firstValueFrom } from "rxjs";
import { MessagesRepository } from "./repositories/messages.repository";
import { ReactionsRepository } from "./repositories/reactions.repository";
import { PinnedMessagesRepository } from "./repositories/pinned-messages.repository";
import { AttachmentsRepository } from "./repositories/attachments.repository";
import { SearchRepository } from "./repositories/search.repository";
import { NotificationSettingsRepository } from "./repositories/notification-settings.repository";
import { RoomsRepository } from "../rooms/repositories/room.repository";
import { RoomMembersRepository } from "../rooms/repositories/room-members.repository";
import { FileStorageClient } from "../common/file-storage/file-storage.client";
import { NotificationLevel } from "../database/entities/channel-notification-setting.entity";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_URL || 'http://notification-api:3000';

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
  metadata?: Record<string, any> | null;
};

export interface CreateHuddleMessageDto {
  roomId: string;
  userId: string;
  orgId: string;
  type: 'huddle_started' | 'huddle_ended';
  meetingId: string;
  meetingRoomId: string;
  duration?: number;
  participantCount?: number;
  hasTranscript?: boolean;
}

export interface CreateMeetingChatMessageDto {
  roomId: string;
  userId: string;
  orgId: string;
  meetingId: string;
  content: string;
  senderName?: string;
}

// Simple UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly messagesRepo: MessagesRepository,
    private readonly reactionsRepo: ReactionsRepository,
    private readonly pinnedMessagesRepo: PinnedMessagesRepository,
    private readonly attachmentsRepo: AttachmentsRepository,
    private readonly searchRepo: SearchRepository,
    private readonly notificationSettingsRepo: NotificationSettingsRepository,
    private readonly roomsRepo: RoomsRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    private readonly fileStorageClient: FileStorageClient,
    private readonly httpService: HttpService,
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

      if (!isValidUuid(userId) || !isValidUuid(orgId)) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = userId;
      socket.orgId = orgId;
      return next();
    });
  }

  async createMessage(body: {
    roomId: string;
    userId: string;
    orgId: string;
    content: string;
    threadId?: string;
  }): Promise<CreatedMessage> {
    const entity = await this.messagesRepo.create({
      roomId: body.roomId,
      content: body.content,
      userId: body.userId,
      orgId: body.orgId,
      threadId: body.threadId,
      type: "text",
    });

    return {
      id: entity.id,
      roomId: entity.roomId,
      userId: entity.userId,
      orgId: entity.orgId,
      threadId: entity.threadId ?? null,
      type: entity.type,
      content: entity.content,
      sentAt: entity.createdAt.toISOString(),
    };
  }

  async createHuddleMessage(dto: CreateHuddleMessageDto): Promise<CreatedMessage> {
    const metadata = {
      meetingId: dto.meetingId,
      meetingRoomId: dto.meetingRoomId,
      duration: dto.duration,
      participantCount: dto.participantCount,
    };

    const entity = await this.messagesRepo.create({
      roomId: dto.roomId,
      content: '', // Empty content, UI renders based on type
      userId: dto.userId,
      orgId: dto.orgId,
      type: dto.type,
      metadata,
    });

    return {
      id: entity.id,
      roomId: entity.roomId,
      userId: entity.userId,
      orgId: entity.orgId,
      threadId: null,
      type: entity.type,
      content: entity.content,
      metadata: entity.metadata,
      sentAt: entity.createdAt.toISOString(),
    };
  }

  /**
   * Update existing huddle_started message to huddle_ended
   * Returns the updated message, or null if no huddle_started message found
   */
  async updateHuddleToEnded(dto: CreateHuddleMessageDto): Promise<CreatedMessage | null> {
    // Find the existing huddle_started message
    const existingMessage = await this.messagesRepo.findHuddleStartedMessage(
      dto.roomId,
      dto.meetingId,
    );

    if (!existingMessage) {
      this.logger.warn(`No huddle_started message found for meeting ${dto.meetingId} in room ${dto.roomId}`);
      return null;
    }

    const metadata = {
      meetingId: dto.meetingId,
      meetingRoomId: dto.meetingRoomId,
      duration: dto.duration,
      participantCount: dto.participantCount,
      hasTranscript: dto.hasTranscript ?? false,
    };

    const updated = await this.messagesRepo.updateHuddleMessage(existingMessage.id, {
      type: 'huddle_ended',
      metadata,
    });

    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      roomId: updated.roomId,
      userId: updated.userId,
      orgId: updated.orgId,
      threadId: null,
      type: updated.type,
      content: updated.content,
      metadata: updated.metadata,
      sentAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Create a meeting chat message as a thread reply under the huddle message
   */
  async createMeetingChatMessage(dto: CreateMeetingChatMessageDto): Promise<CreatedMessage | null> {
    // Find the huddle message for this meeting
    const huddleMessage = await this.messagesRepo.findHuddleMessageByMeetingId(
      dto.roomId,
      dto.meetingId,
    );

    if (!huddleMessage) {
      this.logger.warn(`No huddle message found for meeting ${dto.meetingId} in room ${dto.roomId}`);
      return null;
    }

    // Create the message as a thread reply
    const entity = await this.messagesRepo.create({
      roomId: dto.roomId,
      content: dto.content,
      userId: dto.userId,
      orgId: dto.orgId,
      threadId: huddleMessage.id, // Thread under the huddle message
      type: 'meeting_chat',
      metadata: {
        meetingId: dto.meetingId,
        senderName: dto.senderName,
      },
    });

    return {
      id: entity.id,
      roomId: entity.roomId,
      userId: entity.userId,
      orgId: entity.orgId,
      threadId: entity.threadId,
      type: entity.type,
      content: entity.content,
      metadata: entity.metadata,
      sentAt: entity.createdAt.toISOString(),
    };
  }

  /**
   * Get meeting chat messages for a specific meeting
   * Returns all thread replies under the huddle message
   */
  async getMeetingChatMessages(roomId: string, meetingId: string): Promise<CreatedMessage[]> {
    // Find the huddle message for this meeting
    const huddleMessage = await this.messagesRepo.findHuddleMessageByMeetingId(roomId, meetingId);

    if (!huddleMessage) {
      this.logger.warn(`No huddle message found for meeting ${meetingId} in room ${roomId}`);
      return [];
    }

    // Get all thread replies (meeting chat messages)
    const rs = await this.messagesRepo.listByThread(roomId, huddleMessage.id, { pageSize: 100 });

    return rs.items.map(m => ({
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      orgId: m.orgId,
      threadId: m.threadId ?? null,
      type: m.type,
      content: m.content,
      metadata: m.metadata,
      sentAt: m.createdAt.toISOString(),
    }));
  }

  async listMessages(roomId: string, paging?: { pageSize?: number; pageState?: string }) {
    const rs = await this.messagesRepo.listByRoom(roomId, paging);

    // Get IDs of main messages (those without threadId) to fetch reply counts
    const mainMessageIds = rs.items
      .filter(m => !m.threadId)
      .map(m => m.id);

    // Fetch reply counts from database for main messages
    const replyCountMap = mainMessageIds.length > 0
      ? await this.messagesRepo.getReplyCountsForMessages(roomId, mainMessageIds)
      : new Map<string, number>();

    // Fetch reactions for all messages in parallel
    const allMessageIds = rs.items.map(m => m.id);
    const reactionsMap = new Map<string, { emoji: string; count: number; users: string[] }[]>();

    if (allMessageIds.length > 0) {
      const reactionsPromises = allMessageIds.map(async (messageId) => {
        const reactions = await this.reactionsRepo.getReactionsByMessage(messageId);
        const counts = await this.reactionsRepo.getReactionCounts(messageId);

        // Group by emoji
        const grouped: Record<string, { emoji: string; count: number; users: string[] }> = {};
        reactions.forEach(r => {
          if (!grouped[r.emoji]) {
            grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
          }
          grouped[r.emoji].users.push(r.userId);
        });

        // Set counts
        counts.forEach((count, emoji) => {
          if (grouped[emoji]) {
            grouped[emoji].count = count;
          }
        });

        return { messageId, reactions: Object.values(grouped) };
      });

      const reactionsResults = await Promise.all(reactionsPromises);
      reactionsResults.forEach(({ messageId, reactions }) => {
        reactionsMap.set(messageId, reactions);
      });
    }

    // Fetch attachments for all messages
    const attachmentsMap = allMessageIds.length > 0
      ? await this.attachmentsRepo.findByMessageIds(allMessageIds)
      : new Map();

    // Generate download URLs for attachments
    const attachmentsWithUrls = new Map<string, Array<{
      id: string;
      fileId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      downloadUrl?: string;
      thumbnailUrl?: string;
    }>>();

    // Collect all fileIds to fetch presigned URLs in batch
    const allFileIds: string[] = [];
    for (const attachments of attachmentsMap.values()) {
      for (const att of attachments) {
        allFileIds.push(att.fileId);
      }
    }

    // Get presigned URLs for all files in batch
    const urlsMap = new Map<string, string>();
    if (allFileIds.length > 0) {
      try {
        const urlResults = await this.fileStorageClient.getPresignedGetUrls(allFileIds);
        for (const urlResult of urlResults) {
          urlsMap.set(urlResult.id, urlResult.presignedUrl);
        }
      } catch (err) {
        this.logger.warn(`Failed to get download URLs: ${err.message}`);
      }
    }

    for (const [messageId, attachments] of attachmentsMap.entries()) {
      const withUrls = attachments.map((att) => ({
        id: att.id,
        fileId: att.fileId,
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        downloadUrl: urlsMap.get(att.fileId),
        thumbnailUrl: att.thumbnailUrl,
      }));
      attachmentsWithUrls.set(messageId, withUrls);
    }

    return {
      items: rs.items.map(m => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        orgId: m.orgId,
        threadId: m.threadId ?? null,
        type: m.type,
        content: m.content,
        metadata: m.metadata,
        sentAt: m.createdAt.toISOString(),
        replyCount: m.threadId ? undefined : (replyCountMap.get(m.id) || 0),
        reactions: reactionsMap.get(m.id) || [],
        attachments: attachmentsWithUrls.get(m.id) || [],
      })),
      pageState: rs.pageState,
    };
  }

  async listThreadMessages(roomId: string, threadId: string, paging?: { pageSize?: number; pageState?: string }) {
    const rs = await this.messagesRepo.listByThread(roomId, threadId, paging);

    return {
      items: rs.items.map(m => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        orgId: m.orgId,
        threadId: m.threadId ?? null,
        type: m.type,
        content: m.content,
        sentAt: m.createdAt.toISOString(),
      })),
      pageState: rs.pageState,
    };
  }

  // ============== UC06: Thread ==============

  /**
   * UC06: Get thread info with reply count and last reply
   */
  async getThreadInfo(roomId: string, threadId: string, userId: string) {
    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to view thread');

    // Get parent message
    const parentMessage = await this.messagesRepo.findById(threadId);
    if (!parentMessage) throw new NotFoundException('Thread not found');
    if (parentMessage.roomId !== roomId) throw new NotFoundException('Thread not found in this room');

    // Get reply count
    const replyCount = await this.messagesRepo.countRepliesByThreadId(roomId, threadId);

    // Get last reply
    const lastReply = await this.messagesRepo.getLastReply(roomId, threadId);

    return {
      threadId,
      roomId,
      parentMessage: {
        id: parentMessage.id,
        content: parentMessage.content,
        userId: parentMessage.userId,
        createdAt: parentMessage.createdAt.toISOString(),
      },
      replyCount,
      lastReply: lastReply ? {
        id: lastReply.id,
        content: lastReply.content,
        userId: lastReply.userId,
        createdAt: lastReply.createdAt.toISOString(),
      } : null,
    };
  }

  /**
   * UC06: Get reply count for a specific thread
   */
  async getThreadReplyCount(roomId: string, threadId: string): Promise<number> {
    return this.messagesRepo.countRepliesByThreadId(roomId, threadId);
  }

  async listRoomsForOrg(orgId: string) {
    const { items } = await this.roomsRepo.listByOrg(orgId, { limit: 100 });
    return items.map((room) => ({
      id: room.id,
      orgId: room.orgId,
      name: room.name,
      isPrivate: room.isPrivate,
    }));
  }

  // ============== UC07: Message Interactions ==============

  /**
   * UC07: Edit message
   * - Only message author can edit
   */
  async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    await this.messagesRepo.updateContent(messageId, newContent);

    return {
      id: messageId,
      content: newContent,
      editedAt: new Date().toISOString(),
    };
  }

  /**
   * UC07: Delete message (soft delete)
   * - Message author can delete their own messages
   * - Room admins can delete any message
   */
  async deleteMessage(messageId: string, userId: string, orgId: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const isAuthor = message.userId === userId;

    if (!isAuthor) {
      // Check if user is room admin
      const member = await this.roomMembersRepo.get(message.roomId, userId);
      if (!member || member.role !== 'ADMIN') {
        throw new ForbiddenException('You can only delete your own messages or be a room admin');
      }
    }

    await this.messagesRepo.softDelete(messageId);

    return { deleted: true, messageId };
  }

  /**
   * UC07: Add reaction to message
   */
  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Check if user is member of the room
    const isMember = await this.roomMembersRepo.isMember(message.roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to react');

    // Check if already reacted with same emoji
    const hasReacted = await this.reactionsRepo.hasUserReacted(messageId, userId, emoji);
    if (hasReacted) throw new BadRequestException('You already reacted with this emoji');

    const reaction = await this.reactionsRepo.addReaction(messageId, userId, emoji);

    return {
      id: reaction.id,
      messageId,
      userId,
      emoji,
      createdAt: reaction.createdAt.toISOString(),
    };
  }

  /**
   * UC07: Remove reaction from message
   */
  async removeReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const removed = await this.reactionsRepo.removeReaction(messageId, userId, emoji);
    if (!removed) throw new NotFoundException('Reaction not found');

    return { removed: true, messageId, emoji };
  }

  /**
   * UC07: Get reactions for a message
   */
  async getReactions(messageId: string) {
    const reactions = await this.reactionsRepo.getReactionsByMessage(messageId);
    const counts = await this.reactionsRepo.getReactionCounts(messageId);

    // Group by emoji
    const groupedReactions: Record<string, { count: number; users: string[] }> = {};

    reactions.forEach(r => {
      if (!groupedReactions[r.emoji]) {
        groupedReactions[r.emoji] = { count: 0, users: [] };
      }
      groupedReactions[r.emoji].users.push(r.userId);
    });

    // Set counts
    counts.forEach((count, emoji) => {
      if (groupedReactions[emoji]) {
        groupedReactions[emoji].count = count;
      }
    });

    return {
      messageId,
      reactions: groupedReactions,
    };
  }

  /**
   * UC07: Pin message
   * - Only room members can pin
   */
  async pinMessage(messageId: string, userId: string, orgId: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(message.roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to pin messages');

    // Check if already pinned
    const isPinned = await this.pinnedMessagesRepo.isPinned(message.roomId, messageId);
    if (isPinned) throw new BadRequestException('Message is already pinned');

    const pinned = await this.pinnedMessagesRepo.pinMessage(message.roomId, messageId, userId);

    return {
      id: pinned.id,
      roomId: message.roomId,
      messageId,
      pinnedBy: userId,
      pinnedAt: pinned.pinnedAt.toISOString(),
    };
  }

  /**
   * UC07: Unpin message
   * - Original pinner or room admin can unpin
   */
  async unpinMessage(messageId: string, userId: string, orgId: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const unpinned = await this.pinnedMessagesRepo.unpinMessage(message.roomId, messageId);
    if (!unpinned) throw new NotFoundException('Message is not pinned');

    return { unpinned: true, messageId };
  }

  /**
   * UC07: Get pinned messages for a room
   */
  async getPinnedMessages(roomId: string, userId: string) {
    // Verify user is a member
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to view pinned messages');

    const { items, total } = await this.pinnedMessagesRepo.getPinnedMessages(roomId);

    // Fetch message details for each pinned message
    const pinnedWithMessages = await Promise.all(
      items.map(async (p) => {
        const message = await this.messagesRepo.findById(p.messageId);
        return {
          ...p,
          pinnedAt: p.pinnedAt.toISOString(),
          message: message ? {
            id: message.id,
            content: message.content,
            userId: message.userId,
            createdAt: message.createdAt.toISOString(),
          } : null,
        };
      })
    );

    return {
      roomId,
      items: pinnedWithMessages,
      total,
    };
  }

  // ============== UC08/09: File Attachments ==============

  /**
   * UC08: Create presigned URL for file upload
   * Returns a presigned URL that client can use to upload directly to storage
   */
  async createAttachmentUploadUrl(
    roomId: string,
    userId: string,
    orgId: string,
    file: { originalName: string; mimeType: string; size: number }
  ) {
    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to upload files');

    // Create presigned URL via file-storage service
    const result = await this.fileStorageClient.createPresignedUrl({
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      service: 'chat',
      modelType: 'message-attachment',
      subjectId: roomId,
      uploadedBy: userId,
      orgId: orgId,
    });

    return {
      assetId: result.assetId,
      presignedUrl: result.presignedUrl,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * UC08: Confirm upload and attach file to message
   * Called after client uploads file directly to storage
   */
  async confirmAttachmentUpload(
    messageId: string,
    assetId: string,
    userId: string,
  ) {
    // Get message
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Check if user is the message author
    if (message.userId !== userId) {
      throw new ForbiddenException('You can only attach files to your own messages');
    }

    // Confirm upload with file-storage service
    const fileMetadata = await this.fileStorageClient.confirmUpload(assetId);

    // Save attachment to database
    const attachment = await this.attachmentsRepo.create({
      messageId,
      fileId: fileMetadata.id,
      fileName: fileMetadata.originalName,
      fileSize: fileMetadata.size,
      mimeType: fileMetadata.mimeType,
    });

    // Get presigned download URL for immediate display
    let downloadUrl: string | undefined;
    try {
      const urlResult = await this.fileStorageClient.getPresignedGetUrl(fileMetadata.id);
      downloadUrl = urlResult.presignedUrl;
    } catch (err) {
      console.error('Failed to get presigned URL for attachment:', err.message);
    }

    return {
      id: attachment.id,
      messageId,
      fileId: attachment.fileId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      downloadUrl,
      createdAt: attachment.createdAt.toISOString(),
    };
  }

  /**
   * UC09: Get attachments for a message with presigned download URLs
   */
  async getMessageAttachments(messageId: string, userId: string) {
    const message = await this.messagesRepo.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(message.roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to view attachments');

    const attachments = await this.attachmentsRepo.findByMessageId(messageId);

    if (attachments.length === 0) {
      return { messageId, attachments: [] };
    }

    // Get presigned URLs for all attachments
    const fileIds = attachments.map(a => a.fileId);
    const presignedUrls = await this.fileStorageClient.getPresignedGetUrls(fileIds);

    // Map presigned URLs to attachments
    const urlMap = new Map(presignedUrls.map(u => [u.id, u.presignedUrl]));

    return {
      messageId,
      attachments: attachments.map(a => ({
        id: a.id,
        fileId: a.fileId,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        downloadUrl: urlMap.get(a.fileId) || null,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  /**
   * UC09: Get single attachment download URL
   */
  async getAttachmentDownloadUrl(attachmentId: string, userId: string) {
    // Find attachment by ID
    const attachment = await this.attachmentsRepo.findById(attachmentId);

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const message = await this.messagesRepo.findById(attachment.messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(message.roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to download files');

    const presignedUrl = await this.fileStorageClient.getPresignedGetUrl(attachment.fileId);

    return {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      downloadUrl: presignedUrl.presignedUrl,
      expiresIn: presignedUrl.expiresIn,
    };
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string, userId: string) {
    // Find attachment by ID
    const attachment = await this.attachmentsRepo.findById(attachmentId);
    if (!attachment) throw new NotFoundException('Attachment not found');

    // Get the message to verify ownership
    const message = await this.messagesRepo.findById(attachment.messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Only message author can delete attachments
    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete attachments from your own messages');
    }

    await this.attachmentsRepo.delete(attachmentId);

    return { deleted: true };
  }

  // ============== UC10: Search ==============

  /**
   * UC10: Search messages within a specific room
   */
  async searchInRoom(
    roomId: string,
    userId: string,
    orgId: string,
    query: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      fromUserId?: string;
    } = {},
  ) {
    // Check if user is member of the room
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to search in this room');

    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const filters = {
      roomId,
      userId: options.fromUserId,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
    };

    const result = await this.searchRepo.searchMessages(
      orgId,
      query,
      filters,
      { limit: options.limit, offset: options.offset },
    );

    return {
      query,
      roomId,
      total: result.total,
      items: result.items.map(item => ({
        id: item.id,
        roomId: item.roomId,
        userId: item.userId,
        threadId: item.threadId,
        content: item.content,
        type: item.type,
        createdAt: item.createdAt.toISOString(),
        highlight: item.highlight,
      })),
    };
  }

  /**
   * UC10: Search messages across all rooms user is member of
   */
  async searchAllRooms(
    userId: string,
    orgId: string,
    query: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      fromUserId?: string;
    } = {},
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    // Get all rooms user is member of
    const memberRooms = await this.roomMembersRepo.findRoomIdsByUser(userId, orgId);
    if (memberRooms.length === 0) {
      return { query, total: 0, items: [] };
    }

    const filters = {
      userId: options.fromUserId,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
    };

    const result = await this.searchRepo.searchInUserRooms(
      userId,
      orgId,
      memberRooms,
      query,
      filters,
      { limit: options.limit, offset: options.offset },
    );

    return {
      query,
      total: result.total,
      items: result.items.map(item => ({
        id: item.id,
        roomId: item.roomId,
        userId: item.userId,
        threadId: item.threadId,
        content: item.content,
        type: item.type,
        createdAt: item.createdAt.toISOString(),
        highlight: item.highlight,
      })),
    };
  }

  // ============== UC15: Notification Settings ==============

  /**
   * UC15: Get notification settings for a room
   */
  async getNotificationSettings(roomId: string, userId: string) {
    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to view notification settings');

    const settings = await this.notificationSettingsRepo.getOrCreate(roomId, userId);

    return {
      roomId,
      userId,
      level: settings.level,
      mutedUntil: settings.mutedUntil?.toISOString() || null,
      soundEnabled: settings.soundEnabled,
      pushEnabled: settings.pushEnabled,
    };
  }

  /**
   * UC15: Update notification settings for a room
   */
  async updateNotificationSettings(
    roomId: string,
    userId: string,
    data: {
      level?: NotificationLevel;
      soundEnabled?: boolean;
      pushEnabled?: boolean;
    },
  ) {
    // Check if user is member
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to update notification settings');

    const settings = await this.notificationSettingsRepo.update(roomId, userId, data);

    return {
      roomId,
      userId,
      level: settings.level,
      mutedUntil: settings.mutedUntil?.toISOString() || null,
      soundEnabled: settings.soundEnabled,
      pushEnabled: settings.pushEnabled,
    };
  }

  /**
   * UC15: Mute a room
   * @param duration Duration in seconds (null = mute indefinitely)
   */
  async muteRoom(roomId: string, userId: string, duration?: number) {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to mute this room');

    const settings = await this.notificationSettingsRepo.mute(roomId, userId, duration);

    return {
      roomId,
      userId,
      muted: true,
      mutedUntil: settings.mutedUntil?.toISOString() || null,
    };
  }

  /**
   * UC15: Unmute a room
   */
  async unmuteRoom(roomId: string, userId: string) {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to unmute this room');

    await this.notificationSettingsRepo.unmute(roomId, userId);

    return {
      roomId,
      userId,
      muted: false,
    };
  }

  /**
   * UC15: Get unread count for a room
   */
  async getUnreadCount(roomId: string, userId: string) {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to get unread count');

    // Get last seen message ID
    const lastSeenId = await this.roomMembersRepo.getLastSeen(roomId, userId);

    // Count messages after last seen
    const count = await this.messagesRepo.countAfterMessage(roomId, lastSeenId);

    return {
      roomId,
      unreadCount: count,
      lastSeenMessageId: lastSeenId,
    };
  }

  /**
   * UC15: Get unread counts for all rooms user is member of
   */
  async getAllUnreadCounts(userId: string, orgId: string) {
    const roomIds = await this.roomMembersRepo.findRoomIdsByUser(userId, orgId);
    if (roomIds.length === 0) return { rooms: [] };

    const unreadCounts = await Promise.all(
      roomIds.map(async (roomId) => {
        const lastSeenId = await this.roomMembersRepo.getLastSeen(roomId, userId);
        const count = await this.messagesRepo.countAfterMessage(roomId, lastSeenId);
        return { roomId, unreadCount: count };
      })
    );

    // Only return rooms with unread messages
    const roomsWithUnread = unreadCounts.filter(r => r.unreadCount > 0);

    return {
      totalUnread: roomsWithUnread.reduce((sum, r) => sum + r.unreadCount, 0),
      rooms: roomsWithUnread,
    };
  }

  /**
   * UC15: Mark messages as read (up to a specific message)
   */
  async markAsRead(roomId: string, userId: string, messageId: string) {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to mark messages as read');

    // Verify message exists in this room
    const message = await this.messagesRepo.findById(messageId);
    if (!message || message.roomId !== roomId) {
      throw new NotFoundException('Message not found in this room');
    }

    // Update last seen
    await this.roomMembersRepo.updateLastSeen(roomId, userId, messageId, message.orgId);

    return {
      roomId,
      userId,
      lastSeenMessageId: messageId,
      markedAt: new Date().toISOString(),
    };
  }

  /**
   * UC15: Mark all messages in a room as read
   */
  async markAllAsRead(roomId: string, userId: string) {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You must be a member to mark messages as read');

    // Get the latest message in the room
    const latestMessage = await this.messagesRepo.getLatestMessage(roomId);
    if (!latestMessage) {
      return { roomId, userId, lastSeenMessageId: null };
    }

    // Update last seen to latest message
    await this.roomMembersRepo.updateLastSeen(roomId, userId, latestMessage.id, latestMessage.orgId);

    return {
      roomId,
      userId,
      lastSeenMessageId: latestMessage.id,
      markedAt: new Date().toISOString(),
    };
  }

  // ============== Mention Notifications ==============

  /**
   * Send notifications to mentioned users
   * - Filters out self-mentions (sender mentioning themselves)
   * - Only notifies users who are members of the room
   */
  async sendMentionNotifications(data: {
    messageId: string;
    roomId: string;
    senderId: string;
    mentionedUserIds: string[];
    messagePreview: string;
    orgId: string;
  }) {
    // Filter out self-mentions
    const userIdsToNotify = data.mentionedUserIds.filter(id => id !== data.senderId);

    if (userIdsToNotify.length === 0) return;

    try {
      // Get room info for notification context
      const room = await this.roomsRepo.findById(data.roomId);
      const roomName = room?.name || 'a conversation';

      // Only notify users who are actually members of the room
      const validUserIds: string[] = [];
      for (const userId of userIdsToNotify) {
        const isMember = await this.roomMembersRepo.isMember(data.roomId, userId);
        if (isMember) {
          validUserIds.push(userId);
        }
      }

      if (validUserIds.length === 0) return;

      // Strip HTML from preview
      const textPreview = this.stripHtml(data.messagePreview);
      const truncatedPreview = textPreview.length > 100
        ? textPreview.substring(0, 100) + '...'
        : textPreview;

      this.logger.log(`Sending mention notifications to ${validUserIds.length} users for message ${data.messageId}`);

      // Send notifications to each mentioned user via notification service
      await Promise.all(validUserIds.map(async (userId) => {
        try {
          await firstValueFrom(
            this.httpService.post(`${NOTIFICATION_SERVICE_URL}/notifications/internal`, {
              userId,
              orgId: data.orgId,
              type: 'CHAT_MENTION',
              title: 'You were mentioned',
              content: `in ${roomName}: "${truncatedPreview}"`,
              metadata: {
                messageId: data.messageId,
                roomId: data.roomId,
                roomName,
                senderId: data.senderId,
              },
            })
          );
        } catch (err) {
          this.logger.warn(`Failed to send mention notification to user ${userId}: ${err.message}`);
        }
      }));

    } catch (error) {
      // Don't throw - notification failure shouldn't fail message sending
      this.logger.error('Failed to send mention notifications:', error);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
