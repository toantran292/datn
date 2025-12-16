# UC05 - Gui/nhan tin nhan

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC05 |
| **Ten** | Gui/nhan tin nhan |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Phuc tap |
| **Actor** | Member |

## Mo ta
Cho phep Member gui tin nhan van ban, tin nhan co dinh dang (bold, italic, code) va nhan tin nhan tu cac thanh vien khac trong thoi gian thuc thong qua WebSocket.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon gui va nhan tin nhan trong thoi gian thuc de trao doi thong tin voi cac thanh vien khac trong kenh.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh

## Trigger
Member mo kenh va nhap tin nhan vao o chat.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Mo kenh] --> [Ket noi WebSocket]
                                 |
                                 v
                      [Tai lich su tin nhan]
                                 |
                                 v
                      [Nhap noi dung tin nhan]
                                 |
                                 v
                      [Nhan "Gui" hoac Enter]
                                 |
                                 v
                      [Gui qua WebSocket]
                                 |
                                 v
                      [Server luu va broadcast]
                                 |
                                 v
                      [Hien thi cho tat ca thanh vien]
```

### Cac buoc chi tiet

1. **Mo kenh**
   - Member mo mot kenh dang tham gia

2. **Ket noi WebSocket**
   - He thong ket noi WebSocket va tai lich su tin nhan gan nhat

3. **Nhap tin nhan**
   - Member nhap noi dung tin nhan vao o chat

4. **Gui tin nhan**
   - Member nhan "Gui" hoac phim Enter

5. **Truyen qua WebSocket**
   - He thong gui tin nhan qua WebSocket den server

6. **Xu ly server**
   - Server luu tin nhan va broadcast den tat ca thanh vien trong kenh

7. **Hien thi tin nhan**
   - Tin nhan hien thi trong khung chat cua tat ca thanh vien online

## Cac luong su kien con (Subflows)

### S1 - Gui tin nhan co dinh dang
1. Member su dung toolbar hoac markdown de dinh dang:
   - **Bold:** `**text**` hoac Ctrl+B
   - *Italic:* `*text*` hoac Ctrl+I
   - `Code:` \`code\` hoac Ctrl+`
   - Code block: \`\`\`code\`\`\`
2. Gui tin nhan
3. Tin nhan hien thi voi dinh dang

## Luong thay the (Alternative Flows)

### 5a. Mat ket noi WebSocket
- He thong tu dong reconnect va dong bo tin nhan bi miss

### 5b. Tin nhan qua dai
- He thong thong bao "Tin nhan vuot qua gioi han ky tu"

## Ket qua
Tin nhan duoc gui va hien thi cho tat ca thanh vien trong kenh theo thoi gian thuc.

## API Endpoints

### WebSocket Events

#### Client -> Server
```javascript
// Gui tin nhan
socket.emit('message:send', {
  channelId: 'uuid',
  content: 'string',
  format: 'plain | markdown'
});
```

#### Server -> Client
```javascript
// Nhan tin nhan moi
socket.on('message:new', {
  id: 'uuid',
  channelId: 'uuid',
  senderId: 'uuid',
  senderName: 'string',
  senderAvatar: 'string',
  content: 'string',
  format: 'plain | markdown',
  createdAt: 'timestamp'
});
```

### REST API

#### GET /api/channels/:channelId/messages
**Mo ta:** Lay lich su tin nhan

**Query params:**
- `limit`: so tin nhan (default: 50)
- `before`: cursor de phan trang

**Response Success (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "string",
      "content": "string",
      "format": "plain | markdown",
      "createdAt": "timestamp",
      "editedAt": "timestamp | null"
    }
  ],
  "hasMore": true,
  "nextCursor": "string"
}
```

## Database Schema

### Messages Table (Cassandra)
```cql
CREATE TABLE messages (
  channel_id UUID,
  message_id TIMEUUID,
  sender_id UUID,
  content TEXT,
  format VARCHAR,
  thread_id UUID,
  reply_to UUID,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  PRIMARY KEY ((channel_id), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| content | Required, 1-4000 ky tu |
| channelId | Required, UUID hop le |
| format | Optional, enum: plain, markdown |

## Audit Log
- Action: `MESSAGE_SENT`
