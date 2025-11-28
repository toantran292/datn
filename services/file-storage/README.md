# File Storage Service

Generic file storage service với MinIO và metadata tracking. Service này cho phép các service khác upload files với đầy đủ thông tin về nguồn gốc (service nào upload, thuộc model gì, subject ID gì).

## Features

- ✅ **MinIO Integration** - S3-compatible object storage
- ✅ **Metadata Tracking** - Track service, model type, subject ID
- ✅ **Generic API** - Dùng được cho tất cả services
- ✅ **File Management** - Upload, download, delete, list
- ✅ **Swagger Documentation** - Auto-generated API docs
- ✅ **Query & Filter** - Search by service, model, subject, tags
- ✅ **Presigned URLs** - Secure file access với expiry
- ✅ **Multi-part Upload** - Support large files

## Architecture

```
Service (chat, pm, identity, etc.)
    ↓ HTTP POST /files/upload
File Storage API
    ├─ Validate & Extract Metadata
    ├─ Upload to MinIO
    ├─ Generate Presigned URL
    └─ Store Metadata (in-memory → DB later)
```

### Metadata Schema

```typescript
{
  id: string;              // Unique file ID
  originalName: string;    // Original filename
  mimeType: string;        // MIME type
  size: number;            // File size in bytes

  // Storage info
  bucket: string;          // MinIO bucket
  objectKey: string;       // MinIO object key
  url: string;             // Presigned URL

  // Tracking metadata
  service: string;         // "chat", "pm", "identity", etc.
  modelType: string;       // "User", "Message", "Project", etc.
  subjectId: string;       // "user-123", "message-456", etc.

  // Optional
  uploadedBy?: string;     // User ID who uploaded
  tags?: string[];         // Tags for categorization
  metadata?: object;       // Custom metadata

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### 1. Upload File

```http
POST /files/upload
Content-Type: multipart/form-data

// Form fields:
file: [binary file]
service: "chat"
modelType: "Message"
subjectId: "msg-12345"
uploadedBy: "user-123" (optional)
tags: ["screenshot", "bug-report"] (optional)
metadata: {"orderId": "123"} (optional)
```

**Response**:
```json
{
  "statusCode": 201,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "originalName": "screenshot.png",
    "mimeType": "image/png",
    "size": 1024567,
    "bucket": "files",
    "objectKey": "1732775424-f47ac10b.png",
    "url": "http://minio:9000/files/...",
    "service": "chat",
    "modelType": "Message",
    "subjectId": "msg-12345",
    "uploadedBy": "user-123",
    "tags": ["screenshot", "bug-report"],
    "createdAt": "2024-11-28T10:30:24.000Z",
    "updatedAt": "2024-11-28T10:30:24.000Z"
  },
  "message": "File uploaded successfully"
}
```

### 2. List Files

```http
GET /files?service=chat&modelType=Message&subjectId=msg-12345&page=1&limit=20
```

**Query Parameters**:
- `service` - Filter by service
- `modelType` - Filter by model type
- `subjectId` - Filter by subject ID
- `uploadedBy` - Filter by uploader
- `tags` - Filter by tags (array)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response**:
```json
{
  "statusCode": 200,
  "data": {
    "files": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 3. Get File Metadata

```http
GET /files/:id
```

**Response**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "originalName": "screenshot.png",
    ...
  }
}
```

### 4. Download File

```http
GET /files/:id/download
```

Returns file binary with appropriate headers.

### 5. Update Metadata

```http
PATCH /files/:id
Content-Type: application/json

{
  "tags": ["updated-tag"],
  "metadata": {"newField": "value"}
}
```

### 6. Delete File

```http
DELETE /files/:id
```

### 7. Delete All Files for a Subject

```http
DELETE /files/subject/:service/:modelType/:subjectId
```

Example:
```http
DELETE /files/subject/chat/Message/msg-12345
```

### 8. Health Check

```http
GET /files/health
```

## Usage Examples

### From Backend Services

#### Example 1: Upload Avatar (Identity Service)

```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('service', 'identity');
    formData.append('modelType', 'User');
    formData.append('subjectId', userId);
    formData.append('uploadedBy', userId);
    formData.append('tags', JSON.stringify(['avatar', 'profile']));

    const response = await firstValueFrom(
      this.httpService.post(
        'http://file-storage-api:3000/files/upload',
        formData,
        {
          headers: formData.getHeaders(),
        },
      ),
    );

    return response.data.data; // File metadata
  }
}
```

#### Example 2: Upload Message Attachments (Chat Service)

```typescript
@Injectable()
export class MessageService {
  async uploadAttachment(
    messageId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('service', 'chat');
    formData.append('modelType', 'Message');
    formData.append('subjectId', messageId);
    formData.append('uploadedBy', userId);

    const response = await firstValueFrom(
      this.httpService.post(
        'http://file-storage-api:3000/files/upload',
        formData,
      ),
    );

    return response.data.data.url; // Return URL to save in message
  }

  async getMessageAttachments(messageId: string) {
    const response = await firstValueFrom(
      this.httpService.get('http://file-storage-api:3000/files', {
        params: {
          service: 'chat',
          modelType: 'Message',
          subjectId: messageId,
        },
      }),
    );

    return response.data.data.files;
  }

  async deleteMessageAttachments(messageId: string) {
    await firstValueFrom(
      this.httpService.delete(
        `http://file-storage-api:3000/files/subject/chat/Message/${messageId}`,
      ),
    );
  }
}
```

#### Example 3: Upload Project Files (PM Service)

```typescript
@Injectable()
export class ProjectService {
  async uploadProjectDocument(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
    tags: string[],
  ) {
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('service', 'pm');
    formData.append('modelType', 'Project');
    formData.append('subjectId', projectId);
    formData.append('uploadedBy', userId);
    formData.append('tags', JSON.stringify(tags));
    formData.append('metadata', JSON.stringify({
      projectName: 'Project Alpha',
      uploadedAt: new Date().toISOString(),
    }));

    const response = await firstValueFrom(
      this.httpService.post(
        'http://file-storage-api:3000/files/upload',
        formData,
      ),
    );

    return response.data.data;
  }

  async listProjectFiles(projectId: string, tags?: string[]) {
    const response = await firstValueFrom(
      this.httpService.get('http://file-storage-api:3000/files', {
        params: {
          service: 'pm',
          modelType: 'Project',
          subjectId: projectId,
          tags: tags?.join(','),
        },
      }),
    );

    return response.data.data;
  }
}
```

### From Frontend (via BFF)

Frontend → BFF → File Storage Service

```typescript
// In BFF
@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
    @Headers('x-user-id') userId: string,
  ) {
    // Add uploadedBy from auth
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('service', dto.service);
    formData.append('modelType', dto.modelType);
    formData.append('subjectId', dto.subjectId);
    formData.append('uploadedBy', userId); // From auth

    return this.httpService.post(
      'http://file-storage-api:3000/files/upload',
      formData,
    );
  }
}
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000

# MinIO Configuration
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_DEFAULT_BUCKET=files
MINIO_REGION=us-east-1

# MongoDB Configuration
MONGODB_URI=mongodb://admin:password@mongodb:27017/file_storage?authSource=admin
```

## Docker Setup

Service đã được thêm vào `infra/docker/compose.dev.yml`:

```bash
# Start file storage service
docker-compose -f infra/docker/compose.dev.yml up file-storage-api

# Access Swagger docs
open http://localhost:3000/api

# Access MinIO Console
open http://localhost:9001
```

## Development

```bash
cd services/file-storage

# Install dependencies
pnpm install

# Run in development
pnpm run start:dev

# Build
pnpm run build

# Run tests
pnpm test
```

## Swagger Documentation

Khi service chạy, truy cập:
```
http://localhost:3000/api
```

Swagger UI sẽ show tất cả endpoints với schemas và examples.

## Storage Strategy

### Current: MongoDB Persistence ✅

File metadata được lưu trong MongoDB với schema:

```typescript
@Schema({ timestamps: true, collection: 'file_metadata' })
export class FileMetadata {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, unique: true })
  objectKey: string;

  @Prop({ required: true, index: true })
  service: string;

  @Prop({ required: true, index: true })
  modelType: string;

  @Prop({ required: true, index: true })
  subjectId: string;

  // ... other fields with indexes
}
```

**Indexes**:
- Compound index: `{ service, modelType, subjectId }`
- User tracking: `{ uploadedBy, createdAt }`
- Tag search: `{ tags }`

**Benefits**:
- ✅ Persistent storage
- ✅ Fast queries với indexed fields
- ✅ Flexible schema với metadata object
- ✅ Built-in timestamps
- ✅ Scalable với MongoDB sharding

## Best Practices

### 1. Always Track Context
```typescript
// Good
formData.append('service', 'chat');
formData.append('modelType', 'Message');
formData.append('subjectId', messageId);

// Bad
formData.append('service', 'unknown');
formData.append('modelType', 'File');
formData.append('subjectId', 'n/a');
```

### 2. Use Tags for Categorization
```typescript
formData.append('tags', JSON.stringify([
  'document',
  'invoice',
  'q4-2024',
]));
```

### 3. Store Minimal Metadata
```typescript
// Store only URLs in your database
message.attachments = [
  {
    fileId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    url: 'http://minio:9000/files/...',
    name: 'screenshot.png',
  },
];

// Fetch full metadata when needed
const fileMetadata = await fileService.getFile(fileId);
```

### 4. Clean Up on Delete
```typescript
// When deleting a message, delete its files
await this.httpService.delete(
  `http://file-storage-api:3000/files/subject/chat/Message/${messageId}`,
);
```

## Troubleshooting

### MinIO Connection Failed

```bash
# Check MinIO is running
docker ps | grep minio

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Access MinIO Console
open http://localhost:9001
# Login: minioadmin / minioadmin
```

### Bucket Not Found

Service auto-creates `files` bucket on startup. If issue persists:

```bash
# Restart service
docker-compose restart file-storage-api

# Check logs
docker logs uts_file_storage_api
```

### Large File Upload

Update nginx config for larger files:

```nginx
client_max_body_size 100M;
```

## Security Considerations

### For Production:

1. **Add Authentication**
   - Verify user permissions before upload
   - Check if user can access file before download

2. **Validate File Types**
   - Whitelist allowed MIME types
   - Scan for malware

3. **Rate Limiting**
   - Limit uploads per user/service
   - Prevent abuse

4. **Encrypt Files**
   - Enable MinIO encryption
   - Encrypt sensitive files before upload

5. **Access Control**
   - Implement bucket policies
   - Use private buckets with signed URLs

## Roadmap

- [ ] PostgreSQL persistence
- [ ] File versioning
- [ ] Thumbnail generation (images)
- [ ] Virus scanning
- [ ] CDN integration
- [ ] File compression
- [ ] Bulk upload/download
- [ ] File sharing links
- [ ] Access permissions per file
- [ ] Audit logs

## License

Private - UTS Platform
