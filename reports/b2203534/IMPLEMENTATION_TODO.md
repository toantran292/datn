# B2203534 - Implementation TODO

Danh sách các chức năng cần triển khai cho hệ thống Workspace Management với AI.

**Ngày tạo:** 2024-12-15
**Cập nhật lần cuối:** 2024-12-15

---

## TỔNG QUAN TIẾN ĐỘ

| Nhóm | Hoàn thành | Một phần | Chưa làm | Tổng |
|------|------------|----------|----------|------|
| Xác thực (UC01-05) | 5 | 0 | 0 | 5 |
| Workspace (UC06-12) | 7 | 0 | 0 | 7 |
| Files (UC13-14) | 2 | 0 | 0 | 2 |
| Notifications/Reports (UC15-17) | 3 | 0 | 0 | 3 |
| **TỔNG** | **17** | **0** | **0** | **17** |

**Tiến độ tổng thể: 100% (17/17 hoàn thành)**

---

## MỨC ĐỘ ƯU TIÊN

- 🔴 **P0 - Critical**: Cần làm ngay, ảnh hưởng core functionality
- 🟠 **P1 - High**: Quan trọng, cần cho production
- 🟡 **P2 - Medium**: Cần có nhưng không urgent
- 🟢 **P3 - Low**: Nice to have

---

## NHÓM 1: XÁC THỰC VÀ QUẢN LÝ TÀI KHOẢN

### UC01 - Đăng ký tài khoản ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `POST /auth/register` endpoint
- [x] Password hash với BCrypt
- [x] PasswordPolicy validation
- [x] User entity với email, password, emailVerifiedAt
- [x] `EmailVerificationToken` entity và repository
- [x] `EmailVerificationService` với rate limiting
- [x] Migration `V6__add_email_verification.sql`
- [x] `GET /auth/verify-email?token=` - xác thực email
- [x] `POST /auth/verify-email` - xác thực email (POST)
- [x] `POST /auth/resend-verification` - gửi lại email
- [x] `POST /auth/verify-email/check` - kiểm tra token hợp lệ
- [x] Email template cho verification
- [x] Auto gửi verification email khi register
- [x] Domain event: `EmailVerified`

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/user/
│   ├── User.java (modified - added emailVerifiedAt)
│   ├── EmailVerificationToken.java (new)
│   └── EmailVerificationTokenRepository.java (new)
├── application/
│   ├── UserApplicationService.java (modified)
│   └── EmailVerificationService.java (new)
├── infrastructure/
│   ├── persistence/
│   │   ├── JpaEmailVerificationTokenRepository.java (new)
│   │   ├── adapter/UserRepositoryImpl.java (modified)
│   │   └── entity/UserEntity.java (modified)
│   └── outbox/
│       └── OutboxRelayService.java (modified - added EMAIL_VERIFICATION template)
├── interfaces/api/
│   └── AuthController.java (modified - added verification endpoints)
└── domain/events/
    └── IdentityEvents.java (modified - added EmailVerified)

services/identity/src/main/resources/db/migration/
└── V6__add_email_verification.sql (new)
```

**Không cần làm thêm.**

---

### UC02 - Đăng nhập ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `POST /auth/token` - login với email/password
- [x] JWT access token (15 phút)
- [x] Refresh token (7 ngày)
- [x] HttpOnly cookies
- [x] `POST /auth/refresh` - refresh token
- [x] `POST /auth/switch-org` - switch organization
- [x] Token revocation

**Không cần làm thêm.**

---

### UC03 - Đăng xuất ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `POST /auth/logout`
- [x] Clear cookies
- [x] Revoke refresh token
- [x] Revoke all user tokens

**Không cần làm thêm.**

---

### UC04 - Quản lý mật khẩu ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `POST /auth/password/set` - đổi mật khẩu (khi đã login)
- [x] Password validation policy
- [x] `POST /auth/forgot-password` - yêu cầu reset password
- [x] `POST /auth/reset-password` - reset password với token
- [x] `POST /auth/reset-password/validate` - validate token
- [x] `PasswordResetToken` entity (domain/user/)
- [x] `PasswordResetTokenRepository` interface và implementation
- [x] `PasswordResetService` với rate limiting
- [x] `EmailService` interface với outbox pattern
- [x] Migration `V5__add_password_reset_tokens.sql`
- [x] Domain events: `PasswordResetRequested`, `PasswordReset`

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/
│   ├── user/
│   │   ├── PasswordResetToken.java (new)
│   │   └── PasswordResetTokenRepository.java (new)
│   ├── email/
│   │   └── EmailService.java (new)
│   └── events/
│       └── IdentityEvents.java (modified - added PasswordResetRequested, PasswordReset)
├── application/
│   └── PasswordResetService.java (new)
├── infrastructure/
│   ├── persistence/
│   │   └── JpaPasswordResetTokenRepository.java (new)
│   └── email/
│       └── OutboxEmailService.java (new)
└── interfaces/api/
    └── PasswordController.java (modified)

services/identity/src/main/resources/db/migration/
└── V5__add_password_reset_tokens.sql (new)
```

**Không cần làm thêm.**

---

### UC05 - Cập nhật thông tin cá nhân ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] User entity với displayName, phone, bio, avatarAssetId
- [x] `GET /auth/me` - lấy thông tin user
- [x] Migration `V7__add_user_profile_fields.sql`
- [x] `UpdateProfileReq` và `ProfileRes` DTOs
- [x] `GET /users/me` - lấy profile
- [x] `PATCH /users/me` - cập nhật profile
- [x] `UserApplicationService.getProfile(userId)`
- [x] `UserApplicationService.updateProfile(userId, request)`
- [x] Domain event: `ProfileUpdated`

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/user/
│   └── User.java (modified - added phone, bio, avatarAssetId, updateProfile())
├── application/
│   └── UserApplicationService.java (modified - added getProfile, updateProfile)
├── infrastructure/
│   ├── persistence/
│   │   ├── entity/UserEntity.java (modified)
│   │   └── adapter/UserRepositoryImpl.java (modified)
├── interfaces/api/
│   ├── UsersController.java (modified - added GET/PATCH /users/me)
│   └── dto/Dtos.java (modified - added UpdateProfileReq, ProfileRes)
└── domain/events/
    └── IdentityEvents.java (modified - added ProfileUpdated)

services/identity/src/main/resources/db/migration/
└── V7__add_user_profile_fields.sql (new)
```

**Còn lại (optional):**
- [ ] Avatar upload với presigned URL (tích hợp file-storage service)

---

## NHÓM 2: QUẢN LÝ WORKSPACE

### UC06 - Tạo Workspace ✅

**Trạng thái:** ✅ Hoàn thành (95%)

**Đã có:**
- [x] `POST /orgs` - tạo workspace
- [x] Auto assign OWNER role
- [x] Slug uniqueness check
- [x] Logo upload với presigned URL

**Cần làm (optional):**
- [ ] **[Identity]** Thêm `llmProvider` field vào Organization (cho UC16)

---

### UC07 - Cấu hình Workspace ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `GET /orgs/my` - danh sách workspace
- [x] `PATCH /orgs/{id}/logo` - update logo
- [x] `GET /orgs/resolve?slug=` - resolve by slug
- [x] Migration `V8__add_org_settings.sql` - thêm description, llm_provider, settings
- [x] `LlmProvider` enum (OPENAI, ANTHROPIC, GOOGLE)
- [x] `OrganizationSettings` value object với feature flags
- [x] `GET /orgs/{id}` - lấy org detail
- [x] `PATCH /orgs/{id}` - update org info (displayName, description, llmProvider)
- [x] `GET /orgs/{id}/settings` - lấy settings
- [x] `PATCH /orgs/{id}/settings` - update settings
- [x] Domain events: `OrganizationUpdated`, `OrganizationSettingsUpdated`

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/org/
│   ├── Organization.java (modified - added description, llmProvider, settings)
│   ├── LlmProvider.java (new - enum)
│   └── OrganizationSettings.java (new - value object with FeatureFlags)
├── application/
│   └── OrganizationApplicationService.java (modified - added getOrgDetail, updateOrg, getOrgSettings, updateOrgSettings)
├── infrastructure/persistence/
│   ├── entity/OrganizationEntity.java (modified)
│   └── adapter/OrganizationRepositoryImpl.java (modified - added JSON serialization)
├── interfaces/api/
│   ├── OrganizationsController.java (modified - added 4 endpoints)
│   └── dto/Dtos.java (modified - added UpdateOrgReq, UpdateOrgSettingsReq, OrgDetailRes, OrgSettingsRes)
└── domain/events/
    └── IdentityEvents.java (modified - added OrganizationUpdated, OrganizationSettingsUpdated)

services/identity/src/main/resources/db/migration/
└── V8__add_org_settings.sql (new)
```

**Không cần làm thêm.**

---

### UC08 - Quản lý trạng thái Workspace ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `OrganizationStatus` enum (ACTIVE, LOCKED)
- [x] Organization entity với status, lockReason, lockedAt, lockedBy fields
- [x] Migration `V10__add_org_status.sql`
- [x] `POST /admin/orgs/{orgId}/lock` - khóa workspace
- [x] `POST /admin/orgs/{orgId}/unlock` - mở khóa workspace
- [x] `GET /admin/orgs/{orgId}/status` - lấy trạng thái workspace
- [x] Access control: Chặn update org/settings khi bị locked
- [x] OrgDetailRes include status và lockReason
- [x] Audit logging cho ORG_LOCKED, ORG_UNLOCKED

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/org/
│   ├── Organization.java (modified - added status fields, lock/unlock methods)
│   └── OrganizationStatus.java (new - enum)
├── application/
│   └── OrganizationApplicationService.java (modified - added lockOrg, unlockOrg, getOrgStatus, isOrgLocked)
├── infrastructure/persistence/
│   ├── entity/OrganizationEntity.java (modified)
│   └── adapter/OrganizationRepositoryImpl.java (modified)
├── interfaces/api/
│   ├── SuperAdminController.java (new)
│   ├── OrganizationsController.java (modified - added locked check)
│   └── dto/Dtos.java (modified - added LockOrgReq, OrgStatusRes, updated OrgDetailRes)
└── resources/db/migration/
    └── V10__add_org_status.sql (new)
```

**Còn lại (optional):**
- [ ] SuperAdminGuard - check super admin role
- [ ] `GET /admin/orgs` - list all workspaces
- [ ] Notification khi lock/unlock

---

### UC09 - Xem Dashboard ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `DashboardService` với getDashboardStats(orgId)
- [x] `DashboardController` với `GET /orgs/{orgId}/dashboard`
- [x] Member stats: total, owners, admins, staff, guests
- [x] Activity stats: totalActions, todayActions, thisWeekActions
- [x] Recent activities (10 items) với user email
- [x] DTOs: DashboardStatsRes, MemberStats, ActivityStats, RecentActivityRes
- [x] MembershipRepository với countByRole, countByMemberType
- [x] AuditLogRepository với countByOrgIdSince, findRecentByOrgId

**API Endpoint:**
- `GET /orgs/{orgId}/dashboard` - Dashboard statistics

**Response format:**
```json
{
  "orgId": "...",
  "orgName": "...",
  "status": "ACTIVE",
  "members": {
    "total": 10,
    "owners": 1,
    "admins": 2,
    "staff": 8,
    "guests": 2
  },
  "activities": {
    "totalActions": 100,
    "todayActions": 5,
    "thisWeekActions": 25,
    "recentActivities": [...]
  }
}
```

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── application/
│   └── DashboardService.java (new)
├── domain/
│   ├── org/MembershipRepository.java (modified)
│   └── audit/AuditLogRepository.java (modified)
├── infrastructure/persistence/
│   ├── adapter/MembershipRepositoryImpl.java (modified)
│   └── JpaAuditLogRepository.java (modified)
├── interfaces/api/
│   ├── DashboardController.java (new)
│   └── dto/Dtos.java (modified)
```

**Còn lại (optional):**
- [ ] File storage stats (integrate with file-storage service)
- [ ] Report stats (after UC16/17)

---

### UC10 - Xem Audit Log ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `AuditLog` domain entity với id, orgId, userId, action, description, metadata, ipAddress, userAgent, createdAt
- [x] `AuditAction` enum với categories: USER, ORGANIZATION, MEMBERSHIP, FILE, REPORT
- [x] `AuditLogRepository` interface
- [x] Migration `V9__add_audit_log.sql` với indexes
- [x] `JpaAuditLogRepository` implementation với JdbcClient
- [x] `AuditLogService` với query và filter support
- [x] `GET /orgs/{orgId}/audit-logs` - list audit logs với filters (userId, action, category, from, to)
- [x] `GET /orgs/{orgId}/audit-logs/categories` - list categories
- [x] `GET /orgs/{orgId}/audit-logs/actions` - list actions
- [x] Tích hợp audit vào OrganizationApplicationService
- [x] Tích hợp audit vào InvitationApplicationService
- [x] DTOs: `AuditLogRes`, `AuditActionInfo`

**Actions được log:**
- ORG_CREATED, ORG_UPDATED, ORG_SETTINGS_UPDATED
- MEMBER_INVITED, MEMBER_JOINED, MEMBER_REMOVED, MEMBER_ROLE_CHANGED
- INVITATION_ACCEPTED

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/audit/
│   ├── AuditLog.java (new)
│   ├── AuditLogRepository.java (new)
│   └── AuditAction.java (new - enum)
├── application/
│   ├── AuditLogService.java (new)
│   ├── OrganizationApplicationService.java (modified - added audit logging)
│   └── InvitationApplicationService.java (modified - added audit logging)
├── infrastructure/persistence/
│   └── JpaAuditLogRepository.java (new)
├── interfaces/api/
│   ├── AuditLogController.java (new)
│   └── dto/Dtos.java (modified - added AuditLogRes, AuditActionInfo)
└── resources/db/migration/
    └── V9__add_audit_log.sql (new)
```

**Còn lại (optional):**
- [ ] Export CSV/JSON
- [ ] @Auditable annotation với AOP

---

### UC11 - Quản lý thành viên ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `GET /orgs/{id}/members` - list members
- [x] `POST /orgs/{id}/members/invite` - invite member
- [x] `PUT /orgs/{id}/members/roles` - update roles
- [x] `DELETE /orgs/{id}/members/{userId}` - remove member
- [x] Invitation với token
- [x] Accept invitation

**Không cần làm thêm.**

---

### UC12 - Chuyển quyền sở hữu ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `POST /orgs/{orgId}/transfer-ownership` - chuyển quyền sở hữu
  - Request: `{ newOwnerId, password, confirmation: "TRANSFER" }`
  - Verify current user is OWNER
  - Verify password
  - Update roles trong transaction
- [x] `OrganizationApplicationService.transferOwnership(actorId, orgId, newOwnerId, password)`
- [x] `OrganizationApplicationService.isOwner(userId, orgId)`
- [x] Password verification với PasswordHasher
- [x] Chặn transfer khi org bị locked
- [x] Chặn transfer cho chính mình
- [x] Verify new owner phải là member
- [x] Audit logging với `ORG_OWNERSHIP_TRANSFERRED`
- [x] Domain events: `MembershipRolesUpdated` cho cả 2 users

**API Endpoint:**
- `POST /orgs/{orgId}/transfer-ownership` - Transfer ownership

**Request format:**
```json
{
  "newOwnerId": "uuid",
  "password": "current_password",
  "confirmation": "TRANSFER"
}
```

**Response format:**
```json
{
  "orgId": "...",
  "previousOwnerId": "...",
  "newOwnerId": "...",
  "transferredAt": "2024-12-15T..."
}
```

**Files đã tạo/sửa:**
```
services/identity/src/main/java/
├── domain/audit/
│   └── AuditAction.java (modified - added ORG_OWNERSHIP_TRANSFERRED)
├── application/
│   └── OrganizationApplicationService.java (modified - added transferOwnership, isOwner)
├── interfaces/api/
│   ├── OrganizationsController.java (modified - added transfer-ownership endpoint)
│   └── dto/Dtos.java (modified - added TransferOwnershipReq, TransferOwnershipRes)
```

**Còn lại (optional):**
- [ ] `POST /admin/orgs/{id}/revoke-ownership` - Super admin revoke
- [ ] Notification khi transfer ownership

---

## NHÓM 3: QUẢN LÝ TỆP

### UC13 - Upload tệp ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `POST /files/presigned-url` - presigned upload URL
- [x] `POST /files/confirm-upload` - confirm upload
- [x] `POST /files/upload` - direct upload
- [x] MinIO storage
- [x] Metadata tracking
- [x] Upload status tracking

**Không cần làm thêm.**

---

### UC14 - Quản lý tệp ✅

**Trạng thái:** ✅ Hoàn thành (95%)

**Đã có:**
- [x] `GET /files` - list files với filter
- [x] `GET /files/:id` - file detail
- [x] `GET /files/:id/download` - download
- [x] `DELETE /files/:id` - delete
- [x] `DELETE /files/subject/*` - batch delete
- [x] `PATCH /files/:id` - update metadata

**Cần làm (optional):**

#### Task 14.1: Folder Structure (Optional)
- [ ] **[File-Storage]** Tạo `Folder` schema
- [ ] **[File-Storage]** Tạo folder CRUD endpoints
- [ ] **[File-Storage]** Tạo move file endpoint

---

## NHÓM 4: THÔNG BÁO VÀ BÁO CÁO

### UC15 - Quản lý thông báo ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `Notification` domain entity với id, userId, orgId, type, title, content, metadata, isRead, readAt, createdAt
- [x] `NotificationType` enum với categories: ORGANIZATION, USER, SYSTEM
- [x] `NotificationRepository` interface và JpaNotificationRepository implementation
- [x] Migration `V11__add_notifications.sql` với indexes
- [x] `NotificationService` với các methods:
  - `createNotification(userId, orgId, type, title, content, metadata)`
  - `getNotifications(userId, page, size)` - paginated
  - `getUnreadNotifications(userId)`
  - `getUnreadCount(userId)`
  - `markAsRead(userId, notificationId)`
  - `markAllAsRead(userId)`
  - `deleteNotification(userId, notificationId)`
  - `deleteAllNotifications(userId)`
- [x] Helper methods cho common notifications:
  - `notifyInvitation(userId, orgId, orgName, inviterEmail)`
  - `notifyMemberJoined(userId, orgId, orgName, memberEmail)`
  - `notifyRoleChanged(userId, orgId, orgName, newRole)`
  - `notifyOwnershipTransferred(userId, orgId, orgName, isNewOwner)`

**API Endpoints:**
- `GET /notifications` - List notifications (paginated)
- `GET /notifications/unread` - List unread notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/{id}/read` - Mark as read
- `PATCH /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/{id}` - Delete notification
- `DELETE /notifications` - Delete all notifications

**NotificationTypes:**
- ORG_INVITATION, ORG_MEMBER_JOINED, ORG_MEMBER_REMOVED
- ORG_ROLE_CHANGED, ORG_OWNERSHIP_TRANSFERRED
- ORG_LOCKED, ORG_UNLOCKED
- PASSWORD_CHANGED, EMAIL_VERIFIED, PROFILE_UPDATED
- SYSTEM_ANNOUNCEMENT, SYSTEM_MAINTENANCE

**Files đã tạo (refactored to notification-service NestJS):**
```
services/notification/src/
├── persistence/
│   ├── entities/notification.entity.ts (new - TypeORM entity)
│   ├── notification.repository.ts (new)
│   └── persistence.module.ts (new)
├── notification/
│   ├── stored-notification.service.ts (new)
│   ├── stored-notification.controller.ts (new)
│   └── notification.module.ts (modified)
└── package.json (modified - added TypeORM, pg)
```

**Đã có:**
- [x] WebSocket real-time notifications (đã có từ đầu)
- [x] Email notifications (đã có từ đầu)
- [x] PostgreSQL persistence với TypeORM
- [x] Helper methods: notifyInvitation, notifyMemberJoined, notifyRoleChanged, notifyReportCompleted

**Còn lại (optional):**
- [ ] NotificationSettings entity và endpoints

---

### UC16 - Tạo báo cáo AI ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `Report` domain entity với lifecycle methods (create, startProcessing, complete, fail)
- [x] `ReportStatus` enum (PENDING, PROCESSING, COMPLETED, FAILED) với isTerminal(), canRetry()
- [x] `ReportType` enum (SUMMARY, ANALYSIS, EXTRACTION, COMPARISON, CUSTOM) với getDescription()
- [x] `ReportRepository` interface và JpaReportRepository implementation
- [x] Migration `V12__add_reports.sql` với indexes cho performance
- [x] `LlmService` interface với generate(), getProviderName(), getDefaultModel()
- [x] `LlmResult` record với success/failure factory methods
- [x] `MockLlmService` implementation cho testing/demo
- [x] `ReportService` với các methods:
  - `createReport(orgId, userId, request)` - tạo report
  - `processReport(reportId)` - xử lý với LLM
  - `createAndProcessReport(orgId, userId, request)` - tạo và xử lý synchronous
  - `getReport(reportId, orgId)` - lấy report detail
  - `getReports(orgId, page, size)` - list reports paginated
  - `getReportStatus(reportId, orgId)` - lấy trạng thái
  - `deleteReport(reportId, orgId)` - xóa report
  - `retryReport(reportId, orgId)` - retry failed report
- [x] Prompt builder dựa trên ReportType
- [x] Audit logging cho REPORT_CREATED, REPORT_DELETED

**API Endpoints:**
- `POST /orgs/{orgId}/reports` - Create report (sync processing)
- `GET /orgs/{orgId}/reports` - List reports (paginated)
- `GET /orgs/{orgId}/reports/{reportId}` - Get report detail
- `GET /orgs/{orgId}/reports/{reportId}/status` - Get report status
- `DELETE /orgs/{orgId}/reports/{reportId}` - Delete report
- `POST /orgs/{orgId}/reports/{reportId}/retry` - Retry failed report
- `GET /orgs/{orgId}/reports/types` - Get available report types

**Report Schema:**
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    llm_provider VARCHAR(20),
    llm_model VARCHAR(50),
    prompt TEXT,
    content TEXT,
    error_message TEXT,
    file_ids UUID[] DEFAULT '{}',
    config JSONB DEFAULT '{}',
    token_usage JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
```

**Files đã tạo (refactored to tenant-bff NestJS):**
```
services/tenant-bff/src/
├── reports/
│   ├── entities/report.entity.ts (new - enums, interfaces)
│   ├── dto/report.dto.ts (new - DTOs with validation)
│   ├── reports.service.ts (new - business logic)
│   ├── reports.controller.ts (new - REST endpoints)
│   └── reports.module.ts (new)
├── llm/
│   ├── llm.service.ts (new - OpenAI, Anthropic, Google AI, Mock)
│   └── llm.module.ts (new)
├── app.module.ts (modified - added ReportsModule, LlmModule)
└── package.json (modified - added uuid)
```

**LLM Integrations:**
- [x] OpenAI (GPT-4) - via API
- [x] Anthropic (Claude) - via API
- [x] Google AI (Gemini) - via API
- [x] Mock service cho testing/demo

**Còn lại (optional):**
- [ ] LangSmith integration cho tracing
- [ ] Async processing với queue (RabbitMQ/Kafka)
- [ ] Document content extraction (PDF, DOCX, CSV)

---

### UC17 - Xem và xuất báo cáo ✅

**Trạng thái:** ✅ Hoàn thành (100%)

**Đã có:**
- [x] `ExportFormat` enum (PDF, DOCX, MARKDOWN, HTML)
- [x] `ExportResult` interface với buffer, filename, mimeType
- [x] `ExportService` với export(), getSupportedFormats(), parseFormat()
- [x] `MarkdownExporter` - export markdown với metadata sections
- [x] `HtmlExporter` - export HTML với CSS styling và markdown-to-HTML conversion
- [x] `PdfExporter` - print-optimized HTML (ready for puppeteer integration)
- [x] `DocxExporter` - Office Open XML format
- [x] Export endpoints trong ReportsController:
  - `GET /orgs/{orgId}/reports/export/formats` - list supported formats
  - `GET /orgs/{orgId}/reports/{reportId}/export?format=PDF|DOCX|MARKDOWN|HTML` - export report

**API Endpoints:**
- `GET /orgs/{orgId}/reports/export/formats` - Get supported export formats
- `GET /orgs/{orgId}/reports/{reportId}/export` - Export report to file
  - Query params: `format` (PDF, DOCX, MARKDOWN, HTML), `includeMetadata` (true/false)
  - Returns: File download with appropriate Content-Type and Content-Disposition

**Export Formats:**
| Format | MIME Type | Extension |
|--------|-----------|-----------|
| PDF | text/html (print-ready) | .html |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx |
| MARKDOWN | text/markdown | .md |
| HTML | text/html | .html |

**Files đã tạo:**
```
services/tenant-bff/src/reports/export/
├── export.types.ts (new - ExportFormat enum, ExportResult interface)
├── export.service.ts (new - main export service)
├── markdown-exporter.ts (new)
├── html-exporter.ts (new)
├── pdf-exporter.ts (new - print-optimized HTML)
├── docx-exporter.ts (new - Office Open XML)
└── index.ts (new - barrel export)

services/tenant-bff/src/reports/
├── reports.service.ts (modified - added exportReport, getExportFormats)
├── reports.controller.ts (modified - added export endpoints)
└── dto/report.dto.ts (modified - added ExportReportQueryDto, ExportFormatInfoDto)
```

**Còn lại (optional):**
- [ ] Puppeteer integration cho actual PDF generation
- [ ] docx library integration cho rich DOCX formatting

---

## CHECKLIST TỔNG HỢP

### Phase 1: Core Authentication (Tuần 1-2)
- [ ] UC01 - Email verification
- [ ] UC04 - Forgot password
- [ ] UC10 - Audit log infrastructure

### Phase 2: Workspace Enhancement (Tuần 3-4)
- [ ] UC05 - Update profile
- [ ] UC07 - Workspace settings
- [ ] UC08 - Lock/unlock workspace
- [ ] UC12 - Transfer ownership

### Phase 3: Dashboard & Notifications (Tuần 5-6)
- [ ] UC09 - Dashboard
- [ ] UC15 - Notifications

### Phase 4: AI Reports (Tuần 7-8)
- [ ] UC16 - Create AI report
- [ ] UC17 - Export report

---

## DEPENDENCIES

```
UC09 (Dashboard) ──depends on──> UC10 (Audit Log)
UC16 (AI Report) ──depends on──> UC14 (Files) ✅
UC17 (Export) ──depends on──> UC16 (AI Report)
UC08 (Lock) ──depends on──> UC15 (Notifications) [optional]
```

---

## GHI CHÚ

- Mỗi task nên tạo branch riêng: `feature/ucXX-task-name`
- Commit message format: `feat(service): UC01 - add email verification`
- Tạo PR và review trước khi merge
- Viết unit tests cho các service mới
- Update API documentation (Swagger/OpenAPI)
