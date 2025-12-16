# UC12 - Trich xuat action items

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC12 |
| **Ten** | Trich xuat action items |
| **Muc do** | Quan trong |
| **Do phuc tap** | Phuc tap |
| **Actor** | Member |

## Mo ta
Cho phep Member yeu cau AI phan tich cuoc hoi thoai va trich xuat danh sach cac cong viec, nhiem vu (action items) duoc de cap, bao gom nguoi chiu trach nhiem va deadline neu co.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon trich xuat danh sach cong viec, nhiem vu tu cuoc thao luan de theo doi va thuc hien.
- **AI Provider:** Phan tich va trich xuat action items.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh
- AI Assistant duoc bat trong kenh
- Co tin nhan de phan tich

## Trigger
Member chon "Trich xuat action items" trong mot kenh hoac thread.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Mo panel AI Assistant] --> [Chon "Trich xuat action items"]
                                                   |
                                                   v
                                          [Thu thap noi dung hoi thoai]
                                                   |
                                                   v
                                          [Gui den AI Service]
                                                   |
                                                   v
                                          [AI phan tich va trich xuat]
                                                   |
                                                   v
                                          [Hien thi danh sach action items]
                                                   |
                                                   v
                                          [Copy hoac export]
```

### Cac buoc chi tiet

1. **Mo AI Assistant**
   - Member mo panel AI Assistant trong kenh

2. **Chon trich xuat**
   - Member chon "Trich xuat action items"

3. **Thu thap noi dung**
   - He thong thu thap noi dung hoi thoai gan day

4. **Gui den AI Service**
   - He thong gui noi dung den AI Service

5. **Phan tich AI**
   - AI Service phan tich va trich xuat cac cong viec

6. **Hien thi ket qua**
   - He thong hien thi danh sach action items voi format:
     - Task
     - Nguoi thuc hien
     - Deadline

7. **Export**
   - Member co the copy hoac export danh sach

## Luong thay the (Alternative Flows)

### 5a. Khong tim thay action items
- He thong thong bao "Khong tim thay cong viec cu the trong cuoc hoi thoai"

## Ket qua
Danh sach action items duoc trich xuat va hien thi cho Member.

## API Endpoints

### POST /api/ai/action-items
**Mo ta:** Trich xuat action items

**Request:**
```json
{
  "channelId": "uuid",
  "threadId": "uuid (optional)",
  "timeRange": {
    "from": "timestamp (optional)",
    "to": "timestamp (optional)"
  }
}
```

**Response Success (200):**
```json
{
  "actionItems": [
    {
      "id": "uuid",
      "task": "string",
      "assignee": {
        "userId": "uuid | null",
        "name": "string | null"
      },
      "deadline": "string | null",
      "priority": "high | medium | low | null",
      "sourceMessageId": "uuid",
      "sourceText": "string"
    }
  ],
  "totalFound": "number",
  "analyzedMessages": "number",
  "generatedAt": "timestamp"
}
```

### POST /api/ai/action-items/export
**Mo ta:** Export action items

**Request:**
```json
{
  "actionItemIds": ["uuid"],
  "format": "json | csv | markdown"
}
```

## Database Schema

### Extracted Action Items Table
```sql
CREATE TABLE extracted_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  thread_id UUID,
  extracted_by UUID NOT NULL REFERENCES users(id),
  task TEXT NOT NULL,
  assignee_user_id UUID REFERENCES users(id),
  assignee_name VARCHAR(100),
  deadline VARCHAR(100),
  priority VARCHAR(20),
  source_message_id UUID,
  source_text TEXT,
  status VARCHAR(20) DEFAULT 'EXTRACTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## AI Prompt Template

```
You are an assistant that extracts action items from team conversations.

Analyze the following conversation and identify any tasks, action items, or to-dos mentioned.

For each action item, extract:
1. Task description
2. Person responsible (if mentioned)
3. Deadline (if mentioned)
4. Priority level (if inferable)

Conversation:
{messages}

Return the results in JSON format. If no action items are found, return an empty array.
Please identify tasks in Vietnamese.
```

## Validation Rules
| Field | Rules |
|-------|-------|
| channelId | Required, UUID hop le |
| threadId | Optional, UUID hop le |

## Audit Log
- Action: `ACTION_ITEMS_EXTRACTED`
- Action: `ACTION_ITEMS_EXPORTED`
