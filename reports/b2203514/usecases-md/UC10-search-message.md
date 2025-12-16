# UC10 - Tim kiem tin nhan

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC10 |
| **Ten** | Tim kiem tin nhan |
| **Muc do** | Quan trong |
| **Do phuc tap** | Trung binh |
| **Actor** | Member |

## Mo ta
Cho phep Member tim kiem tin nhan trong cac kenh ma minh co quyen truy cap. Ho tro tim kiem theo tu khoa (full-text) va tim kiem ngu nghia (semantic search) su dung vector database.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon tim kiem tin nhan cu theo tu khoa, nguoi gui hoac khoang thoi gian.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua workspace

## Trigger
Member nhap tu khoa vao o tim kiem.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Click o tim kiem / Ctrl+K] --> [Nhap tu khoa]
                                                   |
                                                   v
                                          [Tim kiem full-text]
                                                   |
                                                   v
                                          [Hien thi ket qua voi highlight]
                                                   |
                                                   v
                                          [Click vao ket qua]
                                                   |
                                                   v
                                          [Chuyen den tin nhan trong kenh]
```

### Cac buoc chi tiet

1. **Mo tim kiem**
   - Member click vao o tim kiem hoac nhan Ctrl+K

2. **Nhap tu khoa**
   - Member nhap tu khoa can tim

3. **Tim kiem**
   - He thong thuc hien tim kiem full-text tren noi dung tin nhan

4. **Hien thi ket qua**
   - He thong hien thi danh sach ket qua voi highlight tu khoa

5. **Chon ket qua**
   - Member click vao mot ket qua

6. **Chuyen den tin nhan**
   - He thong chuyen den tin nhan tuong ung trong kenh

## Cac luong su kien con (Subflows)

### S1 - Tim kiem nang cao
1. Member chon bo loc:
   - Kenh cu the
   - Nguoi gui
   - Khoang thoi gian
   - Loai (tin nhan / file / link)
2. Ket qua duoc loc theo dieu kien

### S2 - Tim kiem ngu nghia
1. Member bat che do semantic search
2. He thong tim theo y nghia thay vi tu khoa chinh xac
3. Su dung vector database de tim kiem

## Luong thay the (Alternative Flows)

### 3a. Khong co ket qua
- He thong hien thi "Khong tim thay tin nhan phu hop"

### 3b. Qua nhieu ket qua
- He thong phan trang ket qua va hien thi cac ket qua lien quan nhat truoc

## Ket qua
Member tim duoc tin nhan can tim va co the truy cap truc tiep.

## API Endpoints

### GET /api/search/messages
**Mo ta:** Tim kiem tin nhan

**Query params:**
- `q`: Tu khoa tim kiem (required)
- `channelId`: Loc theo kenh (optional)
- `senderId`: Loc theo nguoi gui (optional)
- `from`: Thoi gian bat dau (optional)
- `to`: Thoi gian ket thuc (optional)
- `type`: Loai (message, file, link) (optional)
- `semantic`: Bat semantic search (optional, default: false)
- `page`: Trang (default: 1)
- `limit`: So ket qua (default: 20)

**Response Success (200):**
```json
{
  "results": [
    {
      "messageId": "uuid",
      "channelId": "uuid",
      "channelName": "string",
      "content": "string",
      "highlight": "string with <mark>keyword</mark>",
      "senderId": "uuid",
      "senderName": "string",
      "createdAt": "timestamp",
      "score": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### GET /api/search/suggestions
**Mo ta:** Goi y tim kiem

**Query params:**
- `q`: Tu khoa

**Response Success (200):**
```json
{
  "suggestions": [
    "string"
  ],
  "recentSearches": [
    "string"
  ]
}
```

## Database Schema

### Search Index (Elasticsearch)
```json
{
  "mappings": {
    "properties": {
      "message_id": { "type": "keyword" },
      "channel_id": { "type": "keyword" },
      "sender_id": { "type": "keyword" },
      "content": {
        "type": "text",
        "analyzer": "vietnamese"
      },
      "created_at": { "type": "date" },
      "type": { "type": "keyword" }
    }
  }
}
```

### Vector Index (for Semantic Search)
```sql
CREATE TABLE message_embeddings (
  message_id UUID PRIMARY KEY,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON message_embeddings
USING ivfflat (embedding vector_cosine_ops);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| q | Required, 1-200 ky tu |
| limit | Optional, 1-100 |

## Audit Log
- Action: `SEARCH_PERFORMED`
