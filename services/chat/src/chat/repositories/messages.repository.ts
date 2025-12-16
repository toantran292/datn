import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Message } from '../../database/entities/message.entity';

export interface MessageEntity {
  id?: string;
  roomId: string;
  userId: string;
  orgId: string;
  threadId?: string | null;
  type: string;
  content: string;
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
      createdAt: message.createdAt,
    };
  }
}
