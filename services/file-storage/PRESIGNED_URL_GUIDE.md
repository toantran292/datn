# File Storage - Presigned URL Upload Guide

## Overview

File Storage Service sử dụng **Presigned URL flow** để upload files. Điều này cho phép client upload file trực tiếp lên MinIO mà không cần qua backend server.

## Flow Upload

### 1. Service Backend: Tạo Presigned URL

```typescript
// Example: Chat service tạo presigned URL cho attachment
POST http://file-storage-api:3000/files/presigned-url
Content-Type: application/json

{
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1048576,
  "service": "chat",
  "modelType": "Message",
  "subjectId": "msg-123",
  "uploadedBy": "user-456",
  "tags": ["attachment"],
  "metadata": {
    "roomId": "room-789"
  }
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "assetId": "67890abcdef",
    "presignedUrl": "http://minio:9000/files/1234567890-uuid.pdf?X-Amz-...",
    "objectKey": "1234567890-uuid.pdf",
    "expiresIn": 3600
  }
}
```

### 2. Service Backend: Lưu assetId

```typescript
// Lưu assetId vào database của service
await messageRepo.update(messageId, {
  attachments: ['67890abcdef']  // Lưu assetId
});
```

### 3. Frontend: Upload file trực tiếp lên MinIO

```typescript
// Upload file bằng presigned URL
await fetch(presignedUrl, {
  method: 'PUT',
  body: fileBlob,
  headers: {
    'Content-Type': 'application/pdf',
  },
});
```

### 4. Frontend/Backend: Confirm upload

```typescript
POST http://file-storage-api:3000/files/confirm-upload
Content-Type: application/json

{
  "assetId": "67890abcdef"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "67890abcdef",
    "uploadStatus": "completed",
    "url": "http://minio:9000/files/1234567890-uuid.pdf?X-Amz-..."
  }
}
```

## Integration Example

### Chat Service Backend

```typescript
class MessageService {
  async createMessageWithAttachments(
    userId: string,
    roomId: string,
    text: string,
    files: FileMetadata[]
  ) {
    // 1. Tạo message trước
    const message = await this.messageRepo.save({
      userId,
      roomId,
      text,
      attachments: [],
    });

    const uploadUrls = [];

    // 2. Tạo presigned URL cho từng file
    for (const file of files) {
      const response = await this.httpService.post(
        'http://file-storage-api:3000/files/presigned-url',
        {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          service: 'chat',
          modelType: 'Message',
          subjectId: message.id,
          uploadedBy: userId,
          tags: ['attachment'],
          metadata: { roomId },
        }
      ).toPromise();

      uploadUrls.push({
        assetId: response.data.data.assetId,
        presignedUrl: response.data.data.presignedUrl,
        originalName: file.name,
      });
    }

    // 3. Lưu assetIds vào message
    await this.messageRepo.update(message.id, {
      attachments: uploadUrls.map(u => u.assetId),
    });

    // 4. Trả về presigned URLs cho frontend
    return {
      messageId: message.id,
      uploadUrls,
    };
  }

  async getMessageWithFiles(messageId: string) {
    const message = await this.messageRepo.findById(messageId);

    // Lấy thông tin files từ file-storage
    const files = await Promise.all(
      message.attachments.map(assetId =>
        this.httpService.get(`http://file-storage-api:3000/files/${assetId}`)
          .toPromise()
          .then(res => res.data.data)
      )
    );

    return {
      ...message,
      files,  // Array of FileMetadata with download URLs
    };
  }
}
```

### Frontend (React)

```typescript
const uploadMessageWithFiles = async (text: string, files: File[]) => {
  // 1. Tạo message và lấy presigned URLs
  const fileMetadata = files.map(f => ({
    name: f.name,
    type: f.type,
    size: f.size,
  }));

  const { messageId, uploadUrls } = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, files: fileMetadata }),
  }).then(r => r.json());

  // 2. Upload từng file trực tiếp lên MinIO
  await Promise.all(
    uploadUrls.map(async (upload, index) => {
      // Upload file
      await fetch(upload.presignedUrl, {
        method: 'PUT',
        body: files[index],
        headers: {
          'Content-Type': files[index].type,
        },
      });

      // Confirm upload
      await fetch('http://localhost:41111/files/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: upload.assetId }),
      });
    })
  );

  return messageId;
};
```

## Testing với curl

### 1. Tạo presigned URL

```bash
curl -X POST http://localhost:41111/files/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "originalName": "test.txt",
    "mimeType": "text/plain",
    "size": 100,
    "service": "chat",
    "modelType": "Message",
    "subjectId": "msg-123",
    "uploadedBy": "user-1"
  }'
```

### 2. Upload file bằng presigned URL

```bash
# Lấy presigned URL từ response ở bước 1
curl -X PUT "http://localhost:9000/files/xxx.txt?X-Amz-..." \
  -H "Content-Type: text/plain" \
  --data-binary "@test.txt"
```

### 3. Confirm upload

```bash
curl -X POST http://localhost:41111/files/confirm-upload \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "67890abcdef"
  }'
```

## Benefits

✅ **Performance**: File không đi qua backend server
✅ **Scalability**: Backend không xử lý large files
✅ **Security**: Presigned URL có thời gian expire
✅ **Tracking**: Backend biết trước file sẽ được upload (có assetId ngay)
✅ **Reliability**: Upload thất bại không ảnh hưởng backend

## Production Notes

- Presigned URL expire sau 1 giờ (default)
- Download URL expire sau 7 ngày
- Files với status "pending" nên được cleanup định kỳ
- Nên thêm webhook để notify service khi upload hoàn thành
