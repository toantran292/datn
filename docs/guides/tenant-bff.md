# Tenant BFF (Backend for Frontend)

## Overview

Tenant BFF is the backend layer between the Edge Gateway and internal services for tenant-specific operations. It aggregates data from multiple services (Identity, File Storage, Notification) and provides a unified API for the tenant web application.

## Architecture

```
Client → Edge Gateway (Auth) → Tenant BFF (HMAC) → Internal Services
                                     ↓
                        ┌────────────┼────────────┐
                        ↓            ↓            ↓
                   Identity    File Storage   Notification
```

## Base URL

- Via Edge: `http://edge:8080/tenant`
- Internal: `http://tenant-bff:8085`
- Port: `8085`

## Authentication

All endpoints require HMAC verification from Edge Gateway. The following headers are set by Edge:

| Header | Description |
|--------|-------------|
| `X-User-ID` | Current user UUID |
| `X-Org-ID` | Current organization UUID |
| `X-Roles` | User roles (comma-separated) |
| `X-Auth-Timestamp` | HMAC timestamp |
| `X-Auth-Signature` | HMAC signature |

## Endpoints

### Me (Current User Context)

#### Get Current User
```http
GET /tenant/me
```

Response:
```json
{
  "user": {
    "id": "user-uuid",
    "roles": ["ADMIN"],
    "perms": ["org.read", "user.invite"]
  },
  "orgId": "org-uuid",
  "projectId": "project-uuid"
}
```

### Dashboard

#### Get Dashboard Data
```http
GET /tenant/dashboard
```

Response:
```json
{
  "stats": {
    "memberCount": 25,
    "projectCount": 10,
    "storageUsed": 1073741824,
    "storageLimit": 10737418240
  },
  "recentActivity": [...]
}
```

#### Get Recent Files
```http
GET /tenant/dashboard/recent-files?limit=5
```

### Members & Invitations

#### List Members and Invitations
```http
GET /tenant/members
```

Response:
```json
{
  "members": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "displayName": "John Doe",
      "role": "ADMIN",
      "status": "active",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "invitations": [
    {
      "id": "inv-uuid",
      "email": "jane@example.com",
      "role": "MEMBER",
      "status": "pending",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

#### Invite Member
```http
POST /tenant/members/invite
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "MEMBER",
  "project_ids": ["project-1", "project-2"]
}
```

#### Update Member Role
```http
PATCH /tenant/members/:userId/role
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### Remove Member
```http
DELETE /tenant/members/:userId
```

#### Cancel Invitation
```http
DELETE /tenant/members/invitations/:invitationId
```

#### Resend Invitation
```http
POST /tenant/members/invitations/:invitationId/resend
```

### Settings (Organization)

#### Get Organization Settings
```http
GET /tenant/settings
```

Response:
```json
{
  "id": "org-uuid",
  "name": "Acme Corp",
  "description": "Building the future",
  "logoUrl": "https://presigned-url...",
  "slug": "acme-corp",
  "status": "active",
  "settings": { ... },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

#### Update Organization Settings
```http
PATCH /tenant/settings
Content-Type: application/json

{
  "name": "New Name",
  "description": "New description"
}
```

#### Get Logo Upload URL
```http
POST /tenant/settings/logo/presigned-url
Content-Type: application/json

{
  "originalName": "logo.png",
  "mimeType": "image/png",
  "size": 102400
}
```

Response:
```json
{
  "assetId": "asset-uuid",
  "presignedUrl": "https://minio.../signed-upload-url"
}
```

#### Confirm Logo Upload
```http
POST /tenant/settings/logo/confirm
Content-Type: application/json

{
  "assetId": "asset-uuid"
}
```

#### Delete Logo
```http
DELETE /tenant/settings/logo
```

#### Delete Organization
```http
DELETE /tenant/settings/organization
```

> Note: Only OWNER role can delete organization.

### Files

#### List Files
```http
GET /tenant/files?page=1&limit=20&search=report&type=pdf
```

Response:
```json
{
  "files": [
    {
      "id": "file-uuid",
      "originalName": "report.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

#### Get Storage Usage
```http
GET /tenant/files/storage
```

Response:
```json
{
  "usedBytes": 1073741824,
  "fileCount": 150,
  "limit": 10737418240
}
```

#### Upload File (Multipart)
```http
POST /tenant/files/upload
Content-Type: multipart/form-data

file: (binary)
tags: report,finance
description: Q4 Financial Report
```

#### Get Presigned Upload URL
```http
POST /tenant/files/presigned-url
Content-Type: application/json

{
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000
}
```

Response:
```json
{
  "assetId": "asset-uuid",
  "presignedUrl": "https://minio.../signed-url",
  "expiresIn": 3600
}
```

#### Confirm Upload
```http
POST /tenant/files/confirm-upload
Content-Type: application/json

{
  "assetId": "asset-uuid"
}
```

#### Get Download URL
```http
POST /tenant/files/:id/download-url
```

Response:
```json
{
  "presignedUrl": "https://minio.../download-url",
  "expiresIn": 3600
}
```

#### Delete File
```http
DELETE /tenant/files/:id
```

## Frontend Integration

### API Client Example

```typescript
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// Get settings
const settings = await apiGet<OrgSettings>('/tenant/settings');

// Update settings
const updated = await apiPatch<OrgSettings>('/tenant/settings', {
  name: 'New Name',
});

// Upload logo with presigned URL
async function uploadLogo(file: File) {
  // Step 1: Get presigned URL
  const { assetId, presignedUrl } = await apiPost('/tenant/settings/logo/presigned-url', {
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  // Step 2: Upload to S3/MinIO
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // Step 3: Confirm upload
  return apiPost('/tenant/settings/logo/confirm', { assetId });
}

// List members
const { members, invitations } = await apiGet('/tenant/members');

// Invite member
await apiPost('/tenant/members/invite', {
  email: 'newuser@example.com',
  role: 'MEMBER',
});
```

### React Hook Pattern

```typescript
export function useOrgSettings() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    const data = await apiGet<OrgSettings>('/tenant/settings');
    setSettings(data);
    setIsLoading(false);
  };

  const updateSettings = async (data: Partial<OrgSettings>) => {
    const updated = await apiPatch<OrgSettings>('/tenant/settings', data);
    setSettings(updated);
    return updated;
  };

  useEffect(() => { fetchSettings(); }, []);

  return { settings, isLoading, updateSettings, refetch: fetchSettings };
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8085 | HTTP port |
| `BFF_HMAC_SECRET` | Yes | - | HMAC secret (must match EDGE_HMAC_SECRET) |
| `IDENTITY_URL` | Yes | - | Identity service URL |
| `FILE_STORAGE_URL` | Yes | - | File Storage service URL |
| `NOTIFICATION_URL` | Yes | - | Notification service URL |

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (HMAC verification failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., invitation already exists)
- `500` - Internal Server Error

## Important Notes

- All requests must pass through Edge Gateway for authentication
- BFF trusts headers set by Edge after HMAC verification
- Logo/avatar files are excluded from storage quota
- Organization deletion requires OWNER role
- File uploads support both multipart and presigned URL flows
- Presigned URL flow is recommended for large files
