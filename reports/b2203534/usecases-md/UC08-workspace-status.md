# UC08 - Quan ly trang thai Workspace

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC08 |
| **Ten** | Quan ly trang thai Workspace |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Super Admin (Quan tri vien he thong) |

## Mo ta
Cho phep Super Admin khoa hoac mo khoa workspace khi vi pham chinh sach hoac theo yeu cau, dong thoi gui thong bao den cac thanh vien.

## Dieu kien tien quyet
- Nguoi dung co quyen Super Admin trong he thong
- Workspace ton tai trong he thong

## Luong xu ly chinh

```
[Super Admin] --> [Trang quan tri workspace] --> [Chon workspace]
                                                        |
                                                        v
                                              [Chon "Khoa" hoac "Mo khoa"]
                                                        |
                                                        v
                                              [Nhap ly do (neu khoa)]
                                                        |
                                                        v
                                              [Xac nhan thao tac]
                                                        |
                                                        v
                                              [Cap nhat trang thai]
                                                        |
                                                        v
                                              [Gui thong bao den thanh vien]
                                                        |
                                                        v
                                              [Ghi audit log]
```

### Cac buoc chi tiet

#### A. Khoa Workspace

1. **Truy cap quan tri**
   - Super Admin vao Admin Panel > Workspaces
   - Tim va chon workspace can khoa

2. **Thuc hien khoa**
   - Click nut "Khoa"
   - Nhap ly do khoa (bat buoc)
   - Xac nhan thao tac

3. **He thong xu ly**
   - Cap nhat status = LOCKED
   - Luu ly do va thoi gian khoa
   - Gui thong bao den tat ca thanh vien
   - Gui email thong bao den Owner

4. **Hieu luc**
   - Thanh vien khong the truy cap workspace
   - Khong the upload file, tao bao cao
   - Chi co the xem thong tin co ban

#### B. Mo khoa Workspace

1. **Truy cap quan tri**
   - Super Admin vao Admin Panel > Workspaces
   - Tim workspace dang bi khoa

2. **Thuc hien mo khoa**
   - Click nut "Mo khoa"
   - Xac nhan thao tac

3. **He thong xu ly**
   - Cap nhat status = ACTIVE
   - Xoa thong tin khoa
   - Gui thong bao den tat ca thanh vien
   - Gui email thong bao den Owner

## Luong thay the (Alternative Flows)

### 2a. Khong nhap ly do khoa
- He thong yeu cau nhap ly do
- Khong cho phep khoa ma khong co ly do

## API Endpoints

### GET /api/admin/workspaces
**Headers:**
```
Authorization: Bearer {accessToken}
X-Admin-Token: {adminToken}
```

**Query Parameters:**
```
status: ACTIVE | LOCKED (optional)
search: string (optional)
page: number (default 1)
limit: number (default 20)
```

**Response Success (200):**
```json
{
  "workspaces": [
    {
      "id": "uuid",
      "name": "Workspace 1",
      "status": "ACTIVE",
      "owner": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "stats": {
        "memberCount": 10,
        "fileCount": 500,
        "storageUsedGb": 5.5
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### POST /api/admin/workspaces/:id/lock
**Headers:**
```
Authorization: Bearer {accessToken}
X-Admin-Token: {adminToken}
```

**Request:**
```json
{
  "reason": "Vi pham dieu khoan su dung - Upload noi dung khong phu hop"
}
```

**Response Success (200):**
```json
{
  "message": "Workspace locked successfully",
  "workspace": {
    "id": "uuid",
    "status": "LOCKED",
    "lockReason": "Vi pham dieu khoan su dung - Upload noi dung khong phu hop",
    "lockedAt": "2024-01-15T10:00:00Z",
    "lockedBy": "admin_uuid"
  },
  "notificationsSent": 10
}
```

### POST /api/admin/workspaces/:id/unlock
**Request:**
```json
{
  "note": "Da xu ly vi pham" // optional
}
```

**Response Success (200):**
```json
{
  "message": "Workspace unlocked successfully",
  "workspace": {
    "id": "uuid",
    "status": "ACTIVE"
  },
  "notificationsSent": 10
}
```

## Database Updates

### Workspace Table (Lock Fields)
```sql
-- These fields are already in the workspace table
ALTER TABLE workspaces ADD COLUMN lock_reason TEXT;
ALTER TABLE workspaces ADD COLUMN locked_at TIMESTAMP;
ALTER TABLE workspaces ADD COLUMN locked_by UUID REFERENCES users(id);
```

## Notification Templates

### Lock Notification
```
Subject: [Quan trong] Workspace "{workspace_name}" da bi khoa

Kinh gui {member_name},

Workspace "{workspace_name}" ma ban la thanh vien da bi quan tri vien he thong khoa.

Ly do: {lock_reason}

Thoi gian: {locked_at}

Trong thoi gian workspace bi khoa, ban se khong the:
- Upload hoac tao file moi
- Tao bao cao AI
- Moi thanh vien moi

Neu ban co thac mac, vui long lien he ho tro.

Tran trong,
He thong
```

### Unlock Notification
```
Subject: Workspace "{workspace_name}" da duoc mo khoa

Kinh gui {member_name},

Workspace "{workspace_name}" da duoc mo khoa va hoat dong binh thuong tro lai.

Ban co the tiep tuc su dung day du cac tinh nang cua workspace.

Tran trong,
He thong
```

## Implementation Notes

### Lock Workspace Service
```typescript
async function lockWorkspace(
  adminId: string,
  workspaceId: string,
  reason: string
): Promise<void> {
  return db.$transaction(async (tx) => {
    // Update workspace status
    await tx.workspaces.update({
      where: { id: workspaceId },
      data: {
        status: 'LOCKED',
        lockReason: reason,
        lockedAt: new Date(),
        lockedBy: adminId
      }
    });

    // Get all members
    const members = await tx.workspaceMembers.findMany({
      where: { workspaceId },
      include: { user: true }
    });

    // Create notifications
    await tx.notifications.createMany({
      data: members.map(m => ({
        userId: m.userId,
        type: 'WORKSPACE_LOCKED',
        title: 'Workspace bi khoa',
        content: `Workspace da bi khoa. Ly do: ${reason}`,
        metadata: { workspaceId, reason }
      }))
    });

    // Send email to owner
    const owner = members.find(m => m.role === 'OWNER');
    if (owner) {
      await emailService.send({
        to: owner.user.email,
        template: 'workspace-locked',
        data: { workspaceName, reason }
      });
    }

    // Audit log
    await tx.auditLogs.create({
      data: {
        workspaceId,
        userId: adminId,
        action: 'WORKSPACE_LOCKED',
        metadata: { reason }
      }
    });
  });
}
```

## Access Control When Locked

```typescript
// Middleware to check workspace status
async function checkWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { workspaceId } = req.params;
  const workspace = await db.workspaces.findUnique({
    where: { id: workspaceId }
  });

  if (workspace.status === 'LOCKED') {
    // Allow read-only operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      req.workspaceReadOnly = true;
      return next();
    }

    // Block write operations
    return res.status(403).json({
      error: 'WORKSPACE_LOCKED',
      message: 'This workspace is locked',
      lockReason: workspace.lockReason
    });
  }

  next();
}
```

## Audit Log
- Action: `WORKSPACE_LOCKED`
- Action: `WORKSPACE_UNLOCKED`
- Metadata: reason, admin_id, affected_members_count
