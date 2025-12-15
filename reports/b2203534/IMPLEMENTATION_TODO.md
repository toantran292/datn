# B2203534 - Implementation TODO

Danh sách các chức năng cần triển khai cho hệ thống Workspace Management với AI.

**Ngày tạo:** 2024-12-15
**Cập nhật lần cuối:** 2024-12-15

---

## TỔNG QUAN TIẾN ĐỘ

| Nhóm | Hoàn thành | Một phần | Chưa làm | Tổng |
|------|------------|----------|----------|------|
| Xác thực (UC01-05) | 2 | 3 | 0 | 5 |
| Workspace (UC06-12) | 2 | 1 | 4 | 7 |
| Files (UC13-14) | 2 | 0 | 0 | 2 |
| Notifications/Reports (UC15-17) | 0 | 0 | 3 | 3 |
| **TỔNG** | **6** | **4** | **7** | **17** |

**Tiến độ tổng thể: 35% (6/17 hoàn thành)**

---

## MỨC ĐỘ ƯU TIÊN

- 🔴 **P0 - Critical**: Cần làm ngay, ảnh hưởng core functionality
- 🟠 **P1 - High**: Quan trọng, cần cho production
- 🟡 **P2 - Medium**: Cần có nhưng không urgent
- 🟢 **P3 - Low**: Nice to have

---

## NHÓM 1: XÁC THỰC VÀ QUẢN LÝ TÀI KHOẢN

### UC01 - Đăng ký tài khoản 🟠 P1

**Trạng thái:** 🔶 Một phần (70%)

**Đã có:**
- [x] `POST /auth/register` endpoint
- [x] Password hash với BCrypt
- [x] PasswordPolicy validation
- [x] User entity với email, password

**Cần làm:**

#### Task 1.1: Email Verification System
- [ ] **[Identity]** Tạo `EmailVerificationToken` entity
  ```java
  // domain/user/EmailVerificationToken.java
  - id: UUID
  - userId: UUID
  - token: String (unique)
  - expiresAt: LocalDateTime
  - verifiedAt: LocalDateTime (nullable)
  ```
- [ ] **[Identity]** Tạo `EmailVerificationTokenRepository`
- [ ] **[Identity]** Tạo migration `V5__add_email_verification.sql`
- [ ] **[Identity]** Thêm field `emailVerifiedAt` vào User entity
- [ ] **[Identity]** Tạo `EmailVerificationService`
  - `createToken(userId)` - tạo token mới
  - `verifyToken(token)` - xác thực token
  - `resendToken(email)` - gửi lại token
- [ ] **[Identity]** Cập nhật `UserApplicationService.register()` để tạo token
- [ ] **[Identity]** Tạo endpoints:
  - `GET /auth/verify-email?token={token}` - xác thực email
  - `POST /auth/resend-verification` - gửi lại email

#### Task 1.2: Email Service Integration
- [ ] **[Identity]** Tạo `EmailService` interface
- [ ] **[Identity]** Implement với SMTP hoặc SendGrid/AWS SES
- [ ] **[Identity]** Tạo email templates:
  - `verification-email.html`
  - `welcome-email.html`
- [ ] **[Config]** Thêm email config vào application.yml

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/user/
│   ├── EmailVerificationToken.java (new)
│   └── EmailVerificationTokenRepository.java (new)
├── application/
│   └── EmailVerificationService.java (new)
├── infrastructure/
│   ├── email/
│   │   ├── EmailService.java (new)
│   │   └── SmtpEmailService.java (new)
│   └── persistence/
│       └── EmailVerificationTokenRepositoryImpl.java (new)
└── interfaces/api/
    └── AuthController.java (modify)
```

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

### UC04 - Quản lý mật khẩu 🔴 P0

**Trạng thái:** 🔶 Một phần (40%)

**Đã có:**
- [x] `POST /auth/password/set` - đổi mật khẩu (khi đã login)
- [x] Password validation policy

**Cần làm:**

#### Task 4.1: Password Reset Token
- [ ] **[Identity]** Tạo `PasswordResetToken` entity
  ```java
  // domain/user/PasswordResetToken.java
  - id: UUID
  - userId: UUID
  - tokenHash: String
  - expiresAt: LocalDateTime
  - usedAt: LocalDateTime (nullable)
  ```
- [ ] **[Identity]** Tạo `PasswordResetTokenRepository`
- [ ] **[Identity]** Tạo migration `V6__add_password_reset.sql`

#### Task 4.2: Forgot Password Flow
- [ ] **[Identity]** Tạo `PasswordResetService`
  - `requestReset(email)` - tạo token và gửi email
  - `validateToken(token)` - kiểm tra token hợp lệ
  - `resetPassword(token, newPassword)` - đặt mật khẩu mới
- [ ] **[Identity]** Tạo endpoints:
  - `POST /auth/forgot-password` - yêu cầu reset
  - `POST /auth/reset-password` - reset với token
  - `GET /auth/reset-password/validate?token=` - validate token
- [ ] **[Identity]** Tạo email template `password-reset.html`

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/user/
│   ├── PasswordResetToken.java (new)
│   └── PasswordResetTokenRepository.java (new)
├── application/
│   └── PasswordResetService.java (new)
├── infrastructure/persistence/
│   └── PasswordResetTokenRepositoryImpl.java (new)
└── interfaces/api/
    └── PasswordController.java (modify)
```

---

### UC05 - Cập nhật thông tin cá nhân 🟡 P2

**Trạng thái:** 🔶 Một phần (30%)

**Đã có:**
- [x] User entity với displayName
- [x] `GET /auth/me` - lấy thông tin user

**Cần làm:**

#### Task 5.1: Update Profile API
- [ ] **[Identity]** Thêm fields vào User entity:
  ```java
  - phone: String (nullable)
  - bio: String (nullable)
  - avatarAssetId: UUID (nullable)
  ```
- [ ] **[Identity]** Tạo migration `V7__add_user_profile_fields.sql`
- [ ] **[Identity]** Tạo `UpdateProfileRequest` DTO
- [ ] **[Identity]** Tạo endpoint `PATCH /users/me`
- [ ] **[Identity]** Cập nhật `UserApplicationService`:
  - `updateProfile(userId, request)`

#### Task 5.2: Avatar Upload
- [ ] **[Identity]** Tạo endpoint `POST /users/me/avatar/presigned-url`
- [ ] **[Identity]** Tạo endpoint `PATCH /users/me/avatar`
- [ ] **[Identity]** Tích hợp với file-storage service

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/user/
│   └── User.java (modify - add fields)
├── application/
│   └── UserApplicationService.java (modify)
├── interfaces/api/
│   ├── UsersController.java (modify)
│   └── dto/
│       └── UpdateProfileRequest.java (new)
└── resources/db/migration/
    └── V7__add_user_profile_fields.sql (new)
```

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

### UC07 - Cấu hình Workspace 🟡 P2

**Trạng thái:** 🔶 Một phần (50%)

**Đã có:**
- [x] `GET /orgs/my` - danh sách workspace
- [x] `PATCH /orgs/{id}/logo` - update logo
- [x] `GET /orgs/resolve?slug=` - resolve by slug

**Cần làm:**

#### Task 7.1: Update Workspace Settings
- [ ] **[Identity]** Thêm fields vào Organization:
  ```java
  - description: String
  - llmProvider: Enum (OPENAI, ANTHROPIC, GOOGLE)
  - settings: JSON (maxFileSizeMb, storageLimitGb, allowedFileTypes)
  ```
- [ ] **[Identity]** Tạo migration `V8__add_org_settings.sql`
- [ ] **[Identity]** Tạo endpoint `PATCH /orgs/{id}` - update org info
- [ ] **[Identity]** Tạo endpoint `PATCH /orgs/{id}/settings` - update settings
- [ ] **[Identity]** Tạo endpoint `GET /orgs/{id}/settings` - get settings

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/organization/
│   ├── Organization.java (modify)
│   └── OrganizationSettings.java (new - value object)
├── application/
│   └── OrganizationApplicationService.java (modify)
├── interfaces/api/
│   ├── OrganizationsController.java (modify)
│   └── dto/
│       ├── UpdateOrganizationRequest.java (new)
│       └── UpdateSettingsRequest.java (new)
└── resources/db/migration/
    └── V8__add_org_settings.sql (new)
```

---

### UC08 - Quản lý trạng thái Workspace 🟡 P2

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 8.1: Workspace Status
- [ ] **[Identity]** Thêm fields vào Organization:
  ```java
  - status: Enum (ACTIVE, LOCKED)
  - lockReason: String
  - lockedAt: LocalDateTime
  - lockedBy: UUID
  ```
- [ ] **[Identity]** Tạo migration `V9__add_org_status.sql`

#### Task 8.2: Super Admin APIs
- [ ] **[Identity]** Tạo `SuperAdminController`
- [ ] **[Identity]** Tạo endpoints:
  - `POST /admin/orgs/{id}/lock` - khóa workspace
  - `POST /admin/orgs/{id}/unlock` - mở khóa workspace
  - `GET /admin/orgs` - list all workspaces (admin)
- [ ] **[Identity]** Tạo `SuperAdminGuard` - check super admin role
- [ ] **[Identity]** Tích hợp notification khi lock/unlock

#### Task 8.3: Access Control khi Locked
- [ ] **[Identity]** Update các API để check workspace status
- [ ] **[Tenant-BFF]** Return locked status trong response

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/organization/
│   ├── Organization.java (modify)
│   └── OrganizationStatus.java (new - enum)
├── application/
│   └── SuperAdminService.java (new)
├── interfaces/api/
│   └── SuperAdminController.java (new)
└── resources/db/migration/
    └── V9__add_org_status.sql (new)
```

---

### UC09 - Xem Dashboard 🟡 P2

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 9.1: Dashboard Stats API
- [ ] **[Tenant-BFF]** Tạo `DashboardController`
- [ ] **[Tenant-BFF]** Tạo endpoint `GET /dashboard`
- [ ] **[Tenant-BFF]** Tạo `DashboardService` để aggregate data:
  - Gọi Identity service lấy member count
  - Gọi File-storage service lấy file stats
  - Gọi Report service lấy report count (sau khi có)

#### Task 9.2: Recent Activities
- [ ] **[Tenant-BFF]** Tạo endpoint `GET /dashboard/activities`
- [ ] **[Identity]** Cần có Audit Log trước (UC10)

**Files cần tạo/sửa:**
```
services/tenant-bff/src/
├── dashboard/
│   ├── dashboard.module.ts (new)
│   ├── dashboard.controller.ts (new)
│   └── dashboard.service.ts (new)
└── services/
    └── file-storage.service.ts (new)
```

---

### UC10 - Xem Audit Log 🟠 P1

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 10.1: Audit Log Infrastructure
- [ ] **[Identity]** Tạo `AuditLog` entity
  ```java
  - id: UUID
  - orgId: UUID
  - userId: UUID
  - action: String
  - description: String
  - metadata: JSON
  - ipAddress: String
  - userAgent: String
  - createdAt: LocalDateTime
  ```
- [ ] **[Identity]** Tạo `AuditLogRepository`
- [ ] **[Identity]** Tạo migration `V10__add_audit_log.sql`

#### Task 10.2: Audit Log Service
- [ ] **[Identity]** Tạo `AuditLogService`
  - `log(orgId, userId, action, metadata, request)`
  - `findByOrg(orgId, filters, pageable)`
- [ ] **[Identity]** Tạo `@Auditable` annotation
- [ ] **[Identity]** Tạo `AuditAspect` để auto-log

#### Task 10.3: Audit Log API
- [ ] **[Identity]** Tạo endpoints:
  - `GET /orgs/{id}/audit-logs` - list audit logs
  - `GET /orgs/{id}/audit-logs/export` - export CSV/JSON
- [ ] **[Identity]** Tích hợp audit vào các service hiện tại

#### Task 10.4: Audit Actions
- [ ] **[Identity]** Log các actions:
  - USER_REGISTERED, USER_LOGIN, USER_LOGOUT
  - ORG_CREATED, ORG_UPDATED, ORG_LOCKED, ORG_UNLOCKED
  - MEMBER_INVITED, MEMBER_JOINED, MEMBER_REMOVED, MEMBER_ROLE_CHANGED
  - FILE_UPLOADED, FILE_DELETED, FILE_DOWNLOADED
  - REPORT_CREATED, REPORT_EXPORTED

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/audit/
│   ├── AuditLog.java (new)
│   ├── AuditLogRepository.java (new)
│   └── AuditAction.java (new - enum)
├── application/
│   └── AuditLogService.java (new)
├── infrastructure/
│   ├── audit/
│   │   ├── Auditable.java (new - annotation)
│   │   └── AuditAspect.java (new)
│   └── persistence/
│       └── AuditLogRepositoryImpl.java (new)
├── interfaces/api/
│   └── AuditLogController.java (new)
└── resources/db/migration/
    └── V10__add_audit_log.sql (new)
```

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

### UC12 - Chuyển quyền sở hữu 🟡 P2

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 12.1: Transfer Ownership API
- [ ] **[Identity]** Tạo endpoint `POST /orgs/{id}/transfer-ownership`
  - Request: `{ newOwnerId, password, confirmation }`
  - Verify current user is OWNER
  - Verify password
  - Update roles trong transaction
- [ ] **[Identity]** Cập nhật `OrganizationApplicationService`:
  - `transferOwnership(actorId, orgId, newOwnerId, password)`

#### Task 12.2: Revoke Ownership (Super Admin)
- [ ] **[Identity]** Tạo endpoint `POST /admin/orgs/{id}/revoke-ownership`
  - Request: `{ reason, newOwnerId (optional) }`
- [ ] **[Identity]** Gửi notification cho affected users

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── application/
│   └── OrganizationApplicationService.java (modify)
├── interfaces/api/
│   ├── OrganizationsController.java (modify)
│   ├── SuperAdminController.java (modify)
│   └── dto/
│       ├── TransferOwnershipRequest.java (new)
│       └── RevokeOwnershipRequest.java (new)
```

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

### UC15 - Quản lý thông báo 🟡 P2

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 15.1: Notification Infrastructure
- [ ] **[Identity]** Tạo `Notification` entity
  ```java
  - id: UUID
  - userId: UUID
  - orgId: UUID (nullable)
  - type: String
  - title: String
  - content: String
  - metadata: JSON
  - isRead: Boolean
  - readAt: LocalDateTime
  - createdAt: LocalDateTime
  ```
- [ ] **[Identity]** Tạo migration `V11__add_notifications.sql`

#### Task 15.2: Notification Service
- [ ] **[Identity]** Tạo `NotificationService`
  - `create(notification)`
  - `findByUser(userId, filters)`
  - `markAsRead(id)`
  - `markAllAsRead(userId)`
  - `getUnreadCount(userId)`
- [ ] **[Identity]** Tạo endpoints:
  - `GET /notifications` - list notifications
  - `GET /notifications/unread-count` - count unread
  - `PATCH /notifications/{id}/read` - mark as read
  - `PATCH /notifications/mark-all-read` - mark all as read

#### Task 15.3: Notification Settings
- [ ] **[Identity]** Tạo `NotificationSettings` entity
- [ ] **[Identity]** Tạo endpoints:
  - `GET /notifications/settings`
  - `PUT /notifications/settings`

#### Task 15.4: Real-time Notifications (Optional)
- [ ] **[Tenant-BFF]** Tích hợp WebSocket/SSE
- [ ] **[Tenant-BFF]** Push notification khi có notification mới

**Files cần tạo/sửa:**
```
services/identity/src/main/java/
├── domain/notification/
│   ├── Notification.java (new)
│   ├── NotificationRepository.java (new)
│   ├── NotificationSettings.java (new)
│   └── NotificationType.java (new - enum)
├── application/
│   └── NotificationService.java (new)
├── infrastructure/persistence/
│   └── NotificationRepositoryImpl.java (new)
├── interfaces/api/
│   └── NotificationController.java (new)
└── resources/db/migration/
    └── V11__add_notifications.sql (new)
```

---

### UC16 - Tạo báo cáo AI 🟢 P3

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 16.1: Report Infrastructure
- [ ] **[New Service?]** Tạo Report service hoặc thêm vào Tenant-BFF
- [ ] **[DB]** Tạo `Report` schema (MongoDB hoặc PostgreSQL)
  ```
  - id: UUID
  - workspaceId: UUID
  - name: String
  - type: Enum (SUMMARY, ANALYSIS, CUSTOM)
  - description: String
  - content: Text
  - llmProvider: Enum
  - llmModel: String
  - config: JSON
  - status: Enum (PENDING, PROCESSING, COMPLETED, FAILED)
  - errorMessage: String
  - tokenUsage: JSON
  - fileIds: UUID[]
  - createdBy: UUID
  - createdAt: DateTime
  - completedAt: DateTime
  ```

#### Task 16.2: LLM Integration
- [ ] **[Tenant-BFF]** Tạo `LLMService` interface
- [ ] **[Tenant-BFF]** Implement `OpenAIService`
- [ ] **[Tenant-BFF]** Implement `AnthropicService`
- [ ] **[Tenant-BFF]** Implement `GoogleAIService`
- [ ] **[Config]** Thêm API keys vào config

#### Task 16.3: Report Generation
- [ ] **[Tenant-BFF]** Tạo `ReportService`
  - `create(request)` - tạo report và queue processing
  - `process(reportId)` - xử lý async
  - `getStatus(reportId)` - lấy trạng thái
- [ ] **[Tenant-BFF]** Tạo endpoints:
  - `POST /reports` - tạo report
  - `GET /reports/{id}/status` - lấy trạng thái

#### Task 16.4: Document Processing
- [ ] **[Tenant-BFF]** Tạo `DocumentExtractor`
  - Extract text từ PDF
  - Extract text từ DOCX
  - Extract data từ CSV/XLSX

**Files cần tạo/sửa:**
```
services/tenant-bff/src/
├── reports/
│   ├── reports.module.ts (new)
│   ├── reports.controller.ts (new)
│   ├── reports.service.ts (new)
│   └── schemas/
│       └── report.schema.ts (new)
├── llm/
│   ├── llm.module.ts (new)
│   ├── llm.service.ts (new - interface)
│   ├── openai.service.ts (new)
│   ├── anthropic.service.ts (new)
│   └── google-ai.service.ts (new)
└── document/
    ├── document.module.ts (new)
    └── document-extractor.service.ts (new)
```

---

### UC17 - Xem và xuất báo cáo 🟢 P3

**Trạng thái:** ❌ Chưa triển khai (0%)

**Cần làm:**

#### Task 17.1: Report Listing & Detail
- [ ] **[Tenant-BFF]** Tạo endpoints:
  - `GET /reports` - list reports
  - `GET /reports/{id}` - report detail
  - `DELETE /reports/{id}` - delete report

#### Task 17.2: Report Export
- [ ] **[Tenant-BFF]** Tạo `ExportService`
  - `exportToPdf(reportId)` - export PDF
  - `exportToDocx(reportId)` - export DOCX
  - `exportToMarkdown(reportId)` - export MD
- [ ] **[Tenant-BFF]** Tạo endpoint:
  - `GET /reports/{id}/export?format=pdf|docx|md`
- [ ] **[Tenant-BFF]** Tích hợp libraries:
  - puppeteer hoặc pdfkit cho PDF
  - docx cho DOCX

**Files cần tạo/sửa:**
```
services/tenant-bff/src/
├── reports/
│   ├── reports.controller.ts (modify)
│   └── export/
│       ├── export.service.ts (new)
│       ├── pdf-exporter.ts (new)
│       ├── docx-exporter.ts (new)
│       └── markdown-exporter.ts (new)
```

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
