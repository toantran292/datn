# UC12 - Chuyen quyen so huu

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC12 |
| **Ten** | Chuyen quyen so huu |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Owner cua Workspace hoac Super Admin |

## Mo ta
Cho phep chuyen hoac thu hoi quyen so huu workspace.

## Chuc nang con

### A. Chuyen quyen Owner (boi Owner hien tai)

#### Dieu kien tien quyet
- Nguoi dung la Owner cua workspace
- Co it nhat 1 thanh vien khac trong workspace

#### Luong xu ly

```
[Owner] --> [Tab "Cai dat"] --> [Click "Chuyen quyen so huu"]
                                         |
                                         v
                               [Hien thi danh sach thanh vien]
                                         |
                                         v
                               [Chon thanh vien nhan quyen]
                                         |
                                         v
                               [Xac nhan voi mat khau]
                                         |
                                         v
                               [Cap nhat quyen so huu]
                                         |
                                         v
                               [Gui thong bao]
                                         |
                                         v
                               [Ghi audit log]
```

### B. Thu hoi quyen Owner (boi Super Admin)

#### Dieu kien tien quyet
- Nguoi dung la Super Admin cua he thong
- Workspace ton tai va co Owner

#### Luong xu ly

```
[Super Admin] --> [Admin Panel] --> [Chon workspace]
                                          |
                                          v
                                 [Click "Thu hoi quyen Owner"]
                                          |
                                          v
                                 [Nhap ly do]
                                          |
                                          v
                                 [Chon Owner moi (optional)]
                                          |
                                          v
                                 [Cap nhat quyen so huu]
                                          |
                                          v
                                 [Gui thong bao]
                                          |
                                          v
                                 [Ghi audit log]
```

### Cac buoc chi tiet

#### A. Chuyen quyen Owner

1. **Truy cap chuc nang**
   - Owner vao Settings > Danger Zone > Chuyen quyen so huu

2. **Chon nguoi nhan**
   - He thong hien thi danh sach thanh vien (Admin va Member)
   - Owner chon thanh vien se nhan quyen

3. **Xac nhan**
   - Nhap mat khau de xac nhan
   - Tick xac nhan "Toi hieu rang toi se mat quyen Owner"

4. **He thong xu ly**
   - Cap nhat role cua Owner cu thanh ADMIN
   - Cap nhat role cua nguoi nhan thanh OWNER
   - Gui thong bao cho ca 2 ben
   - Ghi audit log

#### B. Thu hoi quyen Owner

1. **Super Admin truy cap Admin Panel**
   - Tim va chon workspace

2. **Thuc hien thu hoi**
   - Click "Thu hoi quyen Owner"
   - Nhap ly do
   - Chon Owner moi (hoac de trong - workspace se khong co owner)

3. **He thong xu ly**
   - Ha cap Owner cu thanh ADMIN (hoac xoa khoi workspace)
   - Chi dinh Owner moi (neu co)
   - Gui thong bao cho tat ca thanh vien
   - Ghi audit log

## Luong thay the (Alternative Flows)

### A.2a. Khong co thanh vien phu hop
- Thong bao "Can moi them thanh vien truoc khi chuyen quyen"
- Huong dan moi thanh vien

### A.3a. Mat khau khong dung
- Thong bao loi xac thuc
- Cho phep thu lai

### A.3b. Huy xac nhan
- Quay ve trang truoc
- Khong thay doi gi

## API Endpoints

### POST /api/workspaces/:id/transfer-ownership
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "newOwnerId": "uuid",
  "password": "string",
  "confirmation": true
}
```

**Response Success (200):**
```json
{
  "message": "Ownership transferred successfully",
  "workspace": {
    "id": "uuid",
    "name": "Workspace Name"
  },
  "previousOwner": {
    "id": "uuid",
    "name": "John Doe",
    "newRole": "ADMIN"
  },
  "newOwner": {
    "id": "uuid",
    "name": "Jane Doe"
  }
}
```

**Response Error (400):**
```json
{
  "error": "INVALID_NEW_OWNER",
  "message": "Selected user is not a member of this workspace"
}
```

**Response Error (401):**
```json
{
  "error": "INVALID_PASSWORD",
  "message": "Password is incorrect"
}
```

### POST /api/admin/workspaces/:id/revoke-ownership
**Headers:**
```
Authorization: Bearer {accessToken}
X-Admin-Token: {adminToken}
```

**Request:**
```json
{
  "reason": "Vi pham chinh sach - Khong hoat dong",
  "newOwnerId": "uuid",  // optional
  "removeCurrentOwner": false
}
```

**Response Success (200):**
```json
{
  "message": "Ownership revoked successfully",
  "workspace": {
    "id": "uuid",
    "name": "Workspace Name"
  },
  "previousOwner": {
    "id": "uuid",
    "name": "John Doe",
    "newRole": "ADMIN"
  },
  "newOwner": {
    "id": "uuid",
    "name": "Jane Doe"
  }
}
```

### GET /api/workspaces/:id/eligible-owners
**Response Success (200):**
```json
{
  "members": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar": "url",
      "role": "ADMIN",
      "joinedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "role": "MEMBER",
      "joinedAt": "2024-01-05T00:00:00Z"
    }
  ]
}
```

## Implementation Notes

### Transfer Ownership Service
```typescript
async function transferOwnership(
  workspaceId: string,
  currentOwnerId: string,
  newOwnerId: string,
  password: string
): Promise<void> {
  // Verify password
  const user = await db.users.findUnique({ where: { id: currentOwnerId } });
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedException('INVALID_PASSWORD');
  }

  // Verify new owner is a member
  const newOwnerMembership = await db.workspaceMembers.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: newOwnerId }
    }
  });
  if (!newOwnerMembership) {
    throw new BadRequestException('INVALID_NEW_OWNER');
  }

  // Transaction
  return db.$transaction(async (tx) => {
    // Update current owner to ADMIN
    await tx.workspaceMembers.update({
      where: {
        workspaceId_userId: { workspaceId, userId: currentOwnerId }
      },
      data: { role: 'ADMIN' }
    });

    // Update new owner
    await tx.workspaceMembers.update({
      where: {
        workspaceId_userId: { workspaceId, userId: newOwnerId }
      },
      data: { role: 'OWNER' }
    });

    // Get workspace for notifications
    const workspace = await tx.workspaces.findUnique({
      where: { id: workspaceId }
    });

    // Notify both users
    await tx.notifications.createMany({
      data: [
        {
          userId: currentOwnerId,
          type: 'OWNERSHIP_TRANSFERRED',
          title: 'Quyen so huu da duoc chuyen',
          content: `Ban da chuyen quyen so huu workspace "${workspace.name}"`,
          metadata: { workspaceId, newOwnerId }
        },
        {
          userId: newOwnerId,
          type: 'OWNERSHIP_RECEIVED',
          title: 'Ban da nhan quyen so huu',
          content: `Ban da tro thanh Owner cua workspace "${workspace.name}"`,
          metadata: { workspaceId, previousOwnerId: currentOwnerId }
        }
      ]
    });

    // Audit log
    await tx.auditLogs.create({
      data: {
        workspaceId,
        userId: currentOwnerId,
        action: 'OWNERSHIP_TRANSFERRED',
        metadata: {
          previousOwnerId: currentOwnerId,
          newOwnerId
        }
      }
    });
  });
}
```

### Revoke Ownership Service (Super Admin)
```typescript
async function revokeOwnership(
  adminId: string,
  workspaceId: string,
  reason: string,
  newOwnerId?: string,
  removeCurrentOwner?: boolean
): Promise<void> {
  return db.$transaction(async (tx) => {
    // Get current owner
    const currentOwner = await tx.workspaceMembers.findFirst({
      where: { workspaceId, role: 'OWNER' }
    });

    if (!currentOwner) {
      throw new BadRequestException('WORKSPACE_HAS_NO_OWNER');
    }

    // Handle current owner
    if (removeCurrentOwner) {
      await tx.workspaceMembers.delete({
        where: { id: currentOwner.id }
      });
    } else {
      await tx.workspaceMembers.update({
        where: { id: currentOwner.id },
        data: { role: 'ADMIN' }
      });
    }

    // Assign new owner if specified
    if (newOwnerId) {
      await tx.workspaceMembers.update({
        where: {
          workspaceId_userId: { workspaceId, userId: newOwnerId }
        },
        data: { role: 'OWNER' }
      });
    }

    // Notify all members
    const members = await tx.workspaceMembers.findMany({
      where: { workspaceId }
    });

    await tx.notifications.createMany({
      data: members.map(m => ({
        userId: m.userId,
        type: 'OWNERSHIP_REVOKED',
        title: 'Quyen so huu workspace da thay doi',
        content: `Quyen so huu workspace da duoc quan tri vien thay doi. Ly do: ${reason}`,
        metadata: { workspaceId, reason, newOwnerId }
      }))
    });

    // Audit log
    await tx.auditLogs.create({
      data: {
        workspaceId,
        userId: adminId,
        action: 'OWNERSHIP_REVOKED',
        metadata: {
          reason,
          previousOwnerId: currentOwner.userId,
          newOwnerId,
          revokedBy: 'SUPER_ADMIN'
        }
      }
    });
  });
}
```

## UI Confirmation Dialog

### Transfer Ownership Confirmation
```
Title: Chuyen quyen so huu Workspace

Content:
Ban sap chuyen quyen so huu workspace "{workspace_name}" cho {new_owner_name}.

Sau khi chuyen:
- Ban se tro thanh Admin cua workspace
- {new_owner_name} se co toan quyen kiem soat workspace
- Hanh dong nay khong the hoan tac

[X] Toi hieu va muon tiep tuc

Nhap mat khau de xac nhan:
[____________]

[Huy] [Xac nhan chuyen quyen]
```

## Audit Log
- Action: `OWNERSHIP_TRANSFERRED`
- Action: `OWNERSHIP_REVOKED`
- Metadata: previousOwnerId, newOwnerId, reason (for revoke)
