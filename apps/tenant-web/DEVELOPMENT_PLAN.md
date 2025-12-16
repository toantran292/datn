# Tenant-Web Development Plan

## Tổng quan dự án

**Mục tiêu:** Hoàn thiện ứng dụng tenant-web với đầy đủ chức năng quản lý workspace cho hệ thống UTS (Unified Team Space).

**Công nghệ:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, @uts/design-system

---

## Trạng thái hiện tại

| Trang | Tiến độ | Ghi chú |
|-------|---------|---------|
| Overview (`/`) | 90% | Đã kết nối API Recent Files, Agent Chat còn mock |
| Members (`/members`) | 95% | Đã hoàn thiện, có Change Role modal |
| Files (`/files`) | 95% | Đã kết nối API thực, upload, download, delete |
| Settings (`/settings`) | 95% | Đã implement frontend và BFF |

---

## Phase 1: Settings Page (Ưu tiên cao)

### 1.1 Tạo cấu trúc Settings

**Files cần tạo:**
```
src/
├── app/(tenant)/settings/
│   └── page.tsx
└── features/settings/
    ├── SettingsView.tsx
    ├── hooks/
    │   └── useOrgSettings.ts
    └── components/
        ├── GeneralSettings.tsx
        ├── LogoUpload.tsx
        ├── DangerZone.tsx
        └── DeleteOrgModal.tsx
```

### 1.2 General Settings

**Chức năng:**
- [x] Hiển thị thông tin workspace (name, description)
- [x] Form chỉnh sửa workspace name
- [x] Form chỉnh sửa description
- [x] Nút Save Changes

**API đã tạo:**
- `GET /tenant/settings` - Lấy thông tin settings (đã implement BFF)
- `PATCH /tenant/settings` - Cập nhật settings (đã implement BFF)

### 1.3 Logo Upload

**Chức năng:**
- [x] Hiển thị logo hiện tại (hoặc placeholder)
- [x] Upload logo mới (drag & drop + click)
- [x] Preview trước khi save
- [ ] Crop/resize image
- [x] Xóa logo

**API đã tạo:**
- `POST /tenant/settings/logo` - Upload logo (đã implement BFF)
- `DELETE /tenant/settings/logo` - Xóa logo (đã implement BFF)

### 1.4 Danger Zone

**Chức năng:**
- [ ] Transfer Ownership (chỉ Owner) - chưa implement
- [x] Delete Organization (chỉ Owner, cần confirm)

**API đã tạo:**
- `DELETE /tenant/settings/organization` - Xóa organization (đã implement BFF)

---

## Phase 2: Hoàn thiện các trang hiện có

### 2.1 Overview Page

**Tasks:**
- [x] Kết nối API Recent Files thực (hoàn thành)
- [ ] Implement Agent Chat với backend (SSE streaming)
- [x] Thêm loading skeleton cho từng component (hoàn thành)
- [ ] Error boundary cho từng section

**API đã có:**
- `GET /tenant/dashboard/recent-files` - Lấy files gần đây (đã implement)
- `POST /tenant/agent/chat` - SSE endpoint cho chat (cần implement)

### 2.2 Members Page

**Tasks:**
- [ ] Implement View Profile action (redirect hoặc modal)
- [ ] Bulk actions (select multiple, remove multiple)
- [ ] Export members list (CSV)
- [ ] Pagination cho danh sách lớn

### 2.3 Files Page

**Tasks:**
- [x] Kết nối File Upload API thực
- [ ] Implement file sharing/permissions
- [ ] Bulk download/delete
- [x] File search với pagination
- [ ] Breadcrumb navigation cho folders

**API đã tạo:**
- `POST /tenant/files/upload` - Upload file (đã implement)
- `GET /tenant/files` - List files với pagination (đã implement)
- `GET /tenant/files/storage` - Storage usage (đã implement)
- `POST /tenant/files/presigned-url` - Get presigned upload URL (đã implement)
- `POST /tenant/files/confirm-upload` - Confirm upload (đã implement)
- `POST /tenant/files/:id/download-url` - Get download URL (đã implement)
- `DELETE /tenant/files/:id` - Xóa file (đã implement)

---

## Phase 3: Tính năng bổ sung

> **Note:** User Profile đã được implement ở `auth-web`, không cần làm ở tenant-web.

### 3.1 Projects Page (`/projects`)

**Files cần tạo:**
```
src/
├── app/(tenant)/projects/
│   └── page.tsx
└── features/projects/
    ├── ProjectsView.tsx
    ├── hooks/
    │   └── useProjects.ts
    └── components/
        ├── ProjectCard.tsx
        ├── CreateProjectModal.tsx
        └── ProjectSettingsModal.tsx
```

**Chức năng:**
- [ ] Danh sách projects
- [ ] Tạo project mới
- [ ] Archive/Delete project
- [ ] Project settings

### 3.2 Notifications

> **Note:** Notifications được triển khai trong `auth-header` (shared component) và gọi trực tiếp tới notification API thông qua edge. Không cần implement trong tenant-web riêng.

**Chức năng (implement trong auth-header):**
- [x] Notification bell icon trong header
- [x] Dropdown với recent notifications
- [x] Mark as read/unread
- [ ] Notification preferences

**Files đã tạo/sửa:**
- `packages/design-system/ui/src/app-header/notification-bell.tsx` - NotificationBell component
- `packages/design-system/ui/src/app-header/app-header.tsx` - Tích hợp NotificationBell
- `packages/notifications/src/utils/NotificationClient.ts` - Fix WebSocket path
- `services/notification/src/websocket/notification.gateway.ts` - Add Socket.IO path config
- `services/edge/configs/nginx.conf` - Fix WebSocket proxy (không rewrite path)

**Kiến trúc:**
- WebSocket (Socket.IO) cho real-time notifications
- REST API để load stored notifications và persist actions
- Merge real-time + stored notifications (dedupe by id)

**API endpoints (qua edge):**
- `GET /notifications` - List notifications (paginated)
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `DELETE /notifications` - Clear all notifications
- WebSocket: `ws://edge/notifications/socket.io` - Real-time

---

## Phase 4: Polish & Optimization

### 4.1 UX Improvements

- [ ] Loading states cho tất cả actions
- [ ] Optimistic updates
- [ ] Toast notifications nhất quán
- [ ] Keyboard shortcuts
- [ ] Empty states đẹp hơn

### 4.2 Performance

- [ ] React Query caching
- [ ] Image optimization
- [ ] Code splitting
- [ ] Prefetching

### 4.3 Accessibility

- [ ] ARIA labels
- [ ] Focus management
- [ ] Screen reader support
- [ ] Color contrast

---

## Backend API Requirements

### Identity Service (Java Spring)

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/internal/orgs/{id}` | GET | Get org details | Cần kiểm tra |
| `/internal/orgs/{id}` | PATCH | Update org | Cần tạo |
| `/internal/orgs/{id}/logo` | POST | Upload logo | Cần tạo |
| `/internal/orgs/{id}/logo` | DELETE | Delete logo | Cần tạo |
| `/internal/orgs/{id}/transfer` | POST | Transfer ownership | Cần tạo |
| `/internal/orgs/{id}` | DELETE | Delete org | Cần tạo |

### Tenant-BFF (NestJS)

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/tenant/settings` | GET | Get settings | Đã tạo |
| `/tenant/settings` | PATCH | Update settings | Đã tạo |
| `/tenant/settings/logo` | POST | Upload logo | Đã tạo |
| `/tenant/settings/logo` | DELETE | Delete logo | Đã tạo |
| `/tenant/settings/organization` | DELETE | Delete org | Đã tạo |
| `/tenant/dashboard/recent-files` | GET | Recent files | Đã tạo |
| `/tenant/files` | GET | List files với pagination | Đã tạo |
| `/tenant/files/storage` | GET | Storage usage | Đã tạo |
| `/tenant/files/upload` | POST | Upload file | Đã tạo |
| `/tenant/files/presigned-url` | POST | Get presigned upload URL | Đã tạo |
| `/tenant/files/confirm-upload` | POST | Confirm upload | Đã tạo |
| `/tenant/files/:id/download-url` | POST | Get download URL | Đã tạo |
| `/tenant/files/:id` | DELETE | Delete file | Đã tạo |

---

## Timeline ước tính

| Phase | Công việc | Thời gian |
|-------|-----------|-----------|
| Phase 1 | Settings Page | ~~2-3 ngày~~ Đã hoàn thành |
| Phase 2 | Hoàn thiện Overview, Members, Files | ~~2-3 ngày~~ Đang tiến hành (Files hoàn thành) |
| Phase 3 | Projects, Notifications | 2-3 ngày |
| Phase 4 | Polish & Optimization | 1-2 ngày |

**Tổng cộng:** 3-5 ngày (đã trừ Phase 1 hoàn thành, Files API hoàn thành, Profile đã có ở auth-web)

---

## Checklist triển khai Settings Page

### Frontend (tenant-web)

- [x] Tạo route `/settings/page.tsx`
- [x] Tạo `SettingsView.tsx` component chính
- [x] Tạo `useOrgSettings.ts` hook
- [x] Tạo `GeneralSettings.tsx` - form chỉnh sửa tên, mô tả
- [x] Tạo `LogoUpload.tsx` - upload logo
- [x] Tạo `DangerZone.tsx` - transfer ownership, delete
- [x] Tạo `DeleteOrgModal.tsx` - confirm delete
- [x] Thêm Settings vào sidebar navigation
- [ ] Test responsive design
- [ ] Test error handling

### Backend (tenant-bff)

- [x] Tạo `settings.controller.ts`
- [x] Tạo `settings.service.ts`
- [x] Tạo endpoints GET/PATCH `/tenant/settings`
- [x] Tạo endpoint POST `/tenant/settings/logo`
- [x] Tạo endpoint DELETE `/tenant/settings/logo`
- [x] Tạo endpoint DELETE `/tenant/settings/organization`
- [x] Kết nối với identity service

### Backend (identity)

- [ ] Tạo/update endpoint GET `/internal/orgs/{id}` - lấy chi tiết org
- [ ] Tạo/update endpoint PATCH `/internal/orgs/{id}` - update name, description
- [ ] Tạo endpoint PATCH `/internal/orgs/{id}/logo` - update logo URL
- [ ] Tạo endpoint DELETE `/internal/orgs/{id}` - delete org
- [ ] Tạo endpoint transfer ownership

---

## Notes

- Tất cả Settings chỉ dành cho **Owner** hoặc **Admin**
- Delete Organization chỉ dành cho **Owner**
- Transfer Ownership chỉ dành cho **Owner**
- Logo upload sử dụng file-storage service
- Cần confirm dialog cho các action nguy hiểm
