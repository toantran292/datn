# UC09 - Xem Dashboard

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC09 |
| **Ten** | Xem Dashboard |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Thanh vien cua Workspace |

## Mo ta
Hien thi tong quan workspace gom thong ke so lieu va hoat dong gan day.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua workspace

## Luong xu ly chinh

```
[Nguoi dung] --> [Truy cap Workspace] --> [Tab Dashboard]
                                                |
                                                v
                                      [He thong tai du lieu]
                                                |
                        +-----------------------+-----------------------+
                        |                       |                       |
              [Tinh toan thong ke]    [Lay hoat dong gan day]    [Lay bao cao moi]
                        |                       |                       |
                        v                       v                       v
                  [Hien thi cards]     [Hien thi timeline]    [Hien thi list]
```

### Cac buoc chi tiet

1. **Truy cap Dashboard**
   - Nguoi dung chon workspace tu danh sach
   - Mac dinh chuyen den tab Dashboard
   - Hoac click vao "Dashboard" trong sidebar

2. **He thong tai va tinh toan**
   - Tai thong ke tong hop
   - Tai danh sach hoat dong gan day
   - Tai bao cao moi nhat

3. **Hien thi thong tin**
   - Cards thong ke: so thanh vien, so file, so bao cao, dung luong
   - Timeline hoat dong: 10 hoat dong gan nhat
   - Bao cao moi: 5 bao cao gan nhat
   - Bieu do (optional): xu huong hoat dong theo thoi gian

## Luong thay the (Alternative Flows)

### 2a. Workspace trong (moi tao)
- Hien thi welcome message
- Huong dan bat dau: moi thanh vien, upload file, tao bao cao
- Quick actions buttons

### 2b. Workspace bi khoa
- Hien thi dashboard voi thong bao "Read-only"
- Van hien thi thong ke va lich su
- An cac nut action

## API Endpoints

### GET /api/workspaces/:id/dashboard
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response Success (200):**
```json
{
  "workspace": {
    "id": "uuid",
    "name": "Workspace 1",
    "status": "ACTIVE"
  },
  "stats": {
    "memberCount": 10,
    "fileCount": 150,
    "reportCount": 25,
    "storage": {
      "usedGb": 5.5,
      "limitGb": 10,
      "usedPercent": 55
    }
  },
  "recentActivities": [
    {
      "id": "uuid",
      "type": "FILE_UPLOADED",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "url"
      },
      "description": "uploaded document.pdf",
      "metadata": {
        "fileName": "document.pdf",
        "fileSize": 1024000
      },
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "REPORT_CREATED",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar": "url"
      },
      "description": "created AI report",
      "metadata": {
        "reportName": "Monthly Summary"
      },
      "createdAt": "2024-01-14T15:30:00Z"
    }
  ],
  "recentReports": [
    {
      "id": "uuid",
      "name": "Monthly Summary",
      "type": "SUMMARY",
      "createdBy": {
        "id": "uuid",
        "name": "Jane Doe"
      },
      "createdAt": "2024-01-14T15:30:00Z"
    }
  ],
  "quickActions": [
    {
      "action": "UPLOAD_FILE",
      "label": "Upload File",
      "icon": "upload"
    },
    {
      "action": "CREATE_REPORT",
      "label": "Create Report",
      "icon": "file-text"
    },
    {
      "action": "INVITE_MEMBER",
      "label": "Invite Member",
      "icon": "user-plus"
    }
  ]
}
```

### GET /api/workspaces/:id/stats
**Response Success (200):**
```json
{
  "memberCount": 10,
  "fileCount": 150,
  "reportCount": 25,
  "storage": {
    "usedGb": 5.5,
    "limitGb": 10
  },
  "trend": {
    "files": {
      "thisWeek": 15,
      "lastWeek": 10,
      "change": 50
    },
    "reports": {
      "thisWeek": 5,
      "lastWeek": 3,
      "change": 66.7
    }
  }
}
```

### GET /api/workspaces/:id/activities
**Query Parameters:**
```
limit: number (default 10, max 50)
type: FILE_UPLOADED | REPORT_CREATED | MEMBER_JOINED | ... (optional)
```

**Response Success (200):**
```json
{
  "activities": [
    {
      "id": "uuid",
      "type": "FILE_UPLOADED",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "url"
      },
      "description": "uploaded document.pdf",
      "metadata": {},
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "hasMore": true
}
```

## Activity Types
| Type | Description |
|------|-------------|
| FILE_UPLOADED | Thanh vien upload file |
| FILE_DELETED | File bi xoa |
| REPORT_CREATED | Bao cao AI duoc tao |
| REPORT_EXPORTED | Bao cao duoc export |
| MEMBER_JOINED | Thanh vien moi tham gia |
| MEMBER_LEFT | Thanh vien roi khoi |
| MEMBER_ROLE_CHANGED | Thay doi vai tro thanh vien |
| SETTINGS_UPDATED | Cai dat workspace duoc cap nhat |

## Dashboard Components

### Stats Cards
```typescript
interface StatsCard {
  title: string;
  value: number | string;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

const statsCards: StatsCard[] = [
  { title: 'Thanh vien', value: 10, icon: 'users' },
  { title: 'Tep tin', value: 150, icon: 'file' },
  { title: 'Bao cao', value: 25, icon: 'file-text' },
  {
    title: 'Dung luong',
    value: '5.5 / 10 GB',
    icon: 'database',
    progress: 55
  }
];
```

### Activity Timeline
```typescript
interface Activity {
  id: string;
  type: ActivityType;
  user: UserSummary;
  description: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Display format
function formatActivity(activity: Activity): string {
  switch (activity.type) {
    case 'FILE_UPLOADED':
      return `${activity.user.name} uploaded ${activity.metadata.fileName}`;
    case 'REPORT_CREATED':
      return `${activity.user.name} created report "${activity.metadata.reportName}"`;
    case 'MEMBER_JOINED':
      return `${activity.metadata.memberName} joined the workspace`;
    // ...
  }
}
```

## Caching Strategy
- Stats: Cache 5 phut
- Activities: Real-time hoac cache 1 phut
- Invalidate cache khi co thay doi

## Implementation Notes

### Dashboard Service
```typescript
async function getDashboardData(
  workspaceId: string,
  userId: string
): Promise<DashboardData> {
  // Check membership
  const membership = await checkMembership(workspaceId, userId);
  if (!membership) {
    throw new ForbiddenException('Not a member of this workspace');
  }

  // Fetch data in parallel
  const [stats, activities, reports, workspace] = await Promise.all([
    getWorkspaceStats(workspaceId),
    getRecentActivities(workspaceId, 10),
    getRecentReports(workspaceId, 5),
    getWorkspace(workspaceId)
  ]);

  // Determine quick actions based on role
  const quickActions = getQuickActions(membership.role, workspace.status);

  return {
    workspace,
    stats,
    recentActivities: activities,
    recentReports: reports,
    quickActions
  };
}
```

## Audit Log
- Action: `DASHBOARD_VIEWED` (optional, for analytics)
