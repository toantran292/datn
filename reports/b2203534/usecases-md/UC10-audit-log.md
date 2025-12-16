# UC10 - Xem Audit Log

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC10 |
| **Ten** | Xem Audit Log |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Owner hoac Admin cua Workspace |

## Mo ta
Cho phep xem lich su cac hoat dong trong workspace voi kha nang loc theo hanh dong va nguoi dung de theo doi va kiem tra bao mat.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Owner hoac Admin trong workspace

## Luong xu ly chinh

```
[Owner/Admin] --> [Tab "Audit Log"] --> [He thong tai danh sach log]
                                                   |
                                                   v
                                        [Hien thi danh sach log]
                                                   |
                                                   v
                                        [Ap dung bo loc (optional)]
                                                   |
                                                   v
                                        [Hien thi ket qua loc]
```

### Cac buoc chi tiet

1. **Truy cap Audit Log**
   - Owner/Admin vao Settings > Audit Log
   - Hoac click "Audit Log" trong sidebar

2. **He thong tai du lieu**
   - Tai danh sach log theo thu tu thoi gian (moi nhat truoc)
   - Mac dinh hien thi 7 ngay gan nhat
   - Phan trang: 50 items/trang

3. **Hien thi thong tin**
   - Thoi gian
   - Nguoi thuc hien
   - Hanh dong
   - Chi tiet (metadata)
   - IP Address (optional)

4. **Su dung bo loc**
   - Loc theo khoang thoi gian
   - Loc theo nguoi dung
   - Loc theo loai hanh dong
   - Tim kiem theo keyword

## Luong thay the (Alternative Flows)

### 2a. Khong co log
- Hien thi thong bao "Chua co hoat dong nao duoc ghi nhan"
- Giai thich cac loai hoat dong se duoc ghi

## API Endpoints

### GET /api/workspaces/:id/audit-logs
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
startDate: ISO date string (optional)
endDate: ISO date string (optional)
userId: uuid (optional)
action: string (optional)
search: string (optional)
page: number (default 1)
limit: number (default 50, max 100)
```

**Response Success (200):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "FILE_UPLOADED",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "url"
      },
      "description": "Uploaded file document.pdf",
      "metadata": {
        "fileName": "document.pdf",
        "fileSize": 1024000,
        "fileType": "application/pdf"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 ...",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "action": "MEMBER_INVITED",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "description": "Invited new.user@example.com as MEMBER",
      "metadata": {
        "invitedEmail": "new.user@example.com",
        "role": "MEMBER"
      },
      "createdAt": "2024-01-15T09:30:00Z"
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 50,
    "totalPages": 10
  },
  "filters": {
    "availableActions": [
      "FILE_UPLOADED",
      "FILE_DELETED",
      "REPORT_CREATED",
      "MEMBER_INVITED",
      "MEMBER_REMOVED",
      "SETTINGS_UPDATED"
    ],
    "availableUsers": [
      {
        "id": "uuid",
        "name": "John Doe"
      }
    ]
  }
}
```

### GET /api/workspaces/:id/audit-logs/export
**Query Parameters:**
```
format: csv | json
startDate: ISO date string
endDate: ISO date string
```

**Response:**
- Returns file download

## Database Schema

### Audit Log Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

## Action Types
| Action | Description | Metadata |
|--------|-------------|----------|
| WORKSPACE_CREATED | Workspace duoc tao | name |
| WORKSPACE_UPDATED | Cap nhat thong tin workspace | changed_fields |
| WORKSPACE_LOCKED | Workspace bi khoa | reason |
| WORKSPACE_UNLOCKED | Workspace duoc mo khoa | - |
| MEMBER_INVITED | Moi thanh vien | email, role |
| MEMBER_JOINED | Thanh vien tham gia | - |
| MEMBER_REMOVED | Xoa thanh vien | removed_user_id |
| MEMBER_ROLE_CHANGED | Thay doi vai tro | old_role, new_role |
| OWNERSHIP_TRANSFERRED | Chuyen quyen so huu | new_owner_id |
| FILE_UPLOADED | Upload file | fileName, fileSize |
| FILE_DELETED | Xoa file | fileName |
| FILE_DOWNLOADED | Tai file | fileName |
| REPORT_CREATED | Tao bao cao AI | reportName, llmProvider |
| REPORT_EXPORTED | Xuat bao cao | reportName, format |
| SETTINGS_UPDATED | Cap nhat cai dat | changed_fields |

## Filter Component
```typescript
interface AuditLogFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  userId?: string;
  action?: string;
  search?: string;
}

const defaultFilter: AuditLogFilter = {
  dateRange: {
    start: subDays(new Date(), 7),
    end: new Date()
  }
};
```

## Implementation Notes

### Audit Log Service
```typescript
async function getAuditLogs(
  workspaceId: string,
  filters: AuditLogFilter,
  pagination: PaginationParams
): Promise<PaginatedResponse<AuditLog>> {
  const where: Prisma.AuditLogWhereInput = {
    workspaceId,
    createdAt: {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end
    }
  };

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { metadata: { path: [], string_contains: filters.search } }
    ];
  }

  const [logs, total] = await Promise.all([
    db.auditLogs.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit
    }),
    db.auditLogs.count({ where })
  ]);

  return {
    data: logs,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    }
  };
}
```

### Create Audit Log Helper
```typescript
async function createAuditLog(data: {
  workspaceId: string;
  userId: string;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
  req?: Request;
}): Promise<void> {
  await db.auditLogs.create({
    data: {
      workspaceId: data.workspaceId,
      userId: data.userId,
      action: data.action,
      description: data.description || generateDescription(data.action, data.metadata),
      metadata: data.metadata,
      ipAddress: data.req?.ip,
      userAgent: data.req?.headers['user-agent']
    }
  });
}
```

## Retention Policy
- Luu tru audit log toi thieu 90 ngay
- Co the cau hinh retention policy theo workspace
- Archive logs cu sang cold storage
