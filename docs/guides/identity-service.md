# Identity Service

## Overview

Identity Service (Java/Spring Boot) manages users, organizations, authentication, authorization, and invitations. It serves as the central identity provider for the platform.

## Architecture

```
Edge Gateway → Identity Service → PostgreSQL
     ↑              ↓
   JWT/JWKS    Notifications (emails)
```

## Base URL

- Internal: `http://identity-api:8081`
- Port: `8081`

## Authentication Endpoints

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Email Verification
```http
GET /auth/verify-email?token=xxx
```

### Resend Verification
```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Change Password
```http
POST /auth/password/change
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpass",
  "new_password": "newpass"
}
```

### Link Google Account
```http
POST /auth/link-google
Content-Type: application/json

{
  "google_sub": "google-id",
  "google_email": "user@gmail.com",
  "password": "existing-password"
}
```

## Token Endpoints

### Exchange Code for Tokens
```http
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=xxx&redirect_uri=xxx
```

### Refresh Token
```http
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=xxx
```

### Get JWKS
```http
GET /oauth2/jwks
```

## Authorization Endpoints

### Check Permission
```http
GET /authz/check?user_id=xxx&org_id=xxx&permission=org.read
```

Response:
```json
{
  "user_id": "uuid",
  "org_id": "uuid",
  "permission": "org.read",
  "allow": true,
  "reason": "ok"
}
```

### Batch Check
```http
POST /authz/check/batch
Content-Type: application/json

[
  { "user_id": "uuid", "org_id": "uuid", "permission": "org.read" },
  { "user_id": "uuid", "org_id": "uuid", "permission": "user.invite" }
]
```

### Check for Current User
```http
GET /authz/check/me?permission=org.read
Authorization: Bearer <token>
X-Requested-Org-Id: <org-uuid>
```

## Role Permissions

| Role | Permissions |
|------|-------------|
| OWNER | org.read, org.manage, user.invite, member.manage, rbac.manage, project.manage, project.member.manage |
| ADMIN | org.read, user.invite, member.manage, rbac.manage, project.manage, project.member.manage |
| MEMBER | org.read |

## Organization Endpoints

### Create Organization
```http
POST /orgs
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "my-org",
  "name": "My Organization"
}
```

### Get Organization
```http
GET /orgs/{orgId}
Authorization: Bearer <token>
```

### Update Organization
```http
PATCH /orgs/{orgId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "New Name",
  "description": "New description"
}
```

### Resolve Slug
```http
GET /orgs/resolve?slug=my-org
Authorization: Bearer <token>
```

### Check Slug Availability
```http
GET /orgs/availability?slug=new-slug
```

### Get My Organizations
```http
GET /orgs/my
Authorization: Bearer <token>
```

## Member Management

### List Members
```http
GET /orgs/{orgId}/members?page=0&size=20
Authorization: Bearer <token>
```

Response:
```json
{
  "content": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "roles": ["MEMBER"],
      "memberType": "STAFF",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalElements": 50,
  "totalPages": 3
}
```

### Invite Member
```http
POST /orgs/{orgId}/members/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

### Update Member Roles
```http
PUT /orgs/{orgId}/members/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "uuid",
  "roles": ["ADMIN"]
}
```

### Remove Member
```http
DELETE /orgs/{orgId}/members/{userId}
Authorization: Bearer <token>
```

## Invitation Endpoints

### List Pending Invitations
```http
GET /orgs/{orgId}/invitations
Authorization: Bearer <token>
```

### Cancel Invitation
```http
DELETE /orgs/{orgId}/invitations/{invitationId}
Authorization: Bearer <token>
```

### Accept Invitation (Public)
```http
POST /invitations/accept
Content-Type: application/json

{
  "token": "invitation-token"
}
```

### Get Invitation Info (Public)
```http
GET /invitations/{token}
```

## Transfer Ownership

```http
POST /orgs/{orgId}/transfer-ownership
Authorization: Bearer <token>
Content-Type: application/json

{
  "newOwnerId": "uuid",
  "password": "current-password",
  "confirmation": "TRANSFER"
}
```

## Internal Endpoints (Service-to-Service)

These endpoints are for internal use by BFF/other services. No auth required but should be network-restricted.

### Get Org Details
```http
GET /internal/orgs/{orgId}
```

### Update Org
```http
PATCH /internal/orgs/{orgId}
Content-Type: application/json

{
  "displayName": "New Name",
  "description": "New description"
}
```

### Update Logo
```http
PATCH /internal/orgs/{orgId}/logo
Content-Type: application/json

{
  "logoUrl": "asset-id-or-null"
}
```

### List Members (Internal)
```http
GET /internal/orgs/{orgId}/members?page=0&size=20
```

### Invite Member (Internal)
```http
POST /internal/orgs/{orgId}/members/invite
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "ADMIN"
}
```

### Update Member Role (Internal)
```http
PATCH /internal/orgs/{orgId}/members/{userId}/role
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### Remove Member (Internal)
```http
DELETE /internal/orgs/{orgId}/members/{userId}
```

### List Invitations (Internal)
```http
GET /internal/orgs/{orgId}/invitations
```

### Cancel Invitation (Internal)
```http
DELETE /internal/orgs/{orgId}/invitations/{invitationId}
```

### Resend Invitation (Internal)
```http
POST /internal/orgs/{orgId}/invitations/{invitationId}/resend
```

## Integration from BFF

```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IdentityService {
  private readonly baseUrl = 'http://identity-api:8081';

  constructor(private http: HttpService) {}

  async getOrgSettings(orgId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}`;
    const res = await firstValueFrom(this.http.get(url));
    return res.data;
  }

  async updateOrgSettings(orgId: string, data: UpdateOrgDto) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}`;
    const res = await firstValueFrom(this.http.patch(url, {
      displayName: data.name,
      description: data.description,
    }));
    return res.data;
  }

  async listMembers(orgId: string, page: number, size: number) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/members`;
    const res = await firstValueFrom(
      this.http.get(url, { params: { page, size } })
    );
    return res.data;
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | Yes | - | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Yes | - | DB username |
| `SPRING_DATASOURCE_PASSWORD` | Yes | - | DB password |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `UTS_COOKIE_DOMAIN` | No | localhost | Cookie domain |
| `UTS_COOKIE_SECURE` | No | false | Use secure cookies |
| `MAIL_HOST` | Yes | - | SMTP host |
| `MAIL_PORT` | Yes | - | SMTP port |
| `MAIL_USERNAME` | Yes | - | SMTP username |
| `MAIL_PASSWORD` | Yes | - | SMTP password |

## Important Notes

- All public endpoints require valid JWT token via `Authorization: Bearer` header
- Organization context via `X-Requested-Org-Id` header for org-scoped operations
- Internal endpoints (`/internal/*`) should only be called from trusted services
- OWNER role has all permissions and cannot have role changed
- Password is required for sensitive operations (transfer ownership)
