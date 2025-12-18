# RAG Approach - Issue Context Management

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Tại sao cần RAG](#tại-sao-cần-rag)
3. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
4. [Implementation với pgvector](#implementation-với-pgvector)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)
7. [Performance & Optimization](#performance--optimization)

---

## Tổng quan

### RAG (Retrieval-Augmented Generation) là gì?

RAG là một kỹ thuật kết hợp **retrieval** (tìm kiếm thông tin) với **generation** (tạo nội dung bằng AI) để cải thiện chất lượng output của LLM.

**Quy trình cơ bản:**
```
User Query → Embedding → Vector Search → Top-K Similar Docs → LLM Context → AI Response
```

### Ứng dụng trong PM Tool

Trong hệ thống quản lý dự án của chúng ta, RAG được sử dụng để:
- **Risk Detection**: Tìm các issue tương tự từ quá khứ để dự đoán rủi ro
- **AI Estimation**: Sử dụng historical data để estimate story points chính xác hơn
- **Smart Recommendations**: Đề xuất actions dựa trên patterns từ past sprints

---

## Tại sao cần RAG?

### Vấn đề khi KHÔNG dùng RAG

#### 1. **Context Window Limitation**
```typescript
// ❌ Không RAG: Gửi toàn bộ issues vào prompt
const allIssues = await prisma.issue.findMany(); // 10,000+ issues
const prompt = `Here are all issues: ${JSON.stringify(allIssues)}...`;
// → Token limit exceeded!
```

#### 2. **Irrelevant Context**
```typescript
// ❌ Không RAG: Gửi random issues không liên quan
const prompt = `
  Current Issue: "Fix login bug"
  Past Issues:
  - "Add dark mode"
  - "Update database schema"
  - "Design new logo"
  ...
`;
// → AI không có thông tin hữu ích để tham khảo
```

#### 3. **High Cost**
```typescript
// ❌ Không RAG: Gửi quá nhiều tokens
const response = await openai.chat.completions.create({
  messages: [{ role: 'user', content: hugePrompt }], // 50,000 tokens
});
// → $1.00 per request!
```

### Giải pháp với RAG

#### 1. **Smart Context Selection**
```typescript
// ✅ Với RAG: Chỉ lấy top-K relevant issues
const query = "Fix login authentication bug";
const similarIssues = await findSimilarIssues(query, limit: 5);
// → Only 5 most relevant issues
```

#### 2. **Semantic Search**
```typescript
// ✅ Với RAG: Tìm issues dựa trên semantic similarity
Query: "User cannot sign in"
Results:
  1. "Login fails with wrong password" (similarity: 0.92)
  2. "Authentication error on mobile" (similarity: 0.89)
  3. "Session timeout issues" (similarity: 0.85)
```

#### 3. **Cost Optimization**
```typescript
// ✅ Với RAG: Giảm 90% tokens
const response = await openai.chat.completions.create({
  messages: [{ role: 'user', content: compactPrompt }], // 5,000 tokens
});
// → $0.10 per request (10x cheaper!)
```

---

## Kiến trúc hệ thống

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Risk Detector│  │ AI Estimation│  │ Smart Recommend │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
└─────────┼──────────────────┼───────────────────┼───────────┘
          │                  │                   │
          └──────────────────┼───────────────────┘
                             │ API Calls
┌─────────────────────────────┼────────────────────────────────┐
│                      Backend (NestJS)                        │
│  ┌─────────────────────────┴───────────────────────────┐    │
│  │           Risk Detector Service                     │    │
│  │  - detectRisksForSprint()                          │    │
│  │  - generateRecommendations()                       │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │                                     │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │           RAG Service (New!)                        │    │
│  │  - findSimilarIssues(query, limit)                 │    │
│  │  - generateEmbedding(text)                         │    │
│  │  - updateEmbeddings()                              │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────┐
│                   PostgreSQL + pgvector                    │
│  ┌──────────────────┐           ┌──────────────────────┐  │
│  │    Issue Table   │           │   Vector Index       │  │
│  │  - id            │           │   (ivfflat/hnsw)     │  │
│  │  - name          │───────────│   Fast similarity    │  │
│  │  - description   │           │   search             │  │
│  │  - embedding     │           │                      │  │
│  └──────────────────┘           └──────────────────────┘  │
└───────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────┐
│                    OpenAI API                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  text-embedding-ada-002                             │  │
│  │  Input: "Fix login bug..."                          │  │
│  │  Output: [0.123, -0.456, ..., 0.789] (1536 dims)   │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. **Issue Creation → Embedding Generation**
```
User creates issue
      ↓
Save to database
      ↓
[Background Job] Generate embedding
      ↓
Update issue.embedding column
      ↓
Ready for similarity search
```

#### 2. **Risk Detection → Similarity Search**
```
Detect risks for Sprint X
      ↓
Build query: "Overcommitment with 50 points, team velocity 30"
      ↓
Generate query embedding
      ↓
Vector similarity search (cosine distance)
      ↓
Top 10 similar past issues
      ↓
Include in AI prompt as context
      ↓
Generate recommendations
```

---

## Implementation với pgvector

### 1. Setup Database

#### Install pgvector extension

```sql
-- Run in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Update Prisma Schema

```prisma
// prisma/schema.prisma
model Issue {
  id              String    @id @default(uuid())
  name            String
  description     String?
  type            IssueType
  priority        IssuePriority
  point           Int?

  // ... existing fields ...

  // NEW: Vector embedding for RAG
  embedding       String?   @db.Text  // Store as JSON string
  embeddingUpdatedAt DateTime?

  @@index([projectId, embedding])
}
```

#### Create Migration

```bash
npx prisma migrate dev --name add_issue_embeddings
```

#### Create Vector Index

```sql
-- After migration, run this SQL manually
CREATE INDEX issue_embedding_idx
ON "Issue"
USING ivfflat (
  CAST(embedding AS vector(1536))
  vector_cosine_ops
)
WITH (lists = 100);

-- For better performance with large datasets, use HNSW instead:
-- CREATE INDEX issue_embedding_idx
-- ON "Issue"
-- USING hnsw (
--   CAST(embedding AS vector(1536))
--   vector_cosine_ops
-- );
```

---

### 2. Create RAG Service

#### File structure:
```
services/pm/src/modules/
├── rag/
│   ├── rag.module.ts
│   ├── rag.service.ts
│   ├── embedding.service.ts
│   ├── dto/
│   │   └── rag.dto.ts
│   └── interfaces/
│       └── rag.interface.ts
```

#### DTOs

```typescript
// services/pm/src/modules/rag/dto/rag.dto.ts
export class SimilaritySearchDto {
  query: string;
  limit?: number;
  projectId?: string;
  threshold?: number; // Minimum similarity score (0-1)
}

export class SimilarIssueDto {
  id: string;
  name: string;
  description: string | null;
  type: string;
  priority: string;
  point: number | null;
  similarity: number; // Cosine similarity score
}
```

#### Embedding Service

```typescript
// services/pm/src/modules/rag/embedding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: this.cleanText(text),
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert issue to searchable text
   */
  issueToText(issue: {
    name: string;
    description?: string | null;
    type: string;
    priority: string;
    point?: number | null;
  }): string {
    const parts = [
      `Title: ${issue.name}`,
      `Type: ${issue.type}`,
      `Priority: ${issue.priority}`,
    ];

    if (issue.description) {
      parts.push(`Description: ${issue.description}`);
    }

    if (issue.point) {
      parts.push(`Story Points: ${issue.point}`);
    }

    return parts.join('\n');
  }

  /**
   * Clean text before embedding
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special chars
      .trim()
      .slice(0, 8000); // OpenAI limit: 8191 tokens ≈ 8000 chars
  }
}
```

#### RAG Service

```typescript
// services/pm/src/modules/rag/rag.service.ts
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

    // 2. Build WHERE clause
    const whereClause = projectId
      ? Prisma.sql`AND i."projectId" = ${projectId}`
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
      FROM "Issue" i
      WHERE i.embedding IS NOT NULL
        ${whereClause}
        AND (1 - (CAST(i.embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536)))) >= ${threshold}
      ORDER BY CAST(i.embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536))
      LIMIT ${limit}
    `;

    this.logger.log(
      `Found ${results.length} similar issues for query: "${query.slice(0, 50)}..."`,
    );

    return results;
  }

  /**
   * Generate and save embedding for an issue
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
    const text = this.embeddingService.issueToText(issue);

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
        OR: [
          { embedding: null },
          { embeddingUpdatedAt: null },
        ],
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
        const text = this.embeddingService.issueToText(issue);
        const embedding = await this.embeddingService.generateEmbedding(text);

        await this.prisma.issue.update({
          where: { id: issue.id },
          data: {
            embedding: JSON.stringify(embedding),
            embeddingUpdatedAt: new Date(),
          },
        });

        updated++;

        // Rate limiting: 3000 requests/min for OpenAI
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
   * Update embedding when issue is modified
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
      await this.generateAndSaveEmbedding(issueId);
    }
  }
}
```

#### Module Registration

```typescript
// services/pm/src/modules/rag/rag.module.ts
import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RagService, EmbeddingService],
  exports: [RagService],
})
export class RagModule {}
```

---

### 3. Integrate RAG vào Risk Detector

#### Update Risk Detector Service

```typescript
// services/pm/src/modules/risk-detector/risk-detector.service.ts
import { RagService } from '../rag/rag.service';

@Injectable()
export class RiskDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService, // ← NEW
    private readonly overcommitmentRule: OvercommitmentRule,
    private readonly blockedIssuesRule: BlockedIssuesRule,
  ) {
    // ...
  }

  /**
   * Build sprint context with RAG-enhanced historical data
   */
  private async buildSprintContext(
    sprintId: string,
  ): Promise<SprintContext | null> {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) return null;

    const issues = await this.prisma.issue.findMany({
      where: { sprintId },
      include: { status: true },
    });

    // Fetch sprint history (traditional approach)
    const sprintHistory = await this.prisma.sprintHistory.findMany({
      where: { projectId: sprint.projectId },
      orderBy: { startDate: 'desc' },
      take: 6,
    });

    // NEW: Use RAG to find similar past issues
    const totalPoints = issues.reduce((sum, i) => sum + (i.point || 0), 0);
    const queryText = `
      Sprint planning with ${totalPoints} story points
      ${issues.length} tasks in sprint
      Project context: ${sprint.name}
    `;

    const similarIssues = await this.ragService.findSimilarIssues({
      query: queryText,
      limit: 10,
      projectId: sprint.projectId,
      threshold: 0.75,
    });

    return {
      sprint: this.mapSprintToData(sprint),
      issues: issues.map((i) => this.mapIssueToData(i)),
      sprintHistory: sprintHistory.map((h) => this.mapHistoryToData(h)),
      similarPastIssues: similarIssues, // ← NEW: RAG context
    };
  }
}
```

#### Update Overcommitment Rule

```typescript
// services/pm/src/modules/risk-detector/rules/overcommitment.rule.ts
async check(context: SprintContext): Promise<RiskDetectionResult | null> {
  // ... existing logic ...

  // NEW: Use RAG context in AI prompt
  const similarIssuesContext = context.similarPastIssues
    ?.map(
      (issue, idx) =>
        `${idx + 1}. "${issue.name}" (${issue.point} points, ${issue.type}, similarity: ${(issue.similarity * 100).toFixed(0)}%)
   Description: ${issue.description || 'N/A'}`,
    )
    .join('\n\n');

  const prompt = `
You are a Sprint Planning Expert analyzing potential overcommitment.

**Current Sprint Analysis:**
- Total Committed Points: ${totalPoints}
- Number of Issues: ${issues.length}
- Team Average Velocity: ${avgVelocity} points/sprint
- Overcommitment Ratio: ${(totalPoints / avgVelocity).toFixed(2)}x

**Historical Context (Similar Past Issues):**
${similarIssuesContext || 'No similar issues found'}

**Low-Priority Issues in Current Sprint:**
${lowPriorityIssues.length > 0 ? lowPriorityIssues.map((i) => `- ID: ${i.id} | ${i.name} (${i.point} points)`).join('\n') : 'None found'}

Based on similar past patterns and current sprint data, generate 3 specific recommendations...
  `;

  // Call OpenAI...
}
```

---

### 4. Background Job để Update Embeddings

#### Create Cron Job

```typescript
// services/pm/src/modules/rag/rag-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RagService } from './rag.service';

@Injectable()
export class RagCronService {
  private readonly logger = new Logger(RagCronService.name);

  constructor(private readonly ragService: RagService) {}

  /**
   * Update embeddings every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateEmbeddings() {
    this.logger.log('Starting batch embedding update...');

    try {
      const updated = await this.ragService.batchUpdateEmbeddings(100);
      this.logger.log(`Batch embedding update completed: ${updated} issues updated`);
    } catch (error) {
      this.logger.error(`Batch embedding update failed: ${error.message}`);
    }
  }

  /**
   * Run on startup to catch any missed issues
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async fullEmbeddingSync() {
    this.logger.log('Starting full embedding sync...');

    let totalUpdated = 0;
    let batchCount = 0;

    // Process in batches until all done
    while (true) {
      const updated = await this.ragService.batchUpdateEmbeddings(50);

      if (updated === 0) break;

      totalUpdated += updated;
      batchCount++;

      this.logger.log(`Batch ${batchCount}: ${updated} issues updated`);

      // Wait 1 minute between batches to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }

    this.logger.log(`Full sync completed: ${totalUpdated} total issues updated`);
  }
}
```

#### Update Module

```typescript
// services/pm/src/modules/rag/rag.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { RagCronService } from './rag-cron.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RagService, EmbeddingService, RagCronService],
  exports: [RagService],
})
export class RagModule {}
```

---

## Code Examples

### Example 1: Find Similar Issues for AI Estimation

```typescript
// Use case: AI Estimate Story Points based on similar issues
async estimateStoryPoints(issue: {
  name: string;
  description: string;
  type: string;
}) {
  // 1. Find similar issues using RAG
  const queryText = `${issue.name} ${issue.description}`;
  const similarIssues = await this.ragService.findSimilarIssues({
    query: queryText,
    limit: 5,
    threshold: 0.8,
  });

  // 2. Build context for AI
  const historicalContext = similarIssues
    .map((i) => `- "${i.name}": ${i.point} points (similarity: ${(i.similarity * 100).toFixed(0)}%)`)
    .join('\n');

  // 3. Call OpenAI with context
  const prompt = `
Estimate story points for this issue:

**New Issue:**
Name: ${issue.name}
Description: ${issue.description}
Type: ${issue.type}

**Similar Past Issues:**
${historicalContext}

Based on similar issues, estimate the story points (1, 2, 3, 5, 8, 13, 21):
  `;

  const response = await this.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Example 2: Smart Issue Categorization

```typescript
// Use case: Auto-categorize issues based on past patterns
async categorizeIssue(issueId: string) {
  const issue = await this.prisma.issue.findUnique({
    where: { id: issueId },
  });

  if (!issue) return null;

  // Find similar issues
  const similar = await this.ragService.findSimilarIssues({
    query: `${issue.name} ${issue.description}`,
    limit: 10,
    projectId: issue.projectId,
  });

  // Analyze categories of similar issues
  const categoryCount = similar.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + i.similarity;
    return acc;
  }, {} as Record<string, number>);

  // Suggest most likely category
  const suggestedCategory = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  return {
    suggested: suggestedCategory,
    confidence: categoryCount[suggestedCategory] / similar.length,
    similarIssues: similar.slice(0, 3),
  };
}
```

---

## Best Practices

### 1. **Embedding Updates**

#### When to update embeddings:
✅ **DO update when:**
- Issue name changes
- Description changes significantly
- Type or priority changes

❌ **DON'T update when:**
- Status changes (OPEN → IN_PROGRESS)
- Assignee changes
- Comments added
- sortOrder changes

```typescript
// Implement smart update logic
async onIssueUpdate(issueId: string, changedFields: string[]) {
  const relevantFields = ['name', 'description', 'type', 'priority'];

  if (changedFields.some(f => relevantFields.includes(f))) {
    // Queue for embedding update (don't block the main request)
    await this.queueEmbeddingUpdate(issueId);
  }
}
```

### 2. **Query Optimization**

#### Use appropriate similarity thresholds:

```typescript
// Different thresholds for different use cases
const thresholds = {
  aiEstimation: 0.85,      // High precision needed
  riskDetection: 0.75,     // Moderate precision
  smartSearch: 0.60,       // Broader results
  autoTagging: 0.90,       // Very high precision
};
```

### 3. **Cost Management**

#### Estimate costs:

```typescript
// OpenAI Embedding Pricing (as of 2024)
const COST_PER_1K_TOKENS = 0.0001; // $0.0001 per 1K tokens

// Average issue = ~500 tokens
// 10,000 issues × 500 tokens = 5M tokens
// Cost = 5,000 × $0.0001 = $0.50

// Monthly cost for 1000 new issues:
// 1000 × 500 tokens = 500K tokens
// Cost = 500 × $0.0001 = $0.05/month
```

### 4. **Performance Optimization**

#### Use appropriate index:

```sql
-- For < 100K vectors: ivfflat (faster to build)
CREATE INDEX issue_embedding_idx
ON "Issue"
USING ivfflat (CAST(embedding AS vector(1536)) vector_cosine_ops)
WITH (lists = 100);

-- For > 100K vectors: hnsw (faster queries)
CREATE INDEX issue_embedding_idx
ON "Issue"
USING hnsw (CAST(embedding AS vector(1536)) vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Performance & Optimization

### Benchmarks

#### Vector Search Performance:

| Dataset Size | Index Type | Query Time | Accuracy |
|--------------|------------|------------|----------|
| 10K issues   | ivfflat    | ~5ms       | 95%      |
| 10K issues   | hnsw       | ~2ms       | 98%      |
| 100K issues  | ivfflat    | ~50ms      | 93%      |
| 100K issues  | hnsw       | ~10ms      | 97%      |
| 1M issues    | hnsw       | ~30ms      | 96%      |

### Optimization Strategies

#### 1. **Caching**

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RagService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findSimilarIssues(options: SimilaritySearchDto) {
    const cacheKey = `similar:${options.query}:${options.limit}`;

    // Check cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Perform search
    const results = await this.performVectorSearch(options);

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, results, 3600);

    return results;
  }
}
```

#### 2. **Batch Processing**

```typescript
// Process embeddings in batches with rate limiting
async batchGenerateEmbeddings(issues: Issue[]) {
  const BATCH_SIZE = 100;
  const RATE_LIMIT_MS = 60000; // 1 minute

  for (let i = 0; i < issues.length; i += BATCH_SIZE) {
    const batch = issues.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(issue => this.generateAndSaveEmbedding(issue.id))
    );

    // Rate limit
    if (i + BATCH_SIZE < issues.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }
  }
}
```

#### 3. **Hybrid Search** (Structured + Vector)

```typescript
async hybridSearch(options: {
  query: string;
  projectId: string;
  dateRange?: { from: Date; to: Date };
}) {
  const { query, projectId, dateRange } = options;

  const queryEmbedding = await this.embeddingService.generateEmbedding(query);
  const embeddingJson = JSON.stringify(queryEmbedding);

  return await this.prisma.$queryRaw`
    WITH filtered_issues AS (
      SELECT * FROM "Issue"
      WHERE "projectId" = ${projectId}
        AND embedding IS NOT NULL
        ${dateRange ? Prisma.sql`AND "createdAt" BETWEEN ${dateRange.from} AND ${dateRange.to}` : Prisma.empty}
    )
    SELECT
      id, name, description, type, priority, point,
      1 - (CAST(embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536))) as similarity
    FROM filtered_issues
    ORDER BY CAST(embedding AS vector(1536)) <=> CAST(${embeddingJson} AS vector(1536))
    LIMIT 10
  `;
}
```

---

## Monitoring & Debugging

### Metrics to Track

```typescript
// Add monitoring metrics
import { Counter, Histogram } from 'prom-client';

const embeddingGenerationCounter = new Counter({
  name: 'rag_embeddings_generated_total',
  help: 'Total embeddings generated',
});

const similaritySearchDuration = new Histogram({
  name: 'rag_similarity_search_duration_seconds',
  help: 'Duration of similarity searches',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// Use in service
async findSimilarIssues(options: SimilaritySearchDto) {
  const timer = similaritySearchDuration.startTimer();

  try {
    const results = await this.performSearch(options);
    return results;
  } finally {
    timer();
  }
}
```

---

## Summary

### Key Takeaways

1. **RAG = Better AI Context**: Chỉ gửi relevant issues → Better recommendations
2. **pgvector = Easy Start**: Không cần thêm infrastructure
3. **Background Jobs = Non-blocking**: Embeddings generate async
4. **Cost Effective**: ~$0.05/month cho 1000 issues
5. **Scalable**: Support millions of issues với proper indexing

### Next Steps

1. ✅ Setup pgvector extension
2. ✅ Implement RAG service
3. ✅ Create background jobs
4. ✅ Integrate with Risk Detector
5. ⏭️ Monitor performance
6. ⏭️ Fine-tune thresholds
7. ⏭️ Add more use cases (AI estimation, smart search)
