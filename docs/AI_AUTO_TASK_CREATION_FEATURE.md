# AI Auto Task Creation Feature - Tự Động Tạo Công Việc

## Tổng Quan (Overview)

Hệ thống Auto Task Creation cho phép người dùng tự động tạo các công việc (Issues/Tasks) từ:
1. **Text Input** - Nhập mô tả văn bản ngắn gọn, AI sẽ tinh chỉnh và cấu trúc lại thành mô tả chi tiết
2. **Issue Breakdown** - Phân tách Epic/Story lớn thành các sub-tasks nhỏ hơn với dependencies và estimates
3. **Story Points Estimation** - Tự động ước lượng độ phức tạp của công việc

Hệ thống sử dụng OpenAI GPT-4o-mini với streaming support để cung cấp trải nghiệm real-time cho người dùng.

---

## Kiến Trúc Hệ Thống (System Architecture)

### Tech Stack
- **Backend**: NestJS + TypeScript + Prisma ORM + PostgreSQL
- **Frontend**: Next.js 14 + React 18 + MobX + TypeScript
- **AI**: OpenAI API (gpt-4o-mini model)
- **Streaming**: Server-Sent Events (SSE)
- **Caching**: Redis-compatible cache với TTL 24 giờ
- **Vector Search**: PostgreSQL pgvector extension (RAG)

### Luồng Dữ Liệu (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (Next.js Frontend - pm-web)                                    │
│                                                                 │
│  Components:                                                    │
│  • IssueDetailPanel - Main UI for AI operations                │
│  • AIRefineSection - Description refinement UI                 │
│  • AIBreakdownSection - Epic breakdown UI                      │
│  • AIEstimateButton - Story points estimation                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP POST (JSON)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES (Proxy)                   │
│  • /api/ai/refine → Backend streaming proxy                    │
│  • /api/ai/breakdown → Breakdown proxy                         │
│  • /api/ai/estimate → Estimation proxy                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Forwards to Backend
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND BFF (NestJS)                       │
│  Port: 41003 (PM Service)                                       │
│                                                                 │
│  Controllers:                                                   │
│  • AIController                                                 │
│    - POST /api/ai/refine-description-stream (SSE)              │
│    - POST /api/ai/breakdown-issue-stream (SSE)                 │
│    - POST /api/ai/estimate-points-stream (SSE)                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Delegates to Services
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AI SERVICES                             │
│                                                                 │
│  1. AIService (ai.service.ts)                                   │
│     • refineDescriptionStream()                                 │
│     • breakdownEpicStream()                                     │
│     • estimateStoryPointsStream()                               │
│     • Uses caching with SHA256 keys                             │
│                                                                 │
│  2. PromptService (prompt.service.ts)                           │
│     • buildRefineDescriptionPrompt()                            │
│     • buildBreakdownPrompt()                                    │
│     • buildEstimatePointsPrompt()                               │
│     • Template-based prompt generation                          │
│                                                                 │
│  3. OpenAIService (openai.service.ts)                           │
│     • createStreamingChatCompletion()                           │
│     • Token counting & rate limiting                            │
│     • Direct OpenAI API integration                             │
│                                                                 │
│  4. RagService (rag.service.ts)                                 │
│     • findSimilarIssues() - Vector similarity search            │
│     • Prevents duplicate issues                                 │
│                                                                 │
│  5. EmbeddingService (embedding.service.ts)                     │
│     • generateEmbedding() - text-embedding-ada-002              │
│     • Converts issues to vectors                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OPENAI API                                 │
│  • Model: gpt-4o-mini (configurable)                           │
│  • Embedding: text-embedding-ada-002                           │
│  • Streaming: SSE chunks                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chức Năng Chi Tiết (Detailed Features)

### 1. AI Refine Description - Tinh Chỉnh Mô Tả

#### Mục Đích
Chuyển đổi mô tả ngắn gọn thành mô tả chi tiết, có cấu trúc, phù hợp với loại issue.

#### Input
```typescript
{
  "currentDescription": "Người dùng cần đăng nhập qua Google",
  "issueName": "Tích hợp Google OAuth",
  "issueType": "STORY" | "BUG" | "TASK" | "EPIC",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
}
```

#### Output (HTML Format)
```html
<div class="refined-description">
  <h3>📋 Tóm tắt</h3>
  <p>Tích hợp OAuth 2.0 với Google để cho phép người dùng đăng nhập...</p>

  <h3>📝 Mô tả chi tiết</h3>
  <p>Hiện tại hệ thống chỉ hỗ trợ đăng nhập qua email/password...</p>

  <h3>🎯 Mục tiêu</h3>
  <ul>
    <li>Triển khai Google OAuth 2.0 flow</li>
    <li>Lưu trữ access token và refresh token</li>
  </ul>

  <h3>✅ Acceptance Criteria</h3>
  <ul>
    <li>User có thể click nút "Sign in with Google"</li>
    <li>Sau khi xác thực thành công, user được redirect về dashboard</li>
  </ul>
</div>
```

#### Template Adaptations
Mô tả được điều chỉnh theo loại issue:

**BUG**:
- ✅ Reproduction Steps (Các bước tái hiện)
- ✅ Expected vs Actual Behavior
- ✅ Environment Details
- ✅ Error Messages/Screenshots

**STORY**:
- ✅ User Persona & Journey
- ✅ Acceptance Criteria
- ✅ Business Value
- ✅ Edge Cases

**TASK**:
- ✅ Action Items
- ✅ Technical Approach
- ✅ Dependencies
- ✅ Checklist

**EPIC**:
- ✅ Scope & Timeline
- ✅ High-Level Requirements
- ✅ Success Metrics
- ✅ Stakeholders

#### API Endpoint
```bash
POST /api/ai/refine-description-stream
Content-Type: application/json

{
  "currentDescription": "string (5-10000 chars)",
  "issueName": "string",
  "issueType": "STORY" | "BUG" | "TASK" | "EPIC",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
}
```

#### Response (Server-Sent Events)
```
data: {"type":"progress","message":"Đang phân tích mô tả..."}

data: {"type":"chunk","content":"<h3>📋 Tóm tắt</h3>"}

data: {"type":"chunk","content":"<p>Tích hợp OAuth..."}

data: {"type":"complete","fullContent":"<div>...</div>"}
```

#### Frontend Hook
```typescript
import { useAIRefineStream } from '@/core/hooks/use-ai-refine-stream';

function MyComponent() {
  const { refineDescription, isRefining, refinedContent, error } = useAIRefineStream();

  const handleRefine = async () => {
    await refineDescription({
      currentDescription: "Short description",
      issueName: "Issue name",
      issueType: "STORY",
      priority: "MEDIUM"
    });
  };

  return (
    <div>
      <button onClick={handleRefine}>Refine</button>
      {isRefining && <p>Generating...</p>}
      <div dangerouslySetInnerHTML={{ __html: refinedContent }} />
    </div>
  );
}
```

#### Caching
- **Cache Key**: SHA256 hash của (description + type + priority)
- **TTL**: 24 giờ
- **Storage**: Redis-compatible cache

---

### 2. AI Issue Breakdown - Phân Tách Epic/Story

#### Mục Đích
Tự động chia nhỏ Epic hoặc Story lớn thành các sub-tasks có thể thực hiện, bao gồm:
- Estimated story points (Fibonacci scale)
- Task dependencies
- Technical layers (Frontend, Backend, Database, etc.)
- Parallelization analysis

#### Input
```typescript
{
  "issueId": "uuid",
  "description": "Epic description",
  "maxSubTasks": 10,
  "targetPointsPerTask": 3,
  "includeTests": true,
  "includeDocs": false
}
```

#### Output Structure
```typescript
{
  "subTasks": [
    {
      "tempId": "temp-1",
      "name": "Setup database schema",
      "description": "Create users, oauth_tokens tables",
      "descriptionHtml": "<p>...</p>",
      "estimatedPoints": 3,
      "taskType": "FEATURE",
      "technicalLayer": "DATABASE",
      "dependencies": [],
      "canParallelize": true,
      "priority": "HIGH",
      "acceptanceCriteria": ["Schema created", "Migrations run"]
    },
    {
      "tempId": "temp-2",
      "name": "Implement OAuth flow",
      "description": "Backend API endpoints",
      "estimatedPoints": 5,
      "taskType": "FEATURE",
      "technicalLayer": "BACKEND",
      "dependencies": ["temp-1"],
      "canParallelize": false,
      "priority": "HIGH"
    }
  ],
  "reasoning": {
    "summary": "Phân tích breakdown...",
    "approachExplanation": "Bắt đầu từ database layer...",
    "estimationLogic": "Points dựa trên độ phức tạp..."
  },
  "validation": {
    "totalPoints": 23,
    "completeness": 0.95,
    "balanceScore": 0.88,
    "coveragePercentage": 92
  },
  "dependencyGraph": [
    { "from": "temp-1", "to": "temp-2", "type": "blocking" }
  ]
}
```

#### Task Types
- **FEATURE** - New functionality
- **TESTING** - Test cases, QA
- **INFRA** - DevOps, CI/CD
- **DOCS** - Documentation
- **BUGFIX** - Bug fixes

#### Technical Layers
- **FRONTEND** - UI components, state management
- **BACKEND** - API endpoints, business logic
- **DATABASE** - Schema, migrations, queries
- **DEVOPS** - Infrastructure, deployment
- **CROSS** - Full-stack or multiple layers

#### Story Points (Fibonacci Scale)
- **1** - Trivial (< 1 hour)
- **2** - Simple (1-2 hours)
- **3** - Medium (half day)
- **5** - Complex (1 day)
- **8** - Very complex (2-3 days)
- **13** - Epic (should be broken down further)

#### API Endpoint
```bash
POST /api/ai/breakdown-issue-stream
Content-Type: application/json

{
  "issueId": "uuid",
  "description": "Epic description",
  "maxSubTasks": 10,
  "targetPointsPerTask": 3,
  "includeTests": true,
  "includeDocs": false
}
```

#### Response (SSE)
```
data: {"type":"progress","message":"Analyzing issue complexity..."}

data: {"type":"subtask","value":{"tempId":"temp-1","name":"...","estimatedPoints":3}}

data: {"type":"subtask","value":{"tempId":"temp-2","name":"..."}}

data: {"type":"reasoning","value":{"summary":"...","approachExplanation":"..."}}

data: {"type":"validation","value":{"totalPoints":23,"completeness":0.95}}

data: {"type":"dependencies","value":[{"from":"temp-1","to":"temp-2"}]}

data: {"type":"complete"}
```

#### Frontend Hook
```typescript
import { useAIBreakdown } from '@/core/hooks/use-ai-breakdown';

function BreakdownComponent() {
  const { breakdown, isGenerating, error } = useAIBreakdown();

  const handleBreakdown = async () => {
    const result = await breakdown({
      issueId: "issue-uuid",
      description: "Epic description",
      maxSubTasks: 10,
      targetPointsPerTask: 3,
      includeTests: true
    });

    console.log("Generated sub-tasks:", result?.subTasks);
  };

  return (
    <div>
      <button onClick={handleBreakdown} disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Break Down Epic"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

#### Dependency Graph Visualization
```
Database Schema (temp-1) [3pts]
    ↓ (blocking)
Backend API (temp-2) [5pts]
    ↓ (blocking)
Frontend UI (temp-3) [5pts]

Unit Tests (temp-4) [2pts] ← can parallelize
Integration Tests (temp-5) [3pts] ← can parallelize
```

---

### 3. AI Story Points Estimation - Ước Lượng Story Points

#### Mục Đích
Tự động ước lượng độ phức tạp của issue dựa trên:
- Mô tả chi tiết
- Loại issue (Story, Bug, Task)
- Priority level
- Similar issues trong codebase (RAG)

#### Input
```typescript
{
  "description": "Detailed issue description",
  "issueType": "STORY" | "BUG" | "TASK",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "issueId": "uuid" // Optional, for RAG context
}
```

#### Output
```typescript
{
  "suggestedPoints": 5,
  "confidence": 0.85, // 0.0 - 1.0
  "reasoning": {
    "summary": "Task requires backend API + frontend integration",
    "factors": [
      "Database schema changes (+2 points)",
      "External API integration (+2 points)",
      "Frontend state management (+1 point)"
    ]
  },
  "alternatives": [
    { "points": 3, "scenario": "If using existing auth library" },
    { "points": 8, "scenario": "If implementing custom OAuth flow" }
  ]
}
```

#### Estimation Factors
AI xem xét các yếu tố:
- **Technical Complexity** - Số lượng layers cần thay đổi
- **External Dependencies** - Third-party services, APIs
- **Data Model Changes** - Database migrations, schema updates
- **Testing Requirements** - Unit, integration, E2E tests
- **UI Complexity** - Number of screens, interactions
- **Business Logic** - Complexity of rules and validations
- **Risk Level** - Unknowns, technical debt, legacy code

#### API Endpoint
```bash
POST /api/ai/estimate-points-stream
Content-Type: application/json

{
  "description": "Issue description",
  "issueType": "STORY",
  "priority": "MEDIUM",
  "issueId": "uuid"
}
```

#### Response (SSE)
```
data: {"type":"progress","message":"Analyzing complexity..."}

data: {"type":"partial","suggestedPoints":5,"confidence":0.75}

data: {"type":"reasoning","summary":"...","factors":["..."]}

data: {"type":"alternatives","value":[{"points":3,"scenario":"..."}]}

data: {"type":"complete","finalEstimate":{"suggestedPoints":5,"confidence":0.85}}
```

#### Frontend Hook
```typescript
import { useAIEstimate } from '@/core/hooks/use-ai-estimate';

function EstimateComponent() {
  const { estimate, isEstimating, result, error } = useAIEstimate();

  const handleEstimate = async () => {
    await estimate({
      description: issueDescription,
      issueType: "STORY",
      priority: "MEDIUM"
    });
  };

  return (
    <div>
      <button onClick={handleEstimate}>Estimate</button>
      {isEstimating && <Spinner />}
      {result && (
        <div>
          <h4>Suggested: {result.suggestedPoints} points</h4>
          <p>Confidence: {(result.confidence * 100).toFixed(0)}%</p>
          <ul>
            {result.reasoning.factors.map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## RAG (Retrieval-Augmented Generation)

### Mục Đích
Sử dụng vector similarity search để tìm các issues tương tự, giúp:
- Cải thiện độ chính xác của estimation
- Prevent duplicate issues
- Suggest related tasks

### Kiến Trúc
```
Issue Description
     ↓
EmbeddingService.generateEmbedding()
     ↓
text-embedding-ada-002 (OpenAI)
     ↓
Vector [1536 dimensions]
     ↓
PostgreSQL pgvector
     ↓
Cosine Similarity Search
     ↓
Top 5 Similar Issues
```

### Database Schema
```sql
-- pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Issues table with embedding column
ALTER TABLE issues
ADD COLUMN embedding vector(1536);

-- Vector similarity index
CREATE INDEX idx_issue_embedding ON issues
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### API Usage
```typescript
import { RagService } from '@/modules/rag/rag.service';

// Find similar issues
const similarIssues = await ragService.findSimilarIssues(
  'User authentication with Google',
  projectId,
  5 // limit
);

console.log(similarIssues);
// [
//   { id: 'uuid', name: 'OAuth integration', similarity: 0.92 },
//   { id: 'uuid', name: 'SSO setup', similarity: 0.85 }
// ]
```

### Embedding Generation
```typescript
import { EmbeddingService } from '@/modules/rag/embedding.service';

// Generate embedding for new issue
const embedding = await embeddingService.generateEmbedding(
  'Implement Google OAuth login flow with token refresh'
);

// Save to database
await prisma.issue.update({
  where: { id: issueId },
  data: { embedding }
});
```

---

## File Upload & Document Processing

### Hiện Trạng
Hiện tại hệ thống **CHƯA HỖ TRỢ** parse document files (PDF, Word, Excel) để tự động tạo tasks.

### File Storage Infrastructure
Có sẵn file storage service sử dụng MinIO, nhưng chỉ để lưu attachments:

#### Upload Flow
```
1. Client requests presigned URL
   POST /files/presigned-url
   { fileName: "doc.pdf", mimeType: "application/pdf" }

2. Backend generates presigned URL (MinIO)
   Response: { uploadUrl: "https://...", fileId: "uuid" }

3. Client uploads directly to MinIO
   PUT {uploadUrl} with file data

4. Client confirms upload
   POST /files/confirm-upload
   { fileId: "uuid" }

5. Backend updates metadata
   Status: pending → completed
```

#### Metadata Storage
```typescript
// file-storage service
{
  id: "uuid",
  originalName: "requirements.pdf",
  mimeType: "application/pdf",
  size: 1024000,
  uploadStatus: "completed",
  tags: ["issue-attachment"],
  metadata: { issueId: "..." }
}
```

### Future Enhancement: Document Parsing
Để implement document parsing → task creation:

#### Approach 1: PDF Text Extraction
```typescript
// Install pdf-parse
import pdfParse from 'pdf-parse';

async function extractTextFromPDF(fileBuffer: Buffer) {
  const data = await pdfParse(fileBuffer);
  return data.text; // Raw text content
}

// Use AI to structure tasks
const tasks = await aiService.extractTasksFromText({
  content: extractedText,
  documentType: 'requirements'
});
```

#### Approach 2: OpenAI Vision API (for scanned PDFs/images)
```typescript
import { OpenAI } from 'openai';

async function extractTasksFromImage(imageBase64: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract tasks from this document' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### Approach 3: Structured Document Processing
```typescript
// For Excel/CSV files
import xlsx from 'xlsx';

async function extractTasksFromExcel(fileBuffer: Buffer) {
  const workbook = xlsx.read(fileBuffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  // Map rows to tasks
  return data.map(row => ({
    name: row['Task Name'],
    description: row['Description'],
    priority: row['Priority'],
    assignee: row['Assignee']
  }));
}
```

---

## Code Reference Guide

### Backend Files

#### AI Controllers
- [ai.controller.ts](../services/pm/src/modules/ai/ai.controller.ts) - API endpoints cho refine, breakdown, estimate

#### AI Services
- [ai.service.ts](../services/pm/src/modules/ai/ai.service.ts) - Main AI orchestration service
- [openai.service.ts](../services/pm/src/modules/ai/openai.service.ts) - OpenAI API integration
- [prompt.service.ts](../services/pm/src/modules/ai/prompt.service.ts) - Prompt template management

#### RAG Services
- [rag.service.ts](../services/pm/src/modules/rag/rag.service.ts) - Vector similarity search
- [embedding.service.ts](../services/pm/src/modules/rag/embedding.service.ts) - Text → vector embedding

#### DTOs
- [refine-description.dto.ts](../services/pm/src/modules/ai/dto/refine-description.dto.ts)
- [breakdown-issue.dto.ts](../services/pm/src/modules/ai/dto/breakdown-issue.dto.ts)
- [estimate-points.dto.ts](../services/pm/src/modules/ai/dto/estimate-points.dto.ts)

#### File Storage
- [file-storage.controller.ts](../services/file-storage/src/storage/file-storage.controller.ts) - Presigned URLs, upload confirmation
- [metadata.service.ts](../services/file-storage/src/metadata/metadata.service.ts) - File metadata tracking

### Frontend Files

#### API Routes (Next.js Proxy)
- [/app/api/ai/refine/route.ts](../apps/pm-web/src/app/api/ai/refine/route.ts)
- [/app/api/ai/breakdown/route.ts](../apps/pm-web/src/app/api/ai/breakdown/route.ts)
- [/app/api/ai/estimate/route.ts](../apps/pm-web/src/app/api/ai/estimate/route.ts)

#### Frontend Services
- [ai.service.ts](../apps/pm-web/src/core/services/ai.service.ts) - Frontend AI service wrapper

#### React Hooks
- [use-ai-refine-stream.ts](../apps/pm-web/src/core/hooks/use-ai-refine-stream.ts) - Streaming description refinement
- [use-ai-breakdown.ts](../apps/pm-web/src/core/hooks/use-ai-breakdown.ts) - Epic/story breakdown
- [use-ai-estimate.ts](../apps/pm-web/src/core/hooks/use-ai-estimate.ts) - Story points estimation
- [use-ai-stream.ts](../apps/pm-web/src/core/hooks/use-ai-stream.ts) - Base SSE streaming hook

#### UI Components
- [issue-detail-panel.tsx](../apps/pm-web/src/core/components/issue/issue-detail-panel.tsx) - Main UI integrating all AI features

#### Type Definitions
- [ai.ts](../apps/pm-web/src/core/types/ai.ts) - TypeScript interfaces for AI operations

---

## Environment Variables

### Backend (.env)
```bash
# OpenAI API
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-ada-002

# Redis Cache (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# PostgreSQL (with pgvector)
DATABASE_URL=postgresql://user:pass@localhost:5432/pm_db?schema=public

# Service Ports
PM_PORT=8083
```

### Frontend (.env.local)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:41003
```

---

## Error Handling

### Rate Limiting (429)
```typescript
try {
  await aiService.refineDescription(dto);
} catch (error) {
  if (error.status === 429) {
    throw new HttpException(
      'OpenAI rate limit exceeded. Please try again later.',
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}
```

### Validation Errors (400)
```typescript
// DTO validation
@IsString()
@Length(5, 10000)
currentDescription: string;

// Throws BadRequestException automatically if invalid
```

### Streaming Errors
```typescript
// Frontend error handling
const { refineDescription, error } = useAIRefineStream();

if (error) {
  toast.error("AI refinement failed: " + error);
}
```

### Cache Failures
```typescript
// Graceful degradation - proceed without cache
try {
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;
} catch (cacheError) {
  this.logger.warn('Cache read failed, proceeding without cache');
}
```

---

## Performance Optimization

### Caching Strategy
```typescript
// SHA256-based cache keys
import { createHash } from 'crypto';

function generateCacheKey(dto: RefineDescriptionDto): string {
  const content = JSON.stringify({
    description: dto.currentDescription,
    type: dto.issueType,
    priority: dto.priority
  });
  return createHash('sha256').update(content).digest('hex');
}

// Cache for 24 hours
await cache.set(cacheKey, result, 60 * 60 * 24);
```

### Streaming Benefits
- Reduces perceived latency (content appears immediately)
- Better UX for long-running operations
- Client can show progressive updates

### Token Counting
```typescript
import { encoding_for_model } from 'tiktoken';

function countTokens(text: string, model: string): number {
  const encoding = encoding_for_model(model);
  const tokens = encoding.encode(text);
  encoding.free();
  return tokens.length;
}

// Log token usage
this.logger.log(`Tokens used: ${tokensUsed}, Cost: $${cost.toFixed(4)}`);
```

---

## Security Considerations

### API Key Protection
```typescript
// NEVER expose API key to frontend
// Use backend proxy routes

// ❌ DON'T
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });

// ✅ DO
// Frontend calls /api/ai/refine
// Next.js route proxies to NestJS backend
// Backend uses OPENAI_API_KEY from secure env
```

### Input Sanitization
```typescript
// Validate and sanitize user input
@IsString()
@Matches(/^[a-zA-Z0-9\s\-.,!?àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệ]+$/)
currentDescription: string;
```

### Rate Limiting
```typescript
// Implement rate limiting per user
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
async refineDescription() { ... }
```

---

## Testing

### Unit Tests
```typescript
// ai.service.spec.ts
describe('AIService', () => {
  it('should refine description successfully', async () => {
    const result = await aiService.refineDescriptionStream({
      currentDescription: 'Short desc',
      issueName: 'Test',
      issueType: 'STORY',
      priority: 'MEDIUM'
    });

    expect(result).toContain('<h3>📋 Tóm tắt</h3>');
  });
});
```

### Integration Tests
```typescript
// ai.controller.e2e.spec.ts
describe('AI Controller (e2e)', () => {
  it('/api/ai/refine-description-stream (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/ai/refine-description-stream')
      .send({
        currentDescription: 'Test description',
        issueName: 'Test',
        issueType: 'STORY',
        priority: 'MEDIUM'
      })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);
  });
});
```

### Manual Testing
```bash
# Test streaming endpoint
curl -N -X POST http://localhost:41003/api/ai/refine-description-stream \
  -H 'Content-Type: application/json' \
  -d '{
    "currentDescription": "Người dùng cần đăng nhập",
    "issueName": "Login feature",
    "issueType": "STORY",
    "priority": "MEDIUM"
  }'
```

---

## Troubleshooting

### Issue: "OpenAI API key not configured"
**Solution**: Check `OPENAI_API_KEY` in backend `.env`

### Issue: "Failed to fetch - CORS error"
**Solution**: Ensure Next.js API routes are proxying correctly

### Issue: "Streaming not working"
**Solution**:
- Check `Content-Type: text/event-stream` header
- Disable nginx buffering (`X-Accel-Buffering: no`)
- Use `Cache-Control: no-cache, no-transform`

### Issue: "Vector similarity search returns empty"
**Solution**:
- Ensure pgvector extension is installed
- Run `CREATE EXTENSION IF NOT EXISTS vector;`
- Generate embeddings for existing issues

### Issue: "High OpenAI costs"
**Solution**:
- Enable caching (24h TTL)
- Switch to cheaper model (gpt-3.5-turbo)
- Implement token limits

---

## Future Roadmap

### Phase 1: Document Parsing (Q1 2025)
- [ ] PDF text extraction
- [ ] Excel/CSV parsing
- [ ] Image OCR with GPT-4 Vision
- [ ] Document structure analysis

### Phase 2: Smart Suggestions (Q2 2025)
- [ ] Auto-detect issue type from description
- [ ] Suggest assignees based on expertise
- [ ] Auto-tag issues with labels
- [ ] Estimate completion time

### Phase 3: Workflow Automation (Q3 2025)
- [ ] Auto-create sub-tasks when Epic is created
- [ ] Auto-update story points when description changes
- [ ] Auto-link related issues
- [ ] Generate test cases from acceptance criteria

### Phase 4: Advanced RAG (Q4 2025)
- [ ] Multi-project similarity search
- [ ] Historical velocity analysis
- [ ] Pattern recognition for common tasks
- [ ] Team-specific prompt tuning

---

## API Reference Summary

| Endpoint | Method | Purpose | Streaming |
|----------|--------|---------|-----------|
| `/api/ai/refine-description-stream` | POST | Refine issue description | ✅ SSE |
| `/api/ai/breakdown-issue-stream` | POST | Break down Epic/Story | ✅ SSE |
| `/api/ai/estimate-points-stream` | POST | Estimate story points | ✅ SSE |
| `/api/issues` | POST | Create issue directly | ❌ |
| `/files/presigned-url` | POST | Get upload URL | ❌ |
| `/files/confirm-upload` | POST | Confirm file upload | ❌ |

---

## Support & Contact

- **Documentation**: [/docs](../docs/)
- **Backend Code**: [/services/pm/src/modules/ai](../services/pm/src/modules/ai)
- **Frontend Code**: [/apps/pm-web/src/core](../apps/pm-web/src/core)
- **Issue Tracker**: GitHub Issues

---

**Last Updated**: 2025-12-16
**Version**: 1.0.0
**Maintainer**: Development Team
