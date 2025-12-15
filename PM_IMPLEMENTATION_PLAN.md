# KẾ HOẠCH TRIỂN KHAI PM MODULE

## TỔNG QUAN

**Dự án**: Project Management Module - DATN
**Ngày tạo**: 2025-12-15
**Cập nhật**: 2025-12-15
**Tình trạng hiện tại**: 71% các use cases đã hoàn thành
**Mục tiêu**: Hoàn thiện 100% use cases trong specifications

**Lưu ý quan trọng**:
- Hệ thống hỗ trợ **flexible workflow**, cho phép nhiều sprint ACTIVE cùng lúc
- Không enforce strict Scrum rules về "1 sprint tại 1 thời điểm"

---

## TÌNH TRẠNG HIỆN TẠI

### ✅ ĐÃ HOÀN THÀNH (20/28 use cases = 71%)

#### Quản lý Dự án (4/4)
- ✅ UC01.1 - Tạo dự án mới
- ✅ UC01.2 - Cấu hình dự án
- ✅ UC01.3 - Xem danh sách và chi tiết dự án
- ✅ UC01.4 - Xóa dự án

#### Quản lý Sprint (2/4)
- ✅ UC02.1 - Tạo sprint mới
- ✅ UC02.4 - Xem danh sách sprint

#### Quản lý Công việc (5/6)
- ✅ UC03.1 - Tạo công việc mới
- ✅ UC03.2 - Cập nhật công việc
- ✅ UC03.3 - Xem chi tiết công việc
- ✅ UC03.4 - Xóa công việc
- ✅ UC03.5 - Thêm bình luận

#### Quản lý Trạng thái (4/4)
- ✅ UC04.1 - Tạo trạng thái mới
- ✅ UC04.2 - Cập nhật trạng thái
- ✅ UC04.3 - Sắp xếp lại trạng thái
- ✅ UC04.4 - Xóa trạng thái (có thiếu logic migration)

#### Board & Views (5/6)
- ✅ UC05.1 - Board View
- ✅ UC05.2 - Backlog View
- ✅ UC05.4 - Drag-and-drop
- ✅ UC05.5 - Calendar View
- ✅ UC05.6 - Timeline View

---

## CÁC TÍNH NĂNG CÒN THIẾU

### 🔴 CRITICAL - Cần làm ngay (2 tasks)

#### 1. UC02.2 - Bắt đầu Sprint (⚠️ Partially Done)
**Độ ưu tiên**: CRITICAL
**Thời gian ước tính**: 1-2 ngày
**Lý do quan trọng**: Metrics quan trọng cho báo cáo và velocity tracking

**Thiếu gì:**
- ❌ Ghi lại metrics khi bắt đầu sprint (snapshot issue count & story points)
- ❌ Warning nếu sprint không có issue

**Lưu ý:** Hệ thống cho phép nhiều sprint ACTIVE cùng lúc (flexible workflow)

**Công việc cần làm:**

**Backend** (`services/pm`):
```typescript
// File: src/modules/sprint/sprint.service.ts

async startSprint(sprintId: string, orgId: string, dto: StartSprintDto) {
  // 1. Kiểm tra sprint có tồn tại không
  const sprint = await this.findOne(sprintId, orgId);
  if (!sprint) throw new NotFoundException();

  // 2. Validate startDate và endDate
  if (!dto.startDate || !dto.endDate) {
    throw new BadRequestException('Cần có ngày bắt đầu và kết thúc');
  }

  if (new Date(dto.endDate) <= new Date(dto.startDate)) {
    throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // 3. Đếm số issues và tổng story points trong sprint
  const issueCount = await this.prisma.issue.count({
    where: { sprintId }
  });

  const storyPointsSum = await this.prisma.issue.aggregate({
    where: { sprintId },
    _sum: { point: true }
  });

  // 4. Cập nhật sprint status và lưu snapshot metrics
  const updatedSprint = await this.prisma.sprint.update({
    where: { id: sprintId },
    data: {
      status: SprintStatus.ACTIVE,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      // Snapshot metrics tại thời điểm bắt đầu
      initialIssueCount: issueCount,
      initialStoryPoints: storyPointsSum._sum.point || 0,
      startedAt: new Date(),
    }
  });

  return updatedSprint;
}
```

**Frontend** (`apps/pm-web`):
```typescript
// File: src/core/components/sprint/start-sprint-modal.tsx

// Cần thêm:
// 1. Warning message nếu sprint.issueCount === 0
// 2. Validation dates ở UI
// 3. Hiển thị overview: số issues và story points

{sprint.issueCount === 0 && (
  <div className="rounded-md bg-yellow-50 p-3">
    <p className="text-sm text-yellow-800">
      ⚠️ Sprint này chưa có công việc nào. Bạn có chắc muốn bắt đầu?
    </p>
  </div>
)}

<div className="mt-4 rounded-md bg-blue-50 p-3">
  <p className="text-sm text-blue-800">
    📊 Sprint sẽ bắt đầu với: <strong>{sprint.issueCount} issues</strong>
    {sprint.totalStoryPoints && ` (${sprint.totalStoryPoints} story points)`}
  </p>
</div>
```

**Database Migration**:
```sql
-- Add columns to Sprint table if not exists
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "initialIssueCount" INTEGER DEFAULT 0;
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP;
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
```

**Test Cases**:
- ✅ Yêu cầu startDate và endDate
- ✅ endDate phải sau startDate
- ✅ Ghi lại initialIssueCount và initialStoryPoints
- ✅ Warning hiển thị khi sprint rỗng
- ✅ Cho phép nhiều sprint ACTIVE cùng lúc (flexible workflow)

---

#### 2. UC02.3 - Hoàn thành Sprint (⚠️ Partially Done)
**Độ ưu tiên**: CRITICAL
**Thời gian ước tính**: 3-5 ngày
**Lý do quan trọng**: Metrics quan trọng cho báo cáo, sprint velocity

**Thiếu gì:**
- ❌ Logic xử lý incomplete issues (move to backlog / next sprint)
- ❌ Tính toán và lưu velocity (story points completed)
- ❌ Ghi lại metrics: completedIssueCount, incompletedIssueCount
- ❌ AI Sprint Summary (UC06.1) - optional nhưng trong specs

**Công việc cần làm:**

**Backend**:
```typescript
// File: src/modules/sprint/sprint.service.ts

async completeSprint(
  sprintId: string,
  orgId: string,
  dto: CompleteSprintDto
) {
  const sprint = await this.findOne(sprintId, orgId);

  // 1. Đếm issues
  const totalIssues = await this.prisma.issue.count({
    where: { sprintId }
  });

  const completedIssues = await this.prisma.issue.count({
    where: {
      sprintId,
      status: { name: 'DONE' } // Hoặc dựa vào isDone flag
    }
  });

  const incompletedIssues = totalIssues - completedIssues;

  // 2. Tính velocity (story points)
  const completedPoints = await this.prisma.issue.aggregate({
    where: {
      sprintId,
      status: { name: 'DONE' }
    },
    _sum: { point: true }
  });

  const velocity = completedPoints._sum.point || 0;

  // 3. Xử lý incomplete issues theo dto.incompleteAction
  if (dto.incompleteAction === 'MOVE_TO_BACKLOG') {
    await this.prisma.issue.updateMany({
      where: {
        sprintId,
        status: { NOT: { name: 'DONE' } }
      },
      data: { sprintId: null }
    });
  } else if (dto.incompleteAction === 'MOVE_TO_NEXT_SPRINT') {
    // Tìm FUTURE sprint đầu tiên
    const nextSprint = await this.prisma.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        status: SprintStatus.FUTURE
      },
      orderBy: { createdAt: 'asc' }
    });

    if (nextSprint) {
      await this.prisma.issue.updateMany({
        where: {
          sprintId,
          status: { NOT: { name: 'DONE' } }
        },
        data: { sprintId: nextSprint.id }
      });
    }
  }
  // 'KEEP' = không làm gì, để nguyên trong closed sprint

  // 4. Cập nhật sprint
  const updatedSprint = await this.prisma.sprint.update({
    where: { id: sprintId },
    data: {
      status: SprintStatus.CLOSED,
      completedAt: new Date(),
      completedIssueCount: completedIssues,
      incompletedIssueCount: incompletedIssues,
      velocity: velocity,
    }
  });

  return updatedSprint;
}
```

**DTO**:
```typescript
// File: src/modules/sprint/dto/complete-sprint.dto.ts

export class CompleteSprintDto {
  @IsEnum(['MOVE_TO_BACKLOG', 'MOVE_TO_NEXT_SPRINT', 'KEEP'])
  incompleteAction: 'MOVE_TO_BACKLOG' | 'MOVE_TO_NEXT_SPRINT' | 'KEEP';
}
```

**Frontend**:
```typescript
// File: src/core/components/sprint/complete-sprint-modal.tsx

// Cần thêm:
// 1. Hiển thị tổng quan: total, completed, incomplete
// 2. Radio buttons cho incomplete action:
//    - Move to Backlog
//    - Move to next sprint
//    - Keep in this sprint
// 3. Dropdown chọn sprint (nếu move to next sprint)
// 4. Checkbox "Generate AI Summary" (optional - UC06.1)

<div className="space-y-4">
  <div className="rounded-md bg-blue-50 p-4">
    <h4 className="font-medium">Sprint Overview</h4>
    <div className="mt-2 grid grid-cols-3 gap-4">
      <div>
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-2xl font-bold">{sprint.totalIssues}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Completed</p>
        <p className="text-2xl font-bold text-green-600">{sprint.completedIssues}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Incomplete</p>
        <p className="text-2xl font-bold text-orange-600">{sprint.incompleteIssues}</p>
      </div>
    </div>
  </div>

  {sprint.incompleteIssues > 0 && (
    <div>
      <label className="block text-sm font-medium mb-2">
        Xử lý {sprint.incompleteIssues} công việc chưa hoàn thành:
      </label>
      <RadioGroup value={action} onChange={setAction}>
        <Radio value="MOVE_TO_BACKLOG">
          Chuyển về Backlog
        </Radio>
        <Radio value="MOVE_TO_NEXT_SPRINT">
          Chuyển sang Sprint tiếp theo
        </Radio>
        <Radio value="KEEP">
          Giữ nguyên trong Sprint này
        </Radio>
      </RadioGroup>
    </div>
  )}
</div>
```

**Database Migration**:
```sql
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "completedIssueCount" INTEGER DEFAULT 0;
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "incompletedIssueCount" INTEGER DEFAULT 0;
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "velocity" INTEGER DEFAULT 0;
ALTER TABLE "Sprint" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
```

---

#### 3. UC04.4 - Xóa Trạng thái với Issue Migration (⚠️ Partially Done)
**Độ ưu tiên**: HIGH
**Thời gian ước tính**: 1-2 ngày
**Lý do quan trọng**: Tránh mất data, business logic quan trọng

**Thiếu gì:**
- ❌ Logic migrate issues sang target status
- ❌ Validation không cho xóa status cuối cùng
- ❌ UI chọn target status

**Công việc cần làm:**

**Backend**:
```typescript
// File: src/modules/issue-status/issue-status.service.ts

async remove(statusId: string, orgId: string, targetStatusId?: string) {
  const status = await this.findOne(statusId, orgId);

  // 1. Kiểm tra không phải status cuối cùng
  const statusCount = await this.prisma.issueStatus.count({
    where: { projectId: status.projectId }
  });

  if (statusCount <= 1) {
    throw new BadRequestException('Không thể xóa trạng thái cuối cùng của dự án');
  }

  // 2. Đếm issues có status này
  const issueCount = await this.prisma.issue.count({
    where: { statusId }
  });

  if (issueCount > 0) {
    // 3. Yêu cầu targetStatusId
    if (!targetStatusId) {
      throw new BadRequestException(
        `Có ${issueCount} công việc đang ở trạng thái này. ` +
        `Vui lòng chọn trạng thái đích để chuyển các công việc.`
      );
    }

    // 4. Validate targetStatusId
    const targetStatus = await this.prisma.issueStatus.findFirst({
      where: {
        id: targetStatusId,
        projectId: status.projectId
      }
    });

    if (!targetStatus) {
      throw new BadRequestException('Trạng thái đích không hợp lệ');
    }

    // 5. Migrate issues
    await this.prisma.issue.updateMany({
      where: { statusId },
      data: { statusId: targetStatusId }
    });
  }

  // 6. Xóa status
  await this.prisma.issueStatus.delete({
    where: { id: statusId }
  });

  return { success: true, migratedCount: issueCount };
}
```

**Frontend**:
```typescript
// File: src/core/components/issue-status/delete-status-modal.tsx

const [targetStatusId, setTargetStatusId] = useState<string>('');
const otherStatuses = statuses.filter(s => s.id !== status.id);

// Trong modal:
{status.issueCount > 0 && (
  <div className="space-y-3">
    <Alert variant="warning">
      Có {status.issueCount} công việc đang ở trạng thái "{status.name}".
      Các công việc này sẽ được chuyển sang trạng thái bạn chọn.
    </Alert>

    <Select
      label="Chuyển sang trạng thái"
      value={targetStatusId}
      onChange={setTargetStatusId}
      required
    >
      {otherStatuses.map(s => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  </div>
)}
```

---

### 🟡 HIGH PRIORITY - Tính năng nâng cao (2 tasks)

#### 4. UC05.3 - Filter và Search Issues (⚠️ Partially Done)
**Độ ưu tiên**: HIGH
**Thời gian ước tính**: 3-4 ngày

**Thiếu gì:**
- ❌ Comprehensive filter UI (assignee, priority, type, status)
- ❌ Save filter presets
- ❌ Clear all filters

**Công việc cần làm:**

**Frontend**:
```typescript
// File: src/core/components/filters/issue-filter-bar.tsx

interface IssueFilters {
  search: string;
  assignees: string[];
  priorities: IssuePriority[];
  types: IssueType[];
  statuses: string[];
}

const IssueFilterBar = () => {
  const [filters, setFilters] = useState<IssueFilters>({
    search: '',
    assignees: [],
    priorities: [],
    types: [],
    statuses: []
  });

  const activeFilterCount = useMemo(() => {
    return (
      (filters.search ? 1 : 0) +
      filters.assignees.length +
      filters.priorities.length +
      filters.types.length +
      filters.statuses.length
    );
  }, [filters]);

  return (
    <div className="flex items-center gap-2">
      <SearchInput
        value={filters.search}
        onChange={(v) => setFilters(f => ({ ...f, search: v }))}
        placeholder="Tìm kiếm theo tên hoặc ID..."
      />

      <FilterDropdown
        label="Assignee"
        options={members}
        selected={filters.assignees}
        onChange={(v) => setFilters(f => ({ ...f, assignees: v }))}
      />

      <FilterDropdown
        label="Priority"
        options={PRIORITIES}
        selected={filters.priorities}
        onChange={(v) => setFilters(f => ({ ...f, priorities: v }))}
      />

      <FilterDropdown
        label="Type"
        options={ISSUE_TYPES}
        selected={filters.types}
        onChange={(v) => setFilters(f => ({ ...f, types: v }))}
      />

      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
          Clear all ({activeFilterCount})
        </Button>
      )}
    </div>
  );
};
```

**Optional - Filter Presets**:
```typescript
// LocalStorage hoặc backend API để lưu filter presets
const [presets, setPresets] = useState<FilterPreset[]>([]);

const savePreset = (name: string) => {
  const preset = { name, filters };
  localStorage.setItem(`filter_preset_${name}`, JSON.stringify(preset));
};

const loadPreset = (name: string) => {
  const preset = localStorage.getItem(`filter_preset_${name}`);
  if (preset) setFilters(JSON.parse(preset).filters);
};
```

---

#### 5. Sprint Velocity Analytics
**Độ ưu tiên**: HIGH
**Thời gian ước tính**: 2-3 ngày

**Thiếu gì:**
- ❌ Backend API để lấy sprint velocity history
- ❌ Frontend chart component hiển thị velocity

**Công việc cần làm:**

**Backend**:
```typescript
// File: src/modules/analytics/analytics.controller.ts

@Get('projects/:projectId/analytics/sprint-velocity')
async getSprintVelocity(@Param('projectId') projectId: string) {
  const sprints = await this.prisma.sprint.findMany({
    where: {
      projectId,
      status: SprintStatus.CLOSED
    },
    orderBy: { completedAt: 'asc' },
    select: {
      id: true,
      name: true,
      velocity: true,
      completedAt: true
    }
  });

  return {
    sprints: sprints.map(s => ({
      name: s.name,
      velocity: s.velocity,
      date: s.completedAt
    }))
  };
}
```

**Frontend**:
```typescript
// File: src/core/components/analytics/sprint-velocity-chart.tsx

import { BarChart } from '@uts/design-system/charts';

const SprintVelocityChart = ({ projectId }) => {
  const { data } = useSWR(
    `/api/projects/${projectId}/analytics/sprint-velocity`,
    fetcher
  );

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Sprint Velocity</h3>
      <BarChart
        data={data.sprints}
        xKey="name"
        yKey="velocity"
        height={300}
        color="#3b82f6"
      />
    </div>
  );
};
```

---

### 🟢 MEDIUM PRIORITY - AI Features (4 tasks)

#### 6. UC06.4 - LLM API Integration Module
**Độ ưu tiên**: MEDIUM (nền tảng cho các AI features)
**Thời gian ước tính**: 5-7 ngày

**Công việc cần làm:**

**Backend - Tạo AI Module mới**:
```bash
cd services/pm
nest g module ai
nest g service ai
nest g controller ai
```

```typescript
// File: src/modules/ai/ai.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY')
    });

    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY')
    });
  }

  async generateCompletion(
    prompt: string,
    options: {
      provider?: 'anthropic' | 'openai';
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ) {
    const {
      provider = 'anthropic',
      model = provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
      maxTokens = 4096,
      temperature = 0.7
    } = options;

    try {
      if (provider === 'anthropic') {
        const response = await this.anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }]
        });

        return {
          content: response.content[0].text,
          tokens: response.usage.input_tokens + response.usage.output_tokens,
          provider,
          model
        };
      } else {
        const response = await this.openai.chat.completions.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }]
        });

        return {
          content: response.choices[0].message.content,
          tokens: response.usage.total_tokens,
          provider,
          model
        };
      }
    } catch (error) {
      throw new Error(`AI API Error: ${error.message}`);
    }
  }
}
```

**Environment Variables**:
```env
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
```

---

#### 7. UC06.1 - AI Sprint Summary
**Độ ưu tiên**: MEDIUM
**Thời gian ước tính**: 3-4 ngày
**Phụ thuộc**: UC06.4

**Công việc cần làm:**

**Backend**:
```typescript
// File: src/modules/sprint/sprint.service.ts

async generateAiSummary(sprintId: string, orgId: string) {
  const sprint = await this.prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      issues: {
        include: {
          status: true,
          comments: true,
          activities: true
        }
      }
    }
  });

  const completedIssues = sprint.issues.filter(i => i.status.name === 'DONE');
  const incompletedIssues = sprint.issues.filter(i => i.status.name !== 'DONE');

  const prompt = `
You are a project management assistant. Generate a comprehensive sprint retrospective summary.

**Sprint Information:**
- Name: ${sprint.name}
- Goal: ${sprint.goal}
- Duration: ${sprint.startDate} to ${sprint.endDate}
- Total Issues: ${sprint.issues.length}
- Completed: ${completedIssues.length}
- Incomplete: ${incompletedIssues.length}
- Velocity: ${sprint.velocity} points

**Completed Issues:**
${completedIssues.map(i => `- [${i.identifier}] ${i.name} (${i.point} pts)`).join('\n')}

**Incomplete Issues:**
${incompletedIssues.map(i => `- [${i.identifier}] ${i.name} (${i.point} pts)`).join('\n')}

Generate a summary with the following sections:
1. **Overview**: Brief summary of sprint achievement
2. **Completed Work**: Highlight key accomplishments
3. **Challenges**: Issues that weren't completed and why
4. **Velocity Analysis**: Performance vs previous sprints
5. **Recommendations**: Suggestions for next sprint

Format in Markdown.
`;

  const aiResponse = await this.aiService.generateCompletion(prompt, {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 2048
  });

  // Lưu summary vào database
  await this.prisma.sprint.update({
    where: { id: sprintId },
    data: { aiSummary: aiResponse.content }
  });

  return aiResponse.content;
}
```

**Frontend - Thêm vào Complete Sprint Modal**:
```typescript
// File: src/core/components/sprint/complete-sprint-modal.tsx

<Checkbox
  label="Tạo AI Sprint Summary"
  checked={generateAiSummary}
  onChange={setGenerateAiSummary}
/>

// Khi complete:
if (generateAiSummary) {
  await fetch(`/api/sprints/${sprint.id}/ai-summary`, { method: 'POST' });
}
```

**Sprint Detail Page - Hiển thị Summary**:
```typescript
// File: src/core/components/sprint/sprint-detail-view.tsx

{sprint.aiSummary && (
  <div className="mt-6 rounded-lg border p-6">
    <h3 className="text-lg font-semibold mb-4">AI Sprint Summary</h3>
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: marked(sprint.aiSummary) }}
    />
  </div>
)}
```

---

#### 8. UC06.2 - AI Refine Issue Description
**Độ ưu tiên**: MEDIUM
**Thời gian ước tính**: 3-4 ngày
**Phụ thuộc**: UC06.4

**Công việc cần làm:**

**Backend**:
```typescript
// File: src/modules/ai/ai.controller.ts

@Post('refine-description')
async refineDescription(@Body() dto: RefineDescriptionDto) {
  const prompt = `
You are a technical product manager. Refine the following issue description to be more clear and structured.

**Current Description:**
${dto.currentDescription}

**Issue Type:** ${dto.issueType}
**Project Context:** ${dto.projectContext || 'N/A'}

Improve the description following this template:

## User Story (if applicable)
As a [user type], I want [goal] so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
- Technical considerations
- Dependencies
- Out of scope

Keep it concise and clear. Use bullet points.
`;

  const response = await this.aiService.generateCompletion(prompt, {
    maxTokens: 1500
  });

  return { refinedDescription: response.content };
}
```

**Frontend**:
```typescript
// File: src/core/components/issue/issue-description.tsx

const [isRefining, setIsRefining] = useState(false);
const [refinedContent, setRefinedContent] = useState<string | null>(null);

const handleRefineWithAi = async () => {
  setIsRefining(true);
  try {
    const res = await fetch('/api/ai/refine-description', {
      method: 'POST',
      body: JSON.stringify({
        currentDescription: value,
        issueType: issue.type,
        projectContext: project.name
      })
    });
    const data = await res.json();
    setRefinedContent(data.refinedDescription);
  } finally {
    setIsRefining(false);
  }
};

// UI:
<div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={handleRefineWithAi}
    disabled={isRefining}
  >
    {isRefining ? 'Đang xử lý...' : '✨ Refine with AI'}
  </Button>
</div>

{refinedContent && (
  <div className="mt-4 rounded-lg border-2 border-blue-500 p-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold">AI Refined Description</h4>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSubmit(refinedContent)}>
          Accept
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRefinedContent(null)}>
          Reject
        </Button>
      </div>
    </div>
    <div className="prose prose-sm">
      <ReactMarkdown>{refinedContent}</ReactMarkdown>
    </div>
  </div>
)}
```

---

#### 9. UC03.6 - AI Auto-Generate Issues
**Độ ưu tiên**: MEDIUM
**Thời gian ước tính**: 4-5 ngày
**Phụ thuộc**: UC06.4

**Công việc cần làm:**

**Backend**:
```typescript
// File: src/modules/ai/ai.controller.ts

@Post('generate-issues')
async generateIssues(@Body() dto: GenerateIssuesDto) {
  const prompt = `
You are a technical product manager. Break down the following feature description into specific, actionable issues.

**Feature Description:**
${dto.description}

**Project Type:** ${dto.projectType || 'General'}

Generate 3-8 issues following this JSON format:
[
  {
    "name": "Issue title (concise, action-oriented)",
    "description": "Detailed description with acceptance criteria",
    "type": "STORY | TASK | BUG",
    "priority": "LOW | MEDIUM | HIGH | CRITICAL",
    "estimatedPoints": 1-8
  }
]

Rules:
- Break down into small, manageable tasks
- Include frontend, backend, and testing tasks if needed
- Set realistic story points (1=trivial, 3=small, 5=medium, 8=large)
- Prioritize based on dependencies and importance

Return ONLY valid JSON, no additional text.
`;

  const response = await this.aiService.generateCompletion(prompt, {
    maxTokens: 2500,
    temperature: 0.8
  });

  // Parse JSON
  const issues = JSON.parse(response.content);

  return { issues, tokensUsed: response.tokens };
}
```

**Frontend - Create Issues from Description Modal**:
```typescript
// File: src/core/components/issue/generate-issues-modal.tsx

const GenerateIssuesModal = ({ projectId, onClose }) => {
  const [description, setDescription] = useState('');
  const [generatedIssues, setGeneratedIssues] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-issues', {
        method: 'POST',
        body: JSON.stringify({ description, projectId })
      });
      const data = await res.json();
      setGeneratedIssues(data.issues);
      // Select all by default
      setSelectedIssues(new Set(data.issues.map((_, i) => i)));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateIssues = async () => {
    const issuesToCreate = generatedIssues.filter((_, i) =>
      selectedIssues.has(i)
    );

    for (const issue of issuesToCreate) {
      await issueStore.createIssue({
        projectId,
        ...issue
      });
    }

    onClose();
  };

  return (
    <Modal open onClose={onClose} size="xl">
      <Modal.Header>Generate Issues with AI</Modal.Header>
      <Modal.Body>
        {generatedIssues.length === 0 ? (
          <div className="space-y-4">
            <Textarea
              label="Feature Description"
              value={description}
              onChange={setDescription}
              rows={8}
              placeholder="Describe the feature you want to implement. Be as detailed as possible..."
              minLength={50}
            />
            <Button
              onClick={handleGenerate}
              disabled={description.length < 50 || isGenerating}
              fullWidth
            >
              {isGenerating ? 'Generating...' : '✨ Generate Issues with AI'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="info">
              AI generated {generatedIssues.length} issues. Review and uncheck any you don't want to create.
            </Alert>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedIssues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <Checkbox
                    checked={selectedIssues.has(index)}
                    onChange={(checked) => {
                      const newSet = new Set(selectedIssues);
                      if (checked) newSet.add(index);
                      else newSet.delete(index);
                      setSelectedIssues(newSet);
                    }}
                    label={
                      <div className="ml-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={issue.type}>{issue.type}</Badge>
                          <Badge variant={issue.priority}>{issue.priority}</Badge>
                          <span className="font-medium">{issue.name}</span>
                          <span className="text-sm text-gray-500">({issue.estimatedPoints} pts)</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{issue.description}</p>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {generatedIssues.length > 0 && (
          <>
            <Button variant="ghost" onClick={() => setGeneratedIssues([])}>
              Regenerate
            </Button>
            <Button onClick={handleCreateIssues}>
              Create {selectedIssues.size} Issues
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};
```

---

## TỔNG KẾT ROADMAP

### Sprint 1 (Week 1-2): CRITICAL Fixes
- ✅ UC02.2 - Start Sprint với snapshot metrics (1-2 ngày)
- ✅ UC02.3 - Complete Sprint với velocity calculation (3-5 ngày)
- ✅ UC04.4 - Delete Status với migration (1-2 ngày)

**Deliverable**: Core sprint workflow hoàn chỉnh với metrics tracking đầy đủ

---

### Sprint 2 (Week 3-4): Analytics & Filters
- ✅ UC05.3 - Comprehensive filters (3-4 ngày)
- ✅ Sprint Velocity Chart (2-3 ngày)

**Deliverable**: Better user experience với filters, analytics dashboard đầy đủ

---

### Sprint 3 (Week 5-6): AI Foundation
- ✅ UC06.4 - LLM API Integration Module (5-7 ngày)
- ✅ Basic testing & documentation (2 ngày)

**Deliverable**: AI module sẵn sàng cho các features tiếp theo

---

### Sprint 4 (Week 7-9): AI Features
- ✅ UC06.1 - AI Sprint Summary (3-4 ngày)
- ✅ UC06.2 - AI Refine Description (3-4 ngày)
- ✅ UC03.6 - AI Generate Issues (4-5 ngày)

**Deliverable**: Full AI features như trong specifications

---

## CHECKLIST HOÀN THÀNH

### Backend Tasks
- [ ] Start Sprint snapshot metrics recording (issue count + story points)
- [ ] Start Sprint date validation
- [ ] Complete Sprint với incomplete issue handling
- [ ] Complete Sprint velocity calculation
- [ ] Delete Status với issue migration
- [ ] Delete Status validation (prevent last status)
- [ ] Sprint Velocity API endpoint
- [ ] AI Module setup (Anthropic + OpenAI)
- [ ] AI Generate Sprint Summary endpoint
- [ ] AI Refine Description endpoint
- [ ] AI Generate Issues endpoint
- [ ] Database migrations (Sprint metrics columns: initialIssueCount, initialStoryPoints, startedAt, completedAt, velocity)

### Frontend Tasks
- [ ] Start Sprint modal improvements (empty sprint warning, date validation, metrics overview)
- [ ] Complete Sprint modal (incomplete issues handling UI)
- [ ] Delete Status modal (target status selection)
- [ ] Comprehensive filter bar component
- [ ] Filter presets (localStorage)
- [ ] Sprint Velocity chart component
- [ ] AI Sprint Summary display in sprint detail
- [ ] AI Refine Description button & comparison UI
- [ ] AI Generate Issues modal
- [ ] Loading states & error handling cho tất cả AI features

### Testing
- [ ] Unit tests cho sprint validation logic
- [ ] Integration tests cho issue migration
- [ ] E2E tests cho AI features (mock API responses)
- [ ] Performance testing cho filters với large datasets

### Documentation
- [ ] API documentation cho AI endpoints
- [ ] User guide cho AI features
- [ ] Migration guide cho database changes

---

## RESOURCES & DEPENDENCIES

### NPM Packages cần cài
```json
{
  "@anthropic-ai/sdk": "^0.27.0",
  "openai": "^4.0.0",
  "marked": "^11.0.0",
  "react-markdown": "^9.0.0"
}
```

### Environment Variables
```env
# AI Configuration
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
AI_DEFAULT_PROVIDER=anthropic
AI_DEFAULT_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4096
```

### API Rate Limits (Cần lưu ý)
- Anthropic: 50 requests/min (tier 1)
- OpenAI: 60 requests/min (tier 1)
- Cần implement retry với exponential backoff
- Cần queue management nếu users nhiều

---

## RISK MANAGEMENT

### Technical Risks
1. **AI API Costs** - Cần monitor token usage, có thể tốn chi phí cao
   - Mitigation: Rate limiting, token limits per user/org

2. **AI Response Quality** - AI có thể generate nội dung không chính xác
   - Mitigation: User review & edit, disclaimer rõ ràng

3. **Database Migration** - Thêm columns có thể ảnh hưởng production
   - Mitigation: Run migrations off-peak hours, có rollback plan

### Business Risks
1. **User Adoption** - Users có thể không dùng AI features
   - Mitigation: Onboarding tooltips, examples, documentation

2. **Data Privacy** - Sending issue data to LLM providers
   - Mitigation: User consent, data anonymization options

---

## MONITORING & SUCCESS METRICS

### Cần track:
- Sprint start/complete success rate
- Issue migration accuracy (0 data loss)
- AI feature usage rate
- AI token consumption & costs
- User satisfaction score
- Time saved with AI features

### KPIs
- 100% use cases implemented ✅
- 0 critical bugs in production
- < 2s response time cho AI endpoints
- > 80% user satisfaction với AI features
- < $100/month AI API costs (initial estimate)

---

**Last Updated**: 2025-12-15
**Status**: Ready for Implementation
**Estimated Total Time**: 9-10 weeks (có thể song song một số tasks)
