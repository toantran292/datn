# UC06 - Tao Workspace

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC06 |
| **Ten** | Tao Workspace |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Nguoi dung da dang nhap |

## Mo ta
Cho phep nguoi dung tao khong gian lam viec (Workspace) moi voi cac thong tin co ban va tu dong duoc gan quyen Owner.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Chua vuot qua gioi han so workspace duoc tao (neu co)

## Luong xu ly chinh

```
[Nguoi dung] --> [Trang danh sach Workspace] --> [Click "Tao Workspace"]
                                                         |
                                                         v
                                              [Hien thi form tao workspace]
                                                         |
                                                         v
                                              [Nhap thong tin workspace]
                                                         |
                                                         v
                                              [Click "Tao"]
                                                         |
                                                         v
                                              [He thong validate]
                                                         |
                           +-----------------------------+----------------------------+
                           |                                                          |
                   [Du lieu hop le]                                        [Du lieu khong hop le]
                           |                                                          |
                           v                                                          v
                   [Tao workspace]                                           [Hien thi loi]
                           |
                           v
                   [Gan nguoi tao lam Owner]
                           |
                           v
                   [Ghi audit log]
                           |
                           v
                   [Chuyen den Dashboard workspace]
```

### Cac buoc chi tiet

1. **Truy cap chuc nang**
   - Nguoi dung click "Tao Workspace" tu trang danh sach workspace
   - Hoac tu dashboard click "+" de tao moi

2. **Nhap thong tin**
   - Ten workspace (bat buoc, unique trong pham vi user)
   - Mo ta (tuy chon)
   - Logo (tuy chon)
   - LLM Provider mac dinh (OpenAI/Anthropic/Google)

3. **He thong xu ly**
   - Validate thong tin
   - Tao workspace moi
   - Tao WorkspaceMember voi role = OWNER
   - Khoi tao cac cai dat mac dinh
   - Ghi audit log

4. **Ket qua**
   - Workspace duoc tao thanh cong
   - Nguoi dung tro thanh Owner
   - Chuyen huong den Dashboard cua workspace moi

## Luong thay the (Alternative Flows)

### 3a. Ten workspace da ton tai
- Thong bao "Ten workspace da duoc su dung"
- Yeu cau nhap ten khac

### 3b. Vuot qua gioi han workspace
- Thong bao "Ban da dat gioi han so workspace"
- Goi y nang cap goi dich vu hoac xoa workspace khong dung

## Ket qua
- Workspace moi duoc tao
- Nguoi dung la Owner cua workspace
- Co the bat dau moi thanh vien va su dung

## API Endpoints

### POST /api/workspaces
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "logo": "base64_or_url",
  "llmProvider": "OPENAI" | "ANTHROPIC" | "GOOGLE"
}
```

**Response Success (201):**
```json
{
  "id": "uuid",
  "name": "My Workspace",
  "description": "Description here",
  "logo": "https://storage.example.com/logos/uuid.jpg",
  "llmProvider": "OPENAI",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00Z",
  "membership": {
    "role": "OWNER",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "error": "WORKSPACE_NAME_EXISTS",
  "message": "Workspace name already exists"
}
```

**Response Error (403):**
```json
{
  "error": "WORKSPACE_LIMIT_EXCEEDED",
  "message": "You have reached the maximum number of workspaces"
}
```

## Database Schema

### Workspace Table
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  llm_provider ENUM('OPENAI', 'ANTHROPIC', 'GOOGLE') DEFAULT 'OPENAI',
  status ENUM('ACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
  lock_reason TEXT,
  locked_at TIMESTAMP,
  locked_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Workspace Member Table
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL,
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);
```

### Workspace Settings Table
```sql
CREATE TABLE workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  max_file_size_mb INT DEFAULT 100,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'],
  storage_limit_gb INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| name | Required, 3-100 ky tu, alphanumeric + space + dash |
| description | Optional, toi da 500 ky tu |
| logo | Optional, JPG/PNG/SVG, max 2MB |
| llmProvider | Required, one of: OPENAI, ANTHROPIC, GOOGLE |

## Role Permissions Matrix
| Permission | OWNER | ADMIN | MEMBER |
|------------|-------|-------|--------|
| View workspace | Yes | Yes | Yes |
| Update settings | Yes | Yes | No |
| Manage members | Yes | Yes | No |
| Delete workspace | Yes | No | No |
| Transfer ownership | Yes | No | No |

## Implementation Notes

### Create Workspace Service
```typescript
async function createWorkspace(
  userId: string,
  data: CreateWorkspaceDto
): Promise<Workspace> {
  // Check workspace limit
  const count = await db.workspaces.count({
    where: { createdBy: userId }
  });
  if (count >= MAX_WORKSPACES_PER_USER) {
    throw new ForbiddenException('WORKSPACE_LIMIT_EXCEEDED');
  }

  // Check name uniqueness
  const exists = await db.workspaces.findFirst({
    where: { name: data.name, createdBy: userId }
  });
  if (exists) {
    throw new BadRequestException('WORKSPACE_NAME_EXISTS');
  }

  // Create workspace with transaction
  return db.$transaction(async (tx) => {
    const workspace = await tx.workspaces.create({
      data: {
        name: data.name,
        description: data.description,
        llmProvider: data.llmProvider,
        createdBy: userId
      }
    });

    // Add creator as owner
    await tx.workspaceMembers.create({
      data: {
        workspaceId: workspace.id,
        userId: userId,
        role: 'OWNER'
      }
    });

    // Create default settings
    await tx.workspaceSettings.create({
      data: { workspaceId: workspace.id }
    });

    // Audit log
    await tx.auditLogs.create({
      data: {
        workspaceId: workspace.id,
        userId: userId,
        action: 'WORKSPACE_CREATED',
        metadata: { name: data.name }
      }
    });

    return workspace;
  });
}
```

## Audit Log
- Action: `WORKSPACE_CREATED`
- Metadata: name, llmProvider
