import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Message } from '../../database/entities/message.entity';

export interface MessageEntity {
  id?: string;
  roomId: string;
  userId: string;
  orgId: string;
  threadId?: string | null;
  type: string;
  content: string;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
}

export interface PersistedMessage {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  threadId: string | null;
  type: string;
  content: string;
  metadata?: Record<string, any> | null;
  createdAt: Date;
}

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async create(msg: MessageEntity): Promise<PersistedMessage> {
    const entity = this.messageRepo.create({
      roomId: msg.roomId,
      userId: msg.userId,
      orgId: msg.orgId,
      threadId: msg.threadId ?? null,
      type: msg.type as any,
      content: msg.content,
      metadata: msg.metadata ?? null,
    });

    const saved = await this.messageRepo.save(entity);

    return {
      id: saved.id,
      roomId: saved.roomId,
      userId: saved.userId,
      orgId: saved.orgId,
      threadId: saved.threadId,
      type: saved.type,
      content: saved.content,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
    };
  }

  async listByRoom(
    roomId: string,
    opts: { pageSize?: number; pageState?: string } = {},
  ): Promise<{ items: PersistedMessage[]; pageState?: string }> {
    const limit = opts.pageSize ?? 50;
    const offset = opts.pageState ? parseInt(opts.pageState, 10) : 0;

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { roomId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
      skip: offset,
      take: limit,
    });

    const items: PersistedMessage[] = messages.map((row) => ({
      id: row.id,
      roomId: row.roomId,
      userId: row.userId,
      orgId: row.orgId,
      threadId: row.threadId,
      type: row.type,
      content: row.content,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));

    const nextOffset = offset + messages.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pageState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async listByThread(
    roomId: string,
    threadId: string,
    opts: { pageSize?: number; pageState?: string } = {},
  ): Promise<{ items: PersistedMessage[]; pageState?: string }> {
    const limit = opts.pageSize ?? 50;
    const offset = opts.pageState ? parseInt(opts.pageState, 10) : 0;

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { roomId, threadId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
      skip: offset,
      take: limit,
    });

    const items: PersistedMessage[] = messages.map((row) => ({
      id: row.id,
      roomId: row.roomId,
      userId: row.userId,
      orgId: row.orgId,
      threadId: row.threadId,
      type: row.type,
      content: row.content,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));

    const nextOffset = offset + messages.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pageState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async countRepliesByThreadId(roomId: string, threadId: string): Promise<number> {
    return this.messageRepo.count({
      where: { roomId, threadId, deletedAt: IsNull() },
    });
  }

  async findById(id: string): Promise<PersistedMessage | null> {
    const message = await this.messageRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!message) return null;

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      orgId: message.orgId,
      threadId: message.threadId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      createdAt: message.createdAt,
    };
  }

  async updateContent(id: string, content: string): Promise<void> {
    await this.messageRepo.update(id, {
      content,
      editedAt: new Date(),
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.messageRepo.update(id, {
      deletedAt: new Date(),
    });
  }

  async getReplyCountsForMessages(
    roomId: string,
    messageIds: string[],
  ): Promise<Map<string, number>> {
    if (messageIds.length === 0) return new Map();

    const counts = await this.messageRepo
      .createQueryBuilder('m')
      .select('m.thread_id', 'threadId')
      .addSelect('COUNT(*)', 'count')
      .where('m.room_id = :roomId', { roomId })
      .andWhere('m.thread_id IN (:...messageIds)', { messageIds })
      .andWhere('m.deleted_at IS NULL')
      .groupBy('m.thread_id')
      .getRawMany();

    const result = new Map<string, number>();
    for (const row of counts) {
      result.set(row.threadId, parseInt(row.count, 10));
    }
    return result;
  }

  async getLastReply(roomId: string, threadId: string): Promise<PersistedMessage | null> {
    const message = await this.messageRepo.findOne({
      where: { roomId, threadId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (!message) return null;

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      orgId: message.orgId,
      threadId: message.threadId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      createdAt: message.createdAt,
    };
  }

  async countAfterMessage(roomId: string, afterMessageId: string | null): Promise<number> {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.room_id = :roomId', { roomId })
      .andWhere('m.deleted_at IS NULL')
      .andWhere('m.thread_id IS NULL'); // Only count main messages, not replies

    if (afterMessageId) {
      // Get the timestamp of the reference message
      const refMessage = await this.messageRepo.findOne({
        where: { id: afterMessageId },
        select: ['createdAt'],
      });

      if (refMessage) {
        qb.andWhere('m.created_at > :afterTime', { afterTime: refMessage.createdAt });
      }
    }

    return qb.getCount();
  }

  async getLatestMessage(roomId: string): Promise<PersistedMessage | null> {
    const message = await this.messageRepo.findOne({
      where: { roomId, deletedAt: IsNull(), threadId: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (!message) return null;

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      orgId: message.orgId,
      threadId: message.threadId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      createdAt: message.createdAt,
    };
  }

  async findByIds(ids: string[]): Promise<Map<string, PersistedMessage>> {
    if (ids.length === 0) return new Map();

    const messages = await this.messageRepo.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });

    const result = new Map<string, PersistedMessage>();
    for (const msg of messages) {
      result.set(msg.id, {
        id: msg.id,
        roomId: msg.roomId,
        userId: msg.userId,
        orgId: msg.orgId,
        threadId: msg.threadId,
        type: msg.type,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      });
    }
    return result;
  }

  /**
   * Find huddle message by meetingId
   * Used to find the thread parent for meeting chat messages
   */
  async findHuddleMessageByMeetingId(
    roomId: string,
    meetingId: string,
  ): Promise<PersistedMessage | null> {
    // Find huddle_started or huddle_ended message with matching meetingId in metadata
    const message = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.room_id = :roomId', { roomId })
      .andWhere('m.type IN (:...types)', { types: ['huddle_started', 'huddle_ended'] })
      .andWhere('m.deleted_at IS NULL')
      .andWhere("m.metadata->>'meetingId' = :meetingId", { meetingId })
      .orderBy('m.created_at', 'DESC')
      .getOne();

    if (!message) return null;

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      orgId: message.orgId,
      threadId: message.threadId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      createdAt: message.createdAt,
    };
  }

  /**
   * Find huddle_started message by meetingId
   * Used to update it when huddle ends
   */
  async findHuddleStartedMessage(
    roomId: string,
    meetingId: string,
  ): Promise<PersistedMessage | null> {
    const message = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.room_id = :roomId', { roomId })
      .andWhere('m.type = :type', { type: 'huddle_started' })
      .andWhere('m.deleted_at IS NULL')
      .andWhere("m.metadata->>'meetingId' = :meetingId", { meetingId })
      .getOne();

    if (!message) return null;

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      orgId: message.orgId,
      threadId: message.threadId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      createdAt: message.createdAt,
    };
  }

  /**
   * Update huddle message type and metadata
   * Used when huddle ends to convert huddle_started to huddle_ended
   */
  async updateHuddleMessage(
    id: string,
    data: {
      type: string;
      metadata: Record<string, any>;
    },
  ): Promise<PersistedMessage | null> {
    await this.messageRepo.update(id, {
      type: data.type as any,
      metadata: data.metadata,
      editedAt: new Date(),
    });

    return this.findById(id);
  }
}
