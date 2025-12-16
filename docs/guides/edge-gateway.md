# Edge Gateway Service

## Overview

Edge Gateway (Nginx/OpenResty) is the entry point for all client requests. It handles authentication, authorization, caching, and routing to downstream services.

## Architecture

```
Client → Edge (AuthN/AuthZ) → BFF/Services (HMAC verified)
```

## Features

- **Authentication**: Extracts access tokens from `Authorization: Bearer` header or `uts_at` cookie
- **Authorization**: Calls Identity service to verify permissions
- **Caching**: Caches authorization results (TTL: 60s)
- **HMAC Signing**: Signs requests for downstream service verification
- **Rate Limiting**: 300 requests/minute per IP with burst
- **WebSocket Support**: Proper upgrade headers

## Routes

| Path | Upstream | Description |
|------|----------|-------------|
| `/pm` | `pm-api:3000` | Project Management |
| `/meet` | `meet-api:3000` | Meeting Service |
| `/chat` | `chat-api:3000` | Chat Service |
| `/tenant` | `tenant-bff:8085` | Tenant BFF |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EDGE_HMAC_SECRET` | Yes | - | HMAC secret (must match `BFF_HMAC_SECRET`) |

## Headers Set by Edge

After authentication, Edge sets these headers for downstream services:

| Header | Description |
|--------|-------------|
| `X-User-ID` | User UUID |
| `X-Org-ID` | Organization UUID |
| `X-Project-ID` | Project UUID (if applicable) |
| `X-Roles` | Comma-separated user roles |
| `X-Permissions` | Comma-separated permissions |
| `X-Request-Id` | Request tracing ID |
| `X-Auth-Timestamp` | HMAC timestamp |
| `X-Auth-Signature` | HMAC signature |

## Integration

### For Clients

```bash
# Authenticated request
curl -i 'http://localhost:8080/tenant/me' \
  -H 'Authorization: Bearer <access-token>' \
  -H 'X-Requested-Org-Id: <org-uuid>'
```

### For Downstream Services

Services behind Edge should:

1. **Verify HMAC signature** using shared secret
2. **Trust headers** set by Edge (`X-User-ID`, `X-Org-ID`, etc.)
3. **Never accept** these headers directly from clients

### HMAC Verification Example (NestJS)

```typescript
import * as crypto from 'crypto';

function verifyHmac(req: Request): boolean {
  const timestamp = req.headers['x-auth-timestamp'];
  const signature = req.headers['x-auth-signature'];
  const secret = process.env.BFF_HMAC_SECRET;

  // Check timestamp freshness (5 min window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const message = `${req.method}:${req.path}:${timestamp}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Important Notes

- `/tenant` routes: Authorization header is **NOT** forwarded (BFF uses HMAC only)
- Other routes: Authorization header **IS** forwarded
- WebSocket connections are properly supported
- Rate limiting is per-IP, not per-user
