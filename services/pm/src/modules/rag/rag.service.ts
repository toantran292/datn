import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { SimilarIssueDto, SimilaritySearchDto } from './dto/rag.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Find similar issues using vector similarity search
   */
  async findSimilarIssues(
    options: SimilaritySearchDto,
  ): Promise<SimilarIssueDto[]> {
    const { query, limit = 10, projectId, threshold = 0.7 } = options;

    // 1. Generate embedding for query
    const queryEmbedding = await this.embeddingService.generateEmbedding(
      query,
    );
    const embeddingJson = JSON.stringify(queryEmbedding);

    // 2. Build WHERE clause for project filter
    const whereClause = projectId
      ? Prisma.sql`AND i."project_id" = ${projectId}::uuid`
      : Prisma.empty;

    // 3. Perform vector similarity search
    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        type: string;
        priority: string;
        point: number | null;
        similarity: number;
      }>
    >`
      SELECT
        i.id,
        i.name,
        i.description,
        i.type,
        i.priority,
        i.point,
        1 - (CAST(i.embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536))) as similarity
      FROM "issue" i
      WHERE i.embedding IS NOT NULL
        ${whereClause}
        AND (1 - (CAST(i.embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536)))) >= ${threshold}
      ORDER BY CAST(i.embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536))
      LIMIT ${limit}
    `;

    this.logger.log(
      `Found ${results.length} similar issues for query: "${query.slice(0, 50)}..."`,
    );

    return results.map((r) => ({
      ...r,
      point: r.point ? Number(r.point) : null,
    }));
  }

  /**
   * Generate and save embedding for a single issue
   */
  async generateAndSaveEmbedding(issueId: string): Promise<void> {
    // 1. Fetch issue
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        priority: true,
        point: true,
      },
    });

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    // 2. Convert to text
    const text = this.embeddingService.issueToText({
      name: issue.name,
      description: issue.description,
      type: issue.type,
      priority: issue.priority,
      point: issue.point ? Number(issue.point) : null,
    });

    // 3. Generate embedding
    const embedding = await this.embeddingService.generateEmbedding(text);

    // 4. Save to database
    await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        embedding: JSON.stringify(embedding),
        embeddingUpdatedAt: new Date(),
      },
    });

    this.logger.log(`Updated embedding for issue ${issueId}`);
  }

  /**
   * Batch update embeddings for issues without embeddings
   */
  async batchUpdateEmbeddings(batchSize = 50): Promise<number> {
    // Find issues without embeddings
    const issues = await this.prisma.issue.findMany({
      where: {
        OR: [{ embedding: null }, { embeddingUpdatedAt: null }],
      },
      take: batchSize,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        priority: true,
        point: true,
      },
    });

    if (issues.length === 0) {
      this.logger.log('No issues to update');
      return 0;
    }

    let updated = 0;

    for (const issue of issues) {
      try {
        const text = this.embeddingService.issueToText({
          name: issue.name,
          description: issue.description,
          type: issue.type,
          priority: issue.priority,
          point: issue.point ? Number(issue.point) : null,
        });

        const embedding = await this.embeddingService.generateEmbedding(text);

        await this.prisma.issue.update({
          where: { id: issue.id },
          data: {
            embedding: JSON.stringify(embedding),
            embeddingUpdatedAt: new Date(),
          },
        });

        updated++;

        // Rate limiting: 3000 requests/min for OpenAI ≈ 50/second
        // Wait 100ms between requests to be safe
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `Failed to update embedding for issue ${issue.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Updated ${updated}/${issues.length} embeddings`);
    return updated;
  }

  /**
   * Update embedding if relevant fields changed
   */
  async updateEmbeddingIfNeeded(
    issueId: string,
    changedFields: string[],
  ): Promise<void> {
    // Only update if relevant fields changed
    const relevantFields = ['name', 'description', 'type', 'priority', 'point'];
    const shouldUpdate = changedFields.some((field) =>
      relevantFields.includes(field),
    );

    if (shouldUpdate) {
      // Queue for background processing (don't block the request)
      this.generateAndSaveEmbedding(issueId).catch((error) => {
        this.logger.error(
          `Background embedding update failed for ${issueId}: ${error.message}`,
        );
      });
    }
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    total: number;
    withEmbedding: number;
    withoutEmbedding: number;
    percentage: number;
  }> {
    const total = await this.prisma.issue.count();
    const withEmbedding = await this.prisma.issue.count({
      where: { embedding: { not: null } },
    });

    return {
      total,
      withEmbedding,
      withoutEmbedding: total - withEmbedding,
      percentage: total > 0 ? (withEmbedding / total) * 100 : 0,
    };
  }
}
