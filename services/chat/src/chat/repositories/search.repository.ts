import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../database/entities/message.entity';

export interface SearchResult {
  id: string;
  roomId: string;
  userId: string;
  orgId: string;
  threadId: string | null;
  content: string;
  type: string;
  createdAt: Date;
  highlight?: string;
}

export interface SearchFilters {
  roomId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
}

@Injectable()
export class SearchRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  /**
   * Full-text search messages using PostgreSQL tsvector
   * Supports Vietnamese and English through 'simple' config
   * Falls back to ILIKE for short queries (< 3 chars) where full-text search doesn't work well
   */
  async searchMessages(
    orgId: string,
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<{ items: SearchResult[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const trimmedQuery = query.trim();

    // Use ILIKE for short queries (1-2 chars) where full-text search doesn't work well
    if (trimmedQuery.length < 3) {
      return this.searchMessagesWithILike(orgId, trimmedQuery, filters, options);
    }

    // Sanitize query for tsquery
    const sanitizedQuery = this.sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      return { items: [], total: 0 };
    }

    // Build the query
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .select([
        'm.id',
        'm.room_id as "roomId"',
        'm.user_id as "userId"',
        'm.org_id as "orgId"',
        'm.thread_id as "threadId"',
        'm.content',
        'm.type',
        'm.created_at as "createdAt"',
        `ts_headline('simple', m.content, to_tsquery('simple', :query), 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as highlight`,
      ])
      .where('m.org_id = :orgId', { orgId })
      .andWhere('m.deleted_at IS NULL')
      .andWhere(`to_tsvector('simple', m.content) @@ to_tsquery('simple', :query)`, { query: sanitizedQuery });

    // Apply filters
    if (filters.roomId) {
      qb.andWhere('m.room_id = :roomId', { roomId: filters.roomId });
    }

    if (filters.userId) {
      qb.andWhere('m.user_id = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      qb.andWhere('m.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('m.created_at <= :endDate', { endDate: filters.endDate });
    }

    if (filters.type) {
      qb.andWhere('m.type = :type', { type: filters.type });
    }

    // Get total count
    const countQb = qb.clone();
    const total = await countQb.getCount();

    // Get results with pagination
    const results = await qb
      .orderBy(`ts_rank(to_tsvector('simple', m.content), to_tsquery('simple', :query))`, 'DESC')
      .addOrderBy('m.created_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .setParameter('query', sanitizedQuery)
      .getRawMany();

    return {
      items: results.map(r => ({
        id: r.m_id || r.id,
        roomId: r.roomId || r.m_room_id,
        userId: r.userId || r.m_user_id,
        orgId: r.orgId || r.m_org_id,
        threadId: r.threadId || r.m_thread_id || null,
        content: r.content || r.m_content,
        type: r.type || r.m_type,
        createdAt: r.createdAt || r.m_created_at,
        highlight: r.highlight,
      })),
      total,
    };
  }

  /**
   * Simple search using ILIKE (fallback for short queries)
   */
  async searchMessagesSimple(
    orgId: string,
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<{ items: SearchResult[]; total: number }> {
    return this.searchMessagesWithILike(orgId, query, filters, options);
  }

  /**
   * Internal ILIKE search implementation
   */
  private async searchMessagesWithILike(
    orgId: string,
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<{ items: SearchResult[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.org_id = :orgId', { orgId })
      .andWhere('m.deleted_at IS NULL')
      .andWhere('m.content ILIKE :query', { query: `%${query}%` });

    // Apply filters
    if (filters.roomId) {
      qb.andWhere('m.room_id = :roomId', { roomId: filters.roomId });
    }

    if (filters.userId) {
      qb.andWhere('m.user_id = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      qb.andWhere('m.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('m.created_at <= :endDate', { endDate: filters.endDate });
    }

    if (filters.type) {
      qb.andWhere('m.type = :type', { type: filters.type });
    }

    const [items, total] = await qb
      .orderBy('m.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(m => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        orgId: m.orgId,
        threadId: m.threadId,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt,
        highlight: this.highlightMatch(m.content, query),
      })),
      total,
    };
  }

  /**
   * Search messages within rooms user is member of
   * Falls back to ILIKE for short queries (< 3 chars) where full-text search doesn't work well
   */
  async searchInUserRooms(
    userId: string,
    orgId: string,
    roomIds: string[],
    query: string,
    filters: Omit<SearchFilters, 'roomId'> = {},
    options: SearchOptions = {},
  ): Promise<{ items: SearchResult[]; total: number }> {
    if (roomIds.length === 0) {
      return { items: [], total: 0 };
    }

    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const trimmedQuery = query.trim();

    // Use ILIKE for short queries (1-2 chars) where full-text search doesn't work well
    if (trimmedQuery.length < 3) {
      return this.searchInUserRoomsWithILike(orgId, roomIds, trimmedQuery, filters, options);
    }

    const sanitizedQuery = this.sanitizeSearchQuery(query);

    if (!sanitizedQuery) {
      return { items: [], total: 0 };
    }

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.org_id = :orgId', { orgId })
      .andWhere('m.room_id IN (:...roomIds)', { roomIds })
      .andWhere('m.deleted_at IS NULL')
      .andWhere(`to_tsvector('simple', m.content) @@ to_tsquery('simple', :query)`, { query: sanitizedQuery });

    // Apply filters
    if (filters.userId) {
      qb.andWhere('m.user_id = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      qb.andWhere('m.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('m.created_at <= :endDate', { endDate: filters.endDate });
    }

    const [items, total] = await qb
      .orderBy('m.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(m => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        orgId: m.orgId,
        threadId: m.threadId,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt,
        highlight: this.highlightMatch(m.content, query),
      })),
      total,
    };
  }

  /**
   * Internal ILIKE search for user rooms (for short queries)
   */
  private async searchInUserRoomsWithILike(
    orgId: string,
    roomIds: string[],
    query: string,
    filters: Omit<SearchFilters, 'roomId'> = {},
    options: SearchOptions = {},
  ): Promise<{ items: SearchResult[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.org_id = :orgId', { orgId })
      .andWhere('m.room_id IN (:...roomIds)', { roomIds })
      .andWhere('m.deleted_at IS NULL')
      .andWhere('m.content ILIKE :query', { query: `%${query}%` });

    // Apply filters
    if (filters.userId) {
      qb.andWhere('m.user_id = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      qb.andWhere('m.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('m.created_at <= :endDate', { endDate: filters.endDate });
    }

    const [items, total] = await qb
      .orderBy('m.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(m => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        orgId: m.orgId,
        threadId: m.threadId,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt,
        highlight: this.highlightMatch(m.content, query),
      })),
      total,
    };
  }

  /**
   * Sanitize search query for PostgreSQL tsquery
   * Convert to prefix search format for partial matching
   */
  private sanitizeSearchQuery(query: string): string {
    // Remove special characters that could break tsquery
    const cleaned = query
      .trim()
      .replace(/[&|!():*<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Convert each word to prefix search (word:*) for partial matching
    // This allows "don" to match "done", "donation", etc.
    const words = cleaned.split(' ').filter(w => w.length > 0);
    return words.map(word => `${word}:*`).join(' & ');
  }

  /**
   * Simple highlight for ILIKE search
   */
  private highlightMatch(content: string, query: string): string {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
  }
}
