import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinnedMessage } from '../../database/entities/pinned-message.entity';

export interface PinnedMessageEntity {
  id: string;
  roomId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: Date;
}

@Injectable()
export class PinnedMessagesRepository {
  constructor(
    @InjectRepository(PinnedMessage)
    private readonly pinnedRepo: Repository<PinnedMessage>,
  ) {}

  async pinMessage(roomId: string, messageId: string, pinnedBy: string): Promise<PinnedMessageEntity> {
    const entity = this.pinnedRepo.create({
      roomId,
      messageId,
      pinnedBy,
    });

    const saved = await this.pinnedRepo.save(entity);

    return {
      id: saved.id,
      roomId: saved.roomId,
      messageId: saved.messageId,
      pinnedBy: saved.pinnedBy,
      pinnedAt: saved.pinnedAt,
    };
  }

  async unpinMessage(roomId: string, messageId: string): Promise<boolean> {
    const result = await this.pinnedRepo.delete({
      roomId,
      messageId,
    });
    return (result.affected ?? 0) > 0;
  }

  async isPinned(roomId: string, messageId: string): Promise<boolean> {
    const count = await this.pinnedRepo.count({
      where: { roomId, messageId },
    });
    return count > 0;
  }

  async getPinnedMessages(
    roomId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<{ items: PinnedMessageEntity[]; total: number }> {
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;

    const [items, total] = await this.pinnedRepo.findAndCount({
      where: { roomId },
      order: { pinnedAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      items: items.map(p => ({
        id: p.id,
        roomId: p.roomId,
        messageId: p.messageId,
        pinnedBy: p.pinnedBy,
        pinnedAt: p.pinnedAt,
      })),
      total,
    };
  }
}
