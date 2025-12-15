# Kế hoạch phát triển Tenant-Web

## Tổng quan

Tenant-web là ứng dụng **quản lý workspace cross-project** cho Owner/Admin. Đây là trung tâm điều khiển tổng quát, nơi user có thể:

- Nắm bắt tình hình workspace nhanh chóng
- Quản lý members, settings của workspace
- Tương tác với **UTS Agent Chat** để hỏi đáp cross-project

**Đặc điểm quan trọng:**
- AppHeader ẩn ProjectSelector (vì là cross-project view)
- Dashboard tập trung vào workspace-level insights
- Tích hợp AI Agent để hỏi đáp dữ liệu từ nhiều project

### Use Cases:
- **UC07**: Cấu hình Workspace
- **UC09**: Dashboard/Overview (Cross-project)
- **UC11**: Quản lý thành viên
- **UC12**: Chuyển quyền sở hữu

---

## Kiến trúc Storage & Files

### Storage Quota (Cross-Product)
- **Phạm vi**: Tất cả files trong Organization (Projects + Channels)
- **Giới hạn**: 10GB mặc định (config qua `STORAGE_LIMIT_BYTES`)
- **Hiển thị**: Tổng % sử dụng, giống nhau cho mọi user trong org

### DM Files (Direct Messages)
- **KHÔNG tính vào quota**
- **Tự động xóa** sau X ngày (configurable, mặc định 30 ngày)
- **Private**: Chỉ người trong conversation thấy

### Channel Types & File Visibility

| Channel Type | Scope | File Visibility |
|--------------|-------|-----------------|
| Workspace Public | Org-wide | Tất cả org members |
| Workspace Private | Org-wide | Chỉ channel members |
| Project Public | Project | Tất cả project members |
| Project Private | Project | Chỉ channel members trong project |

### Recent Files (Permission-based)
Mỗi user thấy **khác nhau** tùy quyền truy cập:
- **Project files**: User phải là member của project đó
- **Channel files**: User phải có quyền truy cập channel đó
- **DM files**: KHÔNG hiển thị (private)

---

## 1. UC09 - Dashboard/Overview (Trang `/`)

### Trạng thái: ✅ Cơ bản hoàn thành

### Mục tiêu Dashboard
Dashboard là **trung tâm điều khiển** của workspace, giúp user:
1. **Nắm bắt tình hình nhanh** - Workspace overview stats
2. **Truy cập nhanh** - Recent files, quick actions
3. **Cross-project insights** - Thông qua UTS Agent Chat

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE DASHBOARD                          │
├─────────────────────────────────┬───────────────────────────────────┤
│                                 │                                   │
│  📊 WORKSPACE OVERVIEW          │  🤖 UTS AGENT CHAT                │
│  ┌─────────┬─────────┬────────┐ │  ┌─────────────────────────────┐  │
│  │ Members │ Projects│ Storage│ │  │ Streaming + Markdown        │  │
│  │   12    │    5    │ 45%    │ │  │ support                     │  │
│  └─────────┴─────────┴────────┘ │  │                             │  │
│                                 │  │ No history persistence      │  │
│  📁 RECENT FILES (permission)   │  │ (MVP scope)                 │  │
│  • report_q4.pdf (Project A)    │  │                             │  │
│  • meeting_notes.md (Project B) │  │                             │  │
│                                 │  │ [____________________] Send │  │
│  👥 TEAM ACTIVITY               │  └─────────────────────────────┘  │
│  • Toan joined Project X        │                                   │
│  • Mai uploaded file            │                                   │
│                                 │                                   │
│  ⚡ QUICK ACTIONS               │                                   │
│  [+ Project] [+ Member] [Upload]│                                   │
│                                 │                                   │
└─────────────────────────────────┴───────────────────────────────────┘
```

### Tasks:

| # | Task | Status | Chi tiết |
|---|------|--------|----------|
| 1.1 | Workspace Overview Stats | ✅ | Members, Projects, Storage từ API |
| 1.2 | Recent Files (permission-based) | ⬜ | Files mới user có quyền xem |
| 1.3 | Team Activity | ✅ | Từ Identity service |
| 1.4 | Quick Actions | ✅ | Đã có |
| 1.5 | UTS Agent Chat component | ✅ | Streaming + Markdown |
| 1.6 | Tích hợp Agent API | ✅ | SSE streaming |

### Files đã tạo/cập nhật:
- `src/hooks/useDashboard.ts` - Hook fetch dashboard (aggregated)
- `src/lib/api.ts` - Dashboard types và API functions
- `src/components/RecentActivity.tsx` - Activity timeline
- `src/components/OverviewPage.tsx` - Main dashboard page
- `src/components/AgentChat.tsx` - AI chat với streaming + markdown

### API Endpoints (Implemented):

```typescript
// GET /tenant/dashboard (aggregated từ tenant-bff)
interface DashboardResponse {
  orgId: string;
  orgName: string;
  status: string;
  members: {
    total: number;
    owners: number;
    admins: number;
    staff: number;
    guests: number;
  };
  activities: {
    totalActions: number;
    todayActions: number;
    thisWeekActions: number;
    recentActivities: RecentActivity[];
  };
  projects: {
    total: number;
    items: ProjectLite[];
  };
  storage: {
    usedBytes: number;
    limitBytes: number;
    usedPercent: number;
  };
}

// POST /tenant/agent/chat (SSE streaming)
// Request body: { message: string }
// Response: Server-Sent Events với markdown content
```

### API Endpoints (TODO - Recent Files):

```typescript
// GET /tenant/recent-files?limit=5
// Files user có quyền xem (cross-project, permission-based)
interface RecentFilesResponse {
  files: {
    id: string;
    name: string;
    projectId: string;
    projectName: string;
    channelId?: string;
    channelName?: string;
    uploadedBy: { id: string; name: string };
    uploadedAt: string;
    size: number;
  }[];
}
```

---

## 2. UC11 - Quản lý thành viên (Trang `/members`)

### Trạng thái: Đã có UI và hook `useMembers`, đã kết nối API cơ bản

### Tasks:

| # | Task | Status | Chi tiết |
|---|------|--------|----------|
| 2.1 | Xem danh sách | ✅ | Đã có |
| 2.2 | Mời thành viên | ✅ | Đã có `InviteMemberModal` |
| 2.3 | Xóa thành viên | ✅ | Đã có |
| 2.4 | Phân quyền | ⬜ | Thay đổi role (ADMIN/MEMBER) |
| 2.5 | Pending invitations | ⬜ | Hiển thị danh sách lời mời chờ |
| 2.6 | Cancel invitation | ⬜ | Hủy lời mời đang chờ |

### API Endpoints:

```typescript
// GET /tenant/members
// POST /tenant/members/invite
// DELETE /tenant/members/:id
// PATCH /tenant/members/:id/role
interface UpdateRoleRequest {
  role: 'ADMIN' | 'MEMBER';
}

// GET /tenant/invitations
interface InvitationsResponse {
  invitations: Invitation[];
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: { id: string; name: string };
  expiresAt: string;
  createdAt: string;
}

// DELETE /tenant/invitations/:id
```

---

## 3. UC07 - Cấu hình Workspace (Trang `/settings`)

### Trạng thái: Chưa có

### Tasks:

| # | Task | Status | Chi tiết |
|---|------|--------|----------|
| 3.1 | Tạo route `/settings` | ⬜ | Page component |
| 3.2 | Tạo `SettingsPage` component | ⬜ | Layout với tabs/sections |
| 3.3 | General Settings section | ⬜ | Tên, mô tả workspace |
| 3.4 | Logo Upload | ⬜ | Upload và preview logo |
| 3.5 | Storage Settings | ⬜ | Giới hạn file, định dạng |
| 3.6 | Tạo hook `useWorkspaceSettings` | ⬜ | Fetch và update settings |
| 3.7 | Permission check | ⬜ | Chỉ Owner/Admin mới edit được |

### API Endpoints:

```typescript
// GET /tenant/settings
interface SettingsResponse {
  workspace: {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    status: 'ACTIVE' | 'LOCKED';
  };
  settings: {
    maxFileSizeMb: number;
    allowedFileTypes: string[];
    storageLimitGb: number;
    storageUsedGb: number;
  };
  membership: {
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
}

// PATCH /tenant/settings
interface UpdateSettingsRequest {
  name?: string;
  description?: string;
}

// POST /tenant/settings/logo
// Content-Type: multipart/form-data
// Response: { logoUrl: string }

// PATCH /tenant/settings/storage
interface UpdateStorageSettingsRequest {
  maxFileSizeMb?: number;
  allowedFileTypes?: string[];
  storageLimitGb?: number;
}
```

---

## 4. UC12 - Chuyển quyền sở hữu (Trong `/settings`)

### Trạng thái: Chưa có

### Tasks:

| # | Task | Status | Chi tiết |
|---|------|--------|----------|
| 4.1 | Danger Zone section | ⬜ | Thêm vào SettingsPage |
| 4.2 | `TransferOwnershipDialog` | ⬜ | Modal component |
| 4.3 | Eligible owners list | ⬜ | Danh sách thành viên có thể nhận quyền |
| 4.4 | Password confirmation | ⬜ | Input xác nhận mật khẩu |
| 4.5 | Tạo hook `useTransferOwnership` | ⬜ | API integration |

### API Endpoints:

```typescript
// GET /tenant/eligible-owners
interface EligibleOwnersResponse {
  members: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    joinedAt: string;
  }[];
}

// POST /tenant/transfer-ownership
interface TransferOwnershipRequest {
  newOwnerId: string;
  password: string;
  confirmation: boolean;
}

interface TransferOwnershipResponse {
  message: string;
  workspace: { id: string; name: string };
  previousOwner: { id: string; name: string; newRole: string };
  newOwner: { id: string; name: string };
}
```

---

## Cấu trúc Routes

```
tenant-web/
├── /                    → UC09 - Dashboard
├── /members             → UC11 - Members
├── /files               → Files management
└── /settings            → UC07 + UC12
    ├── General          → Thông tin workspace
    ├── Storage          → Cài đặt lưu trữ
    └── Danger Zone      → Chuyển quyền sở hữu
```

---

## Thứ tự triển khai (Roadmap)

### Phase 1: Dashboard Core ✅
- [x] UC09 Dashboard layout
- [x] KPI Cards (Members, Projects, Storage)
- [x] Team Activity từ API
- [x] UTS Agent Chat (streaming + markdown)
- [x] Storage stats từ API (hardcode limit 10GB)

### Phase 2: Files & Storage
- [ ] **File-storage service**: Endpoint `GET /api/storage/usage`
- [ ] **Recent Files API**: Permission-based query
- [ ] **Frontend**: Integrate recent files từ API
- [ ] **DM cleanup job**: Auto-delete sau X ngày

### Phase 3: Members Management
- [ ] UC11 Phân quyền (change role)
- [ ] Pending invitations list
- [ ] Cancel invitation

### Phase 4: Settings
- [ ] UC07 Settings page
- [ ] General settings (name, description, logo)
- [ ] Storage settings

### Phase 5: Ownership Transfer
- [ ] UC12 Transfer ownership
- [ ] Danger zone section
- [ ] Password confirmation

---

## Backend Services Cần Update

### file-storage-api
```typescript
// GET /api/storage/usage
// Header: X-Org-Id
interface StorageUsageResponse {
  usedBytes: number;
  fileCount: number;
}

// GET /api/files/recent?limit=5
// Header: X-Org-Id, X-User-Id
// Permission-based: chỉ trả files user có quyền xem
interface RecentFilesResponse {
  files: FileInfo[];
}
```

### tenant-bff (đã implement)
- `GET /dashboard` - Aggregated dashboard data
- Storage stats với hardcode limit (10GB default)

---

## Ghi chú

- Tất cả API calls sử dụng cookie-based authentication
- API base URL: `process.env.NEXT_PUBLIC_API_BASE` (default: `http://localhost:8080`)
- Sử dụng React Query cho state management
- UI components từ `@/components/ui` (shadcn/ui)
- Storage limit config: `STORAGE_LIMIT_BYTES` env var
