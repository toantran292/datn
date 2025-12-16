# UC16 - Tao bao cao AI

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC16 |
| **Ten** | Tao bao cao AI |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Phuc tap |
| **Actor** | Owner hoac Admin cua Workspace |

## Mo ta
Cho phep tao bao cao AI tuy chinh bang cach cau hinh tham so va prompt, sau do goi LLM Provider de sinh noi dung.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Owner hoac Admin trong workspace
- Workspace khong bi khoa
- Co it nhat 1 tep tin trong workspace

## Luong xu ly chinh

```
[Owner/Admin] --> [Tab "Reports"] --> [Click "Tao bao cao"]
                                             |
                                             v
                                   [Hien thi form tao bao cao]
                                             |
                                             v
                                   [Nhap thong tin bao cao]
                                             |
                                             v
                                   [Chon LLM Provider]
                                             |
                                             v
                                   [Chon files/data source]
                                             |
                                             v
                                   [Nhap prompt tuy chinh (optional)]
                                             |
                                             v
                                   [Click "Tao bao cao"]
                                             |
                                             v
                                   [He thong thu thap du lieu]
                                             |
                                             v
                                   [Goi API LLM Provider]
                                             |
                                             v
                                   [Nhan va xu ly response]
                                             |
                                             v
                                   [Luu bao cao vao database]
                                             |
                                             v
                                   [Hien thi ket qua]
```

### Cac buoc chi tiet

1. **Truy cap chuc nang**
   - Nguoi dung vao tab "Reports"
   - Click "Tao bao cao moi"

2. **Nhap thong tin co ban**
   - Ten bao cao (bat buoc)
   - Loai bao cao (Summary/Analysis/Custom)
   - Mo ta (tuy chon)

3. **Chon LLM Provider**
   - OpenAI (GPT-4, GPT-3.5)
   - Anthropic (Claude)
   - Google (Gemini)
   - Mac dinh theo cau hinh workspace

4. **Chon nguon du lieu**
   - Chon files cu the
   - Hoac chon thu muc
   - Hoac chon tat ca files

5. **Cau hinh nang cao (tuy chon)**
   - Khoang thoi gian du lieu
   - Prompt tuy chinh
   - Temperature
   - Max tokens

6. **Tao bao cao**
   - Click "Tao bao cao"
   - He thong hien thi progress
   - Cho xu ly (co the mat vai phut)

7. **Hien thi ket qua**
   - Hien thi noi dung bao cao
   - Cho phep chinh sua (optional)
   - Luu hoac export

## Luong thay the (Alternative Flows)

### 6a. Khong co du lieu
- Thong bao "Vui long upload tep truoc khi tao bao cao"
- Redirect den trang upload

### 6b. LLM API loi
- Thong bao "Co loi khi tao bao cao. Vui long thu lai"
- Hien thi chi tiet loi (neu co)
- Cho phep thu lai

### 6c. Vuot qua gioi han token
- Thong bao "Du lieu qua lon. Vui long thu hep pham vi"
- Goi y giam so files hoac khoang thoi gian

### 6d. Timeout
- Thong bao "Qua trinh xu ly mat nhieu thoi gian"
- Cho phep doi tiep hoac huy

## API Endpoints

### GET /api/workspaces/:id/reports/templates
**Response Success (200):**
```json
{
  "templates": [
    {
      "id": "summary",
      "name": "Tong hop",
      "description": "Tao bao cao tong hop tu cac tep tin",
      "defaultPrompt": "Tong hop noi dung chinh tu cac tai lieu..."
    },
    {
      "id": "analysis",
      "name": "Phan tich",
      "description": "Phan tich chi tiet noi dung",
      "defaultPrompt": "Phan tich chi tiet..."
    },
    {
      "id": "custom",
      "name": "Tuy chinh",
      "description": "Tao bao cao voi prompt tuy chinh",
      "defaultPrompt": ""
    }
  ]
}
```

### POST /api/workspaces/:id/reports
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "Monthly Summary Report",
  "type": "SUMMARY",
  "description": "Bao cao tong hop thang 1/2024",
  "llmProvider": "OPENAI",
  "llmModel": "gpt-4",
  "fileIds": ["uuid1", "uuid2"],
  "config": {
    "temperature": 0.7,
    "maxTokens": 4000,
    "customPrompt": "Tong hop cac diem chinh..."
  }
}
```

**Response Success (202):**
```json
{
  "message": "Report generation started",
  "reportId": "uuid",
  "status": "PROCESSING",
  "estimatedTime": 60
}
```

### GET /api/workspaces/:id/reports/:reportId/status
**Response Success (200):**
```json
{
  "reportId": "uuid",
  "status": "PROCESSING",
  "progress": 50,
  "currentStep": "Analyzing documents...",
  "startedAt": "2024-01-15T10:00:00Z"
}
```

**Response Success (200) - Completed:**
```json
{
  "reportId": "uuid",
  "status": "COMPLETED",
  "progress": 100,
  "completedAt": "2024-01-15T10:02:00Z"
}
```

**Response Success (200) - Failed:**
```json
{
  "reportId": "uuid",
  "status": "FAILED",
  "error": {
    "code": "LLM_API_ERROR",
    "message": "Failed to connect to OpenAI API"
  }
}
```

### GET /api/workspaces/:id/reports/:reportId
**Response Success (200):**
```json
{
  "id": "uuid",
  "name": "Monthly Summary Report",
  "type": "SUMMARY",
  "description": "Bao cao tong hop thang 1/2024",
  "content": "# Bao cao tong hop\n\n## Tong quan\n...",
  "llmProvider": "OPENAI",
  "llmModel": "gpt-4",
  "status": "COMPLETED",
  "tokenUsage": {
    "input": 5000,
    "output": 2000,
    "total": 7000
  },
  "files": [
    {
      "id": "uuid1",
      "name": "document1.pdf"
    }
  ],
  "createdBy": {
    "id": "uuid",
    "name": "John Doe"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:02:00Z"
}
```

## Database Schema

### Report Table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type ENUM('SUMMARY', 'ANALYSIS', 'CUSTOM') NOT NULL,
  description TEXT,
  content TEXT,
  llm_provider ENUM('OPENAI', 'ANTHROPIC', 'GOOGLE') NOT NULL,
  llm_model VARCHAR(50) NOT NULL,
  config JSONB,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
  error_message TEXT,
  token_usage JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_reports_workspace ON reports(workspace_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### Report Files Table
```sql
CREATE TABLE report_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## LLM Integration

### Provider Configuration
```typescript
interface LLMConfig {
  provider: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE';
  model: string;
  temperature: number;
  maxTokens: number;
  customPrompt?: string;
}

const defaultConfigs = {
  OPENAI: {
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4',
    maxTokens: 4096
  },
  ANTHROPIC: {
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    defaultModel: 'claude-3-sonnet',
    maxTokens: 4096
  },
  GOOGLE: {
    models: ['gemini-pro', 'gemini-ultra'],
    defaultModel: 'gemini-pro',
    maxTokens: 8192
  }
};
```

### Report Generation Service
```typescript
async function generateReport(
  workspaceId: string,
  userId: string,
  data: CreateReportDto
): Promise<Report> {
  // Check permission
  const membership = await checkMembership(workspaceId, userId);
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new ForbiddenException('INSUFFICIENT_PERMISSION');
  }

  // Check workspace status
  const workspace = await getWorkspace(workspaceId);
  if (workspace.status === 'LOCKED') {
    throw new ForbiddenException('WORKSPACE_LOCKED');
  }

  // Validate files
  if (!data.fileIds || data.fileIds.length === 0) {
    throw new BadRequestException('NO_FILES_SELECTED');
  }

  // Create report record
  const report = await db.reports.create({
    data: {
      workspaceId,
      name: data.name,
      type: data.type,
      description: data.description,
      llmProvider: data.llmProvider,
      llmModel: data.llmModel,
      config: data.config,
      status: 'PENDING',
      createdBy: userId
    }
  });

  // Link files
  await db.reportFiles.createMany({
    data: data.fileIds.map(fileId => ({
      reportId: report.id,
      fileId
    }))
  });

  // Start async processing
  processReport(report.id);

  return report;
}

async function processReport(reportId: string): Promise<void> {
  try {
    // Update status
    await updateReportStatus(reportId, 'PROCESSING');

    // Get report with files
    const report = await db.reports.findUnique({
      where: { id: reportId },
      include: {
        reportFiles: { include: { file: true } },
        workspace: true
      }
    });

    // Extract content from files
    const documents = await extractDocuments(report.reportFiles.map(rf => rf.file));

    // Build prompt
    const prompt = buildPrompt(report.type, report.config?.customPrompt, documents);

    // Call LLM API
    const llmResponse = await callLLM({
      provider: report.llmProvider,
      model: report.llmModel,
      prompt,
      temperature: report.config?.temperature ?? 0.7,
      maxTokens: report.config?.maxTokens ?? 4000
    });

    // Update report with content
    await db.reports.update({
      where: { id: reportId },
      data: {
        content: llmResponse.content,
        status: 'COMPLETED',
        tokenUsage: llmResponse.usage,
        completedAt: new Date()
      }
    });

    // Audit log
    await createAuditLog({
      workspaceId: report.workspaceId,
      userId: report.createdBy,
      action: 'REPORT_CREATED',
      metadata: {
        reportId,
        reportName: report.name,
        llmProvider: report.llmProvider
      }
    });

    // Notify user
    await createNotification({
      userId: report.createdBy,
      workspaceId: report.workspaceId,
      type: 'REPORT_CREATED',
      title: 'Bao cao da hoan thanh',
      content: `Bao cao "${report.name}" da duoc tao thanh cong`,
      metadata: { reportId }
    });

  } catch (error) {
    // Update status to failed
    await db.reports.update({
      where: { id: reportId },
      data: {
        status: 'FAILED',
        errorMessage: error.message
      }
    });

    // Notify user
    const report = await db.reports.findUnique({ where: { id: reportId } });
    await createNotification({
      userId: report.createdBy,
      workspaceId: report.workspaceId,
      type: 'REPORT_FAILED',
      title: 'Tao bao cao that bai',
      content: `Khong the tao bao cao "${report.name}". Vui long thu lai.`,
      metadata: { reportId, error: error.message }
    });
  }
}
```

### Prompt Templates
```typescript
const promptTemplates = {
  SUMMARY: `
    Based on the following documents, create a comprehensive summary report.

    Documents:
    {documents}

    Please provide:
    1. Executive summary
    2. Key findings
    3. Main themes and topics
    4. Conclusion
  `,
  ANALYSIS: `
    Analyze the following documents in detail.

    Documents:
    {documents}

    Please provide:
    1. Detailed analysis of each document
    2. Comparative analysis
    3. Trends and patterns
    4. Recommendations
  `,
  CUSTOM: '{customPrompt}\n\nDocuments:\n{documents}'
};
```

## Audit Log
- Action: `REPORT_CREATED`
- Action: `REPORT_GENERATION_STARTED`
- Action: `REPORT_GENERATION_FAILED`
- Metadata: reportId, reportName, llmProvider, tokenUsage
