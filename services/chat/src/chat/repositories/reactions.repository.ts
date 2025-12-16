import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageReaction } from '../../database/entities/message-reaction.entity';

export interface ReactionEntity {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

@Injectable()
export class ReactionsRepository {
  constructor(
    @InjectRepository(MessageReaction)
    private readonly reactionRepo: Repository<MessageReaction>,
  ) {}

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ReactionEntity> {
    const entity = this.reactionRepo.create({
      messageId,
      userId,
      emoji,
    });

    const saved = await this.reactionRepo.save(entity);

    return {
      id: saved.id,
      messageId: saved.messageId,
      userId: saved.userId,
      emoji: saved.emoji,
      createdAt: saved.createdAt,
    };
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    const result = await this.reactionRepo.delete({
      messageId,
      userId,
      emoji,
    });
    return (result.affected ?? 0) > 0;
  }

  async getReactionsByMessage(messageId: string): Promise<ReactionEntity[]> {
    const reactions = await this.reactionRepo.find({
      where: { messageId },
      order: { createdAt: 'ASC' },
    });

    return reactions.map(r => ({
      id: r.id,
      messageId: r.messageId,
      userId: r.userId,
      emoji: r.emoji,
      createdAt: r.createdAt,
    }));
  }

  async getReactionCounts(messageId: string): Promise<Map<string, number>> {
    const counts = await this.reactionRepo
      .createQueryBuilder('r')
      .select('r.emoji', 'emoji')
      .addSelect('COUNT(*)', 'count')
      .where('r.message_id = :messageId', { messageId })
      .groupBy('r.emoji')
      .getRawMany();

    const result = new Map<string, number>();
    for (const row of counts) {
      result.set(row.emoji, parseInt(row.count, 10));
    }
    return result;
  }

  async hasUserReacted(messageId: string, userId: string, emoji: string): Promise<boolean> {
    const count = await this.reactionRepo.count({
      where: { messageId, userId, emoji },
    });
    return count > 0;
  }
}
