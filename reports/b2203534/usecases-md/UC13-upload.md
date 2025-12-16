# UC13 - Upload tep

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC13 |
| **Ten** | Upload tep |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Thanh vien cua Workspace |

## Mo ta
Cho phep thanh vien tai mot hoac nhieu tep tin len workspace de chia se va su dung cho bao cao AI.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua workspace
- Workspace khong bi khoa
- Con du dung luong luu tru

## Luong xu ly chinh

```
[Nguoi dung] --> [Tab "Files"] --> [Click "Upload" hoac Drag & Drop]
                                            |
                                            v
                                  [Chon tep tu may tinh]
                                            |
                                            v
                                  [He thong validate tep]
                                            |
                     +----------------------+----------------------+
                     |                      |                      |
             [Tep hop le]         [Dinh dang sai]         [Qua kich thuoc]
                     |                      |                      |
                     v                      v                      v
             [Hien thi progress]    [Thong bao loi]        [Thong bao loi]
                     |
                     v
             [Upload len storage]
                     |
                     v
             [Luu metadata vao DB]
                     |
                     v
             [Ghi audit log]
                     |
                     v
             [Thong bao thanh cong]
```

### Cac buoc chi tiet

1. **Mo giao dien upload**
   - Nguoi dung click nut "Upload"
   - Hoac keo tha tep vao khu vuc upload

2. **Chon tep**
   - Ho tro chon nhieu tep cung luc
   - Hien thi danh sach tep da chon

3. **He thong validate**
   - Kiem tra dinh dang tep (theo cau hinh workspace)
   - Kiem tra kich thuoc tep (theo cau hinh workspace)
   - Kiem tra dung luong con lai cua workspace

4. **Chon thu muc dich (optional)**
   - Mac dinh upload vao root
   - Co the chon thu muc con

5. **Thuc hien upload**
   - Click nut "Upload"
   - Hien thi progress bar cho tung tep
   - Ho tro huy upload giua chung

6. **Luu tru**
   - Upload tep len object storage (S3/MinIO)
   - Luu metadata vao database
   - Ghi audit log

7. **Ket qua**
   - Thong bao thanh cong
   - Hien thi tep trong danh sach

## Luong thay the (Alternative Flows)

### 3a. Dinh dang khong ho tro
- Thong bao "Dinh dang tep khong duoc ho tro"
- Hien thi danh sach dinh dang cho phep

### 3b. Vuot qua kich thuoc
- Thong bao "Tep vuot qua kich thuoc cho phep ({max_size} MB)"
- Goi y nen file hoac su dung dich vu khac

### 3c. Het dung luong workspace
- Thong bao "Workspace da het dung luong luu tru"
- Goi y xoa bot tep hoac nang cap

### 5a. Upload that bai (network error)
- Hien thi loi cho tep cu the
- Cho phep thu lai

## API Endpoints

### POST /api/workspaces/:id/files/upload
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:**
```
files: (file[])
folderId: uuid (optional)
```

**Response Success (200):**
```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "originalName": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "url": "https://storage.example.com/files/uuid.pdf",
      "folderId": null,
      "uploadedBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "failed": [
    {
      "name": "image.bmp",
      "error": "UNSUPPORTED_FILE_TYPE"
    }
  ]
}
```

### GET /api/workspaces/:id/files/upload-url
**Query Parameters:**
```
fileName: string
fileSize: number
mimeType: string
```

**Response Success (200):**
```json
{
  "uploadUrl": "https://storage.example.com/presigned-url...",
  "fileId": "uuid",
  "expiresAt": "2024-01-15T10:15:00Z"
}
```

### POST /api/workspaces/:id/files/confirm-upload
**Request:**
```json
{
  "fileId": "uuid",
  "folderId": "uuid"  // optional
}
```

**Response Success (200):**
```json
{
  "message": "Upload confirmed",
  "file": {
    "id": "uuid",
    "name": "document.pdf",
    "url": "https://storage.example.com/files/uuid.pdf"
  }
}
```

## Database Schema

### File Table
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_workspace ON files(workspace_id);
CREATE INDEX idx_files_folder ON files(folder_id);
```

### Folder Table
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Supported File Types (Default)
| Category | Extensions | MIME Types |
|----------|------------|------------|
| Documents | pdf, doc, docx, txt, rtf | application/pdf, application/msword, ... |
| Spreadsheets | xls, xlsx, csv | application/vnd.ms-excel, ... |
| Presentations | ppt, pptx | application/vnd.ms-powerpoint, ... |
| Images | jpg, jpeg, png, gif, webp | image/* |
| Archives | zip, rar, 7z | application/zip, ... |

## File Size Limits (Default)
- Single file: 100 MB
- Batch upload: 10 files at once
- Total workspace: 10 GB

## Implementation Notes

### Upload Service
```typescript
async function uploadFiles(
  workspaceId: string,
  userId: string,
  files: Express.Multer.File[],
  folderId?: string
): Promise<UploadResult> {
  const workspace = await getWorkspace(workspaceId);
  const settings = await getWorkspaceSettings(workspaceId);

  const results: FileUploadResult[] = [];
  const failed: FailedUpload[] = [];

  for (const file of files) {
    try {
      // Validate file type
      if (!isAllowedFileType(file.mimetype, settings.allowedFileTypes)) {
        failed.push({
          name: file.originalname,
          error: 'UNSUPPORTED_FILE_TYPE'
        });
        continue;
      }

      // Validate file size
      if (file.size > settings.maxFileSizeMb * 1024 * 1024) {
        failed.push({
          name: file.originalname,
          error: 'FILE_TOO_LARGE'
        });
        continue;
      }

      // Check storage quota
      const usage = await getStorageUsage(workspaceId);
      if (usage + file.size > settings.storageLimitGb * 1024 * 1024 * 1024) {
        failed.push({
          name: file.originalname,
          error: 'STORAGE_LIMIT_EXCEEDED'
        });
        continue;
      }

      // Upload to storage
      const storageKey = `workspaces/${workspaceId}/${uuidv4()}-${file.originalname}`;
      await storage.upload(storageKey, file.buffer, file.mimetype);

      // Save to database
      const savedFile = await db.files.create({
        data: {
          workspaceId,
          folderId,
          name: file.originalname,
          originalName: file.originalname,
          storageKey,
          size: file.size,
          mimeType: file.mimetype,
          uploadedBy: userId
        }
      });

      // Audit log
      await createAuditLog({
        workspaceId,
        userId,
        action: 'FILE_UPLOADED',
        metadata: {
          fileId: savedFile.id,
          fileName: file.originalname,
          fileSize: file.size
        }
      });

      results.push({
        id: savedFile.id,
        name: savedFile.name,
        size: savedFile.size,
        url: await getSignedUrl(storageKey)
      });

    } catch (error) {
      failed.push({
        name: file.originalname,
        error: 'UPLOAD_FAILED'
      });
    }
  }

  return { files: results, failed };
}
```

### Presigned URL Upload (for large files)
```typescript
async function getPresignedUploadUrl(
  workspaceId: string,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<PresignedUrlResponse> {
  // Validate
  const settings = await getWorkspaceSettings(workspaceId);
  if (fileSize > settings.maxFileSizeMb * 1024 * 1024) {
    throw new BadRequestException('FILE_TOO_LARGE');
  }

  // Generate storage key
  const fileId = uuidv4();
  const storageKey = `workspaces/${workspaceId}/${fileId}-${fileName}`;

  // Create presigned URL
  const uploadUrl = await storage.getPresignedUploadUrl(storageKey, {
    expiresIn: 15 * 60, // 15 minutes
    contentType: mimeType
  });

  // Create pending file record
  await db.pendingFiles.create({
    data: {
      id: fileId,
      workspaceId,
      fileName,
      storageKey,
      size: fileSize,
      mimeType,
      expiresAt: addMinutes(new Date(), 15)
    }
  });

  return {
    uploadUrl,
    fileId,
    expiresAt: addMinutes(new Date(), 15)
  };
}
```

## Progress Tracking
- Su dung XMLHttpRequest hoac fetch with progress
- Cap nhat progress bar real-time
- Ho tro huy upload giua chung

## Audit Log
- Action: `FILE_UPLOADED`
- Metadata: fileId, fileName, fileSize, mimeType, folderId
