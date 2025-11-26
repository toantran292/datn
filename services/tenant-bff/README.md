# Tenant BFF (Backend for Frontend)

A NestJS-based BFF service that provides a secure API layer for tenant-specific operations. This service relies on HMAC verification for authentication, ensuring secure communication with the Edge service.

## Architecture

```
Client → Edge (AuthN/AuthZ) → BFF (verify HMAC only) → internal services
```

## Features

- **HMAC Authentication**: Verifies requests from Edge service using HMAC signatures
- **Replay Protection**: Prevents replay attacks using timestamp validation and cache
- **Permission-based Authorization**: Role and permission-based access control
- **Caching**: Built-in caching for performance optimization
- **Rate Limiting**: Request throttling to prevent abuse
- **Swagger Documentation**: API documentation in development mode
- **Structured Logging**: Pino-based logging with pretty printing

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=8085                    # Service port
NODE_ENV=development         # Environment (development/production)
BFF_HMAC_SECRET=change-me-dev # HMAC secret (must match EDGE_HMAC_SECRET)
CLOCK_SKEW_SEC=300          # Allowed timestamp skew in seconds
REPLAY_TTL_SEC=60           # Replay protection TTL in seconds
IDENTITY_BASE_URL=http://identity:40000 # Identity service URL
SERVICE_TIMEOUT_MS=3500     # Service timeout in milliseconds
CACHE_TTL_SEC=60            # Cache TTL in seconds
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
cd services/tenant-bff
pnpm install
```

### Running

```bash
# Development mode with hot reload
pnpm start:dev

# Production build
pnpm build
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Tenant Operations
- `GET /tenant/me` - Get current user context (requires HMAC authentication)

## Authentication Flow

1. **Edge Service** receives client request with Authorization header
2. **Edge Service** validates token with Identity service
3. **Edge Service** signs request with HMAC using shared secret
4. **BFF Service** verifies HMAC signature and extracts user context
5. **BFF Service** processes request with validated user context

## HMAC Verification

The BFF verifies requests using the following process:

1. **Extract Headers**: Gets user context from Edge-set headers
2. **Validate Timestamp**: Ensures request is within allowed time window
3. **Verify Signature**: Validates HMAC signature using shared secret
4. **Replay Protection**: Checks cache to prevent replay attacks
5. **Set Context**: Attaches user context to request object

## Headers Expected from Edge

- `X-User-ID`: User identifier
- `X-Org-ID`: Organization ID
- `X-Project-ID`: Project ID (optional)
- `X-Roles`: Comma-separated user roles
- `X-Permissions`: Comma-separated user permissions
- `X-Auth-Timestamp`: Unix timestamp for HMAC
- `X-Auth-Signature`: HMAC signature in format "v1 <base64_signature>"

## Usage Example

```bash
# Request through Edge service
curl -i 'http://localhost:8080/tenant/me' \
  -H 'Authorization: Bearer <access-token>' \
  -H 'X-Requested-Org-Id: <org-uuid>'

# Response
{
  "user": {
    "id": "user-123",
    "roles": ["admin", "user"],
    "perms": ["read:tenant", "write:tenant"]
  },
  "orgId": "org-456",
  "projectId": "proj-789"
}
```

## Security Features

- **HMAC Verification**: All requests must be signed by Edge service
- **Timestamp Validation**: Prevents replay attacks with configurable skew
- **Replay Protection**: Caches signatures to prevent duplicate requests
- **Permission Guards**: Decorator-based permission checking
- **Rate Limiting**: Built-in request throttling
- **Input Validation**: Zod-based environment and input validation

## Development Notes

- Swagger documentation available at `/docs` in development mode
- Structured logging with Pino for better observability
- TypeScript with strict type checking
- ESLint and Prettier for code quality
- Jest for testing (test files to be added)

## Production Considerations

- Set `NODE_ENV=production` to disable Swagger
- Use strong, unique `BFF_HMAC_SECRET`
- Configure proper logging levels
- Set up monitoring and alerting
- Use proper cache configuration for production load