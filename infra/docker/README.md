# UTS Development Environment

Docker Compose setup for UTS (Unified Team Space) development environment.

## Requirements

- Docker & Docker Compose
- Make (optional, for using Makefile)
- OpenSSL (for generating JWT keys)

## Quick Start

### 1. Environment Configuration

```bash
# Copy environment template
cp env.template .env.dev

# Edit the required values
nano .env.dev
```

### 2. Generate JWT Keys for Identity Service

```bash
# Navigate to identity service directory
cd ../../services/identity

# Generate private key
openssl genpkey -algorithm RSA -out private.pem -pkcs8 -pkeyopt rsa_keygen_bits:2048

# Generate public key
openssl rsa -pubout -in private.pem -out public.pem

# Return to docker directory
cd ../../infra/docker
```

### 3. Start Services

```bash
# Start all services
docker compose -f compose.dev.yml --env-file .env.dev up -d

# Or start only infrastructure services
docker compose -f compose.dev.yml --env-file .env.dev up -d postgres redis minio opensearch redpanda mailhog

# Start identity service
docker compose -f compose.dev.yml --env-file .env.dev up -d identity

# Start gateway service
docker compose -f compose.dev.yml --env-file .env.dev up -d gateway
```

### 4. Health Checks

```bash
# Check all containers
docker compose -f compose.dev.yml ps

# View identity service logs
docker compose -f compose.dev.yml logs -f identity

# View gateway service logs
docker compose -f compose.dev.yml logs -f gateway
```

## Services & Ports

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| PostgreSQL | 5432 | 41000 | `postgresql://localhost:41000/uts_db` |
| Redis | 6379 | 41100 | `redis://localhost:41100` |
| MinIO API | 9000 | 41200 | `http://localhost:41200` |
| MinIO Console | 9001 | 41201 | `http://localhost:41201` |
| OpenSearch | 9200 | 41300 | `http://localhost:41300` |
| OpenSearch Node | 9600 | 41302 | `http://localhost:41302` |
| OS Dashboards | 5601 | 41301 | `http://localhost:41301` |
| Kafka (RedPanda) | 9092 | 41400 | `localhost:41400` |
| PandaProxy | 8082 | 41401 | `http://localhost:41401` |
| MailHog UI | 8025 | 41500 | `http://localhost:41500` |
| MailHog SMTP | 1025 | 41501 | `smtp://localhost:41501` |
| **Gateway Service** | 8080 | 8080 | `http://localhost:8080` |
| **Identity Service** | 40000 | 40000 | `http://localhost:40000` |

## Service Configuration

### Required Environment Variables

Configure in `.env.dev`:

```bash
# Database
PG_USER=uts_user
PG_PASSWORD=uts_password_dev
PG_DB=uts_db

# Services
IDENTITY_PORT=40000
GATEWAY_PORT=8080
IDENTITY_BASE_URL=http://host.docker.internal:40000

# Security
PWD_PEPPER=your-password-pepper-string
RSA_PRIVATE_KEY_PATH=/app/private.pem
RSA_PUBLIC_KEY_PATH=/app/public.pem

# Google OAuth2 (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenSearch Node Port
OS_NODE_PORT=41302
```

### API Endpoints

#### Gateway Service
- Health Check: `http://localhost:8080/health`
- API Gateway: `http://localhost:8080/api/*`

#### Identity Service
- Health Check: `http://localhost:40000/actuator/health`
- OpenAPI Docs: `http://localhost:40000/v3/api-docs`
- Authentication: `http://localhost:40000/auth/*`

## Troubleshooting

### 1. Identity Service Won't Start

```bash
# Check logs
docker compose -f compose.dev.yml logs identity

# Check JWT keys exist
ls -la ../../services/identity/*.pem

# Restart service
docker compose -f compose.dev.yml restart identity
```

### 2. Database Connection Failed

```bash
# Check PostgreSQL logs
docker compose -f compose.dev.yml logs postgres

# Test connection
docker compose -f compose.dev.yml exec postgres psql -U uts_user -d uts_db -c "SELECT 1;"
```

### 3. Build Failed

```bash
# Rebuild image without cache
docker compose -f compose.dev.yml build --no-cache identity

# Remove old containers and images
docker compose -f compose.dev.yml down
docker rmi uts-dev_identity
docker compose -f compose.dev.yml up -d identity
```

### 4. Gateway Service Issues

```bash
# Check gateway logs
docker compose -f compose.dev.yml logs gateway

# Check if identity service is accessible
curl http://localhost:40000/actuator/health

# Restart gateway
docker compose -f compose.dev.yml restart gateway
```

### 5. Missing Environment Variables

```bash
# Check if .env.dev exists
ls -la .env.dev

# Copy from template if missing
cp env.template .env.dev

# Verify required variables are set
docker compose -f compose.dev.yml config
```

## Development Workflow

### 1. Code Changes

#### Identity Service (Java)
```bash
# After changing Java code
docker compose -f compose.dev.yml build identity
docker compose -f compose.dev.yml up -d identity
```

#### Gateway Service (Node.js)
```bash
# After changing TypeScript code
docker compose -f compose.dev.yml build gateway
docker compose -f compose.dev.yml up -d gateway
```

### 2. Database Migration

```bash
# Flyway runs automatically on startup
# To run manually:
docker compose -f compose.dev.yml exec identity ./gradlew flywayMigrate
```

### 3. Testing

```bash
# Run tests in container
docker compose -f compose.dev.yml exec identity ./gradlew test

# Or run tests locally
cd ../../services/identity
./gradlew test
```

### 4. Using Makefile Commands

```bash
# Setup development environment
make dev-setup

# Start all services
make dev-up

# View logs
make dev-logs

# View identity service logs only
make dev-identity-logs

# Rebuild identity service
make dev-identity-build

# Stop all services
make dev-down
```

## Production Notes

- Change all default passwords
- Use secrets management for JWT keys and sensitive data
- Configure proper logging and monitoring
- Setup database backups
- Use production-grade PostgreSQL
- Configure proper CORS policies
- Use HTTPS with valid certificates
- Implement rate limiting and security headers
