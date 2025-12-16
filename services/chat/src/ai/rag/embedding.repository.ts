import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEmbedding, EmbeddingSourceType } from '../../database/entities/document-embedding.entity';

export interface CreateEmbeddingDto {
  sourceType: EmbeddingSourceType;
  sourceId: string;
  roomId: string;
  orgId: string;
  content: string;
  chunkIndex?: number;
  chunkTotal?: number;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  roomId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
  similarity: number;
  createdAt: Date;
}

export interface SearchOptions {
  roomId?: string;
  orgId?: string;
  sourceTypes?: EmbeddingSourceType[];
  limit?: number;
  minSimilarity?: number;
}

@Injectable()
export class EmbeddingRepository {
  constructor(
    @InjectRepository(DocumentEmbedding)
    private readonly embeddingRepo: Repository<DocumentEmbedding>,
  ) {}

  async create(dto: CreateEmbeddingDto): Promise<DocumentEmbedding> {
    const entity = this.embeddingRepo.create({
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      roomId: dto.roomId,
      orgId: dto.orgId,
      content: dto.content,
      chunkIndex: dto.chunkIndex ?? 0,
      chunkTotal: dto.chunkTotal ?? 1,
      embedding: dto.embedding,
      metadata: dto.metadata ?? {},
    });

    return this.embeddingRepo.save(entity);
  }

  async createBatch(dtos: CreateEmbeddingDto[]): Promise<DocumentEmbedding[]> {
    const entities = dtos.map(dto =>
      this.embeddingRepo.create({
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        roomId: dto.roomId,
        orgId: dto.orgId,
        content: dto.content,
        chunkIndex: dto.chunkIndex ?? 0,
        chunkTotal: dto.chunkTotal ?? 1,
        embedding: dto.embedding,
        metadata: dto.metadata ?? {},
      }),
    );

    return this.embeddingRepo.save(entities);
  }

  /**
   * Semantic search using cosine similarity
   * Note: For production, use pgvector's native operators after enabling the extension
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const limit = options.limit ?? 10;
    const minSimilarity = options.minSimilarity ?? 0.7;

    // Build WHERE conditions dynamically
    const conditions: string[] = ['embedding IS NOT NULL'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (options.roomId) {
      conditions.push(`room_id = $${paramIndex++}`);
      queryParams.push(options.roomId);
    }

    if (options.orgId) {
      conditions.push(`org_id = $${paramIndex++}`);
      queryParams.push(options.orgId);
    }

    if (options.sourceTypes && options.sourceTypes.length > 0) {
      conditions.push(`source_type = ANY($${paramIndex++})`);
      queryParams.push(options.sourceTypes);
    }

    const whereClause = conditions.join(' AND ');
    const embeddingArray = `ARRAY[${queryEmbedding.join(',')}]::float[]`;

    // Add minSimilarity and limit params
    const minSimParamIdx = paramIndex++;
    const limitParamIdx = paramIndex++;
    queryParams.push(minSimilarity, limit);

    // Use raw query with subquery to filter by similarity
    const sql = `
      SELECT * FROM (
        SELECT
          id,
          source_type as "sourceType",
          source_id as "sourceId",
          room_id as "roomId",
          content,
          chunk_index as "chunkIndex",
          metadata,
          created_at as "createdAt",
          (
            SELECT COALESCE(SUM(a * b) / NULLIF(SQRT(SUM(a * a)) * SQRT(SUM(b * b)), 0), 0)
            FROM unnest(embedding) WITH ORDINALITY AS t1(a, ord)
            JOIN unnest(${embeddingArray}) WITH ORDINALITY AS t2(b, ord2)
            ON t1.ord = t2.ord2
          ) as similarity
        FROM document_embeddings
        WHERE ${whereClause}
      ) sub
      WHERE similarity >= $${minSimParamIdx}
      ORDER BY similarity DESC
      LIMIT $${limitParamIdx}
    `;

    const results = await this.embeddingRepo.query(sql, queryParams);

    return results.map((row: any) => ({
      id: row.id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      roomId: row.roomId,
      content: row.content,
      chunkIndex: row.chunkIndex,
      metadata: row.metadata,
      similarity: parseFloat(row.similarity),
      createdAt: row.createdAt,
    }));
  }

  /**
   * Alternative search using pgvector operators (requires pgvector extension)
   */
  async searchSimilarPgvector(
    queryEmbedding: number[],
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const limit = options.limit ?? 10;
    const minSimilarity = options.minSimilarity ?? 0.7;

    // Using pgvector's <=> operator for cosine distance
    // Similarity = 1 - distance
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    let whereClause = 'e.embedding IS NOT NULL';
    const params: any = { limit };

    if (options.roomId) {
      whereClause += ' AND e.room_id = :roomId';
      params.roomId = options.roomId;
    }

    if (options.orgId) {
      whereClause += ' AND e.org_id = :orgId';
      params.orgId = options.orgId;
    }

    if (options.sourceTypes && options.sourceTypes.length > 0) {
      whereClause += ' AND e.source_type = ANY(:sourceTypes)';
      params.sourceTypes = options.sourceTypes;
    }

    // Note: This requires pgvector extension to be enabled
    const query = `
      SELECT
        e.id,
        e.source_type as "sourceType",
        e.source_id as "sourceId",
        e.room_id as "roomId",
        e.content,
        e.chunk_index as "chunkIndex",
        e.metadata,
        e.created_at as "createdAt",
        1 - (e.embedding::vector <=> '${embeddingStr}'::vector) as similarity
      FROM document_embeddings e
      WHERE ${whereClause}
        AND 1 - (e.embedding::vector <=> '${embeddingStr}'::vector) >= ${minSimilarity}
      ORDER BY e.embedding::vector <=> '${embeddingStr}'::vector
      LIMIT :limit
    `;

    const results = await this.embeddingRepo.query(query, [
      params.roomId,
      params.orgId,
      params.sourceTypes,
      params.limit,
    ]);

    return results.map((row: any) => ({
      id: row.id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      roomId: row.roomId,
      content: row.content,
      chunkIndex: row.chunkIndex,
      metadata: row.metadata,
      similarity: parseFloat(row.similarity),
      createdAt: row.createdAt,
    }));
  }

  async findBySourceId(sourceType: EmbeddingSourceType, sourceId: string): Promise<DocumentEmbedding[]> {
    return this.embeddingRepo.find({
      where: { sourceType, sourceId },
      order: { chunkIndex: 'ASC' },
    });
  }

  async deleteBySourceId(sourceType: EmbeddingSourceType, sourceId: string): Promise<number> {
    const result = await this.embeddingRepo.delete({ sourceType, sourceId });
    return result.affected ?? 0;
  }

  async deleteByRoomId(roomId: string): Promise<number> {
    const result = await this.embeddingRepo.delete({ roomId });
    return result.affected ?? 0;
  }

  async countByRoom(roomId: string): Promise<number> {
    return this.embeddingRepo.count({ where: { roomId } });
  }

  async existsForSource(sourceType: EmbeddingSourceType, sourceId: string): Promise<boolean> {
    const count = await this.embeddingRepo.count({ where: { sourceType, sourceId } });
    return count > 0;
  }
}
