# UC15 - Quan ly thong bao kenh

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC15 |
| **Ten** | Quan ly thong bao kenh |
| **Muc do** | Quan trong |
| **Do phuc tap** | Don gian |
| **Actor** | Member |

## Mo ta
Cho phep Member cau hinh muc do thong bao cho tung kenh: nhan tat ca, chi mention, hoac tat thong bao. Member cung co the xem danh sach tin nhan chua doc.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon kiem soat thong bao nhan duoc tu cac kenh de tranh bi qua tai thong tin.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh

## Trigger
Member truy cap cai dat thong bao cua kenh hoac xem danh sach tin chua doc.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Click icon cai dat kenh] --> [Chon "Cai dat thong bao"]
                                                    |
                                                    v
                                           [Hien thi cac tuy chon]
                                                    |
                                                    v
                                           [Chon muc do thong bao]
                                                    |
                                                    v
                                           [Nhan "Luu"]
                                                    |
                                                    v
                                           [Cap nhat cau hinh]
```

### Cac buoc chi tiet

1. **Truy cap cai dat**
   - Member click vao icon cai dat cua kenh

2. **Chon cai dat thong bao**
   - Member chon "Cai dat thong bao"

3. **Hien thi tuy chon**
   - He thong hien thi cac tuy chon:
     - Tat ca tin nhan
     - Chi mention
     - Tat thong bao

4. **Chon muc do**
   - Member chon muc do thong bao mong muon

5. **Luu cau hinh**
   - Member nhan "Luu"

6. **Cap nhat**
   - He thong cap nhat cau hinh thong bao cho kenh

## Cac luong su kien con (Subflows)

### S1 - Xem tin chua doc
1. Member click vao badge so tin chua doc
2. He thong hien thi danh sach tin nhan moi
3. Member danh dau da doc

## Ket qua
Cau hinh thong bao duoc cap nhat, Member chi nhan thong bao theo muc do da chon.

## API Endpoints

### GET /api/channels/:channelId/notification-settings
**Mo ta:** Lay cau hinh thong bao cua kenh

**Response Success (200):**
```json
{
  "channelId": "uuid",
  "level": "all | mentions | none",
  "mutedUntil": "timestamp | null",
  "soundEnabled": true,
  "pushEnabled": true
}
```

### PUT /api/channels/:channelId/notification-settings
**Mo ta:** Cap nhat cau hinh thong bao

**Request:**
```json
{
  "level": "all | mentions | none",
  "mutedUntil": "timestamp | null",
  "soundEnabled": true,
  "pushEnabled": true
}
```

### GET /api/channels/:channelId/unread
**Mo ta:** Lay danh sach tin nhan chua doc

**Response Success (200):**
```json
{
  "unreadCount": "number",
  "mentionCount": "number",
  "messages": [
    {
      "id": "uuid",
      "content": "string",
      "senderId": "uuid",
      "senderName": "string",
      "createdAt": "timestamp",
      "isMention": true
    }
  ],
  "lastReadAt": "timestamp"
}
```

### POST /api/channels/:channelId/mark-read
**Mo ta:** Danh dau da doc

**Request:**
```json
{
  "messageId": "uuid (optional, mark all if not provided)"
}
```

### GET /api/users/me/unread-summary
**Mo ta:** Lay tong hop tin chua doc cua tat ca kenh

**Response Success (200):**
```json
{
  "totalUnread": "number",
  "totalMentions": "number",
  "channels": [
    {
      "channelId": "uuid",
      "channelName": "string",
      "unreadCount": "number",
      "mentionCount": "number",
      "lastMessage": {
        "content": "string",
        "senderName": "string",
        "createdAt": "timestamp"
      }
    }
  ]
}
```

## Database Schema

### Channel Notification Settings Table
```sql
CREATE TABLE channel_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  level VARCHAR(20) DEFAULT 'all',
  muted_until TIMESTAMP,
  sound_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, user_id)
);
```

### User Read Status Table
```sql
CREATE TABLE user_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  last_read_message_id UUID,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel_id)
);
```

### Unread Counts Table (Materialized/Cached)
```sql
CREATE TABLE unread_counts (
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  unread_count INTEGER DEFAULT 0,
  mention_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, channel_id)
);
```

## Notification Levels

| Level | Description |
|-------|-------------|
| all | Nhan thong bao cho moi tin nhan moi |
| mentions | Chi nhan khi duoc @mention |
| none | Tat hoan toan thong bao |

## WebSocket Events

```javascript
// Nhan thong bao tin nhan moi
socket.on('notification:new-message', {
  channelId: 'uuid',
  channelName: 'string',
  messageId: 'uuid',
  senderName: 'string',
  preview: 'string',
  isMention: false
});

// Cap nhat so tin chua doc
socket.on('notification:unread-update', {
  channelId: 'uuid',
  unreadCount: 'number',
  mentionCount: 'number'
});
```

## Validation Rules
| Field | Rules |
|-------|-------|
| level | Required, enum: all, mentions, none |
| mutedUntil | Optional, timestamp trong tuong lai |

## Audit Log
- Action: `NOTIFICATION_SETTINGS_UPDATED`
- Action: `MESSAGES_MARKED_READ`
