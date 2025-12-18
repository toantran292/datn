# AI Refine Description - Chi tiết tính năng

**Version**: 1.0.0
**Last Updated**: December 15, 2025
**Owner**: Development Team

---

## 📋 Table of Contents

1. [Tổng quan](#tổng-quan)
2. [Standard Issue Templates](#standard-issue-templates)
3. [User Stories & Requirements](#user-stories--requirements)
4. [UI/UX Design](#uiux-design)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Plan](#implementation-plan)
7. [API Specifications](#api-specifications)
8. [Data Examples](#data-examples)
9. [Testing Strategy](#testing-strategy)
10. [Security & Performance](#security--performance)
11. [Deployment Guide](#deployment-guide)

---

## 🎯 Tổng quan

### Mô tả tính năng

**AI Refine Description** là tính năng sử dụng AI để tự động tinh chỉnh, format và cải thiện nội dung description của issue trong hệ thống quản lý dự án.

### Vấn đề giải quyết

**Hiện trạng:**
- Developer viết description ngắn gọn, thiếu chi tiết: "fix bug login"
- Thiếu cấu trúc rõ ràng (acceptance criteria, steps to reproduce)
- Ngữ pháp không chuẩn, viết tắt khó hiểu
- Không có template thống nhất giữa các team members

**Giải pháp:**
AI sẽ tự động:
- ✅ Mở rộng description với chi tiết cụ thể
- ✅ Thêm cấu trúc markdown chuẩn
- ✅ Đề xuất acceptance criteria
- ✅ Cải thiện ngữ pháp và spelling
- ✅ Format theo best practices

### Lợi ích

| Đối tượng | Lợi ích |
|-----------|---------|
| **Developer** | Tiết kiệm thời gian viết description chi tiết |
| **Product Owner** | Issues rõ ràng hơn, dễ review và prioritize |
| **Tester** | Hiểu rõ acceptance criteria để tạo test cases |
| **Team** | Consistency trong documentation, onboarding dễ dàng |

### Scope

**Trong scope:**
- ✅ Refine description cho tất cả issue types (TASK, BUG, STORY)
- ✅ Hỗ trợ tiếng Việt và tiếng Anh
- ✅ Preview trước khi apply changes
- ✅ Undo/Revert về version cũ

**Ngoài scope:**
- ❌ Tự động generate issue từ text
- ❌ Translate giữa các ngôn ngữ
- ❌ Gợi ý assignee hoặc priority

---

## 📝 Standard Issue Template

### Overview

AI sẽ refine description theo **1 template chuẩn universal** áp dụng cho tất cả issue types (BUG, STORY, TASK, EPIC). Template này được tổng hợp từ best practices của GitHub, Jira, Linear và các công ty công nghệ hàng đầu, đảm bảo tính linh hoạt và nhất quán.

---

### 📋 Universal Template

**Format chuẩn cho tất cả issue types - Flexible và structured**

```markdown
## 📌 Tóm tắt

[Mô tả ngắn gọn vấn đề/feature/task cần giải quyết - 1-2 câu]

## 📝 Mô tả chi tiết

[Giải thích context, background, và lý do cần thực hiện công việc này]

## 🎯 Mục tiêu

[Mục tiêu cần đạt được sau khi hoàn thành]

## 📋 Chi tiết thực hiện

[Phần này linh hoạt tùy theo issue type:
- BUG: Các bước tái hiện, Kết quả thực tế vs Mong đợi
- STORY: User flow, User persona
- TASK: Action items, Technical approach
- EPIC: Implementation phases, Scope]

## ✅ Acceptance Criteria / Definition of Done

- [ ] Tiêu chí 1
- [ ] Tiêu chí 2
- [ ] Tiêu chí 3

## 🔗 Thông tin bổ sung (Optional)

**Môi trường** (cho BUG):
- Trình duyệt/OS: [Nếu relevant]
- Phiên bản: [Nếu relevant]

**Dependencies** (cho TASK/STORY):
- Phụ thuộc vào: [Issues khác]
- Liên quan: [Related work]

**Technical Notes**:
- [Ghi chú kỹ thuật, nếu có]

**Resources**:
- [Links, screenshots, design mockups]
```

---

### 💡 Ví dụ ứng dụng cho từng Issue Type

#### 🐛 Example 1: BUG

```markdown
## 📌 Tóm tắt

Người dùng không thể đăng nhập khi sử dụng email có chứa dấu cộng (+).

## 📝 Mô tả chi tiết

Hệ thống validation hiện tại không chấp nhận email có ký tự đặc biệt như dấu +, mặc dù đây là format hợp lệ theo RFC 5322 standard. Vấn đề này ảnh hưởng đến ~5% users sử dụng email aliasing.

## 🎯 Mục tiêu

Cho phép users đăng nhập với email chứa ký tự + và các ký tự đặc biệt hợp lệ khác.

## 📋 Chi tiết thực hiện

**Các bước tái hiện:**
1. Truy cập trang đăng nhập: https://app.example.com/login
2. Nhập email: `user+test@example.com`
3. Nhập password đúng
4. Click nút "Đăng nhập"
5. Quan sát lỗi

**Kết quả thực tế:**
- Hiển thị lỗi: "Email hoặc password không đúng"
- Console log: `400 Bad Request - Invalid email format`

**Kết quả mong đợi:**
- Đăng nhập thành công
- Redirect đến dashboard

## ✅ Acceptance Criteria / Definition of Done

- [ ] Emails với dấu + được chấp nhận
- [ ] Test với các format: user+tag@domain.com, user+123@domain.com
- [ ] Validation tuân thủ RFC 5322 standard
- [ ] Không ảnh hưởng existing validation logic
- [ ] Unit tests cho edge cases
- [ ] Bug không còn tái hiện

## 🔗 Thông tin bổ sung

**Môi trường:**
- Trình duyệt: Chrome 120.0.6099.129
- Hệ điều hành: Windows 11
- Phiên bản: v2.3.1

**Dependencies:**
- Liên quan: #542 (Email validation overhaul)

**Technical Notes:**
- Root cause: Email validation regex không support dấu +
- Workaround: Sử dụng email không có dấu +

**Resources:**
- Screenshot: https://i.imgur.com/example.png
```

---

#### 📖 Example 2: STORY

```markdown
## 📌 Tóm tắt

**As a** Project Manager
**I want to** export sprint reports to Excel
**So that** I can share progress với stakeholders không có system access

## 📝 Mô tả chi tiết

Hiện tại, PM phải manually copy data từ sprint view và paste vào Excel để tạo reports. Quá trình này mất ~30 phút mỗi sprint và dễ có lỗi. Feature này sẽ tự động generate Excel file với data formatted sẵn.

## 🎯 Mục tiêu

Giảm thời gian tạo sprint report từ 30 phút xuống < 2 phút thông qua tự động hóa export.

## 📋 Chi tiết thực hiện

**User Flow:**
1. User mở Sprint detail view
2. Click nút "Export to Excel" ở góc phải
3. Modal hiển thị preview và export options
4. Chọn sheets to include (Issues / Velocity / Burndown)
5. Click "Download"
6. File .xlsx tự động download

**User Persona:**
- Role: Project Manager
- Experience: Intermediate (familiar với PM tools)
- Pain Point: Mất thời gian tạo reports cho weekly meetings

## ✅ Acceptance Criteria / Definition of Done

**Given** user đang xem sprint detail view
**When** user clicks "Export to Excel" button
**Then** system generates và downloads Excel file

- [ ] Nút "Export to Excel" visible trong sprint detail view
- [ ] Excel file chứa 3 sheets: Issues, Velocity, Burndown
- [ ] Issues sheet có đầy đủ fields: ID, Title, Type, Status, Assignee, Points
- [ ] Velocity chart rendered as image
- [ ] File name format: `Sprint_{sprint_name}_{date}.xlsx`
- [ ] Download < 5 seconds
- [ ] Works trên Chrome, Firefox, Safari
- [ ] Mobile responsive

## 🔗 Thông tin bổ sung

**Dependencies:**
- Phụ thuộc vào: #342 (Sprint metrics calculation)
- Liên quan: #298 (PDF export feature)

**Technical Notes:**
- Use ExcelJS library
- Server-side generation cho large datasets
- Cache files for 1 hour
- Max 10,000 rows per export

**Resources:**
- Mockup: https://figma.com/file/abc123
- Design system: Secondary button, Excel icon từ lucide-react
```

---

#### ✅ Example 3: TASK

```markdown
## 📌 Tóm tắt

Thêm database indexes để tối ưu performance cho sprint queries.

## 📝 Mô tả chi tiết

Query time cho trang sprint detail hiện tại ~2000ms khi có nhiều issues. Cần thêm composite indexes trên Issue và Sprint tables để giảm xuống < 200ms.

## 🎯 Mục tiêu

Giảm query time từ ~2000ms xuống < 200ms cho sprint detail page.

## 📋 Chi tiết thực hiện

**Action Items:**
- [ ] Analyze slow queries trong production logs
- [ ] Identify missing indexes trên Issue và Sprint tables
- [ ] Create migration file cho new indexes
- [ ] Test performance before/after
- [ ] Deploy to staging
- [ ] Verify improvement
- [ ] Deploy to production
- [ ] Monitor metrics 24h

**Technical Approach:**
Thêm composite indexes: `(sprintId, status)`, `(projectId, sprintId)`

**Files to modify:**
- `services/pm/prisma/migrations/XXX_add_sprint_indexes/migration.sql`
- `services/pm/prisma/schema.prisma`

## ✅ Acceptance Criteria / Definition of Done

- [ ] Migration file created và tested locally
- [ ] Schema.prisma updated với @@index
- [ ] Query time < 200ms verified on staging
- [ ] No locking issues (use CONCURRENTLY)
- [ ] Deployed to staging successfully
- [ ] Performance metrics captured
- [ ] Documented in CHANGELOG.md
- [ ] Production deployment complete

## 🔗 Thông tin bổ sung

**Dependencies:**
- PostgreSQL 16+
- Prisma 5.22.0

**Technical Notes:**
```sql
CREATE INDEX CONCURRENTLY idx_issue_sprint_status ON issue(sprint_id, status);
CREATE INDEX CONCURRENTLY idx_issue_project_sprint ON issue(project_id, sprint_id);
```

**Resources:**
- [PostgreSQL Docs](https://www.postgresql.org/docs/16/indexes.html)
- [Performance Analysis](https://docs.google.com/spreadsheets/d/xxx)
```

---

#### 🚀 Example 4: EPIC

```markdown
## 📌 Tóm tắt

Real-time Collaboration System - Cho phép nhiều users cùng edit issue description simultaneously với real-time updates.

## 📝 Mô tả chi tiết

**Problem Statement:**
Users phải refresh page để thấy updates từ team members. Gây conflicts và data loss khi nhiều người edit cùng lúc.

**Business Value:**
- Tăng team productivity 25%
- Giảm conflicts/data loss xuống 0%
- Giảm support tickets ~50 tickets/month

## 🎯 Mục tiêu

Implement real-time collaboration cho issue editing với WebSocket infrastructure, đạt sync latency < 100ms.

## 📋 Chi tiết thực hiện

**Scope:**

In Scope:
- ✅ Real-time description editing với CRDT
- ✅ Real-time comments
- ✅ Presence indicators
- ✅ Conflict auto-resolution

Out of Scope:
- ❌ Video/audio chat (Phase 2)
- ❌ Real-time board updates (separate epic)

**Implementation Phases:**

### Phase 1: Infrastructure (Week 1-2)
- [ ] Setup WebSocket server với Socket.io
- [ ] JWT authentication for WS
- [ ] Presence tracking system
- [ ] Redis pub/sub

### Phase 2: Core Features (Week 3-5)
- [ ] Real-time editing với CRDT
- [ ] Conflict detection/resolution
- [ ] Real-time comments
- [ ] Presence UI

### Phase 3: Launch (Week 6-7)
- [ ] Performance optimization
- [ ] Error handling
- [ ] Load testing (1000 users)
- [ ] Documentation

## ✅ Acceptance Criteria / Definition of Done

**Success Metrics:**
- [ ] Sync latency < 100ms (p95)
- [ ] Support 100+ concurrent users per project
- [ ] Conflict resolution 99%+ success
- [ ] User satisfaction 8.5/10

**Completion Criteria:**
- [ ] All phases deployed to production
- [ ] Performance targets met
- [ ] Load testing passed
- [ ] Documentation complete

## 🔗 Thông tin bổ sung

**Dependencies:**
- Phụ thuộc vào: #499 (Redis setup)
- Blocks: #700 (Real-time board updates)
- Related stories: #550, #551, #552

**Technical Notes:**
- Timeline: 2025-12-16 (Kickoff) → 2026-01-20 (Launch)
- Tech stack: Socket.io, Redis, CRDT library
- Stakeholders: @sarah-pm (PM), @mike-backend (Tech Lead)

**Resources:**
- Figma: https://figma.com/file/realtime-collab
- PRD: https://docs.google.com/document/d/xxx
- Tech design: https://docs.google.com/document/d/yyy
```

---

### 🎯 How to Use This Template

#### Template Flexibility

Phần **"📋 Chi tiết thực hiện"** là flexible section được customize dựa trên issue type:

| Issue Type | Chi tiết thực hiện nên chứa |
|------------|----------------------------|
| **BUG** | • Các bước tái hiện<br>• Kết quả thực tế vs Mong đợi<br>• Môi trường (browser, OS, version) |
| **STORY** | • User flow (step by step)<br>• User persona<br>• UI/UX requirements |
| **TASK** | • Action items checklist<br>• Technical approach<br>• Files to modify |
| **EPIC** | • Scope (In/Out of scope)<br>• Implementation phases<br>• Timeline |

#### Required vs Optional Sections

**Required (Luôn có):**
- ✅ Tóm tắt
- ✅ Mô tả chi tiết
- ✅ Mục tiêu
- ✅ Chi tiết thực hiện
- ✅ Acceptance Criteria / Definition of Done

**Optional (Có khi cần thiết):**
- Thông tin bổ sung (môi trường, dependencies, technical notes, resources)

#### Vietnamese Language Priority

AI luôn output **tiếng Việt** trừ khi:
- Technical terms: API, WebSocket, CRDT, JWT, Redis, etc.
- Code snippets, commands, URLs
- File paths và package names
- Proper nouns (GitHub, Jira, Chrome, etc.)

---

### 💡 AI Prompt Engineering

**System Prompt cho AI:**

```
You are an expert technical writer specializing in software issue documentation.
Your task is to refine and structure issue descriptions using a UNIVERSAL TEMPLATE that works for all issue types (BUG, STORY, TASK, EPIC).

UNIVERSAL TEMPLATE STRUCTURE:
1. 📌 Tóm tắt - Brief 1-2 sentence summary
2. 📝 Mô tả chi tiết - Context and background
3. 🎯 Mục tiêu - Objective/goal
4. 📋 Chi tiết thực hiện - Flexible section (adapt based on issue type)
5. ✅ Acceptance Criteria / Definition of Done - Checklist
6. 🔗 Thông tin bổ sung - Optional metadata

GUIDELINES FOR "Chi tiết thực hiện" SECTION:
- BUG → Include: Reproduction steps, Actual vs Expected results
- STORY → Include: User flow, User persona, UI/UX notes
- TASK → Include: Action items, Technical approach, Files to modify
- EPIC → Include: Scope, Implementation phases, Timeline

GENERAL GUIDELINES:
- Output in Vietnamese (except technical terms, code, URLs)
- Keep original intent and key information
- Be specific and actionable
- Use markdown formatting with emojis
- Add concrete acceptance criteria
- Tone: professional and concise

FLEXIBILITY:
- Adapt "Chi tiết thực hiện" based on issue type
- Skip optional sections if not relevant
- Focus on clarity and completeness
```

**User Prompt Template:**

```
Refine this issue description using the universal standard template.

Issue Type: {issueType}
Title: {issueName}
Priority: {priority}
Current Description:
{currentDescription}

Context:
- Project: {projectName}
- Sprint Goal: {sprintGoal}

Please provide:
1. Refined description following the universal template
2. Adapt "Chi tiết thực hiện" section appropriately for {issueType} type
3. List of improvements made
4. Confidence score (0-1)

---

## 👥 User Stories & Requirements

### User Story 1: Developer muốn cải thiện description nhanh chóng

```gherkin
As a: Developer
I want to: Refine my short issue description using AI
So that: I can save time writing detailed documentation

Given: Tôi đã tạo issue với description ngắn "fix bug login"
When: Tôi click nút "AI Refine" bên cạnh description field
Then: AI sẽ generate description đầy đủ với structure rõ ràng
And: Tôi có thể preview và accept/reject changes
```

### User Story 2: PM muốn ensure quality của issue descriptions

```gherkin
As a: Project Manager
I want to: Issues có description chi tiết và chuẩn format
So that: Team hiểu rõ requirements và test criteria

Given: Team member tạo issue với description sơ sài
When: AI refine được trigger
Then: Description được cấu trúc với acceptance criteria rõ ràng
And: Easier để review và approve tasks
```

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Nút "AI Refine" hiển thị trong issue detail view | P0 |
| FR-02 | Preview modal cho refined description | P0 |
| FR-03 | Accept/Reject refined description | P0 |
| FR-04 | Loading state khi AI đang process | P0 |
| FR-05 | Error handling khi AI service fail | P0 |
| FR-06 | Undo refined description (revert về original) | P1 |
| FR-07 | Show improvements/changes made | P1 |
| FR-08 | Rate limit protection (20 requests/hour per user) | P1 |
| FR-09 | Cache results for 24 hours | P2 |
| FR-10 | Analytics tracking (success rate, usage) | P2 |

### Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Response time | < 3 seconds (95th percentile) |
| **Availability** | Uptime | 99.5% |
| **Scalability** | Concurrent requests | 100 requests/second |
| **Cost** | AI API cost per request | < $0.01 |
| **Quality** | AI accuracy/confidence | > 85% |

---

## 🎨 UI/UX Design

### User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Issue Detail View                         │
│                                                              │
│  Title: Fix login bug                                        │
│                                                              │
│  Description:                                                │
│  ┌────────────────────────────────────────────────┐         │
│  │ khi user login thi no bi loi, can fix        │         │
│  │                                                │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  [✨ AI Refine Description]  [Save]  [Cancel]               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ Click "AI Refine"
┌─────────────────────────────────────────────────────────────┐
│              AI Refine Description Modal                     │
│                                                              │
│  🤖 Refining your description...                            │
│  [████████████░░░░░░] 60%                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ Processing complete
┌─────────────────────────────────────────────────────────────┐
│              AI Refine Description Preview                   │
│                                                              │
│  📊 Improvements:                                            │
│  • Added problem statement                                   │
│  • Included acceptance criteria                              │
│  • Improved grammar and structure                            │
│  • Added reproduction steps                                  │
│                                                              │
│  ─────────────────────────────────────────────────          │
│                                                              │
│  [Original] [Refined]  <-- Tabs                             │
│                                                              │
│  ## Vấn đề                                                   │
│  Hiện tại hệ thống đang gặp lỗi trong quá trình đăng nhập.. │
│                                                              │
│  ## Các bước tái hiện                                        │
│  1. Truy cập trang đăng nhập                                │
│  2. Nhập thông tin hợp lệ                                   │
│  ...                                                         │
│                                                              │
│  [Cancel]  [Apply Changes]                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
IssueDetailPage
├── IssueHeader
├── IssueDescription
│   ├── DescriptionEditor (Markdown)
│   ├── AIRefineButton ⭐
│   └── ActionButtons
└── AIRefineModal ⭐
    ├── LoadingState
    ├── PreviewTabs
    │   ├── OriginalTab
    │   └── RefinedTab
    ├── ImprovementsList
    └── ActionButtons
        ├── CancelButton
        └── ApplyButton
```

### Wireframes

#### 1. Issue Detail View - Default State

```
┌─────────────────────────────────────────────────┐
│ PROJ-123: Fix login bug                         │
├─────────────────────────────────────────────────┤
│                                                  │
│ Priority: High      Type: Bug    Status: Todo   │
│                                                  │
│ Description:                                     │
│ ┌───────────────────────────────────────────┐   │
│ │ khi user login thi no bi loi, can fix    │   │
│ │                                           │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ [✨ AI Refine]  [Edit]  [Save]                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### 2. AI Refining - Loading State

```
┌─────────────────────────────────────────────────┐
│         AI Refining Description                  │
├─────────────────────────────────────────────────┤
│                                                  │
│         🤖 Analyzing your description...        │
│                                                  │
│    [████████████████░░░░░░░░] 75%              │
│                                                  │
│              Please wait...                      │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### 3. Preview Modal - Split View

```
┌────────────────────────────────────────────────────────┐
│ AI Refined Description Preview                  [X]    │
├────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 Improvements Made:                                  │
│ ✓ Added structured problem statement                   │
│ ✓ Included reproduction steps                          │
│ ✓ Added acceptance criteria                            │
│ ✓ Improved grammar and formatting                      │
│                                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│ [Original] [Refined] ← Tabs                            │
│                                                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ## Vấn đề                                          │ │
│ │                                                    │ │
│ │ Hiện tại hệ thống đang gặp lỗi trong quá trình    │ │
│ │ đăng nhập của người dùng...                       │ │
│ │                                                    │ │
│ │ ## Các bước tái hiện                              │ │
│ │                                                    │ │
│ │ 1. Truy cập trang đăng nhập                       │ │
│ │ 2. Nhập thông tin hợp lệ                          │ │
│ │ 3. Click "Đăng nhập"                              │ │
│ │ 4. Hệ thống báo lỗi                               │ │
│ │                                                    │ │
│ │ ## Acceptance Criteria                            │ │
│ │                                                    │ │
│ │ - [ ] User có thể login thành công               │ │
│ │ - [ ] Hiển thị error message rõ ràng             │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│               [Cancel]  [Apply Changes]                 │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Interaction States

| State | Visual Indicator | User Action Available |
|-------|-----------------|----------------------|
| **Idle** | Button enabled | Click to trigger AI |
| **Loading** | Spinner + progress bar | None (disabled) |
| **Success** | Preview modal shown | Accept/Reject |
| **Error** | Error toast message | Retry/Cancel |
| **Applied** | Success toast + updated description | Undo (5 seconds) |

---

## 🏗️ Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Issue Detail Page                                │  │
│  │  - AIRefineButton component                       │  │
│  │  - AIRefineModal component                        │  │
│  │  - useAIRefine() hook                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP POST
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (NestJS) - PM Service               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AI Controller                                    │  │
│  │  - POST /api/ai/refine-description               │  │
│  │  - Validation & Rate Limiting                     │  │
│  └──────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AI Service                                       │  │
│  │  - OpenAI API integration                         │  │
│  │  - Prompt engineering                             │  │
│  │  - Response parsing                               │  │
│  └──────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cache Service (Redis)                           │  │
│  │  - Cache refined descriptions (24h TTL)          │  │
│  │  - Rate limit tracking                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ API Call
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  External AI Service                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OpenAI API (GPT-4o-mini)                        │  │
│  │  - Model: gpt-4o-mini                            │  │
│  │  - Max tokens: 2000                               │  │
│  │  - Temperature: 0.7                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture - Frontend

```typescript
// File structure
apps/pm-web/src/
├── core/
│   ├── components/
│   │   └── ai/
│   │       ├── ai-refine-button.tsx
│   │       ├── ai-refine-modal.tsx
│   │       └── improvements-list.tsx
│   ├── hooks/
│   │   └── use-ai-refine.ts
│   └── services/
│       └── ai.service.ts
```

**AIRefineButton Component:**
```typescript
interface AIRefineButtonProps {
  issueId: string;
  currentDescription: string;
  issueName: string;
  issueType: IssueType;
  priority: Priority;
  onSuccess?: (refinedDescription: string) => void;
}

export const AIRefineButton: React.FC<AIRefineButtonProps> = ({
  issueId,
  currentDescription,
  issueName,
  issueType,
  priority,
  onSuccess,
}) => {
  const { refine, isRefining, error } = useAIRefine();
  const [showModal, setShowModal] = useState(false);
  const [refinedData, setRefinedData] = useState(null);

  const handleRefine = async () => {
    const result = await refine({
      issueId,
      currentDescription,
      issueName,
      issueType,
      priority,
    });

    if (result.success) {
      setRefinedData(result.data);
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleRefine}
        disabled={isRefining || !currentDescription}
        variant="secondary"
        icon={<Sparkles />}
      >
        {isRefining ? 'Refining...' : 'AI Refine'}
      </Button>

      {showModal && (
        <AIRefineModal
          original={currentDescription}
          refined={refinedData}
          onApply={(refined) => {
            onSuccess?.(refined);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
};
```

**useAIRefine Hook:**
```typescript
interface UseAIRefineReturn {
  refine: (input: RefineInput) => Promise<RefineResult>;
  isRefining: boolean;
  error: Error | null;
  reset: () => void;
}

export const useAIRefine = (): UseAIRefineReturn => {
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refine = async (input: RefineInput): Promise<RefineResult> => {
    setIsRefining(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/refine-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsRefining(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { refine, isRefining, error, reset };
};
```

### Backend Architecture

```typescript
// File structure
services/pm/src/
├── modules/
│   └── ai/
│       ├── ai.controller.ts
│       ├── ai.service.ts
│       ├── ai.module.ts
│       ├── dto/
│       │   ├── refine-description.dto.ts
│       │   └── refine-description-response.dto.ts
│       └── prompts/
│           ├── bug-refine.prompt.ts
│           ├── task-refine.prompt.ts
│           └── story-refine.prompt.ts
```

**AI Controller:**
```typescript
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Post('refine-description')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 20, duration: 3600 }) // 20 requests per hour
  async refineDescription(
    @Body() dto: RefineDescriptionDto,
    @CurrentUser() user: User,
  ): Promise<RefineDescriptionResponseDto> {
    // Check rate limit
    const canProceed = await this.rateLimitService.consume(
      `ai-refine:${user.id}`,
      1,
    );

    if (!canProceed) {
      throw new TooManyRequestsException(
        'Rate limit exceeded. Please try again later.',
      );
    }

    // Check cache
    const cacheKey = `ai-refine:${dto.issueId}:${hashString(dto.currentDescription)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Call AI service
    const result = await this.aiService.refineDescription(dto);

    // Cache result for 24 hours
    await this.cacheService.set(cacheKey, result, 86400);

    // Track analytics
    await this.analyticsService.track('ai_refine_description', {
      userId: user.id,
      issueId: dto.issueId,
      issueType: dto.issueType,
      success: result.success,
      confidence: result.data?.confidence,
    });

    return result;
  }
}
```

**AI Service:**
```typescript
@Injectable()
export class AIService {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly promptService: PromptService,
  ) {}

  async refineDescription(
    dto: RefineDescriptionDto,
  ): Promise<RefineDescriptionResponseDto> {
    // Select appropriate prompt based on issue type
    const prompt = this.promptService.getRefinePrompt(
      dto.issueType,
      dto.currentDescription,
      dto.issueName,
      dto.priority,
      dto.context,
    );

    try {
      // Call OpenAI API
      const completion = await this.openaiService.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt.system,
          },
          {
            role: 'user',
            content: prompt.user,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      // Parse response
      const refinedText = completion.choices[0].message.content;
      const { markdown, html, improvements } = this.parseAIResponse(refinedText);

      // Calculate confidence score
      const confidence = this.calculateConfidence(
        dto.currentDescription,
        markdown,
        improvements.length,
      );

      return {
        success: true,
        data: {
          refinedDescription: markdown,
          refinedDescriptionHtml: html,
          improvements,
          confidence,
        },
        metadata: {
          model: 'gpt-4o-mini',
          tokensUsed: completion.usage.total_tokens,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error('AI refine failed', error);
      throw new InternalServerErrorException(
        'Failed to refine description. Please try again.',
      );
    }
  }

  private parseAIResponse(text: string) {
    // Extract markdown content
    const markdown = text.trim();

    // Convert to HTML
    const html = marked(markdown);

    // Extract improvements list
    const improvements = this.extractImprovements(text);

    return { markdown, html, improvements };
  }

  private calculateConfidence(
    original: string,
    refined: string,
    improvementCount: number,
  ): number {
    // Simple heuristic for confidence
    const lengthRatio = refined.length / original.length;
    const hasStructure = refined.includes('##');
    const hasCheckboxes = refined.includes('- [ ]');

    let score = 0.5; // Base score

    if (lengthRatio > 2) score += 0.2;
    if (hasStructure) score += 0.15;
    if (hasCheckboxes) score += 0.1;
    if (improvementCount >= 3) score += 0.05;

    return Math.min(score, 1.0);
  }
}
```

**Prompt Templates:**
```typescript
// prompts/bug-refine.prompt.ts
export const BUG_REFINE_SYSTEM_PROMPT = `
You are an expert technical writer specializing in software bug reports.
Your task is to refine and improve bug descriptions to make them clear,
actionable, and well-structured.

Guidelines:
- Use markdown formatting with clear sections
- Include: Problem Statement, Steps to Reproduce, Expected vs Actual Behavior, Acceptance Criteria
- Be specific and technical
- Maintain original intent and key information
- Use Vietnamese language
- Keep tone professional and concise
`;

export const BUG_REFINE_USER_PROMPT = (
  originalDescription: string,
  issueName: string,
  priority: string,
) => `
Refine this bug report:

Title: ${issueName}
Priority: ${priority}
Current Description:
${originalDescription}

Please provide a well-structured bug report with:
1. Problem statement
2. Steps to reproduce
3. Expected vs Actual behavior
4. Acceptance criteria
`;
```

---

## 📝 Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Backend Setup
- [ ] Create AI module in NestJS
- [ ] Setup OpenAI API integration
- [ ] Implement prompt templates
- [ ] Add DTOs and validation

**Files to create:**
```
services/pm/src/modules/ai/
├── ai.module.ts
├── ai.controller.ts
├── ai.service.ts
├── openai.service.ts
└── dto/
    ├── refine-description.dto.ts
    └── refine-description-response.dto.ts
```

**Code example - AI Module:**
```typescript
@Module({
  imports: [
    ConfigModule,
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 86400, // 24 hours
    }),
  ],
  controllers: [AIController],
  providers: [AIService, OpenAIService, PromptService],
  exports: [AIService],
})
export class AIModule {}
```

#### 1.2 API Endpoint
- [ ] POST /api/ai/refine-description
- [ ] Request/Response validation
- [ ] Error handling
- [ ] Rate limiting

**Testing:**
```bash
curl -X POST http://localhost:3000/api/ai/refine-description \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "issueId": "uuid",
    "currentDescription": "fix bug login",
    "issueName": "Login Error",
    "issueType": "BUG",
    "priority": "HIGH"
  }'
```

### Phase 2: Frontend Components (Week 2)

#### 2.1 Core Components
- [ ] AIRefineButton component
- [ ] AIRefineModal component
- [ ] ImprovementsList component
- [ ] Loading states

**Files to create:**
```
apps/pm-web/src/core/components/ai/
├── ai-refine-button.tsx
├── ai-refine-modal.tsx
├── improvements-list.tsx
└── loading-state.tsx
```

#### 2.2 Hooks & Services
- [ ] useAIRefine() hook
- [ ] AI service client
- [ ] Error handling

**Code example - useAIRefine hook:**
```typescript
export const useAIRefine = () => {
  const [state, setState] = useState({
    isRefining: false,
    error: null,
    result: null,
  });

  const refine = async (input: RefineInput) => {
    setState({ ...state, isRefining: true, error: null });

    try {
      const result = await aiService.refineDescription(input);
      setState({ isRefining: false, error: null, result });
      return result;
    } catch (error) {
      setState({ isRefining: false, error, result: null });
      throw error;
    }
  };

  return { ...state, refine };
};
```

### Phase 3: Integration (Week 3)

#### 3.1 Issue Detail Integration
- [ ] Add AI Refine button to issue description section
- [ ] Wire up modal flow
- [ ] Handle apply/cancel actions
- [ ] Update issue description on apply

**Integration point:**
```typescript
// In IssueDetailPage component
<DescriptionSection>
  <DescriptionEditor
    value={issue.description}
    onChange={handleDescriptionChange}
  />

  <AIRefineButton
    issueId={issue.id}
    currentDescription={issue.description}
    issueName={issue.name}
    issueType={issue.type}
    priority={issue.priority}
    onSuccess={(refined) => {
      updateIssue(issue.id, { description: refined });
    }}
  />
</DescriptionSection>
```

#### 3.2 Caching & Performance
- [ ] Implement Redis caching
- [ ] Add request deduplication
- [ ] Optimize prompt tokens

### Phase 4: Polish & Testing (Week 4)

#### 4.1 UI/UX Polish
- [ ] Loading animations
- [ ] Success/Error toasts
- [ ] Keyboard shortcuts
- [ ] Mobile responsive

#### 4.2 Testing
- [ ] Unit tests for components
- [ ] Integration tests for API
- [ ] E2E tests for user flow
- [ ] Performance testing

#### 4.3 Documentation
- [ ] User guide
- [ ] API documentation
- [ ] Code comments

---

## 🔌 API Specifications

### Endpoint: Refine Description

**Request:**
```http
POST /api/ai/refine-description HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "issueId": "550e8400-e29b-41d4-a716-446655440000",
  "currentDescription": "khi user login thi no bi loi, can fix",
  "issueName": "Fix login bug",
  "issueType": "BUG",
  "priority": "HIGH",
  "context": {
    "projectName": "E-commerce Platform",
    "sprintGoal": "Improve authentication"
  }
}
```

**Response - Success (200):**
```json
{
  "success": true,
  "data": {
    "refinedDescription": "## Vấn đề\n\nHiện tại hệ thống...",
    "refinedDescriptionHtml": "<h2>Vấn đề</h2>...",
    "improvements": [
      "Thêm cấu trúc markdown rõ ràng",
      "Mở rộng mô tả với chi tiết cụ thể",
      "Thêm acceptance criteria",
      "Cải thiện ngữ pháp"
    ],
    "confidence": 0.95
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "tokensUsed": 450,
    "processingTime": 1250
  }
}
```

**Response - Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description is required",
    "details": {
      "field": "currentDescription",
      "constraint": "minLength"
    }
  }
}
```

**Response - Rate Limit (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 minutes.",
    "retryAfter": 1800
  }
}
```

### Rate Limits

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 20 | 100 |
| Pro | 100 | 500 |
| Enterprise | Unlimited | Unlimited |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Issue not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 500 | OpenAI API error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📊 Data Examples

[See AI_FEATURES_DATA_EXAMPLES.md for detailed examples]

---

## 🧪 Testing Strategy

### Unit Tests

**Frontend:**
```typescript
describe('AIRefineButton', () => {
  it('should be disabled when description is empty', () => {
    render(<AIRefineButton currentDescription="" {...props} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state while refining', async () => {
    const { getByText } = render(<AIRefineButton {...props} />);

    fireEvent.click(getByText('AI Refine'));

    await waitFor(() => {
      expect(getByText('Refining...')).toBeInTheDocument();
    });
  });

  it('should open modal on successful refine', async () => {
    mockAIService.refineDescription.mockResolvedValue({
      success: true,
      data: mockRefinedData,
    });

    const { getByText, getByRole } = render(<AIRefineButton {...props} />);

    fireEvent.click(getByText('AI Refine'));

    await waitFor(() => {
      expect(getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

**Backend:**
```typescript
describe('AIService', () => {
  it('should refine bug description correctly', async () => {
    const input = {
      currentDescription: 'fix login bug',
      issueName: 'Login Error',
      issueType: 'BUG',
      priority: 'HIGH',
    };

    const result = await aiService.refineDescription(input);

    expect(result.success).toBe(true);
    expect(result.data.refinedDescription).toContain('## Vấn đề');
    expect(result.data.improvements.length).toBeGreaterThan(0);
    expect(result.data.confidence).toBeGreaterThan(0.7);
  });

  it('should handle OpenAI API errors gracefully', async () => {
    mockOpenAI.createChatCompletion.mockRejectedValue(
      new Error('API Error')
    );

    await expect(
      aiService.refineDescription(input)
    ).rejects.toThrow(InternalServerErrorException);
  });
});
```

### Integration Tests

```typescript
describe('POST /api/ai/refine-description', () => {
  it('should refine description successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/ai/refine-description')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        issueId: 'test-issue-id',
        currentDescription: 'fix bug',
        issueName: 'Bug Fix',
        issueType: 'BUG',
        priority: 'HIGH',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('refinedDescription');
  });

  it('should return 429 when rate limit exceeded', async () => {
    // Make 21 requests (limit is 20)
    for (let i = 0; i < 21; i++) {
      await request(app.getHttpServer())
        .post('/api/ai/refine-description')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validInput);
    }

    const response = await request(app.getHttpServer())
      .post('/api/ai/refine-description')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validInput)
      .expect(429);

    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### E2E Tests

```typescript
describe('AI Refine Description Flow', () => {
  it('should complete full refine flow', async () => {
    // 1. Navigate to issue detail
    await page.goto(`/project/${projectId}/issue/${issueId}`);

    // 2. Click AI Refine button
    await page.click('[data-testid="ai-refine-button"]');

    // 3. Wait for modal to appear
    await page.waitForSelector('[data-testid="ai-refine-modal"]');

    // 4. Verify refined content is displayed
    const refinedText = await page.textContent(
      '[data-testid="refined-description"]'
    );
    expect(refinedText).toContain('## Vấn đề');

    // 5. Click Apply Changes
    await page.click('[data-testid="apply-button"]');

    // 6. Verify description is updated
    await page.waitForSelector('[data-testid="success-toast"]');
    const updatedDescription = await page.textContent(
      '[data-testid="issue-description"]'
    );
    expect(updatedDescription).toContain('## Vấn đề');
  });
});
```

---

## 🔒 Security & Performance

### Security Considerations

1. **Input Sanitization**
   - Validate description length (min: 5, max: 10,000 chars)
   - Strip malicious HTML/JS
   - Sanitize markdown output

2. **Authentication & Authorization**
   - Require JWT authentication
   - Check user has permission to edit issue
   - Validate issue belongs to user's organization

3. **Rate Limiting**
   - Per-user rate limits (20 req/hour)
   - Global rate limits (1000 req/minute)
   - Track in Redis with sliding window

4. **API Key Protection**
   - Store OpenAI API key in environment variables
   - Rotate keys regularly
   - Monitor usage and costs

5. **PII Protection**
   - Don't send user emails/names to AI
   - Remove sensitive data from descriptions
   - Log only anonymized data

### Performance Optimization

1. **Caching Strategy**
   ```typescript
   // Cache key: hash of (issueId + description content)
   const cacheKey = `ai-refine:${issueId}:${hash(description)}`;

   // TTL: 24 hours
   await redis.set(cacheKey, result, 'EX', 86400);
   ```

2. **Request Deduplication**
   - If same description is submitted twice within 1 minute
   - Return cached result immediately
   - Prevents duplicate AI API calls

3. **Token Optimization**
   - Use gpt-4o-mini (cheaper model)
   - Limit max_tokens to 2000
   - Truncate very long descriptions

4. **Async Processing**
   - Consider background jobs for batch refining
   - WebSocket updates for real-time progress
   - Queue system for high load

5. **Monitoring**
   ```typescript
   // Track metrics
   - Average response time
   - AI API success rate
   - Cache hit rate
   - Cost per request
   - User satisfaction (thumbs up/down)
   ```

### Cost Estimation

**OpenAI API Pricing (gpt-4o-mini):**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

**Average Request:**
- Input: ~500 tokens (description + prompt)
- Output: ~1000 tokens (refined description)
- Cost: $0.00075 + $0.0006 = **$0.00135 per request**

**Monthly Cost (1000 users, 5 refines/user/month):**
- Total requests: 5,000
- Total cost: **$6.75/month**

---

## 🚀 Deployment Guide

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

REDIS_HOST=localhost
REDIS_PORT=6379

RATE_LIMIT_POINTS=20
RATE_LIMIT_DURATION=3600
```

### Docker Compose

```yaml
services:
  pm-backend:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_HOST=redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Deployment Steps

1. **Update dependencies:**
   ```bash
   cd services/pm
   npm install openai
   npm install @nestjs/cache-manager cache-manager
   npm install cache-manager-redis-store
   ```

2. **Run migrations:**
   ```bash
   # Optional: Add AI tracking columns
   npx prisma migrate dev --name add_ai_tracking
   ```

3. **Build frontend:**
   ```bash
   cd apps/pm-web
   npm run build
   ```

4. **Deploy backend:**
   ```bash
   docker-compose up -d pm-backend
   ```

5. **Verify deployment:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Monitoring & Alerts

**Datadog/New Relic Metrics:**
- `ai.refine.request.count`
- `ai.refine.request.duration`
- `ai.refine.request.success_rate`
- `ai.refine.cache.hit_rate`
- `ai.refine.cost.total`

**Alerts:**
- Response time > 5 seconds
- Error rate > 5%
- Cost > $50/day
- Rate limit hit > 100 times/hour

---

## 📚 Related Documentation

- [AI_FEATURES_DATA_EXAMPLES.md](../AI_FEATURES_DATA_EXAMPLES.md) - Data examples
- [PM_IMPLEMENTATION_PLAN.md](../PM_IMPLEMENTATION_PLAN.md) - Overall roadmap
- [OpenAI API Docs](https://platform.openai.com/docs) - AI provider docs

---

## ✅ Checklist for Implementation

### Backend
- [ ] Create AI module structure
- [ ] Implement OpenAI integration
- [ ] Add prompt templates
- [ ] Setup caching with Redis
- [ ] Implement rate limiting
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add API documentation

### Frontend
- [ ] Create AIRefineButton component
- [ ] Create AIRefineModal component
- [ ] Implement useAIRefine hook
- [ ] Add loading states
- [ ] Add error handling
- [ ] Integrate with issue detail page
- [ ] Add keyboard shortcuts
- [ ] Write component tests
- [ ] Add E2E tests

### DevOps
- [ ] Setup Redis container
- [ ] Add environment variables
- [ ] Update docker-compose
- [ ] Setup monitoring
- [ ] Configure alerts
- [ ] Document deployment

### QA
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test rate limiting
- [ ] Test caching
- [ ] Performance testing
- [ ] Security audit
- [ ] User acceptance testing

---

**Status**: 📝 Documentation Complete - Ready for Implementation
**Next Steps**: Begin Phase 1 - Backend Setup
