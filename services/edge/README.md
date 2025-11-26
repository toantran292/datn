# Edge Service (Nginx/OpenResty)

This service provides authentication, authorization, and routing for the unified team space architecture.

## Architecture

```
Client → Edge (AuthN/AuthZ) → BFF (verify HMAC only) → internal services
```

## Features

- **Authentication**: Accepts access tokens from Authorization Bearer header or `uts_at` cookie
- **Authorization**: Calls Identity service to verify permissions
- **Caching**: Caches authorization results (TTL: 60s)
- **HMAC Signing**: Signs requests to downstream services with HMAC
- **Rate Limiting**: Basic rate limiting per IP
- **WebSocket Support**: Proper headers for WebSocket connections

## Routes

- `/pm` → pm-api:3000
- `/meet` → meet-api:3000
- `/chat` → chat-api:3000
- `/tenant` → tenant-bff:8085

## Environment Variables

### Required

- `EDGE_HMAC_SECRET`: Secret key for HMAC signing (must match BFF_HMAC_SECRET)

### Development

```bash
EDGE_HMAC_SECRET=dev-secret
```

### Production

```bash
EDGE_HMAC_SECRET=<strong-random-secret>
```

## Server Configuration

### Development
- `server_name localhost` (port 8080 → 80)

### Production
- `server_name api.unifiedteamspace.com` (change as needed)

## Usage Example

```bash
curl -i 'http://localhost:8080/tenant/me' \
  -H 'Authorization: Bearer <access-token>' \
  -H 'X-Requested-Org-Id: <org-uuid>'
```

The Edge will:
1. Extract access token from Authorization header
2. Call Identity service for authorization check
3. Cache the result
4. Set context headers (X-User-ID, X-Org-ID, etc.)
5. Sign with HMAC for BFF verification
6. Forward to tenant-bff (without Authorization header)

## Headers Set by Edge

- `X-User-ID`: User identifier
- `X-Org-ID`: Organization ID
- `X-Project-ID`: Project ID (if applicable)
- `X-Roles`: Comma-separated user roles
- `X-Permissions`: Comma-separated user permissions
- `X-Request-Id`: Request identifier for tracing
- `X-Auth-Timestamp`: Timestamp for HMAC
- `X-Auth-Signature`: HMAC signature for BFF verification

## Important Notes

- For `/tenant` routes, the Authorization header is **not forwarded** to the BFF
- The BFF relies solely on HMAC verification for authentication
- All other routes forward the Authorization header to downstream services
- Rate limiting is configured per IP (300 requests/minute with burst)
- WebSocket connections are properly supported with upgrade headers
