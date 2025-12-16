# UC07 - Cau hinh Workspace

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC07 |
| **Ten** | Cau hinh Workspace |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Owner hoac Admin cua Workspace |

## Mo ta
Cho phep xem danh sach workspace va chinh sua thong tin nhu ten, mo ta, logo, LLM Provider.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Owner hoac Admin trong workspace
- Workspace khong bi khoa

## Chuc nang con

### A. Xem danh sach Workspace

```
[Nguoi dung] --> [Trang danh sach Workspace] --> [He thong tai danh sach]
                                                         |
                                                         v
                                              [Hien thi danh sach workspace]
                                                         |
                                              (Ten, Role, So thanh vien, Trang thai)
```

### B. Chinh sua cau hinh Workspace

```
[Owner/Admin] --> [Chon workspace] --> [Tab "Cai dat"]
                                              |
                                              v
                                    [Hien thi form cau hinh]
                                              |
                                              v
                                    [Chinh sua thong tin]
                                              |
                                              v
                                    [Nhan "Luu thay doi"]
                                              |
                                              v
                                    [He thong validate va luu]
                                              |
                                              v
                                    [Ghi audit log]
```

### Cac buoc chi tiet

1. **Xem danh sach workspace**
   - Truy cap trang workspaces
   - He thong hien thi tat ca workspace ma nguoi dung la thanh vien
   - Hien thi: ten, role cua user, so thanh vien, trang thai

2. **Chon workspace de cau hinh**
   - Click vao workspace
   - Chon tab "Cai dat" (Settings)

3. **Chinh sua thong tin**
   - Ten workspace
   - Mo ta
   - Logo
   - LLM Provider mac dinh
   - Gioi han luu tru
   - Dinh dang file cho phep

4. **Luu thay doi**
   - Click "Luu thay doi"
   - He thong validate va cap nhat
   - Ghi audit log

## Luong thay the (Alternative Flows)

### 3a. Workspace bi khoa
- Hien thi thong bao workspace bi khoa
- Khong cho phep chinh sua cau hinh
- Chi hien thi thong tin read-only

### 4a. Khong co quyen
- Neu la Member: Chi xem, khong hien thi form edit
- Thong bao "Ban khong co quyen thuc hien thao tac nay"

## API Endpoints

### GET /api/workspaces
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
status: ACTIVE | LOCKED (optional)
role: OWNER | ADMIN | MEMBER (optional)
```

**Response Success (200):**
```json
{
  "workspaces": [
    {
      "id": "uuid",
      "name": "Workspace 1",
      "description": "Description",
      "logo": "url",
      "status": "ACTIVE",
      "membership": {
        "role": "OWNER",
        "joinedAt": "2024-01-01T00:00:00Z"
      },
      "stats": {
        "memberCount": 5,
        "fileCount": 100,
        "reportCount": 10
      }
    }
  ],
  "total": 1
}
```

### GET /api/workspaces/:id
**Response Success (200):**
```json
{
  "id": "uuid",
  "name": "Workspace 1",
  "description": "Description",
  "logo": "url",
  "llmProvider": "OPENAI",
  "status": "ACTIVE",
  "settings": {
    "maxFileSizeMb": 100,
    "allowedFileTypes": ["pdf", "doc", "docx"],
    "storageLimitGb": 10,
    "storageUsedGb": 2.5
  },
  "membership": {
    "role": "OWNER"
  }
}
```

### PATCH /api/workspaces/:id
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "llmProvider": "OPENAI" | "ANTHROPIC" | "GOOGLE"
}
```

**Response Success (200):**
```json
{
  "message": "Workspace updated successfully",
  "workspace": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "Updated description",
    "llmProvider": "ANTHROPIC"
  }
}
```

### PATCH /api/workspaces/:id/logo
**Headers:**
```
Content-Type: multipart/form-data
```

**Request:**
```
logo: (file)
```

**Response Success (200):**
```json
{
  "message": "Logo updated successfully",
  "logoUrl": "https://storage.example.com/logos/uuid.jpg"
}
```

### PATCH /api/workspaces/:id/settings
**Request:**
```json
{
  "maxFileSizeMb": 200,
  "allowedFileTypes": ["pdf", "doc", "docx", "xlsx", "csv"],
  "storageLimitGb": 20
}
```

**Response Success (200):**
```json
{
  "message": "Settings updated successfully"
}
```

## Validation Rules
| Field | Rules |
|-------|-------|
| name | Required, 3-100 ky tu |
| description | Optional, toi da 500 ky tu |
| logo | Optional, JPG/PNG/SVG, max 2MB |
| llmProvider | Required, valid enum value |
| maxFileSizeMb | 1-500 |
| storageLimitGb | 1-1000 |

## Permission Check
```typescript
async function canEditWorkspace(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await db.workspaceMembers.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId }
    }
  });

  if (!membership) return false;

  const workspace = await db.workspaces.findUnique({
    where: { id: workspaceId }
  });

  if (workspace.status === 'LOCKED') return false;

  return ['OWNER', 'ADMIN'].includes(membership.role);
}
```

## Audit Log
- Action: `WORKSPACE_UPDATED`
- Action: `WORKSPACE_LOGO_UPDATED`
- Action: `WORKSPACE_SETTINGS_UPDATED`
- Metadata: changed_fields, old_values, new_values
