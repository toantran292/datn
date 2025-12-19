# Tính năng: Tạo Tasks từ Meeting

## 1. Tổng quan

User upload video/audio/text của meeting → System tự động phân tích và hiển thị Task Preview List (đã refined, estimated) → User review & edit → Click tạo tất cả tasks cùng lúc.

**Đơn giản cho user, phức tạp ở backend.**

## 2. User Flow (Đơn giản)

```
Bước 1: Upload meeting
  User: Upload video/audio hoặc paste text transcript
  ↓
Bước 2: Xem task preview
  System: Tự động hiển thị list tasks đã phân tích đầy đủ
  - Title
  - Description (đã refined chi tiết)
  - Type (Bug/Task/Story/Feature)
  - Priority (Urgent/High/Medium/Low)
  - Order (#1, #2, #3...)
  - Story Points (đã estimate)
  - Suggested Assignee
  ↓
Bước 3: Review & Edit
  User: Xem lại, chỉnh sửa nếu cần
  - Sửa title, description
  - Đổi type, priority
  - Xóa tasks
  - Thêm tasks mới
  ↓
Bước 4: Tạo tất cả
  User: Click "Tạo tất cả X Tasks"
  System: Tạo toàn bộ tasks cùng lúc
  ↓
Done: Redirect to project board
```

**So sánh với flow cũ:**
- **Flow cũ**: 1 document → 1 task → Manual refine → Manual estimate → Create
- **Flow mới**: 1 meeting → N tasks (AUTO refined + estimated) → Review → Bulk create

## 3. Backend Processing (Phức tạp - User không thấy)

### 3.1. Khi user upload, backend làm TẤT CẢ trong 1 pipeline:

```
Input: Video/Audio/Text
  ↓
[Step 1] Extract Transcript
  - Video/Audio → Whisper API → Transcript
  - Text → Use directly
  ↓
[Step 2] AI Comprehensive Analysis (SINGLE GPT-4 CALL)
  Input: Full transcript

  AI làm TẤT CẢ:
  1. Extract all action items
  2. Write detailed descriptions (refined)
  3. Classify type (Bug/Task/Story/Feature)
  4. Analyze priority (Urgent/High/Medium/Low)
  5. Determine order/dependencies
  6. Estimate story points
  7. Identify assignees

  Output: Complete task list ready to create
  ↓
[Step 3] Return to Frontend
  Frontend nhận danh sách tasks HOÀN CHỈNH
  User chỉ cần review, không cần manual refine/estimate
```

### 3.2. AI Prompt (Làm mọi thứ trong 1 lần)

```typescript
const COMPREHENSIVE_MEETING_ANALYSIS_PROMPT = `
You are an expert project manager and scrum master.

Analyze this meeting transcript and extract ALL action items as COMPLETE, READY-TO-IMPLEMENT tasks.

Meeting Transcript:
{transcript}

For EACH task, provide FULL information (no user intervention needed):

1. **title**: Short, actionable (5-10 words)
   - Format: Verb + Object
   - Example: "Implement user authentication API"

2. **description**: DETAILED, REFINED description ready for developers
   - Include: What, Why, Acceptance Criteria, Technical Details
   - Format: Markdown with bullet points
   - 5-10 sentences minimum
   - Must be specific enough that a developer can start immediately
   - Example:
     ```
     Implement REST API endpoints for user authentication.

     **Why:** Users need to register and login to access the platform.

     **Endpoints to implement:**
     - POST /api/auth/register - User registration
     - POST /api/auth/login - Returns JWT token
     - POST /api/auth/logout - Invalidates token
     - GET /api/auth/me - Get current user info

     **Technical Requirements:**
     - Use JWT for authentication
     - Password hashing with bcrypt (salt rounds: 10)
     - Email validation
     - Rate limiting: 5 requests per minute
     - Error handling with proper status codes

     **Acceptance Criteria:**
     - All endpoints working and tested
     - Unit tests written (coverage ≥ 80%)
     - Integration tests passing
     - API documentation updated
     ```

3. **type**: Classify as:
   - "bug": Fixing errors or defects
   - "task": Regular technical work
   - "story": User-facing features
   - "feature": Large feature development

4. **priority**: Analyze urgency and importance:
   - "urgent": Blocking other work, immediate deadline
   - "high": Critical path, high business value
   - "medium": Normal priority
   - "low": Nice to have, can defer

5. **order**: Sequence number (1, 2, 3...)
   - Analyze dependencies carefully
   - Lower number = must do first
   - Consider technical dependencies and logical workflow

6. **estimatedPoints**: Story points (1, 2, 3, 5, 8, 13)
   - 1: Very simple (< 2 hours)
   - 2: Simple (2-4 hours)
   - 3: Medium (4-8 hours, ~1 day)
   - 5: Complex (1-2 days)
   - 8: Very complex (2-3 days)
   - 13: Extremely complex (3-5 days, consider breaking down)

7. **suggestedAssignee**: Extract person's name if mentioned, else null

8. **dependencies**: Array of task order numbers this depends on

9. **context**: Brief context from meeting (1-2 sentences)

Guidelines:
- Extract EVERY actionable task mentioned
- Write descriptions as if briefing a developer
- Be specific and technical
- Include acceptance criteria for each task
- Analyze dependencies accurately
- Prioritize based on business value + technical dependencies
- If a task is >8 points, still include it but note it may need breakdown

Return JSON array sorted by order (ascending):
[
  {
    "title": "Create database schema for user management",
    "description": "Design and implement PostgreSQL database schema for user management system.\n\n**Why:** Foundation for authentication and user-related features.\n\n**Schema Details:**\n- Table: users\n  - id: UUID PRIMARY KEY\n  - email: VARCHAR(255) UNIQUE NOT NULL\n  - password_hash: VARCHAR(255) NOT NULL\n  - name: VARCHAR(255)\n  - created_at: TIMESTAMP DEFAULT NOW()\n  - updated_at: TIMESTAMP DEFAULT NOW()\n- Indexes: email, id\n\n**Technical Requirements:**\n- Write Prisma migration\n- Add email uniqueness constraint\n- Add indexes for performance\n- Include timestamps\n\n**Acceptance Criteria:**\n- Migration file created\n- Migration runs successfully on dev DB\n- Schema matches requirements\n- Indexes created",
    "type": "task",
    "priority": "urgent",
    "order": 1,
    "estimatedPoints": 3,
    "suggestedAssignee": "Nguyễn Văn A",
    "dependencies": [],
    "context": "Database schema is blocking task for all user-related features."
  },
  {
    "title": "Implement user authentication API",
    "description": "[Detailed description as shown above...]",
    "type": "feature",
    "priority": "high",
    "order": 2,
    "estimatedPoints": 8,
    "suggestedAssignee": "Nguyễn Văn A",
    "dependencies": [1],
    "context": "Core authentication feature, depends on database schema."
  }
]

CRITICAL: Return ONLY valid JSON array. No explanation, no markdown code blocks, just the JSON.
`;
```

**Key Point:** AI làm TẤT CẢ việc refine + estimate trong 1 lần. User nhận được tasks đã sẵn sàng để tạo.

---

## 4. UI Design

### 4.1. Upload Page

```
+------------------------------------------------------------+
|  📹 Tạo Tasks từ Meeting                                  |
+------------------------------------------------------------+
|                                                            |
|  Chọn input:                                               |
|  ⚪ Upload Video   ⚪ Upload Audio   ⚪ Nhập Text          |
|                                                            |
|  ┌──────────────────────────────────────────────────┐     |
|  │                                                   │     |
|  │        📤 Drag & drop file vào đây               │     |
|  │           hoặc click để chọn                      │     |
|  │                                                   │     |
|  │     Hỗ trợ: MP4, MOV, AVI, MKV, WebM             │     |
|  │              MP3, WAV, M4A                        │     |
|  │     (Max 100MB)                                   │     |
|  │                                                   │     |
|  └──────────────────────────────────────────────────┘     |
|                                                            |
|  hoặc                                                      |
|                                                            |
|  Paste transcript:                                         |
|  ┌──────────────────────────────────────────────────┐     |
|  │ [Nhập hoặc paste meeting transcript...]          │     |
|  │                                                   │     |
|  │                                                   │     |
|  │                                                   │     |
|  └──────────────────────────────────────────────────┘     |
|                                                            |
|                    [Phân tích Meeting]                     |
+------------------------------------------------------------+
```

**Loading State:**
```
+------------------------------------------------------------+
|  ⏳ Đang phân tích meeting...                             |
+------------------------------------------------------------+
|                                                            |
|  ✅ Đã upload file (2.3 MB)                                |
|  🔄 Đang transcribe audio... (30s)                         |
|  ⏳ Đang phân tích và tạo tasks... (15s)                   |
|                                                            |
|  [Progress bar ████████░░░░░░░░ 60%]                       |
+------------------------------------------------------------+
```

---

### 4.2. Task Preview List (Main UI)

```
+------------------------------------------------------------+
|  ✅ Preview: 4 tasks từ meeting (29 story points)          |
|  📄 Transcript: "Trong cuộc họp hôm nay, chúng ta..."      |
|                                           [Xem đầy đủ]     |
+------------------------------------------------------------+
|                                                            |
|  #1  [Task] 🔴 Urgent  📊 3 points       [Edit] [Delete]  |
|  ┌────────────────────────────────────────────────────┐   |
|  │ 📌 Tạo database schema cho user management         │   |
|  │                                                     │   |
|  │ Design and implement PostgreSQL database schema... │   |
|  │                                                     │   |
|  │ **Why:** Foundation for authentication...          │   |
|  │                                                     │   |
|  │ **Schema Details:**                                 │   |
|  │ - Table: users (id, email, password_hash...)       │   |
|  │ - Indexes: email, id                                │   |
|  │                                                     │   |
|  │ **Acceptance Criteria:**                            │   |
|  │ - Migration file created                            │   |
|  │ - Schema matches requirements                       │   |
|  │                                                     │   |
|  │ 👤 Nguyễn Văn A    🔗 Không phụ thuộc              │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  #2  [Feature] 🟠 High  📊 8 points      [Edit] [Delete]  |
|  ┌────────────────────────────────────────────────────┐   |
|  │ 📌 Implement user authentication API               │   |
|  │                                                     │   |
|  │ Implement REST API endpoints for authentication... │   |
|  │                                                     │   |
|  │ **Endpoints to implement:**                         │   |
|  │ - POST /api/auth/register                           │   |
|  │ - POST /api/auth/login (returns JWT)                │   |
|  │ - POST /api/auth/logout                             │   |
|  │                                                     │   |
|  │ **Technical Requirements:**                         │   |
|  │ - Use JWT for authentication                        │   |
|  │ - Password hashing with bcrypt                      │   |
|  │                                                     │   |
|  │ 👤 Nguyễn Văn A    🔗 Phụ thuộc: #1                │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  #3  [Story] 🟡 Medium  📊 5 points      [Edit] [Delete]  |
|  ┌────────────────────────────────────────────────────┐   |
|  │ 📌 Thiết kế UI cho trang login                     │   |
|  │ ...                                                 │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  #4  [Task] 🟡 Medium  📊 5 points       [Edit] [Delete]  |
|  ┌────────────────────────────────────────────────────┐   |
|  │ 📌 Viết unit tests cho authentication flow         │   |
|  │ ...                                                 │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  [+ Thêm task thủ công]                                    |
|                                                            |
+------------------------------------------------------------+
|  📊 Tổng: 4 tasks  •  29 story points                     |
|  🔴 Urgent: 1  🟠 High: 1  🟡 Medium: 2  ⚪ Low: 0        |
|                                                            |
|  [Hủy]                           [Tạo tất cả 4 Tasks]     |
+------------------------------------------------------------+
```

**Features:**
- **Badges**:
  - Type: 🐛 Bug, ✅ Task, 📖 Story, ⭐ Feature
  - Priority: 🔴 Urgent, 🟠 High, 🟡 Medium, ⚪ Low
- **Order**: #1, #2, #3... (có thể drag-drop để reorder)
- **Story Points**: 📊 3 points
- **Assignee**: 👤 Tên người
- **Dependencies**: 🔗 Phụ thuộc #1, #2
- **Actions**: [Edit] [Delete]
- **Expandable**: Click để xem full description
- **Add manual**: Thêm task thủ công nếu AI miss

---

### 4.3. Edit Task Modal

```
+------------------------------------------------------------+
|  ✏️ Chỉnh sửa Task #2                               [✕]  |
+------------------------------------------------------------+
|                                                            |
|  Title:                                                    |
|  [Implement user authentication API_________________]     |
|                                                            |
|  Type:                                                     |
|  ⚪ Bug  ⚪ Task  ⚪ Story  ⚫ Feature                      |
|                                                            |
|  Priority:                                                 |
|  ⚪ Urgent  ⚫ High  ⚪ Medium  ⚪ Low                       |
|                                                            |
|  Story Points:                                             |
|  ⚪ 1  ⚪ 2  ⚪ 3  ⚪ 5  ⚫ 8  ⚪ 13                          |
|                                                            |
|  Description:                                              |
|  ┌──────────────────────────────────────────────────┐     |
|  │ [Markdown editor với preview]                    │     |
|  │                                                   │     |
|  │ Implement REST API endpoints...                  │     |
|  │                                                   │     |
|  └──────────────────────────────────────────────────┘     |
|                                                            |
|  Assignee:                                                 |
|  [Nguyễn Văn A ▼]                                         |
|                                                            |
|  Dependencies (task phải hoàn thành trước):                |
|  ☑ #1 Tạo database schema                                 |
|  ☐ #3 Thiết kế UI login                                    |
|                                                            |
|              [Hủy]              [Lưu thay đổi]            |
+------------------------------------------------------------+
```

---

### 4.4. Bulk Creation Progress

```
+------------------------------------------------------------+
|  ⏳ Đang tạo 4 tasks...                                   |
+------------------------------------------------------------+
|                                                            |
|  ✅ Task #1: Tạo database schema (PROJ-101)                |
|  ✅ Task #2: Implement authentication API (PROJ-102)       |
|  🔄 Task #3: Thiết kế UI login...                          |
|  ⏳ Task #4: Viết unit tests...                            |
|                                                            |
|  [Progress bar ████████████░░░░ 50%]                       |
+------------------------------------------------------------+
```

**Success:**
```
+------------------------------------------------------------+
|  ✅ Đã tạo thành công 4 tasks!                            |
+------------------------------------------------------------+
|                                                            |
|  ✅ PROJ-101: Tạo database schema                          |
|  ✅ PROJ-102: Implement authentication API                 |
|  ✅ PROJ-103: Thiết kế UI login                            |
|  ✅ PROJ-104: Viết unit tests                              |
|                                                            |
|  [Xem tất cả tasks]            [Tạo meeting khác]         |
+------------------------------------------------------------+
```

**Partial Failure:**
```
+------------------------------------------------------------+
|  ⚠️  Đã tạo 3/4 tasks, 1 task thất bại                    |
+------------------------------------------------------------+
|                                                            |
|  ✅ PROJ-101: Tạo database schema                          |
|  ✅ PROJ-102: Implement authentication API                 |
|  ✅ PROJ-103: Thiết kế UI login                            |
|  ❌ Task #4: Viết unit tests                               |
|     Error: Validation failed - Missing project permission |
|                                                            |
|              [Thử lại]              [Bỏ qua]              |
+------------------------------------------------------------+
```

---

## 5. Database Schema

### Table: `meeting_transcripts`
```sql
CREATE TABLE meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  project_id UUID NOT NULL,

  -- Meeting info
  title VARCHAR(255),
  transcript TEXT NOT NULL,
  source_type VARCHAR(20) NOT NULL, -- 'video', 'audio', 'text'
  source_url VARCHAR(500), -- S3 URL if video/audio

  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_meeting_transcripts_project ON meeting_transcripts(project_id);
CREATE INDEX idx_meeting_transcripts_workspace ON meeting_transcripts(workspace_id);
```

### Link in `issues` table
```sql
ALTER TABLE issues ADD COLUMN meeting_transcript_id UUID;
ALTER TABLE issues ADD COLUMN meeting_order INTEGER;
ALTER TABLE issues ADD COLUMN meeting_context TEXT;

ALTER TABLE issues ADD FOREIGN KEY (meeting_transcript_id)
  REFERENCES meeting_transcripts(id) ON DELETE SET NULL;

CREATE INDEX idx_issues_meeting ON issues(meeting_transcript_id);
```

---

## 6. API Endpoints

### 6.1. Analyze Meeting (Single Endpoint)

**Request:**
```
POST /api/meetings/analyze
Content-Type: multipart/form-data OR application/json

Body (multipart - for video/audio):
- file: File
- projectId: string (UUID)
- workspaceId: string (UUID)
- title?: string (optional)

Body (JSON - for text):
{
  "transcript": "string",
  "projectId": "uuid",
  "workspaceId": "uuid",
  "title": "Meeting title" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "meetingId": "uuid",
  "transcript": "Full meeting transcript text...",
  "tasks": [
    {
      "id": "temp-uuid-1",
      "title": "Create database schema for user management",
      "description": "Design and implement PostgreSQL...\n\n**Why:**...",
      "type": "task",
      "priority": "urgent",
      "order": 1,
      "estimatedPoints": 3,
      "suggestedAssignee": "Nguyễn Văn A",
      "dependencies": [],
      "context": "Database schema is blocking task..."
    },
    {
      "id": "temp-uuid-2",
      "title": "Implement user authentication API",
      "description": "...",
      "type": "feature",
      "priority": "high",
      "order": 2,
      "estimatedPoints": 8,
      "suggestedAssignee": "Nguyễn Văn A",
      "dependencies": [1],
      "context": "..."
    }
  ],
  "stats": {
    "totalTasks": 4,
    "totalPoints": 29,
    "byPriority": {
      "urgent": 1,
      "high": 1,
      "medium": 2,
      "low": 0
    },
    "byType": {
      "bug": 0,
      "task": 2,
      "story": 1,
      "feature": 1
    }
  }
}
```

---

### 6.2. Bulk Create Tasks

**Request:**
```
POST /api/meetings/:meetingId/create-tasks

Body:
{
  "projectId": "uuid",
  "tasks": [
    {
      "title": "Create database schema",
      "description": "...",
      "type": "task",
      "priority": "urgent",
      "order": 1,
      "estimatedPoints": 3,
      "assigneeId": "uuid", // Resolved from suggestedAssignee
      "dependencies": []
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 4,
    "succeeded": 4,
    "failed": 0
  },
  "created": [
    {
      "tempId": "temp-uuid-1",
      "issueId": "uuid",
      "issueKey": "PROJ-101",
      "title": "Create database schema"
    },
    ...
  ],
  "failed": []
}
```

**Partial Success Response:**
```json
{
  "success": false,
  "stats": {
    "total": 4,
    "succeeded": 3,
    "failed": 1
  },
  "created": [...],
  "failed": [
    {
      "tempId": "temp-uuid-4",
      "title": "Viết unit tests",
      "error": "Validation failed: Missing project permission",
      "code": "PERMISSION_DENIED"
    }
  ]
}
```

---

## 7. Backend Services

### 7.1. Meeting Analysis Service

```typescript
// services/pm/src/modules/meetings/meeting-analysis.service.ts

@Injectable()
export class MeetingAnalysisService {
  constructor(
    private openaiService: OpenAIService,
    private usersService: UsersService,
  ) {}

  async analyzeTranscript(
    transcript: string,
    projectId: string,
  ): Promise<TaskPreview[]> {
    this.logger.log('Starting comprehensive meeting analysis');

    // Call GPT-4 with comprehensive prompt
    const response = await this.openaiService.chat({
      model: 'gpt-4o', // or gpt-4-turbo
      messages: [
        {
          role: 'system',
          content: COMPREHENSIVE_MEETING_ANALYSIS_PROMPT.replace(
            '{transcript}',
            transcript,
          ),
        },
      ],
      temperature: 0.3, // Low for consistency
      response_format: { type: 'json_object' }, // Ensure JSON
    });

    // Parse response
    let tasks: TaskPreview[];
    try {
      tasks = JSON.parse(response.content);
    } catch (error) {
      this.logger.error('Failed to parse AI response', error);
      throw new BadRequestException('AI returned invalid response');
    }

    // Validate tasks
    tasks = await Promise.all(
      tasks.map((task) => this.validateAndEnrichTask(task, projectId))
    );

    this.logger.log(`Successfully analyzed ${tasks.length} tasks`);
    return tasks;
  }

  private async validateAndEnrichTask(
    task: any,
    projectId: string,
  ): Promise<TaskPreview> {
    // Validate required fields
    if (!task.title || !task.description) {
      throw new BadRequestException('Task missing required fields');
    }

    // Validate enums
    if (!['bug', 'task', 'story', 'feature'].includes(task.type)) {
      task.type = 'task'; // Default
    }

    if (!['urgent', 'high', 'medium', 'low'].includes(task.priority)) {
      task.priority = 'medium'; // Default
    }

    // Validate story points
    const validPoints = [1, 2, 3, 5, 8, 13];
    if (!validPoints.includes(task.estimatedPoints)) {
      task.estimatedPoints = 3; // Default to medium
    }

    // Resolve assignee if mentioned
    if (task.suggestedAssignee) {
      const user = await this.usersService.findByNameInProject(
        task.suggestedAssignee,
        projectId,
      );
      task.assigneeId = user?.id || null;
    }

    return task;
  }
}
```

---

### 7.2. Bulk Task Creation Service

```typescript
// services/pm/src/modules/meetings/bulk-task-creator.service.ts

@Injectable()
export class BulkTaskCreatorService {
  constructor(
    private issuesService: IssuesService,
  ) {}

  async createTasksFromMeeting(
    meetingId: string,
    tasks: TaskPreview[],
    projectId: string,
    userId: string,
  ): Promise<BulkCreateResult> {
    this.logger.log(`Creating ${tasks.length} tasks from meeting ${meetingId}`);

    // Create tasks in parallel
    const results = await Promise.allSettled(
      tasks.map((task, index) =>
        this.createSingleTask(task, projectId, userId, meetingId, index + 1)
      )
    );

    // Process results
    const succeeded: any[] = [];
    const failed: any[] = [];

    results.forEach((result, index) => {
      const task = tasks[index];

      if (result.status === 'fulfilled') {
        succeeded.push({
          tempId: task.id,
          issueId: result.value.id,
          issueKey: result.value.key,
          title: task.title,
        });
      } else {
        failed.push({
          tempId: task.id,
          title: task.title,
          error: result.reason.message,
        });
      }
    });

    this.logger.log(`Created ${succeeded.length}/${tasks.length} tasks`);

    return {
      success: failed.length === 0,
      stats: {
        total: tasks.length,
        succeeded: succeeded.length,
        failed: failed.length,
      },
      created: succeeded,
      failed,
    };
  }

  private async createSingleTask(
    task: TaskPreview,
    projectId: string,
    userId: string,
    meetingId: string,
    order: number,
  ): Promise<Issue> {
    return this.issuesService.create({
      projectId,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      storyPoints: task.estimatedPoints,
      assigneeId: task.assigneeId || null,
      createdBy: userId,
      labels: ['from-meeting'],

      // Link to meeting
      meetingTranscriptId: meetingId,
      meetingOrder: order,
      meetingContext: task.context,
    });
  }
}
```

---

## 8. Frontend Components

```
apps/pm-web/src/app/(all)/(workspaceSlug)/(projects)/
  project/[projectId]/
    meeting-to-tasks/
      page.tsx                          # Main orchestrator
      _components/
        meeting-upload.tsx              # Upload video/audio/text
        loading-analysis.tsx            # Loading state with progress
        tasks-preview-list.tsx          # Main task list view
        task-preview-card.tsx           # Single task card
        task-edit-modal.tsx             # Edit task modal
        bulk-create-button.tsx          # Create all button
        creation-progress.tsx           # Progress during creation
        creation-result.tsx             # Success/failure result
```

---

## 9. Error Handling

### 9.1. Transcription Failures
- **Cause**: Audio quality too low, unsupported language
- **Solution**: Show error, allow manual text input

### 9.2. AI Analysis Failures
- **Cause**: Invalid JSON, API timeout, rate limit
- **Solution**: Retry with exponential backoff, fallback to manual

### 9.3. No Tasks Found
- **Cause**: Meeting has no actionable items
- **Solution**: Show message, allow manual task addition

### 9.4. Bulk Creation Partial Failure
- **Cause**: Validation errors, permission issues
- **Solution**: Show which succeeded/failed, allow retry

---

## 10. Success Metrics

- **Accuracy**: 90% of AI-generated tasks accepted without major edits
- **Time Saved**: 95% faster than manual task creation
- **Adoption**: 60% of teams use weekly
- **Tasks per Meeting**: Average 5-8 tasks

---

## 11. Implementation Checklist

### Phase 1: Core
- [ ] Backend: Meeting upload & transcription
- [ ] Backend: Comprehensive AI analysis (single call)
- [ ] Backend: Bulk task creation
- [ ] Frontend: Upload UI
- [ ] Frontend: Task preview list
- [ ] Frontend: Bulk create
- [ ] Database: Schema updates

### Phase 2: Polish
- [ ] Frontend: Edit tasks
- [ ] Frontend: Drag-drop reorder
- [ ] Frontend: Add manual tasks
- [ ] Frontend: Progress tracking
- [ ] Error handling
- [ ] Loading states
- [ ] Success/failure screens

### Phase 3: Enhancements
- [ ] Dependency visualization
- [ ] Keyboard shortcuts
- [ ] Export task list
- [ ] Save as template
- [ ] E2E tests
