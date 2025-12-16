# Kế hoạch triển khai RAG với pgvector

## Tổng quan

Triển khai hệ thống RAG (Retrieval-Augmented Generation) cho chat service sử dụng pgvector làm vector database, cho phép tìm kiếm ngữ nghĩa (semantic search) trên tin nhắn và tài liệu đính kèm.

---

## Phase 1: Setup pgvector Infrastructure

### 1.1 Enable pgvector Extension

```sql
-- Migration: enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.2 Tạo bảng Document Embeddings

```sql
-- Migration: create_document_embeddings.sql
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source reference
  source_type VARCHAR(50) NOT NULL, -- 'message', 'attachment', 'document'
  source_id UUID NOT NULL,
  room_id UUID NOT NULL,
  org_id UUID NOT NULL,

  -- Content
  content TEXT NOT NULL,
  chunk_index INT DEFAULT 0,
  chunk_total INT DEFAULT 1,

  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding vector(1536),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Vector similarity search index (IVFFlat for better performance)
CREATE INDEX idx_embeddings_vector ON document_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Standard indexes
CREATE INDEX idx_embeddings_room ON document_embeddings(room_id);
CREATE INDEX idx_embeddings_source ON document_embeddings(source_type, source_id);
CREATE INDEX idx_embeddings_org ON document_embeddings(org_id);
```

### 1.3 Cài đặt Dependencies

```bash
pnpm add @langchain/community pdf-parse
pnpm add -D @types/pdf-parse
```

### 1.4 Files cần tạo

| File | Mô tả |
|------|-------|
| `src/ai/embedding/embedding.service.ts` | Service tạo embeddings từ OpenAI |
| `src/ai/embedding/embedding.repository.ts` | Repository lưu/query vectors |
| `src/ai/embedding/document-processor.service.ts` | Xử lý PDF, text, chunking |
| `src/database/entities/document-embedding.entity.ts` | TypeORM entity |

---

## Phase 2: Document Processing Pipeline

### 2.1 Text Chunking Strategy

```
┌─────────────────────────────────────────┐
│            Original Document            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Recursive Text Splitter         │
│  - Chunk size: 1000 characters          │
│  - Overlap: 200 characters              │
│  - Separators: \n\n, \n, ., ?,  !       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Chunk 1│ │Chunk 2│ │Chunk 3│ │Chunk N│
└───────┘ └───────┘ └───────┘ └───────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        OpenAI Embeddings API            │
│     text-embedding-3-small (1536d)      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         pgvector (PostgreSQL)           │
└─────────────────────────────────────────┘
```

### 2.2 Supported Document Types

| Type | Processing Method | Library |
|------|-------------------|---------|
| **Plain Text** | Direct chunking | Native |
| **Markdown** | Direct chunking | Native |
| **PDF** | Extract text → chunk | `pdf-parse` |
| **JSON** | Stringify → chunk | Native |
| **CSV** | Row-by-row or stringify | Native |
| **Audio** | Whisper API → text → chunk | OpenAI Whisper |
| **Video** | Extract audio → Whisper → chunk | FFmpeg + Whisper |

### 2.3 Document Processor Interface

```typescript
interface DocumentProcessor {
  canProcess(mimeType: string): boolean;
  process(content: Buffer, metadata: DocumentMetadata): Promise<ProcessedChunk[]>;
}

interface ProcessedChunk {
  content: string;
  chunkIndex: number;
  chunkTotal: number;
  metadata: Record<string, any>;
}
```

---

## Phase 3: Embedding Service

### 3.1 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    EmbeddingService                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐    ┌─────────────────┐             │
│  │  OpenAI API     │    │   Batch Queue   │             │
│  │  Embeddings     │◄───│   (Rate Limit)  │             │
│  └─────────────────┘    └─────────────────┘             │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐    ┌─────────────────┐             │
│  │   Cache Layer   │───►│    pgvector     │             │
│  │   (Optional)    │    │   Repository    │             │
│  └─────────────────┘    └─────────────────┘             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Key Methods

```typescript
class EmbeddingService {
  // Tạo embedding cho text
  async embed(text: string): Promise<number[]>;

  // Batch embedding (hiệu quả hơn)
  async embedBatch(texts: string[]): Promise<number[][]>;

  // Index một document
  async indexDocument(doc: IndexDocumentDto): Promise<void>;

  // Index một message
  async indexMessage(message: Message): Promise<void>;

  // Semantic search
  async search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}
```

---

## Phase 4: RAG Pipeline Integration

### 4.1 Query Flow

```
┌─────────────┐
│  User Query │
└─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         1. Embed Query              │
│    OpenAI text-embedding-3-small    │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      2. Vector Similarity Search    │
│   pgvector cosine similarity        │
│   Top K = 10 relevant chunks        │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│        3. Context Assembly          │
│   Combine chunks + recent messages  │
│   Respect token limit (~8000)       │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         4. LLM Generation           │
│   GPT-4o-mini with context          │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│        5. Response + Sources        │
│   Answer + referenced documents     │
└─────────────────────────────────────┘
```

### 4.2 Updated askQuestion Method

```typescript
async askQuestion(roomId: string, userId: string, question: string) {
  // 1. Semantic search for relevant context
  const relevantDocs = await this.embeddingService.search(question, {
    roomId,
    limit: 10,
    minScore: 0.7,
  });

  // 2. Get recent messages for recency context
  const recentMessages = await this.messagesRepo.listByRoom(roomId, { pageSize: 20 });

  // 3. Combine contexts
  const context = this.buildContext(relevantDocs, recentMessages);

  // 4. Generate answer with LLM
  const answer = await this.llmService.answerWithContext(question, context);

  // 5. Return with sources
  return {
    answer: answer.text,
    sources: relevantDocs.map(d => ({
      type: d.sourceType,
      id: d.sourceId,
      content: d.content.substring(0, 200),
      score: d.score,
    })),
    confidence: answer.confidence,
  };
}
```

---

## Phase 5: Auto-Indexing

### 5.1 Message Indexing (Real-time)

```typescript
// chat.gateway.ts - After message created
@SubscribeMessage('message:send')
async handleMessage(client: Socket, payload: SendMessageDto) {
  const message = await this.chatsService.createMessage(payload);

  // Emit to room
  this.server.to(payload.roomId).emit('message:new', message);

  // Index asynchronously (non-blocking)
  this.embeddingService.indexMessage(message).catch(err =>
    this.logger.error('Failed to index message', err)
  );

  return message;
}
```

### 5.2 Attachment Indexing (Background Job)

```typescript
// When attachment upload is confirmed
async confirmAttachmentUpload(messageId: string, assetId: string) {
  const attachment = await this.saveAttachment(...);

  // Queue for processing
  await this.documentQueue.add('process-attachment', {
    attachmentId: attachment.id,
    messageId,
    roomId: message.roomId,
  });

  return attachment;
}

// Background worker
@Process('process-attachment')
async processAttachment(job: Job<ProcessAttachmentData>) {
  const { attachmentId, roomId } = job.data;

  // 1. Download file
  const content = await this.downloadFile(attachmentId);

  // 2. Process based on type
  const chunks = await this.documentProcessor.process(content, metadata);

  // 3. Index chunks
  await this.embeddingService.indexChunks(chunks, {
    sourceType: 'attachment',
    sourceId: attachmentId,
    roomId,
  });
}
```

### 5.3 Batch Re-indexing (Admin)

```typescript
// API endpoint for admin to re-index a room
@Post('admin/rooms/:roomId/reindex')
async reindexRoom(@Param('roomId') roomId: string) {
  // Queue all messages and attachments for re-indexing
  await this.embeddingService.queueRoomReindex(roomId);
  return { status: 'queued' };
}
```

---

## Phase 6: API Endpoints

### 6.1 New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/ask/:roomId` | Q&A với RAG (updated) |
| POST | `/ai/index/:roomId` | Manual index room |
| GET | `/ai/search/:roomId` | Semantic search |
| DELETE | `/ai/embeddings/:roomId` | Clear embeddings |

### 6.2 Request/Response Examples

**POST /ai/ask/:roomId**
```json
// Request
{
  "question": "Deadline của project X là khi nào?",
  "options": {
    "includeAttachments": true,
    "maxSources": 5
  }
}

// Response
{
  "answer": "Theo cuộc thảo luận ngày 10/12, deadline của project X là 25/12/2024.",
  "sources": [
    {
      "type": "message",
      "id": "msg-123",
      "content": "Project X cần hoàn thành trước 25/12...",
      "score": 0.92,
      "createdAt": "2024-12-10T10:30:00Z"
    },
    {
      "type": "attachment",
      "id": "att-456",
      "content": "Timeline: ... Milestone 3: 25/12/2024...",
      "score": 0.87,
      "fileName": "project-timeline.pdf"
    }
  ],
  "confidence": 0.89
}
```

---

## Implementation Timeline

| Phase | Tasks | Estimate |
|-------|-------|----------|
| **Phase 1** | pgvector setup, entity, repository | 2-3 hours |
| **Phase 2** | Document processors (text, PDF) | 2-3 hours |
| **Phase 3** | Embedding service + OpenAI integration | 2-3 hours |
| **Phase 4** | RAG pipeline, update askQuestion | 2-3 hours |
| **Phase 5** | Auto-indexing (messages, attachments) | 3-4 hours |
| **Phase 6** | API endpoints, testing | 2-3 hours |

**Total: ~15-20 hours**

---

## Configuration

### Environment Variables

```env
# OpenAI (existing)
OPENAI_API_KEY=sk-...

# Embedding specific
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
EMBEDDING_BATCH_SIZE=100

# RAG settings
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_TOP_K=10
RAG_MIN_SCORE=0.7
```

---

## File Structure

```
src/ai/
├── ai.module.ts
├── ai.controller.ts
├── ai.service.ts
├── llm.service.ts
├── repositories/
│   └── channel-ai-config.repository.ts
└── rag/                          # NEW
    ├── rag.module.ts
    ├── embedding.service.ts
    ├── embedding.repository.ts
    ├── vector-search.service.ts
    └── document-processors/
        ├── processor.interface.ts
        ├── text.processor.ts
        ├── pdf.processor.ts
        └── audio.processor.ts

src/database/entities/
├── ...existing entities...
└── document-embedding.entity.ts  # NEW
```

---

## Testing Checklist

- [ ] pgvector extension enabled
- [ ] Document embedding entity created
- [ ] Text chunking works correctly
- [ ] PDF processing works
- [ ] OpenAI embedding API integration
- [ ] Vector similarity search returns relevant results
- [ ] Message auto-indexing on send
- [ ] Attachment indexing on upload
- [ ] RAG Q&A returns accurate answers with sources
- [ ] Performance acceptable (< 2s response time)

---

## Future Enhancements

1. **Hybrid Search**: Combine vector search với keyword search (BM25)
2. **Multi-modal**: Support image understanding (GPT-4 Vision)
3. **Caching**: Cache frequently asked questions
4. **Analytics**: Track query patterns và improve retrieval
5. **Fine-tuning**: Custom embedding models for domain-specific content
