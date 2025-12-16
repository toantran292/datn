# UC02 - Quan ly thanh vien kenh

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC02 |
| **Ten** | Quan ly thanh vien kenh |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Workspace Owner, Channel Admin |

## Mo ta
Cho phep Channel Admin moi thanh vien workspace vao kenh, xoa thanh vien khoi kenh, va phan quyen Admin/Member cho tung thanh vien trong kenh.

## Cac thanh phan tham gia va moi quan tam
- **Workspace Owner/Channel Admin:** Muon quan ly danh sach thanh vien trong kenh, moi nguoi moi, xoa thanh vien va phan quyen truy cap.
- **Member:** Duoc moi vao kenh hoac bi xoa khoi kenh.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Workspace Owner hoac Channel Admin
- Kenh da duoc tao va dang hoat dong

## Trigger
Channel Admin chon chuc nang "Quan ly thanh vien" cua mot kenh.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Channel Admin] --> [Cai dat kenh] --> [Tab "Thanh vien"]
                                              |
                                              v
                                   [Hien thi danh sach thanh vien]
                                              |
                                              v
                                   [Chon "Moi thanh vien"]
                                              |
                                              v
                                   [Hien thi danh sach co the moi]
                                              |
                                              v
                                   [Chon va moi thanh vien]
                                              |
                                              v
                                   [He thong them va gui thong bao]
```

### Cac buoc chi tiet

1. **Truy cap cai dat kenh**
   - Channel Admin truy cap vao cai dat cua kenh

2. **Chon tab Thanh vien**
   - Channel Admin chon tab "Thanh vien"

3. **Hien thi danh sach**
   - He thong hien thi danh sach thanh vien hien tai cua kenh

4. **Chon moi thanh vien**
   - Channel Admin chon "Moi thanh vien"

5. **Hien thi danh sach co the moi**
   - He thong hien thi danh sach thanh vien workspace chua tham gia kenh

6. **Chon va moi**
   - Channel Admin chon mot hoac nhieu thanh vien va nhan "Moi"

7. **Them thanh vien**
   - He thong them thanh vien vao kenh va gui thong bao

8. **Cap nhat danh sach**
   - Danh sach thanh vien duoc cap nhat

## Cac luong su kien con (Subflows)

### S1 - Xoa thanh vien
1. Channel Admin chon thanh vien can xoa
2. Chon "Xoa"
3. Xac nhan
4. Thanh vien bi xoa khoi kenh

### S2 - Phan quyen
1. Channel Admin chon thanh vien
2. Chon vai tro (Admin/Member)
3. Luu
4. Quyen duoc cap nhat

## Luong thay the (Alternative Flows)

### 6a. Thanh vien da ton tai trong kenh
- He thong bo qua thanh vien da ton tai va chi them cac thanh vien moi

### 7a. Khong the xoa Channel Admin cuoi cung
- He thong thong bao "Kenh phai co it nhat mot Admin"

## Ket qua
Danh sach thanh vien kenh duoc cap nhat (them/xoa/thay doi quyen).

## API Endpoints

### GET /api/channels/:channelId/members
**Mo ta:** Lay danh sach thanh vien kenh

**Response Success (200):**
```json
{
  "members": [
    {
      "userId": "uuid",
      "displayName": "string",
      "avatar": "string",
      "role": "ADMIN | MEMBER",
      "joinedAt": "timestamp"
    }
  ],
  "total": "number"
}
```

### POST /api/channels/:channelId/members
**Mo ta:** Them thanh vien vao kenh

**Request:**
```json
{
  "userIds": ["uuid"],
  "role": "ADMIN | MEMBER"
}
```

### DELETE /api/channels/:channelId/members/:userId
**Mo ta:** Xoa thanh vien khoi kenh

### PUT /api/channels/:channelId/members/:userId/role
**Mo ta:** Thay doi quyen thanh vien

**Request:**
```json
{
  "role": "ADMIN | MEMBER"
}
```

## Database Schema

### Channel Members Table
```sql
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID REFERENCES users(id),
  UNIQUE(channel_id, user_id)
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| userIds | Required, mang UUID hop le |
| role | Required, enum: ADMIN, MEMBER |

## Audit Log
- Action: `MEMBER_ADDED`
- Action: `MEMBER_REMOVED`
- Action: `MEMBER_ROLE_CHANGED`
