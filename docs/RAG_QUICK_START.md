# RAG Quick Start Guide

Quick reference để implement RAG cho PM Tool.

## Prerequisites

- PostgreSQL database
- OpenAI API key
- NestJS backend setup

---

## Step-by-Step Implementation

### 1. Enable pgvector (5 phút)

```bash
# Connect to PostgreSQL
psql -U postgres -d your_database

# Enable extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Update Database Schema (10 phút)

```prisma
// prisma/schema.prisma
model Issue {
  // ... existing fields

  // Add these fields:
  embedding          String?   @db.Text
  embeddingUpdatedAt DateTime?

  @@index([projectId, embedding])
}
```

```bash
# Create migration
npx prisma migrate dev --name add_issue_embeddings

# Create vector index (run SQL manually)
```

```sql
CREATE INDEX issue_embedding_idx
ON "Issue"
USING ivfflat (CAST(embedding AS vector(1536)) vector_cosine_ops)
WITH (lists = 100);
```

### 3. Install Dependencies (2 phút)

```bash
cd services/pm
npm install openai @nestjs/schedule cache-manager
```

### 4. Create RAG Module (30 phút)

#### File structure:
```
services/pm/src/modules/rag/
├── rag.module.ts
├── rag.service.ts
├── embedding.service.ts
├── rag-cron.service.ts
└── dto/
    └── rag.dto.ts
```

**Copy code từ RAG_APPROACH.md:**
- Section "Create RAG Service" → Copy toàn bộ code

### 5. Update Environment Variables (1 phút)

```env
# services/pm/.env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### 6. Register Module (2 phút)

```typescript
// services/pm/src/app.module.ts
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    // ... existing imports
    RagModule, // ← ADD THIS
  ],
})
export class AppModule {}
```

### 7. Integrate với Risk Detector (15 phút)

```typescript
// services/pm/src/modules/risk-detector/risk-detector.service.ts
import { RagService } from '../rag/rag.service';

@Injectable()
export class RiskDetectorService {
  constructor(
    // ... existing deps
    private readonly ragService: RagService, // ← ADD THIS
  ) {}

  // Update buildSprintContext method
  private async buildSprintContext(sprintId: string) {
    // ... existing code

    // ADD: Find similar issues
    const similarIssues = await this.ragService.findSimilarIssues({
      query: `Sprint with ${totalPoints} points, ${issues.length} tasks`,
      limit: 10,
      projectId: sprint.projectId,
    });

    return {
      // ... existing fields
      similarPastIssues: similarIssues, // ← ADD THIS
    };
  }
}
```

### 8. Test Implementation (10 phút)

```bash
# Start backend
npm run dev

# Test embedding generation
curl -X POST http://localhost:8080/pm/api/rag/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{"issueId": "your-issue-id"}'

# Test similarity search
curl -X POST http://localhost:8080/pm/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Fix login bug",
    "limit": 5
  }'
```

### 9. Generate Initial Embeddings (Background)

```bash
# Cron job sẽ tự chạy, hoặc trigger manually:
curl -X POST http://localhost:8080/pm/api/rag/batch-update
```

---

## Verification Checklist

- [ ] pgvector extension enabled
- [ ] Database schema updated
- [ ] Vector index created
- [ ] Dependencies installed
- [ ] RAG module created
- [ ] Environment variables set
- [ ] Module registered in app.module
- [ ] Risk detector updated
- [ ] Tests passed
- [ ] Background jobs running

---

## Expected Results

### Before RAG:
```typescript
// Risk detection prompt
const prompt = `
  Current Sprint: 50 points
  Team Velocity: 30 points

  Generate recommendations...
`;
```

### After RAG:
```typescript
// Risk detection prompt with context
const prompt = `
  Current Sprint: 50 points
  Team Velocity: 30 points

  Similar Past Issues:
  1. "Sprint Jan 2024" (48 pts, 95% similarity)
     - Had overcommitment, moved 3 tasks to backlog
  2. "Sprint Feb 2024" (52 pts, 92% similarity)
     - Completed successfully after reprioritization

  Generate recommendations based on patterns...
`;
```

**Result:** AI có context tốt hơn → Better recommendations!

---

## Troubleshooting

### Issue: "Extension vector does not exist"
```bash
# Solution: Enable extension
psql -U postgres -d your_db -c "CREATE EXTENSION vector;"
```

### Issue: "Cannot cast to vector(1536)"
```sql
-- Solution: Check data format
SELECT embedding FROM "Issue" LIMIT 1;
-- Should be JSON array: "[0.123, -0.456, ...]"
```

### Issue: "OpenAI rate limit exceeded"
```typescript
// Solution: Add delay in batch processing
await new Promise(resolve => setTimeout(resolve, 100));
```

### Issue: "Slow similarity search"
```sql
-- Solution: Rebuild index with better parameters
DROP INDEX issue_embedding_idx;
CREATE INDEX issue_embedding_idx
ON "Issue"
USING hnsw (CAST(embedding AS vector(1536)) vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Performance Tips

1. **Start small**: Test với 100 issues trước
2. **Batch updates**: Process 50 issues/batch
3. **Cache results**: Cache similarity search 1 hour
4. **Monitor costs**: Track OpenAI usage
5. **Use HNSW index**: Khi có > 100K issues

---

## Cost Estimation

```
Initial Setup (one-time):
- 10,000 existing issues × $0.0001/1K tokens × 0.5K tokens = $0.50

Monthly Operations:
- 1,000 new issues/month × $0.0001/1K tokens × 0.5K tokens = $0.05/month
- Similarity searches: FREE (no OpenAI cost)

Total: ~$0.55 first month, ~$0.05/month ongoing
```

---

## Next Steps After Implementation

1. Monitor performance metrics
2. Fine-tune similarity thresholds
3. Add more use cases:
   - AI Story Point Estimation
   - Smart Issue Search
   - Auto-categorization
4. Implement caching for popular queries
5. Add analytics dashboard

---

## Quick Reference Commands

```bash
# Generate embeddings for all issues
npm run rag:generate-all

# Test similarity search
npm run rag:search "Fix authentication bug"

# Check embedding status
npm run rag:status

# Manual batch update
npm run rag:batch-update 100
```
