# UC14 - Quan ly tep

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC14 |
| **Ten** | Quan ly tep |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Thanh vien cua Workspace (xem/tai), Owner/Admin (xoa) |

## Mo ta
Cho phep xem danh sach, tai xuong, xoa va tim kiem tep trong workspace.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua workspace

## Chuc nang con

### A. Xem danh sach tep

```
[Nguoi dung] --> [Tab "Files"] --> [He thong tai danh sach]
                                           |
                                           v
                                  [Hien thi danh sach tep]
                                  (Ten, Kich thuoc, Nguoi upload, Ngay tao)
```

### B. Tai tep xuong

```
[Nguoi dung] --> [Chon tep] --> [Click "Tai xuong"]
                                       |
                                       v
                               [He thong tao download URL]
                                       |
                                       v
                               [Bat dau tai xuong]
                                       |
                                       v
                               [Ghi audit log]
```

### C. Xoa tep

```
[Owner/Admin] --> [Chon tep] --> [Click "Xoa"]
                                       |
                                       v
                               [Hien thi xac nhan]
                                       |
                                       v
                               [Xoa khoi storage va DB]
                                       |
                                       v
                               [Ghi audit log]
```

### D. Tim kiem tep

```
[Nguoi dung] --> [Nhap tu khoa] --> [He thong tim kiem]
                                           |
                                           v
                                   [Hien thi ket qua]
```

### Cac buoc chi tiet

#### A. Xem danh sach
1. Truy cap tab "Files" trong workspace
2. He thong hien thi danh sach tep theo cau truc thu muc
3. Thong tin hien thi:
   - Icon loai tep
   - Ten tep
   - Kich thuoc
   - Nguoi upload
   - Ngay tao
4. Ho tro sap xep theo cac cot

#### B. Tai tep xuong
1. Chon tep can tai
2. Click nut "Tai xuong" hoac double-click
3. He thong tao URL tai xuong
4. Trinh duyet bat dau tai

#### C. Xoa tep
1. Chon tep can xoa (co the chon nhieu)
2. Click nut "Xoa"
3. Xac nhan thao tac
4. He thong xoa tep

#### D. Tim kiem
1. Nhap tu khoa vao thanh tim kiem
2. He thong loc danh sach theo:
   - Ten tep
   - Loai tep
3. Hien thi ket qua

## Luong thay the (Alternative Flows)

### C.2a. Khong co quyen xoa
- An nut xoa voi Member thuong
- Chi Owner/Admin moi thay nut xoa

### C.3a. Tep dang duoc su dung (trong bao cao)
- Hien thi canh bao "Tep nay dang duoc su dung trong X bao cao"
- Yeu cau xac nhan truoc khi xoa

## API Endpoints

### GET /api/workspaces/:id/files
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
folderId: uuid (optional, null for root)
search: string (optional)
type: string (optional, e.g., "pdf", "image")
sortBy: name | size | createdAt (default: createdAt)
sortOrder: asc | desc (default: desc)
page: number (default: 1)
limit: number (default: 50)
```

**Response Success (200):**
```json
{
  "files": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "uploadedBy": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "url"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "isUsedInReports": true
    }
  ],
  "folders": [
    {
      "id": "uuid",
      "name": "Documents",
      "fileCount": 15,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ],
  "breadcrumb": [
    { "id": null, "name": "Root" },
    { "id": "uuid", "name": "Documents" }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### GET /api/workspaces/:id/files/:fileId
**Response Success (200):**
```json
{
  "id": "uuid",
  "name": "document.pdf",
  "originalName": "document.pdf",
  "size": 1024000,
  "mimeType": "application/pdf",
  "url": "https://storage.example.com/files/uuid.pdf",
  "uploadedBy": {
    "id": "uuid",
    "name": "John Doe"
  },
  "folder": {
    "id": "uuid",
    "name": "Documents"
  },
  "usedInReports": [
    {
      "id": "uuid",
      "name": "Monthly Report"
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### GET /api/workspaces/:id/files/:fileId/download
**Response Success (200):**
```json
{
  "downloadUrl": "https://storage.example.com/presigned-download-url...",
  "expiresAt": "2024-01-15T10:15:00Z"
}
```

Hoac redirect truc tiep den file

### DELETE /api/workspaces/:id/files/:fileId
**Response Success (200):**
```json
{
  "message": "File deleted successfully"
}
```

**Response Error (403):**
```json
{
  "error": "INSUFFICIENT_PERMISSION",
  "message": "Only Owner or Admin can delete files"
}
```

### DELETE /api/workspaces/:id/files
**Request:**
```json
{
  "fileIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response Success (200):**
```json
{
  "message": "Files deleted successfully",
  "deleted": 3,
  "failed": []
}
```

### POST /api/workspaces/:id/folders
**Request:**
```json
{
  "name": "New Folder",
  "parentId": "uuid"  // optional
}
```

**Response Success (201):**
```json
{
  "id": "uuid",
  "name": "New Folder",
  "parentId": "uuid"
}
```

### PATCH /api/workspaces/:id/files/:fileId/move
**Request:**
```json
{
  "folderId": "uuid"  // null for root
}
```

**Response Success (200):**
```json
{
  "message": "File moved successfully"
}
```

## File List Component

### View Modes
- **Grid View**: Hien thi thumbnail va ten
- **List View**: Bang chi tiet voi cac cot

### Context Menu
```typescript
const contextMenuItems = [
  { label: 'Xem chi tiet', action: 'view', icon: 'eye' },
  { label: 'Tai xuong', action: 'download', icon: 'download' },
  { label: 'Di chuyen', action: 'move', icon: 'folder' },
  { label: 'Doi ten', action: 'rename', icon: 'edit', roles: ['OWNER', 'ADMIN'] },
  { label: 'Xoa', action: 'delete', icon: 'trash', roles: ['OWNER', 'ADMIN'] }
];
```

### File Preview
- PDF: Preview trong browser
- Images: Lightbox gallery
- Office: Download hoac external viewer
- Text: In-app preview

## Implementation Notes

### File Service
```typescript
async function getFiles(
  workspaceId: string,
  options: GetFilesOptions
): Promise<PaginatedFiles> {
  const where: Prisma.FileWhereInput = {
    workspaceId,
    folderId: options.folderId ?? null
  };

  if (options.search) {
    where.name = { contains: options.search, mode: 'insensitive' };
  }

  if (options.type) {
    where.mimeType = { startsWith: options.type };
  }

  const [files, folders, total] = await Promise.all([
    db.files.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        reportFiles: { select: { reportId: true } }
      },
      orderBy: { [options.sortBy]: options.sortOrder },
      skip: (options.page - 1) * options.limit,
      take: options.limit
    }),
    db.folders.findMany({
      where: { workspaceId, parentId: options.folderId ?? null }
    }),
    db.files.count({ where })
  ]);

  const breadcrumb = await buildBreadcrumb(options.folderId);

  return {
    files: files.map(f => ({
      ...f,
      isUsedInReports: f.reportFiles.length > 0
    })),
    folders,
    breadcrumb,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit)
    }
  };
}

async function deleteFile(
  workspaceId: string,
  fileId: string,
  userId: string
): Promise<void> {
  // Check permission
  const membership = await checkMembership(workspaceId, userId);
  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new ForbiddenException('INSUFFICIENT_PERMISSION');
  }

  const file = await db.files.findUnique({
    where: { id: fileId, workspaceId }
  });

  if (!file) {
    throw new NotFoundException('FILE_NOT_FOUND');
  }

  // Delete from storage
  await storage.delete(file.storageKey);

  // Delete from database
  await db.files.delete({ where: { id: fileId } });

  // Audit log
  await createAuditLog({
    workspaceId,
    userId,
    action: 'FILE_DELETED',
    metadata: {
      fileId,
      fileName: file.name,
      fileSize: file.size
    }
  });
}

async function downloadFile(
  workspaceId: string,
  fileId: string,
  userId: string
): Promise<string> {
  const file = await db.files.findUnique({
    where: { id: fileId, workspaceId }
  });

  if (!file) {
    throw new NotFoundException('FILE_NOT_FOUND');
  }

  // Generate presigned URL
  const downloadUrl = await storage.getPresignedDownloadUrl(file.storageKey, {
    expiresIn: 15 * 60, // 15 minutes
    responseContentDisposition: `attachment; filename="${file.originalName}"`
  });

  // Audit log
  await createAuditLog({
    workspaceId,
    userId,
    action: 'FILE_DOWNLOADED',
    metadata: {
      fileId,
      fileName: file.name
    }
  });

  return downloadUrl;
}
```

## Search Implementation
```typescript
async function searchFiles(
  workspaceId: string,
  query: string
): Promise<File[]> {
  return db.files.findMany({
    where: {
      workspaceId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { mimeType: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 20
  });
}
```

## Audit Log
- Action: `FILE_DOWNLOADED`
- Action: `FILE_DELETED`
- Action: `FILE_MOVED`
- Action: `FILE_RENAMED`
- Action: `FOLDER_CREATED`
- Action: `FOLDER_DELETED`
- Metadata: fileId, fileName, folderId
