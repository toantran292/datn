# UC11 - Quan ly thanh vien

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC11 |
| **Ten** | Quan ly thanh vien |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Phuc tap |
| **Actor** | Owner hoac Admin cua Workspace |

## Mo ta
Cho phep quan ly toan bo thanh vien trong workspace bao gom moi, xoa, phan quyen va xem danh sach.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Owner hoac Admin trong workspace
- Workspace khong bi khoa (cho write operations)

## Chuc nang con

### A. Xem danh sach thanh vien

```
[Owner/Admin] --> [Tab "Thanh vien"] --> [He thong tai danh sach]
                                                  |
                                                  v
                                        [Hien thi danh sach]
                                        (Ten, Email, Role, Ngay tham gia)
```

### B. Moi thanh vien moi

```
[Owner/Admin] --> [Click "Moi thanh vien"] --> [Nhap email va chon role]
                                                       |
                                                       v
                                             [He thong validate]
                                                       |
                           +---------------------------+---------------------------+
                           |                                                       |
                   [Email hop le]                                        [Email khong hop le]
                           |                                                       |
                           v                                                       v
                   [Tao invitation]                                       [Hien thi loi]
                           |
                           v
                   [Gui email moi]
                           |
                           v
                   [Ghi audit log]
```

### C. Xoa thanh vien

```
[Owner/Admin] --> [Chon thanh vien] --> [Click "Xoa"]
                                              |
                                              v
                                     [Hien thi xac nhan]
                                              |
                                              v
                                     [Xoa khoi workspace]
                                              |
                                              v
                                     [Gui thong bao]
                                              |
                                              v
                                     [Ghi audit log]
```

### D. Phan quyen thanh vien

```
[Owner/Admin] --> [Chon thanh vien] --> [Thay doi role]
                                              |
                                              v
                                     [He thong kiem tra quyen]
                                              |
                           +------------------+------------------+
                           |                                     |
                   [Co quyen]                           [Khong co quyen]
                           |                                     |
                           v                                     v
                   [Cap nhat role]                       [Thong bao loi]
                           |
                           v
                   [Gui thong bao]
                           |
                           v
                   [Ghi audit log]
```

### Cac buoc chi tiet

#### A. Xem danh sach
1. Truy cap tab "Thanh vien" trong workspace
2. He thong hien thi danh sach voi thong tin:
   - Avatar, Ten, Email
   - Role (Owner/Admin/Member)
   - Ngay tham gia
   - Trang thai (Active/Pending)

#### B. Moi thanh vien
1. Click "Moi thanh vien"
2. Nhap dia chi email (co the nhap nhieu, phan cach boi dau phay)
3. Chon role cho nguoi duoc moi (Admin/Member)
4. Click "Gui loi moi"
5. He thong:
   - Tao invitation record
   - Gui email moi tham gia
   - Hien thi trang thai "Pending" trong danh sach

#### C. Xoa thanh vien
1. Chon thanh vien can xoa
2. Click "Xoa" hoac icon delete
3. Xac nhan thao tac
4. He thong:
   - Xoa thanh vien khoi workspace
   - Gui email thong bao
   - Cap nhat danh sach

#### D. Phan quyen
1. Chon thanh vien can thay doi quyen
2. Click vao dropdown role
3. Chon role moi
4. He thong:
   - Cap nhat role trong database
   - Gui thong bao cho thanh vien
   - Ghi audit log

## Luong thay the (Alternative Flows)

### B.3a. Email khong hop le
- Thong bao loi dinh dang email
- Highlight email sai

### B.3b. Email da la thanh vien
- Thong bao "Email nay da la thanh vien"
- Bo qua email do

### C.2a. Khong the xoa Owner
- Thong bao "Khong the xoa Owner. Vui long chuyen quyen so huu truoc"
- Huong dan chuyen quyen

### D.3a. Admin khong the phan quyen Admin khac
- Thong bao "Ban khong co quyen thay doi vai tro cua Admin khac"
- Chi Owner moi co quyen nay

### D.3b. Khong the ha cap Owner
- Thong bao "Khong the thay doi vai tro Owner"
- Yeu cau chuyen quyen so huu neu muon thay doi

## API Endpoints

### GET /api/workspaces/:id/members
**Query Parameters:**
```
role: OWNER | ADMIN | MEMBER (optional)
status: ACTIVE | PENDING (optional)
search: string (optional)
```

**Response Success (200):**
```json
{
  "members": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "url"
      },
      "role": "OWNER",
      "status": "ACTIVE",
      "joinedAt": "2024-01-01T00:00:00Z",
      "invitedBy": null
    },
    {
      "id": "uuid",
      "user": null,
      "email": "pending@example.com",
      "role": "MEMBER",
      "status": "PENDING",
      "invitedAt": "2024-01-15T10:00:00Z",
      "invitedBy": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ],
  "total": 10
}
```

### POST /api/workspaces/:id/members/invite
**Request:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "role": "MEMBER"
}
```

**Response Success (200):**
```json
{
  "message": "Invitations sent successfully",
  "results": [
    {
      "email": "user1@example.com",
      "status": "INVITED",
      "invitationId": "uuid"
    },
    {
      "email": "user2@example.com",
      "status": "ALREADY_MEMBER"
    }
  ]
}
```

### POST /api/workspaces/:id/members/accept-invite
**Request:**
```json
{
  "token": "invitation_token"
}
```

**Response Success (200):**
```json
{
  "message": "Welcome to the workspace",
  "workspace": {
    "id": "uuid",
    "name": "Workspace Name"
  }
}
```

### DELETE /api/workspaces/:id/members/:memberId
**Response Success (200):**
```json
{
  "message": "Member removed successfully"
}
```

**Response Error (400):**
```json
{
  "error": "CANNOT_REMOVE_OWNER",
  "message": "Cannot remove workspace owner. Transfer ownership first."
}
```

### PATCH /api/workspaces/:id/members/:memberId/role
**Request:**
```json
{
  "role": "ADMIN"
}
```

**Response Success (200):**
```json
{
  "message": "Role updated successfully",
  "member": {
    "id": "uuid",
    "role": "ADMIN"
  }
}
```

**Response Error (403):**
```json
{
  "error": "INSUFFICIENT_PERMISSION",
  "message": "Admin cannot change role of another Admin"
}
```

## Database Schema

### Workspace Invitation Table
```sql
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'MEMBER') NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, email)
);
```

## Role Hierarchy
```
OWNER > ADMIN > MEMBER

- OWNER: Full control, only one per workspace
- ADMIN: Manage members (except Owner and other Admins), manage files, create reports
- MEMBER: View, upload files, create reports (if permitted)
```

## Permission Matrix
| Action | OWNER | ADMIN | MEMBER |
|--------|-------|-------|--------|
| View members | Yes | Yes | Yes |
| Invite members | Yes | Yes | No |
| Remove members | Yes | Yes* | No |
| Change role to MEMBER | Yes | Yes* | No |
| Change role to ADMIN | Yes | No | No |
| Remove ADMIN | Yes | No | No |

*Admin chi co the quan ly MEMBER, khong quan ly duoc ADMIN khac

## Email Templates

### Invitation Email
```
Subject: Ban duoc moi tham gia Workspace "{workspace_name}"

Xin chao,

{inviter_name} da moi ban tham gia workspace "{workspace_name}" voi vai tro {role}.

Click vao link duoi day de chap nhan loi moi:
{invitation_link}

Link nay se het han sau 7 ngay.

Neu ban khong muon tham gia, ban co the bo qua email nay.

Tran trong,
He thong
```

### Removed Notification
```
Subject: Ban da bi xoa khoi Workspace "{workspace_name}"

Xin chao {member_name},

Ban da bi xoa khoi workspace "{workspace_name}".

Neu ban cho rang day la loi, vui long lien he voi quan tri vien cua workspace.

Tran trong,
He thong
```

## Implementation Notes

### Invite Members Service
```typescript
async function inviteMembers(
  workspaceId: string,
  inviterId: string,
  emails: string[],
  role: 'ADMIN' | 'MEMBER'
): Promise<InviteResult[]> {
  const results: InviteResult[] = [];

  for (const email of emails) {
    try {
      // Check if already a member
      const existingMember = await db.workspaceMembers.findFirst({
        where: {
          workspaceId,
          user: { email }
        }
      });

      if (existingMember) {
        results.push({ email, status: 'ALREADY_MEMBER' });
        continue;
      }

      // Check if already invited
      const existingInvite = await db.workspaceInvitations.findUnique({
        where: {
          workspaceId_email: { workspaceId, email }
        }
      });

      if (existingInvite && existingInvite.expiresAt > new Date()) {
        results.push({ email, status: 'ALREADY_INVITED' });
        continue;
      }

      // Create invitation
      const invitation = await db.workspaceInvitations.upsert({
        where: { workspaceId_email: { workspaceId, email } },
        create: {
          workspaceId,
          email,
          role,
          token: generateToken(),
          invitedBy: inviterId,
          expiresAt: addDays(new Date(), 7)
        },
        update: {
          role,
          token: generateToken(),
          invitedBy: inviterId,
          expiresAt: addDays(new Date(), 7)
        }
      });

      // Send email
      await emailService.sendInvitation(email, invitation);

      results.push({
        email,
        status: 'INVITED',
        invitationId: invitation.id
      });

    } catch (error) {
      results.push({ email, status: 'ERROR', error: error.message });
    }
  }

  return results;
}
```

## Audit Log
- Action: `MEMBER_INVITED`
- Action: `MEMBER_JOINED`
- Action: `MEMBER_REMOVED`
- Action: `MEMBER_ROLE_CHANGED`
- Metadata: email, role, old_role, new_role
