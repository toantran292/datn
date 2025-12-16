# UC04 - Tham gia kenh

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC04 |
| **Ten** | Tham gia kenh |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Member |

## Mo ta
Cho phep Member xem danh sach kenh trong workspace, tham gia cac kenh cong khai va roi khoi kenh dang tham gia.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon xem danh sach cac kenh co the truy cap va tham gia vao cac kenh cong khai hoac roi khoi kenh.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua workspace

## Trigger
Member truy cap vao danh sach kenh hoac chon mot kenh de tham gia/roi.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Trang danh sach kenh] --> [Hien thi cac kenh]
                                              |
                                              v
                                   [Chon kenh cong khai]
                                              |
                                              v
                                   [Nhan "Tham gia kenh"]
                                              |
                                              v
                                   [He thong them vao kenh]
                                              |
                                              v
                                   [Co the xem va gui tin nhan]
```

### Cac buoc chi tiet

1. **Truy cap danh sach kenh**
   - Member truy cap vao trang danh sach kenh cua workspace

2. **Hien thi danh sach kenh**
   - He thong hien thi danh sach kenh:
     - Kenh dang tham gia
     - Kenh cong khai co the tham gia

3. **Chon kenh**
   - Member chon mot kenh cong khai chua tham gia

4. **Tham gia kenh**
   - Member nhan "Tham gia kenh"

5. **Them vao kenh**
   - He thong them Member vao kenh

6. **Truy cap kenh**
   - Member co the xem va gui tin nhan trong kenh

## Cac luong su kien con (Subflows)

### S1 - Roi khoi kenh
1. Member vao kenh dang tham gia
2. Chon "Roi kenh"
3. Xac nhan
4. Member bi xoa khoi kenh

## Luong thay the (Alternative Flows)

### 4a. Kenh rieng tu
- He thong thong bao "Ban can duoc moi de tham gia kenh nay"

### 4b. Kenh da day (neu co gioi han)
- He thong thong bao "Kenh da dat gioi han thanh vien"

## Ket qua
Member tham gia/roi khoi kenh thanh cong.

## API Endpoints

### GET /api/workspaces/:workspaceId/channels
**Mo ta:** Lay danh sach kenh trong workspace

**Response Success (200):**
```json
{
  "joinedChannels": [
    {
      "id": "uuid",
      "name": "string",
      "type": "PUBLIC | PRIVATE",
      "unreadCount": "number"
    }
  ],
  "availableChannels": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "memberCount": "number"
    }
  ]
}
```

### POST /api/channels/:channelId/join
**Mo ta:** Tham gia kenh cong khai

**Response Success (200):**
```json
{
  "message": "Joined channel successfully",
  "channelId": "uuid"
}
```

### POST /api/channels/:channelId/leave
**Mo ta:** Roi khoi kenh

**Response Success (200):**
```json
{
  "message": "Left channel successfully"
}
```

## Database Schema

Su dung bang `channel_members` tu UC02.

## Validation Rules
| Field | Rules |
|-------|-------|
| channelId | Required, UUID hop le |
| Kenh phai la PUBLIC de tu tham gia |

## Audit Log
- Action: `MEMBER_JOINED_CHANNEL`
- Action: `MEMBER_LEFT_CHANNEL`
