# UC17 - Xem va xuat bao cao

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC17 |
| **Ten** | Xem va xuat bao cao |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Thanh vien cua Workspace |

## Mo ta
Cho phep xem danh sach bao cao, xem chi tiet noi dung va xuat bao cao sang PDF, DOCX hoac Markdown.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua workspace

## Chuc nang con

### A. Xem danh sach bao cao

```
[Nguoi dung] --> [Tab "Reports"] --> [He thong tai danh sach]
                                             |
                                             v
                                    [Hien thi danh sach bao cao]
                                    (Ten, Loai, Trang thai, Ngay tao)
```

### B. Xem chi tiet bao cao

```
[Nguoi dung] --> [Chon bao cao] --> [He thong tai noi dung]
                                            |
                                            v
                                   [Hien thi noi dung day du]
                                   (Render Markdown)
```

### C. Xuat bao cao

```
[Nguoi dung] --> [Click "Xuat bao cao"] --> [Chon dinh dang]
                                                   |
                                                   v
                                          [He thong tao file]
                                                   |
                                                   v
                                          [Tai xuong file]
                                                   |
                                                   v
                                          [Ghi audit log]
```

### Cac buoc chi tiet

#### A. Xem danh sach
1. Truy cap tab "Reports" trong workspace
2. He thong hien thi danh sach bao cao:
   - Ten bao cao
   - Loai (Summary/Analysis/Custom)
   - Trang thai (Processing/Completed/Failed)
   - Nguoi tao
   - Ngay tao
3. Ho tro loc va tim kiem

#### B. Xem chi tiet
1. Click vao bao cao trong danh sach
2. He thong hien thi noi dung day du
3. Render Markdown thanh HTML
4. Hien thi thong tin metadata

#### C. Xuat bao cao
1. Click nut "Xuat bao cao" hoac icon download
2. Chon dinh dang:
   - PDF
   - DOCX
   - Markdown (.md)
3. He thong tao file
4. Tai xuong ve may

## Luong thay the (Alternative Flows)

### A.2a. Khong co bao cao
- Hien thi "Chua co bao cao nao"
- Huong dan tao bao cao moi

### C.3a. Loi tao file
- Thong bao "Co loi khi tao file. Vui long thu lai"
- Cho phep thu lai

## API Endpoints

### GET /api/workspaces/:id/reports
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
type: SUMMARY | ANALYSIS | CUSTOM (optional)
status: PENDING | PROCESSING | COMPLETED | FAILED (optional)
search: string (optional)
sortBy: name | createdAt (default: createdAt)
sortOrder: asc | desc (default: desc)
page: number (default: 1)
limit: number (default: 20)
```

**Response Success (200):**
```json
{
  "reports": [
    {
      "id": "uuid",
      "name": "Monthly Summary Report",
      "type": "SUMMARY",
      "status": "COMPLETED",
      "llmProvider": "OPENAI",
      "createdBy": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "url"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:02:00Z"
    },
    {
      "id": "uuid",
      "name": "Data Analysis",
      "type": "ANALYSIS",
      "status": "PROCESSING",
      "llmProvider": "ANTHROPIC",
      "createdBy": {
        "id": "uuid",
        "name": "Jane Doe"
      },
      "createdAt": "2024-01-15T11:00:00Z",
      "progress": 50
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
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
  "content": "# Bao cao tong hop\n\n## Tong quan\n\nDay la bao cao tong hop cac hoat dong trong thang 1/2024...\n\n## Key Findings\n\n1. Doanh thu tang 20%\n2. So luong khach hang moi: 150\n3. ...",
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
      "name": "sales_report.pdf"
    },
    {
      "id": "uuid2",
      "name": "customer_data.xlsx"
    }
  ],
  "createdBy": {
    "id": "uuid",
    "name": "John Doe",
    "avatar": "url"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:02:00Z"
}
```

### GET /api/workspaces/:id/reports/:reportId/export
**Query Parameters:**
```
format: pdf | docx | md
```

**Response Success (200):**
- Returns file download with appropriate Content-Type

**Response Headers:**
```
Content-Type: application/pdf | application/vnd.openxmlformats-officedocument.wordprocessingml.document | text/markdown
Content-Disposition: attachment; filename="Monthly_Summary_Report.pdf"
```

### DELETE /api/workspaces/:id/reports/:reportId
**Response Success (200):**
```json
{
  "message": "Report deleted successfully"
}
```

## Report Content Display

### Markdown Rendering
```typescript
// Use library like react-markdown or marked
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ReportContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
        p: ({ children }) => <p className="mb-4">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-6 mb-4">{children}</ol>,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border">{children}</table>
          </div>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

## Export Implementation

### Export Service
```typescript
async function exportReport(
  workspaceId: string,
  reportId: string,
  userId: string,
  format: 'pdf' | 'docx' | 'md'
): Promise<Buffer> {
  // Get report
  const report = await db.reports.findUnique({
    where: { id: reportId, workspaceId }
  });

  if (!report) {
    throw new NotFoundException('REPORT_NOT_FOUND');
  }

  if (report.status !== 'COMPLETED') {
    throw new BadRequestException('REPORT_NOT_COMPLETED');
  }

  let buffer: Buffer;

  switch (format) {
    case 'pdf':
      buffer = await exportToPdf(report);
      break;
    case 'docx':
      buffer = await exportToDocx(report);
      break;
    case 'md':
      buffer = await exportToMarkdown(report);
      break;
  }

  // Audit log
  await createAuditLog({
    workspaceId,
    userId,
    action: 'REPORT_EXPORTED',
    metadata: {
      reportId,
      reportName: report.name,
      format
    }
  });

  return buffer;
}

// PDF Export using puppeteer or pdfkit
async function exportToPdf(report: Report): Promise<Buffer> {
  const html = renderMarkdownToHtml(report.content);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; }
        h2 { color: #666; }
      </style>
    </head>
    <body>
      <h1>${report.name}</h1>
      <p><em>Generated: ${report.completedAt}</em></p>
      <hr/>
      ${html}
    </body>
    </html>
  `);

  const buffer = await page.pdf({
    format: 'A4',
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
  });

  await browser.close();
  return buffer;
}

// DOCX Export using docx library
async function exportToDocx(report: Report): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: report.name,
          heading: HeadingLevel.TITLE
        }),
        new Paragraph({
          text: `Generated: ${report.completedAt}`,
          style: 'subtitle'
        }),
        ...parseMarkdownToDocx(report.content)
      ]
    }]
  });

  return Packer.toBuffer(doc);
}

// Markdown Export (simple)
async function exportToMarkdown(report: Report): Promise<Buffer> {
  const content = `# ${report.name}

*Generated: ${report.completedAt}*

---

${report.content}
`;

  return Buffer.from(content, 'utf-8');
}
```

## Report List Component

### Filter Panel
```typescript
interface ReportFilters {
  type?: 'SUMMARY' | 'ANALYSIS' | 'CUSTOM';
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

### Report Card
```typescript
interface ReportCardProps {
  report: ReportSummary;
  onView: () => void;
  onExport: (format: string) => void;
  onDelete?: () => void;
}

function ReportCard({ report, onView, onExport, onDelete }: ReportCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{report.name}</h3>
          <p className="text-sm text-gray-500">
            {report.type} | {report.createdBy.name}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {report.status === 'PROCESSING' && (
        <ProgressBar value={report.progress} />
      )}

      <div className="flex gap-2 mt-4">
        <Button onClick={onView}>Xem</Button>
        {report.status === 'COMPLETED' && (
          <DropdownMenu>
            <DropdownItem onClick={() => onExport('pdf')}>PDF</DropdownItem>
            <DropdownItem onClick={() => onExport('docx')}>DOCX</DropdownItem>
            <DropdownItem onClick={() => onExport('md')}>Markdown</DropdownItem>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
```

## Audit Log
- Action: `REPORT_VIEWED`
- Action: `REPORT_EXPORTED`
- Action: `REPORT_DELETED`
- Metadata: reportId, reportName, format
