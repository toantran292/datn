# UC06 - Tao thread thao luan

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC06 |
| **Ten** | Tao thread thao luan |
| **Muc do** | Quan trong |
| **Do phuc tap** | Trung binh |
| **Actor** | Member |

## Mo ta
Cho phep Member tao thread (luong thao luan phu) tu mot tin nhan cu the de thao luan sau ve mot chu de ma khong anh huong den luong chat chinh.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon tao thread tu mot tin nhan de thao luan chi tiet ma khong lam gian doan luong hoi thoai chinh.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh
- Co tin nhan de tao thread

## Trigger
Member chon mot tin nhan va chon "Tao thread".

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Hover vao tin nhan] --> [Chon "Tao thread"]
                                            |
                                            v
                                   [Mo panel thread]
                                            |
                                            v
                                   [Nhap noi dung tra loi]
                                            |
                                            v
                                   [Gui tin nhan trong thread]
                                            |
                                            v
                                   [Hien thi so reply tren tin nhan goc]
```

### Cac buoc chi tiet

1. **Hover vao tin nhan**
   - Member hover vao mot tin nhan trong kenh

2. **Chon tao thread**
   - Member chon icon "Tao thread" hoac "Reply in thread"

3. **Mo panel thread**
   - He thong mo panel thread ben phai man hinh

4. **Nhap noi dung**
   - Member nhap noi dung tra loi trong thread

5. **Gui tin nhan**
   - Member nhan "Gui"

6. **Luu va hien thi**
   - He thong luu tin nhan trong thread va hien thi so reply tren tin nhan goc

7. **Thao luan tiep**
   - Cac thanh vien khac co the xem va tham gia thread

## Luong thay the (Alternative Flows)

### 2a. Thread da ton tai
- He thong mo thread hien co thay vi tao moi

## Ket qua
Thread duoc tao va cac thanh vien co the thao luan chi tiet trong thread.

## API Endpoints

### WebSocket Events

#### Client -> Server
```javascript
// Gui tin nhan trong thread
socket.emit('thread:reply', {
  channelId: 'uuid',
  threadId: 'uuid',
  content: 'string'
});
```

#### Server -> Client
```javascript
// Nhan tin nhan moi trong thread
socket.on('thread:new-reply', {
  threadId: 'uuid',
  message: {
    id: 'uuid',
    senderId: 'uuid',
    senderName: 'string',
    content: 'string',
    createdAt: 'timestamp'
  },
  replyCount: 'number'
});
```

### REST API

#### GET /api/messages/:messageId/thread
**Mo ta:** Lay cac tin nhan trong thread

**Response Success (200):**
```json
{
  "parentMessage": {
    "id": "uuid",
    "content": "string",
    "senderId": "uuid",
    "senderName": "string",
    "createdAt": "timestamp"
  },
  "replies": [
    {
      "id": "uuid",
      "content": "string",
      "senderId": "uuid",
      "senderName": "string",
      "createdAt": "timestamp"
    }
  ],
  "replyCount": "number"
}
```

#### POST /api/messages/:messageId/thread
**Mo ta:** Tra loi trong thread

**Request:**
```json
{
  "content": "string"
}
```

## Database Schema

### Threads Table (Cassandra)
```cql
CREATE TABLE thread_messages (
  thread_id UUID,
  message_id TIMEUUID,
  channel_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMP,
  PRIMARY KEY ((thread_id), message_id)
) WITH CLUSTERING ORDER BY (message_id ASC);

-- Counter table for reply count
CREATE TABLE thread_reply_counts (
  message_id UUID PRIMARY KEY,
  reply_count COUNTER
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| content | Required, 1-4000 ky tu |
| messageId | Required, UUID hop le (parent message) |

## Audit Log
- Action: `THREAD_CREATED`
- Action: `THREAD_REPLY_SENT`
