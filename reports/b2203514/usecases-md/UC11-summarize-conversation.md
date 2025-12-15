# UC11 - Tom tat hoi thoai

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC11 |
| **Ten** | Tom tat hoi thoai |
| **Muc do** | Quan trong |
| **Do phuc tap** | Phuc tap |
| **Actor** | Member |

## Mo ta
Cho phep Member yeu cau AI tom tat mot doan hoi thoai duoc chon hoac tom tat toan bo kenh tu mot moc thoi gian (vi du: tu lan truy cap cuoi).

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon nam bat nhanh noi dung cua mot doan hoi thoai dai ma khong can doc toan bo.
- **AI Provider:** Xu ly va sinh van ban tom tat.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh
- AI Assistant duoc bat trong kenh
- Co tin nhan de tom tat

## Trigger
Member chon cac tin nhan va yeu cau tom tat hoac chon "Tom tat tu lan truy cap cuoi".

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Chon tin nhan can tom tat] --> [Click "Tom tat voi AI"]
                                                      |
                                                      v
                                            [Thu thap noi dung]
                                                      |
                                                      v
                                            [Gui den AI Service]
                                                      |
                                                      v
                                            [AI sinh ban tom tat]
                                                      |
                                                      v
                                            [Hien thi trong panel AI]
                                                      |
                                                      v
                                            [Copy hoac luu tom tat]
```

### Cac buoc chi tiet

1. **Chon tin nhan**
   - Member chon mot hoac nhieu tin nhan can tom tat

2. **Yeu cau tom tat**
   - Member click "Tom tat voi AI"

3. **Thu thap noi dung**
   - He thong thu thap noi dung cac tin nhan duoc chon

4. **Gui den AI Service**
   - He thong gui noi dung den AI Service

5. **Xu ly AI**
   - AI Service su dung LLM de sinh ban tom tat

6. **Hien thi ket qua**
   - He thong hien thi ban tom tat trong panel AI Assistant

7. **Luu hoac copy**
   - Member co the copy hoac luu ban tom tat

## Cac luong su kien con (Subflows)

### S1 - Tom tat tu moc thoi gian
1. Member chon "Tom tat tu lan truy cap cuoi"
2. He thong lay cac tin nhan tu last_read_at
3. AI tom tat tat ca tin nhan moi
4. Hien thi ket qua

## Luong thay the (Alternative Flows)

### 4a. Noi dung qua dai
- He thong chia nho va tom tat tung phan, sau do tong hop

## Ket qua
Ban tom tat hoi thoai duoc hien thi, giup Member nam bat noi dung nhanh chong.

## API Endpoints

### POST /api/ai/summarize
**Mo ta:** Tom tat hoi thoai

**Request:**
```json
{
  "channelId": "uuid",
  "messageIds": ["uuid"],
  "mode": "selected | since_last_visit | time_range",
  "fromTimestamp": "timestamp (optional)",
  "toTimestamp": "timestamp (optional)"
}
```

**Response Success (200):**
```json
{
  "summary": {
    "id": "uuid",
    "content": "string",
    "bulletPoints": [
      "string"
    ],
    "messageCount": "number",
    "timeRange": {
      "from": "timestamp",
      "to": "timestamp"
    },
    "generatedAt": "timestamp"
  }
}
```

**Response Error (400):**
```json
{
  "error": "AI_DISABLED",
  "message": "AI Assistant is not enabled for this channel"
}
```

### Streaming Response (SSE)

```javascript
// Event stream for long summaries
POST /api/ai/summarize/stream

// Events:
event: start
data: {"summaryId": "uuid"}

event: chunk
data: {"text": "partial summary text"}

event: complete
data: {"summary": {...}}
```

## Database Schema

### AI Summaries Table
```sql
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  bullet_points JSONB,
  message_count INTEGER,
  time_range_from TIMESTAMP,
  time_range_to TIMESTAMP,
  model VARCHAR(100),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## AI Prompt Template

```
You are a helpful assistant that summarizes conversations.

Given the following conversation from a team chat channel, provide:
1. A concise summary (2-3 sentences)
2. Key bullet points (3-5 items)
3. Any decisions or action items mentioned

Conversation:
{messages}

Please summarize in Vietnamese.
```

## Validation Rules
| Field | Rules |
|-------|-------|
| channelId | Required, UUID hop le |
| messageIds | Required neu mode = selected |
| mode | Required, enum: selected, since_last_visit, time_range |

## Audit Log
- Action: `AI_SUMMARY_REQUESTED`
- Action: `AI_SUMMARY_GENERATED`
