# AI Risk Detector - Cách Thức Hoạt Động

## 📋 Tổng Quan

AI Risk Detector là hệ thống phân tích **on-demand** (theo yêu cầu), không tự động chạy nền. Khi user nhấn nút "Detect Risks", hệ thống sẽ:

1. **Thu thập dữ liệu** từ sprint hiện tại và lịch sử
2. **Áp dụng các rules** để phát hiện rủi ro
3. **Lưu kết quả** vào database (bảng `risk_alert`)
4. **Hiển thị recommendations** để giải quyết

---

## 🎯 Flow Hoạt Động Chi Tiết

### 1. User Interface Flow

```
Backlog View
    ↓
[Select Sprint] (dropdown nếu có nhiều active sprints)
    ↓
[Risk Dashboard - Collapsed] (hiển thị summary: X risks đang hoạt động)
    ↓
[Click để expand]
    ↓
[Nút "Detect Risks"] ← USER CLICK ĐÂY
    ↓
POST /api/risk-detector/sprints/:sprintId/risks/detect
    ↓
Backend phân tích sprint và trả về kết quả
    ↓
[Hiển thị Risk Alerts với Recommendations]
```

### 2. Backend Analysis Process

Khi API `POST /risk-detector/sprints/:sprintId/risks/detect` được gọi:

```typescript
// Step 1: Build Sprint Context
const context = {
  sprint: {
    id, name, status, startDate, endDate,
    initialIssueCount, initialStoryPoints
  },
  issues: [
    { id, name, point, priority, status, assignees, ... }
  ],
  sprintHistory: [
    { velocity, committedPoints, completedPoints, startDate, endDate }
  ],
  teamCapacity: 32 // Optional, từ config hoặc calculate
}

// Step 2: Run All Risk Rules
for (const rule of this.rules) {
  const result = await rule.check(context);
  if (result) {
    // Found a risk!
    // Save to database nếu chưa tồn tại
  }
}
```

---

## 🔍 Risk Detection Rules - Tiêu Chí Phân Tích

### Rule 1: Overcommitment Detection ✅ (IMPLEMENTED)

**Mục đích**: Phát hiện sprint bị overcommit (cam kết quá nhiều công việc)

**Dữ liệu cần**:
- `committedPoints`: Tổng story points của tất cả issues trong sprint
- `sprintHistory`: Lịch sử 3 sprints gần nhất để tính velocity trung bình

**Thuật toán**:
```typescript
// 1. Calculate committed points
committedPoints = SUM(issues.point WHERE sprintId = currentSprint)

// 2. Calculate average velocity from last 3 sprints
avgVelocity = AVG(sprintHistory.velocity LIMIT 3)
// Fallback: Nếu không có history → use teamCapacity

// 3. Calculate overcommitment ratio
ratio = committedPoints / avgVelocity

// 4. Determine severity
if (ratio > 1.3) {
  // Overcommit > 130% → CRITICAL
  return {
    severity: "CRITICAL",
    title: "Sprint Overcommitment Nghiêm Trọng",
    description: "Sprint đang bị overcommit 53%. Team cam kết 49 điểm...",
    recommendations: [
      "Di chuyển 2-3 stories có priority thấp về backlog",
      "Extend sprint duration thêm 1-2 ngày",
      ...
    ]
  }
} else if (ratio > 1.2) {
  // Overcommit > 120% → CRITICAL
} else if (ratio > 1.1) {
  // Overcommit > 110% → MEDIUM
} else {
  return null; // No risk
}
```

**Ví dụ thực tế**:

**Sprint 1**:
- Committed: 49 points
- Avg Velocity: 32 points (từ 3 sprints trước: 30, 32, 34)
- Ratio: 49 / 32 = 1.53 (153%)
- **→ CRITICAL RISK** ⚠️

**Sprint 2**:
- Committed: 23 points
- Avg Velocity: 32 points
- Ratio: 23 / 32 = 0.72 (72%)
- **→ NO RISK** ✅

---

### Rule 2: Blocked Issues Detection (TODO)

**Mục đích**: Phát hiện quá nhiều issues bị blocked

**Dữ liệu cần**:
- Issues có status = "BLOCKED" hoặc label "blocked"
- Tổng số issues trong sprint

**Thuật toán**:
```typescript
blockedIssues = issues.filter(i => i.status === "BLOCKED")
blockedPercentage = (blockedIssues.length / totalIssues) * 100

if (blockedPercentage > 30%) {
  return CRITICAL
} else if (blockedPercentage > 20%) {
  return MEDIUM
}
```

---

### Rule 3: Zero Progress Detection (TODO)

**Mục đích**: Phát hiện sprint không có tiến độ

**Dữ liệu cần**:
- Sprint progress (% completed)
- Days elapsed vs days total

**Thuật toán**:
```typescript
daysElapsed = today - sprint.startDate
daysTotal = sprint.endDate - sprint.startDate
timeProgress = daysElapsed / daysTotal

completedPoints = SUM(issues.point WHERE status = "DONE")
workProgress = completedPoints / committedPoints

// Nếu đã qua 50% thời gian nhưng chỉ complete 10%
if (timeProgress > 0.5 && workProgress < 0.1) {
  return CRITICAL
}
```

---

### Rule 4: Missing Estimates Detection (TODO)

**Mục đích**: Phát hiện quá nhiều issues không có estimate

**Thuật toán**:
```typescript
issuesWithoutEstimate = issues.filter(i => i.point === null)
percentage = (issuesWithoutEstimate.length / totalIssues) * 100

if (percentage > 40%) {
  return MEDIUM
}
```

---

### Rule 5: Workload Imbalance Detection (TODO)

**Mục đích**: Phát hiện phân bổ công việc không đều

**Thuật toán**:
```typescript
// Group issues by assignee
workloadByPerson = {}
issues.forEach(issue => {
  issue.assignees.forEach(assignee => {
    workloadByPerson[assignee] += issue.point
  })
})

// Calculate standard deviation
avgWorkload = MEAN(workloadByPerson.values())
stdDev = STANDARD_DEVIATION(workloadByPerson.values())

if (stdDev > avgWorkload * 0.5) {
  return MEDIUM // Workload quá chênh lệch
}
```

---

## 🗄️ Database Schema

### SprintHistory Table
Lưu lịch sử các sprints đã hoàn thành để tính velocity:

```sql
CREATE TABLE sprint_history (
  id UUID PRIMARY KEY,
  sprint_id UUID,
  project_id UUID,
  committed_points INT,    -- Số points cam kết lúc bắt đầu
  completed_points INT,    -- Số points hoàn thành
  velocity INT,            -- = completed_points (actual delivery)
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
);
```

**Khi nào data được tạo?**
- ✅ Tự động khi Complete Sprint (sprint status: ACTIVE → CLOSED)
- ✅ Hoặc manually insert bằng SQL (như test data)

### RiskAlert Table
Lưu các risks đã phát hiện:

```sql
CREATE TABLE risk_alert (
  id UUID PRIMARY KEY,
  sprint_id UUID,
  project_id UUID,
  risk_type VARCHAR(50),   -- "OVERCOMMITMENT", "BLOCKED_ISSUES", ...
  severity VARCHAR(20),    -- "CRITICAL", "MEDIUM", "LOW"
  title VARCHAR(255),
  description TEXT,
  impact_score INT,        -- 0-10
  status VARCHAR(20),      -- "ACTIVE", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"
  metadata JSONB,          -- { committedPoints, avgVelocity, ratio, ... }
  detected_at TIMESTAMPTZ
);
```

**Khi nào data được tạo?**
- ✅ Khi user click "Detect Risks"
- ✅ Hoặc theo cron job (every 4 hours - TODO)

---

## ❓ Tại Sao Sprint Khác Không Có Dữ Liệu?

### Nguyên nhân:

1. **Risk alerts chỉ được tạo khi detect**
   - Hệ thống KHÔNG tự động phân tích tất cả sprints
   - User phải click "Detect Risks" cho từng sprint

2. **Sprint History cần được tạo trước**
   - Nếu sprint chưa có history (3 sprints trước) → không thể tính velocity
   - Rule sẽ fallback về `teamCapacity` (nếu có) hoặc skip

3. **Mỗi sprint có context riêng**
   - Sprint 1 có 49 points → Overcommit
   - Sprint 2 có 23 points → Normal
   - **→ Kết quả khác nhau là ĐÚNG!**

### Ví dụ thực tế:

**Sprint 1** (id: `aa7f4255-...`):
```json
{
  "committedPoints": 49,
  "avgVelocity": 32,
  "ratio": 1.53,
  "risks": [
    {
      "type": "OVERCOMMITMENT",
      "severity": "CRITICAL"
    }
  ]
}
```

**Sprint 2** (id: `2e4d9b03-...`):
```json
{
  "committedPoints": 23,
  "avgVelocity": 32,
  "ratio": 0.72,
  "risks": []  // ← Không có risk vì ratio < 1.1
}
```

**→ Đây là BEHAVIOR ĐÚNG**, không phải bug!

---

## 🎨 UI/UX Flow

### Backlog Page

```
┌─────────────────────────────────────────────────┐
│  Sprint 1 (ACTIVE)                              │
│  ├─ Issue 1 (5 points)                          │
│  ├─ Issue 2 (8 points)                          │
│  └─ Issue 3 (3 points)                          │
├─────────────────────────────────────────────────┤
│  Sprint 2 (ACTIVE)                              │
│  ├─ Issue 4 (5 points)                          │
│  └─ Issue 5 (5 points)                          │
├─────────────────────────────────────────────────┤
│  Backlog                                        │
│  ├─ Issue 6                                     │
│  └─ Issue 7                                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🛡️ Risk Alerts • Sprint 1                      │
│                                                  │
│ [ Phân tích rủi ro cho sprint: ▼ Sprint 1 ]     │← Dropdown nếu có > 1 active sprint
│                                                  │
│ ┌─ Summary ─────────────────────┐               │
│ │ ⚠️ Nghiêm trọng: 1             │               │
│ │ ⚠️ Trung bình: 0               │               │
│ │ ⚠️ Thấp: 0                     │               │
│ └────────────────────────────────┘               │
│                                                  │
│ [🔄 Làm mới]  [⚠️ Detect Risks] ← CLICK HERE!   │
│                                                  │
│ ┌─ Overcommitment Nghiêm Trọng ───────────────┐ │
│ │ Sprint đang bị overcommit 53%. Team cam kết  │ │
│ │ 49 điểm nhưng velocity trung bình chỉ 32...  │ │
│ │                                               │ │
│ │ 💡 Khuyến nghị:                               │ │
│ │  1. Di chuyển 1 story về backlog              │ │
│ │  2. Extend sprint thêm 1-2 ngày               │ │
│ │  3. Review sprint goal                        │ │
│ │                                               │ │
│ │ [Bỏ qua] [Đã biết] [Đã giải quyết]           │ │
│ └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Cron Job (TODO - Future Enhancement)

Để tự động phát hiện risks mà không cần user trigger:

```typescript
// Every 4 hours
@Cron('0 */4 * * *')
async autoDetectRisks() {
  // 1. Find all ACTIVE sprints
  const activeSprints = await prisma.sprint.findMany({
    where: { status: 'ACTIVE' }
  });

  // 2. Detect risks for each sprint
  for (const sprint of activeSprints) {
    await this.detectRisksForSprint(sprint.id);
  }

  // 3. Send notifications if new CRITICAL risks found
}
```

---

## 📊 Testing Scenarios

### Test Case 1: Normal Sprint (No Risks)
```sql
-- Sprint: 23 points committed, velocity = 32
-- Expected: No risks
```
✅ Kết quả: `{ risks: [], summary: { total: 0 } }`

### Test Case 2: Overcommitted Sprint
```sql
-- Sprint: 49 points committed, velocity = 32
-- Expected: OVERCOMMITMENT risk
```
✅ Kết quả:
```json
{
  "risks": [{
    "type": "OVERCOMMITMENT",
    "severity": "CRITICAL",
    "title": "Sprint Overcommitment Nghiêm Trọng"
  }]
}
```

### Test Case 3: Sprint Without History
```sql
-- Sprint: 30 points, NO sprint_history records
-- Expected: Use teamCapacity fallback or skip
```

---

## 🚀 Next Steps

### Backend TODO:
1. ✅ Overcommitment Rule - DONE
2. ⏳ Blocked Issues Rule - TODO
3. ⏳ Zero Progress Rule - TODO
4. ⏳ Missing Estimates Rule - TODO
5. ⏳ Workload Imbalance Rule - TODO
6. ⏳ Sprint Health Scoring Service - TODO
7. ⏳ Cron Job for auto-detection - TODO

### Frontend TODO:
1. ✅ Risk Dashboard Component - DONE
2. ✅ Risk Alert Card - DONE
3. ✅ Integration in Backlog Page - DONE
4. ⏳ Sprint Health Score Visualization - TODO
5. ⏳ Risk Trends Chart - TODO

---

## 📖 Tài Liệu Liên Quan

- [AI Risk Detector Feature Spec](./AI_RISK_DETECTOR_SPRINT_HEALTH_MONITOR_FEATURE.md) - Tài liệu chi tiết 70+ trang
- Backend Code: `services/pm/src/modules/risk-detector/`
- Frontend Code: `apps/pm-web/src/core/components/risk-detector/`
- API Endpoints: Swagger tại `http://localhost:3000/api-docs`

---

## 💡 Best Practices

### Khi nào nên Detect Risks?

**✅ Nên**:
- Sau khi plan sprint (thêm issues vào sprint)
- Giữa sprint (daily standup) để kiểm tra tiến độ
- Trước khi complete sprint

**❌ Không nên**:
- Detect liên tục (spam API)
- Detect sprint đã CLOSED
- Detect khi chưa có issues trong sprint

### Làm sao để có Sprint History?

**Option 1: Tự nhiên theo thời gian**
- Khi complete sprint → tự động tạo sprint_history

**Option 2: Import data thủ công** (cho testing)
```sql
INSERT INTO sprint_history (id, sprint_id, project_id, committed_points, completed_points, velocity, start_date, end_date)
VALUES
  (gen_random_uuid(), gen_random_uuid(), 'project-id', 35, 30, 30, '2025-11-01', '2025-11-14'),
  (gen_random_uuid(), gen_random_uuid(), 'project-id', 38, 32, 32, '2025-11-15', '2025-11-28'),
  (gen_random_uuid(), gen_random_uuid(), 'project-id', 36, 34, 34, '2025-11-29', '2025-12-12');
```

---

## 🎓 Summary

AI Risk Detector là hệ thống **on-demand analysis** giúp team:
1. **Phát hiện sớm** các rủi ro trong sprint
2. **Nhận được recommendations** cụ thể để giải quyết
3. **Track history** để cải thiện planning

**Key Insight**: Sprint khác nhau có context khác nhau → kết quả risks khác nhau là BÌNH THƯỜNG!

