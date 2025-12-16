# File Storage Service

## Overview

File Storage Service manages file uploads, storage (MinIO/S3), and metadata (MongoDB). It provides presigned URLs for direct client uploads and handles file lifecycle.

## Architecture

```
Client → BFF → File Storage API → MinIO/S3
                    ↓
                 MongoDB (metadata)
```

## Base URL

- Internal: `http://file-storage-api:3000`
- Port: `3000`

## Endpoints

### Presigned URL Flow (Recommended)

#### Create Upload URL
```http
POST /files/presigned-url
Content-Type: application/json
X-Internal-Call: bff

{
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "service": "tenant",
  "modelType": "Document",
  "subjectId": "project-uuid",
  "orgId": "org-uuid",
  "uploadedBy": "user-uuid",
  "tags": ["report"],
  "metadata": { "category": "finance" }
}
```

Response:
```json
{
  "statusCode": 201,
  "data": {
    "assetId": "asset-uuid",
    "presignedUrl": "https://minio.../signed-url",
    "objectKey": "timestamp-uuid.pdf",
    "expiresIn": 3600
  }
}
```

#### Confirm Upload
```http
POST /files/confirm-upload
Content-Type: application/json

{
  "assetId": "asset-uuid"
}
```

#### Get Download URL (Single)
```http
POST /files/presigned-get-url
Content-Type: application/json

{
  "id": "asset-uuid",
  "expirySeconds": 3600
}
```

#### Get Download URLs (Batch)
```http
POST /files/presigned-get-urls
Content-Type: application/json

{
  "ids": ["asset-1", "asset-2"],
  "expirySeconds": 3600
}
```

### File Management

#### List Files
```http
GET /files?service=tenant&modelType=Document&orgId=xxx&page=1&limit=20
```

#### Get File Metadata
```http
GET /files/:id
```

#### Download File
```http
GET /files/:id/download
```

#### Update Metadata
```http
PATCH /files/:id
Content-Type: application/json

{
  "tags": ["updated", "important"],
  "metadata": { "reviewed": true }
}
```

#### Delete File
```http
DELETE /files/:id
```

#### Delete by Subject
```http
DELETE /files/subject/:service/:modelType/:subjectId
```

### Organization Stats

#### Storage Usage
```http
GET /files/storage/usage
X-Org-Id: org-uuid
```

Response:
```json
{
  "statusCode": 200,
  "data": {
    "usedBytes": 1073741824,
    "fileCount": 150
  }
}
```

**Note**: Files with tags `logo`, `avatar`, `profile_picture`, `thumbnail` are excluded from quota.

#### Recent Files
```http
GET /files/recent?limit=5
X-Org-Id: org-uuid
```

## Integration

### From BFF/Services

```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FileService {
  constructor(private http: HttpService) {}

  async getPresignedUploadUrl(orgId: string, fileInfo: FileInfo) {
    const url = 'http://file-storage-api:3000/files/presigned-url';

    const res = await firstValueFrom(
      this.http.post(url, {
        originalName: fileInfo.name,
        mimeType: fileInfo.type,
        size: fileInfo.size,
        service: 'myservice',
        modelType: 'MyModel',
        subjectId: 'subject-id',
        orgId: orgId,
        tags: ['document'],
      }, {
        headers: { 'X-Internal-Call': 'bff' }
      })
    );

    return res.data?.data;
  }

  async confirmUpload(assetId: string) {
    const url = 'http://file-storage-api:3000/files/confirm-upload';
    await firstValueFrom(
      this.http.post(url, { assetId }, {
        headers: { 'X-Internal-Call': 'bff' }
      })
    );
  }
}
```

### From Frontend (Client-side Upload)

```typescript
async function uploadFile(file: File) {
  // 1. Get presigned URL from BFF
  const { assetId, presignedUrl } = await api.post('/files/presigned-url', {
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  // 2. Upload directly to S3/MinIO
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // 3. Confirm upload
  await api.post('/files/confirm-upload', { assetId });

  return assetId;
}
```

## File Metadata Schema

```typescript
interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url?: string;

  // Tracking
  service: string;      // e.g., "tenant", "pm", "chat"
  modelType: string;    // e.g., "Document", "Organization"
  subjectId: string;    // Related entity ID
  uploadedBy?: string;  // User ID
  orgId?: string;       // Organization ID

  // Flexible
  tags?: string[];
  metadata?: Record<string, any>;

  // Status
  uploadStatus: 'pending' | 'completed' | 'failed';

  createdAt: Date;
  updatedAt: Date;
}
```

## Tags for Quota Exclusion

These tags exclude files from storage quota:
- `logo` - Organization logos
- `avatar` - User avatars
- `profile_picture` - Profile pictures
- `thumbnail` - Auto-generated thumbnails

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINIO_ENDPOINT` | Yes | - | MinIO/S3 endpoint |
| `MINIO_PORT` | Yes | - | MinIO/S3 port |
| `MINIO_ACCESS_KEY` | Yes | - | Access key |
| `MINIO_SECRET_KEY` | Yes | - | Secret key |
| `MINIO_USE_SSL` | No | false | Use SSL |
| `MONGODB_URI` | Yes | - | MongoDB connection URI |

## Legacy Upload (Deprecated)

Direct multipart upload is still supported for backward compatibility:

```http
POST /files/upload
Content-Type: multipart/form-data

file: (binary)
service: tenant
modelType: Document
subjectId: xxx
```

**Recommendation**: Use presigned URL flow for better performance and reliability.
