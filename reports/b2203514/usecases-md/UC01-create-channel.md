# UC01 - Quan ly kenh tro chuyen

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC01 |
| **Ten** | Quan ly kenh tro chuyen |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Phuc tap |
| **Actor** | Workspace Owner, Channel Admin |

## Mo ta
Cho phep Channel Admin tao moi cac kenh tro chuyen (kenh cong khai, kenh rieng tu, kenh theo du an), cap nhat thong tin kenh (ten, mo ta, anh dai dien), xoa hoac luu tru kenh khong con hoat dong.

## Cac thanh phan tham gia va moi quan tam
- **Workspace Owner/Channel Admin:** Muon tao, cap nhat, xoa hoac luu tru cac kenh tro chuyen de to chuc giao tiep trong workspace theo du an hoac chu de.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Workspace Owner hoac Channel Admin

## Trigger
Channel Admin chon chuc nang "Tao kenh moi" hoac chon mot kenh de quan ly.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Channel Admin] --> [Trang quan ly kenh] --> [Chon "Tao kenh moi"]
                                                     |
                                                     v
                                          [Hien thi form tao kenh]
                                                     |
                                                     v
                                          [Nhap thong tin kenh]
                                                     |
                                                     v
                                          [He thong kiem tra]
                                                     |
                                                     v
                                          [Tao kenh thanh cong]
                                                     |
                                                     v
                                          [Kenh xuat hien trong danh sach]
```

### Cac buoc chi tiet

1. **Truy cap trang quan ly kenh**
   - Channel Admin truy cap vao trang quan ly kenh trong workspace

2. **Chon tao kenh moi**
   - Channel Admin chon "Tao kenh moi"

3. **Hien thi form tao kenh**
   - He thong hien thi form tao kenh voi cac truong:
     - Ten kenh
     - Mo ta
     - Loai kenh (cong khai/rieng tu)
     - Du an lien ket (neu co)

4. **Nhap thong tin va gui form**
   - Channel Admin nhap thong tin va nhan "Tao"

5. **Kiem tra tinh hop le**
   - He thong kiem tra tinh hop le cua du lieu

6. **Tao kenh**
   - He thong tao kenh moi va thong bao thanh cong

7. **Hien thi kenh moi**
   - Kenh moi xuat hien trong danh sach kenh cua workspace

## Cac luong su kien con (Subflows)

### S1 - Cap nhat thong tin kenh
1. Channel Admin chon kenh can cap nhat
2. Chon "Chinh sua"
3. Cap nhat thong tin can thiet
4. Luu thay doi
5. He thong cap nhat va thong bao thanh cong

### S2 - Xoa kenh
1. Channel Admin chon kenh can xoa
2. Chon "Xoa"
3. Xac nhan xoa
4. He thong xoa kenh va toan bo tin nhan

### S3 - Luu tru kenh
1. Channel Admin chon kenh can luu tru
2. Chon "Luu tru"
3. Kenh duoc chuyen sang trang thai archived, chi doc

## Luong thay the (Alternative Flows)

### 4a. Ten kenh da ton tai
- He thong thong bao "Ten kenh da ton tai trong workspace"
- Quay tro lai buoc 4 de nhap lai

### 4b. Du lieu khong hop le
- He thong hien thi thong bao loi chi tiet cho tung truong
- Quay tro lai buoc 4 de sua

## Ket qua
Kenh tro chuyen duoc tao moi/cap nhat/xoa/luu tru thanh cong trong workspace.

## API Endpoints

### POST /api/channels
**Mo ta:** Tao kenh moi

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "type": "PUBLIC | PRIVATE",
  "projectId": "uuid (optional)",
  "workspaceId": "uuid"
}
```

**Response Success (201):**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "type": "PUBLIC | PRIVATE",
  "status": "ACTIVE",
  "createdAt": "timestamp",
  "createdBy": "uuid"
}
```

### PUT /api/channels/:channelId
**Mo ta:** Cap nhat thong tin kenh

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "avatar": "string (url)"
}
```

### DELETE /api/channels/:channelId
**Mo ta:** Xoa kenh

### POST /api/channels/:channelId/archive
**Mo ta:** Luu tru kenh

## Database Schema

### Channels Table
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'PUBLIC',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  avatar_url VARCHAR(500),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  UNIQUE(workspace_id, name)
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| name | Required, 2-100 ky tu, unique trong workspace |
| description | Optional, max 500 ky tu |
| type | Required, enum: PUBLIC, PRIVATE |
| workspaceId | Required, UUID hop le |

## Audit Log
- Action: `CHANNEL_CREATED`
- Action: `CHANNEL_UPDATED`
- Action: `CHANNEL_DELETED`
- Action: `CHANNEL_ARCHIVED`
