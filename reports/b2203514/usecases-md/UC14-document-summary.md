# UC14 - Tom tat tai lieu

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC14 |
| **Ten** | Tom tat tai lieu |
| **Muc do** | Quan trong |
| **Do phuc tap** | Phuc tap |
| **Actor** | Member |

## Mo ta
Cho phep Member yeu cau AI tom tat noi dung cua mot tai lieu dinh kem trong chat (PDF, DOCX, v.v.) ngay trong khung chat.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon hieu nhanh noi dung cua tai lieu dinh kem ma khong can doc toan bo.
- **AI Provider:** Xu ly tai lieu va sinh ban tom tat.
- **File Service:** Cung cap noi dung tai lieu.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh
- AI Assistant duoc bat trong kenh
- Co tai lieu dinh kem de tom tat

## Trigger
Member chon mot tai lieu dinh kem va yeu cau tom tat.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Click vao tai lieu] --> [Chon "Tom tat voi AI"]
                                             |
                                             v
                                    [Lay noi dung tu File Service]
                                             |
                                             v
                                    [Trich xuat van ban]
                                             |
                                             v
                                    [Gui den AI Service]
                                             |
                                             v
                                    [AI sinh ban tom tat]
                                             |
                                             v
                                    [Hien thi trong panel AI]
```

### Cac buoc chi tiet

1. **Click vao tai lieu**
   - Member click vao tai lieu dinh kem trong tin nhan

2. **Chon tom tat**
   - Member chon "Tom tat voi AI"

3. **Lay noi dung**
   - He thong lay noi dung tai lieu tu File Service

4. **Trich xuat van ban**
   - He thong trich xuat van ban tu tai lieu (PDF parser, DOCX parser)

5. **Gui den AI**
   - He thong gui noi dung den AI Service

6. **Xu ly AI**
   - AI Service sinh ban tom tat

7. **Hien thi ket qua**
   - He thong hien thi ban tom tat trong panel AI Assistant

## Luong thay the (Alternative Flows)

### 4a. Khong the trich xuat van ban
- He thong thong bao "Khong the doc noi dung tai lieu nay"

### 4b. Tai lieu qua dai
- He thong chia nho, tom tat tung phan va tong hop

## Ket qua
Ban tom tat tai lieu duoc hien thi, giup Member nam bat noi dung nhanh chong.

## API Endpoints

### POST /api/ai/document-summary
**Mo ta:** Tom tat tai lieu

**Request:**
```json
{
  "fileId": "uuid",
  "channelId": "uuid",
  "options": {
    "language": "vi | en",
    "length": "short | medium | long",
    "format": "paragraph | bullets | structured"
  }
}
```

**Response Success (200):**
```json
{
  "summary": {
    "id": "uuid",
    "fileId": "uuid",
    "fileName": "string",
    "content": "string",
    "sections": [
      {
        "title": "string",
        "content": "string"
      }
    ],
    "keyPoints": [
      "string"
    ],
    "wordCount": {
      "original": "number",
      "summary": "number"
    },
    "generatedAt": "timestamp"
  }
}
```

**Response Error (400):**
```json
{
  "error": "UNSUPPORTED_FORMAT",
  "message": "Cannot extract text from this file format"
}
```

### Streaming Response (SSE)

```javascript
POST /api/ai/document-summary/stream

// Events:
event: progress
data: {"stage": "extracting | processing | summarizing", "progress": 50}

event: chunk
data: {"text": "partial summary"}

event: complete
data: {"summary": {...}}
```

## Database Schema

### Document Summaries Table
```sql
CREATE TABLE document_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  summary_content TEXT NOT NULL,
  sections JSONB,
  key_points JSONB,
  original_word_count INTEGER,
  summary_word_count INTEGER,
  language VARCHAR(10),
  format VARCHAR(20),
  model VARCHAR(100),
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Supported Document Types

| Type | Extension | Parser |
|------|-----------|--------|
| PDF | .pdf | pdf-parse, pdf2json |
| Word | .doc, .docx | mammoth, docx-parser |
| Text | .txt | Native |
| Markdown | .md | Native |
| HTML | .html | cheerio |

## AI Prompt Template

```
You are a helpful assistant that summarizes documents.

Document content:
{document_text}

Please provide:
1. A concise summary (appropriate for the document length)
2. Key points (5-10 bullet points)
3. Section summaries if the document has clear sections

Options:
- Language: {language}
- Length: {length}
- Format: {format}

Summary:
```

## Document Processing Pipeline

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   File ID   │────>│  File Service   │────>│ Raw Content  │
└─────────────┘     └─────────────────┘     └──────────────┘
                                                    │
                                                    v
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Summary   │<────│      LLM        │<────│  Text Parser │
└─────────────┘     └─────────────────┘     └──────────────┘
```

## Validation Rules
| Field | Rules |
|-------|-------|
| fileId | Required, UUID hop le |
| channelId | Required, UUID hop le |
| File phai la dinh dang duoc ho tro |

## Audit Log
- Action: `DOCUMENT_SUMMARY_REQUESTED`
- Action: `DOCUMENT_SUMMARY_GENERATED`
