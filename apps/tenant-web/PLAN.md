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

## 1. UC09 - Dashboard/Overview (Trang `/`)

### Trạng thái: 🔄 Đang điều chỉnh

### Mục tiêu Dashboard
Dashboard là **trung tâm điều khiển** của workspace, giúp user:
1. **Nắm bắt tình hình nhanh** - Workspace overview stats
2. **Truy cập nhanh** - Recent files, quick actions
3. **Cross-project insights** - Thông qua UTS Agent Chat

### Layout mới

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE DASHBOARD                          │
├─────────────────────────────────┬───────────────────────────────────┤
│                                 │                                   │
│  📊 WORKSPACE OVERVIEW          │  🤖 UTS AGENT CHAT                │
│  ┌─────────┬─────────┬────────┐ │  ┌─────────────────────────────┐  │
│  │ Members │ Projects│ Storage│ │  │ "Tổng hợp tiến độ các       │  │
│  │   12    │    5    │ 45%    │ │  │  project tuần này"          │  │
│  └─────────┴─────────┴────────┘ │  │                             │  │
│                                 │  │ "So sánh performance giữa   │  │
│  📁 RECENT FILES (cross-project)│  │  project A và B"            │  │
│  • report_q4.pdf (Project A)    │  │                             │  │
│  • meeting_notes.md (Project B) │  │ "Ai chưa submit report      │  │
│                                 │  │  tuần này?"                 │  │
│  👥 TEAM ACTIVITY               │  │                             │  │
│  • Toan joined Project X        │  │ [____________________] Send │  │
│  • Mai uploaded file            │  └─────────────────────────────┘  │
│                                 │                                   │
│  ⚡ QUICK ACTIONS               │                                   │
│  [+ Project] [+ Member] [Upload]│                                   │
│                                 │                                   │
└─────────────────────────────────┴───────────────────────────────────┘
```

### Tasks:

| # | Task | Status | Chi tiết |
|---|------|--------|----------|
| 1.1 | Workspace Overview Stats | ⬜ | Members, Projects, Storage |
| 1.2 | Recent Files (cross-project) | ⬜ | Files mới từ tất cả projects |
| 1.3 | Team Activity | ✅ | Đã có RecentActivity |
| 1.4 | Quick Actions | ✅ | Đã có |
| 1.5 | UTS Agent Chat component | ⬜ | AI chat interface |
| 1.6 | Tích hợp Agent API | ⬜ | Connect to AI backend |

### Files đã tạo/cập nhật:
- `src/hooks/useWorkspaceStats.ts` - Hook fetch thống kê
- `src/hooks/useWorkspaceActivities.ts` - Hook fetch hoạt động
- `src/lib/api.ts` - Dashboard types và API functions
- `src/components/RecentActivity.tsx` - Activity timeline
- `src/components/OverviewPage.tsx` - Main dashboard page

### API Endpoints:

```typescript
// GET /tenant/stats
interface StatsResponse {
  memberCount: number;
  projectCount: number;
  storage: {
    usedGb: number;
    limitGb: number;
    usedPercent: number;
  };
}

// GET /tenant/activities?limit=10
interface ActivitiesResponse {
  activities: Activity[];
  hasMore: boolean;
}

// GET /tenant/recent-files?limit=5
interface RecentFilesResponse {
  files: {
    id: string;
    name: string;
    projectId: string;
    projectName: string;
    uploadedBy: { id: string; name: string };
    uploadedAt: string;
    size: number;
  }[];
}

// POST /tenant/agent/chat
interface AgentChatRequest {
  message: string;
  conversationId?: string;
}

interface AgentChatResponse {
  response: string;
  conversationId: string;
  sources?: { projectId: string; fileId?: string; type: string }[];
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

## Thứ tự triển khai

1. **UC09 - Dashboard** ← Đang làm
2. **UC11 - Members** (hoàn thiện phân quyền)
3. **UC07 - Settings** (tạo mới)
4. **UC12 - Transfer Ownership** (thêm vào Settings)

---

## Ghi chú

- Tất cả API calls sử dụng cookie-based authentication
- API base URL: `process.env.NEXT_PUBLIC_API_BASE` (default: `http://localhost:8080`)
- Sử dụng React Query cho state management
- UI components từ `@/components/ui` (shadcn/ui)
