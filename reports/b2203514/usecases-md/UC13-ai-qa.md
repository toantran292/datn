# UC13 - Hoi dap theo ngu canh

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC13 |
| **Ten** | Hoi dap theo ngu canh |
| **Muc do** | Quan trong |
| **Do phuc tap** | Phuc tap |
| **Actor** | Member |

## Mo ta
Cho phep Member dat cau hoi ve noi dung da trao doi trong kenh. AI su dung kien truc RAG de truy xuat ngu canh lien quan tu vector database va sinh cau tra loi chinh xac.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon dat cau hoi va nhan cau tra loi dua tren noi dung da trao doi trong kenh.
- **AI Provider:** Truy xuat ngu canh va sinh cau tra loi.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh
- AI Assistant duoc bat trong kenh
- Kenh co du lieu da duoc index

## Trigger
Member nhap cau hoi vao AI Assistant.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Mo panel AI Assistant] --> [Nhap cau hoi]
                                              |
                                              v
                                     [Tao embedding cho cau hoi]
                                              |
                                              v
                                     [Truy xuat context tu vector DB]
                                              |
                                              v
                                     [Gui cau hoi + context den LLM]
                                              |
                                              v
                                     [LLM sinh cau tra loi]
                                              |
                                              v
                                     [Hien thi cau tra loi + nguon]
                                              |
                                              v
                                     [Click nguon de xem tin nhan goc]
```

### Cac buoc chi tiet

1. **Mo AI Assistant**
   - Member mo panel AI Assistant

2. **Nhap cau hoi**
   - Member nhap cau hoi ve noi dung kenh

3. **Tao embedding**
   - He thong tao embedding cho cau hoi

4. **Truy xuat context**
   - He thong truy xuat cac tin nhan/tai lieu lien quan tu vector database

5. **Gui den LLM**
   - He thong gui cau hoi + context den LLM

6. **Sinh cau tra loi**
   - LLM sinh cau tra loi dua tren context

7. **Hien thi ket qua**
   - He thong hien thi cau tra loi kem nguon tham chieu

8. **Xem nguon**
   - Member co the click vao nguon de xem tin nhan goc

## Luong thay the (Alternative Flows)

### 4a. Khong tim thay context lien quan
- AI tra loi dua tren kien thuc chung va thong bao "Khong tim thay thong tin cu the trong kenh"

## Ket qua
Member nhan duoc cau tra loi chinh xac dua tren noi dung da trao doi trong kenh.

## API Endpoints

### POST /api/ai/qa
**Mo ta:** Hoi dap theo ngu canh

**Request:**
```json
{
  "channelId": "uuid",
  "question": "string",
  "conversationId": "uuid (optional, for follow-up)"
}
```

**Response Success (200):**
```json
{
  "answer": {
    "id": "uuid",
    "content": "string",
    "confidence": "number (0-1)",
    "sources": [
      {
        "messageId": "uuid",
        "content": "string",
        "senderName": "string",
        "timestamp": "timestamp",
        "relevanceScore": "number"
      }
    ],
    "conversationId": "uuid"
  }
}
```

### Streaming Response (SSE)

```javascript
POST /api/ai/qa/stream

// Events:
event: sources
data: {"sources": [...]}

event: chunk
data: {"text": "partial answer"}

event: complete
data: {"answer": {...}}
```

### GET /api/ai/qa/history
**Mo ta:** Lay lich su hoi dap

**Query params:**
- `channelId`: UUID
- `limit`: number (default: 20)

## Database Schema

### QA History Table
```sql
CREATE TABLE ai_qa_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence DECIMAL(3,2),
  sources JSONB,
  model VARCHAR(100),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Message Embeddings (Vector DB)
```sql
CREATE TABLE message_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  embedding VECTOR(1536),
  content_chunk TEXT,
  chunk_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON message_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## RAG Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Question  │────>│ Embedding Model │────>│ Vector Query │
└─────────────┘     └─────────────────┘     └──────────────┘
                                                    │
                                                    v
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Answer    │<────│      LLM        │<────│   Context    │
└─────────────┘     └─────────────────┘     └──────────────┘
```

## AI Prompt Template

```
You are a helpful assistant that answers questions based on the provided context from a team chat channel.

Context from channel messages:
{context}

User question: {question}

Instructions:
1. Answer based ONLY on the provided context
2. If the answer is not in the context, say "I couldn't find specific information about this in the channel"
3. Cite the sources by referencing the message authors
4. Answer in Vietnamese

Answer:
```

## Validation Rules
| Field | Rules |
|-------|-------|
| channelId | Required, UUID hop le |
| question | Required, 1-500 ky tu |

## Audit Log
- Action: `AI_QA_ASKED`
- Action: `AI_QA_ANSWERED`
