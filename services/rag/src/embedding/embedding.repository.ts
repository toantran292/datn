import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEmbedding, EmbeddingSourceType } from '../database/entities/document-embedding.entity';

export interface CreateEmbeddingDto {
  namespaceId: string;
  namespaceType?: string;
  orgId: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  content: string;
  chunkIndex?: number;
  chunkTotal?: number;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  namespaceId: string;
  orgId: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
  similarity: number;
  createdAt: Date;
}

export interface SearchOptions {
  namespaceId?: string;
  namespaceIds?: string[];
  namespaceType?: string;
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
      namespaceId: dto.namespaceId,
      namespaceType: dto.namespaceType ?? 'room',
      orgId: dto.orgId,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
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
        namespaceId: dto.namespaceId,
        namespaceType: dto.namespaceType ?? 'room',
        orgId: dto.orgId,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
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

    if (options.namespaceId) {
      conditions.push(`namespace_id = $${paramIndex++}`);
      queryParams.push(options.namespaceId);
    }

    if (options.namespaceIds && options.namespaceIds.length > 0) {
      conditions.push(`namespace_id = ANY($${paramIndex++})`);
      queryParams.push(options.namespaceIds);
    }

    if (options.namespaceType) {
      conditions.push(`namespace_type = $${paramIndex++}`);
      queryParams.push(options.namespaceType);
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
          namespace_id as "namespaceId",
          org_id as "orgId",
          source_type as "sourceType",
          source_id as "sourceId",
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
      namespaceId: row.namespaceId,
      orgId: row.orgId,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
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

  async deleteByNamespaceId(namespaceId: string): Promise<number> {
    const result = await this.embeddingRepo.delete({ namespaceId });
    return result.affected ?? 0;
  }

  async countByNamespace(namespaceId: string): Promise<number> {
    return this.embeddingRepo.count({ where: { namespaceId } });
  }

  async countByOrg(orgId: string): Promise<number> {
    return this.embeddingRepo.count({ where: { orgId } });
  }

  async existsForSource(sourceType: EmbeddingSourceType, sourceId: string): Promise<boolean> {
    const count = await this.embeddingRepo.count({ where: { sourceType, sourceId } });
    return count > 0;
  }

  /**
   * Get stats for a namespace
   */
  async getNamespaceStats(namespaceId: string): Promise<{
    totalEmbeddings: number;
    bySourceType: Record<string, number>;
  }> {
    const total = await this.countByNamespace(namespaceId);

    const byType = await this.embeddingRepo
      .createQueryBuilder('e')
      .select('e.sourceType', 'sourceType')
      .addSelect('COUNT(*)', 'count')
      .where('e.namespaceId = :namespaceId', { namespaceId })
      .groupBy('e.sourceType')
      .getRawMany();

    const bySourceType: Record<string, number> = {};
    byType.forEach((row: any) => {
      bySourceType[row.sourceType] = parseInt(row.count, 10);
    });

    return { totalEmbeddings: total, bySourceType };
  }
}
