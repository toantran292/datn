# UC07 - Tuong tac tin nhan

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC07 |
| **Ten** | Tuong tac tin nhan |
| **Muc do** | Quan trong |
| **Do phuc tap** | Don gian |
| **Actor** | Member |

## Mo ta
Cho phep Member thuc hien cac tuong tac voi tin nhan: them reaction (emoji), reply truc tiep, chinh sua tin nhan cua minh, xoa tin nhan va ghim tin nhan quan trong.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon tuong tac voi tin nhan bang reaction, reply, chinh sua, xoa hoac ghim tin nhan quan trong.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh

## Trigger
Member chon mot tin nhan va thuc hien mot hanh dong tuong tac.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Hover vao tin nhan] --> [Hien thi toolbar]
                                            |
                                            v
                                   [Chon icon reaction]
                                            |
                                            v
                                   [Hien thi bang chon emoji]
                                            |
                                            v
                                   [Chon emoji]
                                            |
                                            v
                                   [Them reaction va hien thi]
```

### Cac buoc chi tiet

1. **Hover vao tin nhan**
   - Member hover vao mot tin nhan trong kenh

2. **Hien thi toolbar**
   - He thong hien thi toolbar voi cac tuy chon tuong tac

3. **Chon reaction**
   - Member chon icon reaction (emoji)

4. **Hien thi emoji picker**
   - He thong hien thi bang chon emoji

5. **Chon emoji**
   - Member chon mot emoji

6. **Them reaction**
   - He thong them reaction vao tin nhan va hien thi cho tat ca thanh vien

## Cac luong su kien con (Subflows)

### S1 - Reply tin nhan
1. Member chon "Reply"
2. Tin nhan moi duoc lien ket voi tin nhan goc
3. Hien thi quote cua tin nhan goc

### S2 - Chinh sua tin nhan
1. Member chon "Edit" (chi tin nhan cua minh)
2. Sua noi dung
3. Luu
4. Tin nhan hien thi mark "edited"

### S3 - Xoa tin nhan
1. Member chon "Delete"
2. Xac nhan
3. Tin nhan bi xoa (hoac hien thi "Message deleted")

### S4 - Ghim tin nhan
1. Member chon "Pin"
2. Tin nhan duoc ghim va hien thi trong danh sach pinned

## Luong thay the (Alternative Flows)

### 3a. Khong co quyen chinh sua/xoa
- He thong an cac tuy chon khong duoc phep

## Ket qua
Tin nhan duoc tuong tac (reaction/reply/edit/delete/pin) thanh cong.

## API Endpoints

### WebSocket Events

```javascript
// Them reaction
socket.emit('message:react', {
  messageId: 'uuid',
  emoji: 'string'
});

// Nhan reaction moi
socket.on('message:reacted', {
  messageId: 'uuid',
  emoji: 'string',
  userId: 'uuid',
  count: 'number'
});
```

### REST API

#### POST /api/messages/:messageId/reactions
**Mo ta:** Them reaction

**Request:**
```json
{
  "emoji": "string"
}
```

#### DELETE /api/messages/:messageId/reactions/:emoji
**Mo ta:** Xoa reaction cua minh

#### PUT /api/messages/:messageId
**Mo ta:** Chinh sua tin nhan

**Request:**
```json
{
  "content": "string"
}
```

#### DELETE /api/messages/:messageId
**Mo ta:** Xoa tin nhan

#### POST /api/messages/:messageId/pin
**Mo ta:** Ghim tin nhan

#### DELETE /api/messages/:messageId/pin
**Mo ta:** Bo ghim tin nhan

#### GET /api/channels/:channelId/pinned
**Mo ta:** Lay danh sach tin nhan da ghim

## Database Schema

### Message Reactions Table
```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);
```

### Pinned Messages Table
```sql
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  message_id UUID NOT NULL,
  pinned_by UUID NOT NULL REFERENCES users(id),
  pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| emoji | Required, valid emoji string |
| content (edit) | Required, 1-4000 ky tu |

## Audit Log
- Action: `MESSAGE_REACTED`
- Action: `MESSAGE_EDITED`
- Action: `MESSAGE_DELETED`
- Action: `MESSAGE_PINNED`
- Action: `MESSAGE_UNPINNED`
