# B2203534 - Architecture Analysis

Phân tích kiến trúc hệ thống Workspace Management với AI.

**Ngày tạo:** 2024-12-15

---

## TỔNG QUAN HỆ THỐNG

Hệ thống UTS (Unified Tenant Service) được xây dựng theo kiến trúc **Microservices** với 7 services chính, được điều phối qua Docker Compose và expose qua API Gateway (Edge/OpenResty).

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                        CLIENTS                               │
                                    │            (Web App, Mobile App, External APIs)              │
                                    └─────────────────────────┬───────────────────────────────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                    EDGE SERVICE                              │
                                    │              (OpenResty/Nginx + Lua)                         │
                                    │         • API Gateway • CORS • Rate Limiting                 │
                                    │         • JWT Validation • HMAC Signing                      │
                                    │                      Port: 8080                              │
                                    └──────┬──────┬──────┬──────┬──────┬──────┬───────────────────┘
                                           │      │      │      │      │      │
              ┌────────────────────────────┼──────┼──────┼──────┼──────┼──────┼────────────────────┐
              │                            │      │      │      │      │      │                    │
              ▼                            ▼      │      ▼      │      ▼      │                    ▼
┌─────────────────────────┐  ┌─────────────────┐ │ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    IDENTITY SERVICE     │  │   TENANT-BFF    │ │ │   PM SERVICE    │  │  CHAT SERVICE   │  │ FILE-STORAGE    │
│      (Spring Boot)      │  │    (NestJS)     │ │ │    (NestJS)     │  │    (NestJS)     │  │    (NestJS)     │
│                         │  │                 │ │ │                 │  │                 │  │                 │
│ • Authentication        │  │ • API Aggregator│ │ │ • Projects      │  │ • Real-time     │  │ • File Upload   │
│ • Authorization         │  │ • BFF Pattern   │ │ │ • Sprints       │  │   Messaging     │  │ • Presigned URL │
│ • User Management       │◄─┤ • LLM Reports   │ │ │ • Issues        │  │ • Threads       │  │ • Metadata      │
│ • Organization          │  │ • Caching       │ │ │ • Comments      │  │ • WebSocket     │  │                 │
│ • RBAC                  │  │                 │ │ │                 │  │                 │  │                 │
│ • Audit Logs            │  │                 │ │ │                 │  │                 │  │                 │
└───────────┬─────────────┘  └────────┬────────┘ │ └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
            │                         │          │          │                    │                    │
            │                         │          │          │                    │                    │
            │                         ▼          │          ▼                    │                    ▼
            │              ┌─────────────────────┴──────────────────┐            │         ┌─────────────────────┐
            │              │           NOTIFICATION SERVICE         │◄───────────┘         │                     │
            │              │               (NestJS)                 │                      │                     │
            │              │                                        │                      │       MinIO         │
            │              │  • Email Notifications (SMTP)          │                      │   (S3-Compatible)   │
            │              │  • Real-time WebSocket Notifications   │                      │                     │
            │              │  • Notification History                │                      │   Port: 41200       │
            │              │                                        │                      │                     │
            │              └───────────────────┬────────────────────┘                      └─────────────────────┘
            │                                  │                                                     ▲
            │                                  │                                                     │
            ▼                                  ▼                                                     │
┌───────────────────────────────────────────────────────────────────────────────────────────────────┴───────────┐
│                                              DATA LAYER                                                       │
│                                                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   PostgreSQL    │  │     Redis       │  │    Cassandra    │  │    MongoDB      │  │   Redpanda      │     │
│  │                 │  │                 │  │                 │  │                 │  │ (Kafka-compat)  │     │
│  │ • Identity DB   │  │ • Session Cache │  │ • Chat Messages │  │ • File Metadata │  │ • Event Stream  │     │
│  │ • PM DB         │  │ • Token Cache   │  │ • Threads       │  │ • File Audit    │  │ • Outbox Events │     │
│  │ • Notification  │  │ • Rate Limiting │  │                 │  │                 │  │                 │     │
│  │                 │  │                 │  │                 │  │                 │  │                 │     │
│  │  Port: 5432     │  │  Port: 6379     │  │  Port: 9042     │  │  Port: 27017    │  │  Port: 19092    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                                                                    │
│  │   OpenSearch    │  │    Mailhog      │                                                                    │
│  │                 │  │   (Dev Only)    │                                                                    │
│  │ • Full-text     │  │ • Email Testing │                                                                    │
│  │ • Analytics     │  │                 │                                                                    │
│  │  Port: 9200     │  │  Port: 8025     │                                                                    │
│  └─────────────────┘  └─────────────────┘                                                                    │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## CHI TIẾT CÁC SERVICES

### 1. IDENTITY SERVICE (Authentication & Authorization)

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/identity` |
| **Framework** | Spring Boot 3.5.5 |
| **Language** | Java 21 |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Message Queue** | Redpanda (Kafka) |
| **Port** | 3000 (internal) |

**Chức năng chính:**
- Xác thực người dùng (Basic, OAuth2 - Google)
- JWT/RSA token generation và validation
- Role-Based Access Control (RBAC)
- Quản lý User & Organization
- Email verification, Password reset
- Audit logging

**API Endpoints:**
```
/auth/*           - Authentication (login, register, token)
/users/*          - User management
/orgs/*           - Organization management
/invitations/*    - Invitation flow
/.well-known/jwks - Public keys (JWKS)
```

**Event Publishing (Outbox Pattern):**
```
Topics:
├── notification.email.send    → Email notifications
└── identity.*                 → Domain events
```

---

### 2. TENANT-BFF SERVICE (Backend-For-Frontend)

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/tenant-bff` |
| **Framework** | NestJS 11.x |
| **Language** | TypeScript |
| **Port** | 3000 (internal) |

**Chức năng chính:**
- API Gateway/Aggregator cho tenant-facing APIs
- Single entry point cho frontend
- Service composition và orchestration
- LLM Reports (UC16/UC17)
- Rate limiting, Caching

**API Endpoints:**
```
/tenant/me        - Current user info
/tenant/members   - Member management
/orgs/:orgId/reports/*  - AI Reports (UC16/UC17)
/health           - Health check
```

**Downstream Services:**
```
Identity Service     → Authentication, User data
File-Storage Service → File operations
Notification Service → Send notifications
```

**LLM Integrations:**
- OpenAI (GPT-4)
- Anthropic (Claude)
- Google AI (Gemini)
- Mock service (testing)

---

### 3. PM SERVICE (Project Management)

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/pm` |
| **Framework** | NestJS 11.x |
| **Language** | TypeScript |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Port** | 3001 |

**Chức năng chính:**
- Project management với org isolation
- Sprint management (FUTURE, ACTIVE, CLOSED)
- Issue tracking với parent-child relationships
- Custom workflow statuses per project
- Issue comments và activity tracking

**Database Schema:**
```sql
Project
├── Sprint
├── Issue
│   ├── IssueStatus
│   ├── IssueComment
│   └── IssueActivity
```

**API Endpoints:**
```
/api/projects/*    - Project CRUD
/api/sprints/*     - Sprint management
/api/issues/*      - Issue tracking
/api/analytics/*   - Project analytics
```

---

### 4. CHAT SERVICE (Real-time Messaging)

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/chat` |
| **Framework** | NestJS 11.x |
| **Language** | TypeScript |
| **Database** | Apache Cassandra |
| **Real-time** | Socket.io |
| **Port** | 3000 |

**Chức năng chính:**
- Real-time messaging via WebSocket
- Thread-based conversations
- Time-series message storage (Cassandra)
- Room/channel management

**API Endpoints:**
```
/messages         - Message operations
/messages/thread  - Thread messages
/rooms/*          - Room management
```

**Why Cassandra?**
- Optimized for time-series data (messages)
- High write throughput
- Horizontal scalability
- Partitioning by conversation/thread

---

### 5. NOTIFICATION SERVICE

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/notification` |
| **Framework** | NestJS 11.x |
| **Language** | TypeScript |
| **Database** | PostgreSQL (TypeORM) |
| **Email** | SMTP (Mailhog for dev) |
| **Real-time** | Socket.io |
| **Port** | 3000 |

**Chức năng chính:**
- Email notifications (SMTP)
- Real-time in-app notifications (WebSocket)
- Notification history persistence
- User online status tracking
- Broadcast messaging

**API Endpoints:**
```
/notifications/send        - Send notification
/notifications/send-bulk   - Batch send
/notifications/broadcast   - Broadcast all
/notifications/stats       - Connection stats
/notifications/health      - Health check
```

**Notification Types:**
```typescript
enum StoredNotificationType {
  ORG_INVITATION, ORG_MEMBER_JOINED, ORG_MEMBER_REMOVED,
  ORG_ROLE_CHANGED, ORG_OWNERSHIP_TRANSFERRED,
  ORG_LOCKED, ORG_UNLOCKED,
  PASSWORD_CHANGED, EMAIL_VERIFIED, PROFILE_UPDATED,
  REPORT_COMPLETED, REPORT_FAILED,
  SYSTEM_ANNOUNCEMENT, SYSTEM_MAINTENANCE
}
```

---

### 6. FILE-STORAGE SERVICE

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/file-storage` |
| **Framework** | NestJS 11.x |
| **Language** | TypeScript |
| **Object Storage** | MinIO (S3-compatible) |
| **Metadata DB** | MongoDB |
| **Port** | 3000 |

**Chức năng chính:**
- File upload via presigned URLs
- File metadata tracking
- Secure access URL generation
- Batch operations

**API Endpoints:**
```
/files/presigned-url       - Create upload URL
/files/confirm-upload      - Confirm upload
/files/presigned-get-url   - Get download URL
/files/presigned-get-urls  - Batch get URLs
/files/*                   - CRUD operations
```

**Storage Architecture:**
```
┌─────────────────┐     ┌─────────────────┐
│    MongoDB      │     │     MinIO       │
│   (Metadata)    │     │  (File Content) │
│                 │     │                 │
│ • file_id       │────▶│ • bucket/key    │
│ • original_name │     │ • binary data   │
│ • mime_type     │     │                 │
│ • size          │     │                 │
│ • org_id        │     │                 │
│ • created_at    │     │                 │
└─────────────────┘     └─────────────────┘
```

---

### 7. EDGE SERVICE (API Gateway)

| Thuộc tính | Giá trị |
|------------|---------|
| **Location** | `services/edge` |
| **Platform** | OpenResty (Nginx + Lua) |
| **Port** | 8080 (External) |

**Chức năng chính:**
- Central API Gateway
- Request routing
- JWT Validation
- HMAC Request Signing
- Rate limiting (300 req/min per IP)
- CORS handling

**Upstream Routing:**
```nginx
/api/pm/*           → pm:3000
/api/chat/*         → chat-api:3000
/api/tenant/*       → tenant-bff:3000
/api/auth/*         → identity:3000
/api/notifications/*→ notification-api:3000
/api/files/*        → file-storage-api:3000
```

---

## COMMUNICATION PATTERNS

### 1. Synchronous (HTTP/REST)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SYNCHRONOUS COMMUNICATION                        │
└─────────────────────────────────────────────────────────────────────┘

Client Request Flow:
═══════════════════

┌────────┐     ┌────────┐     ┌──────────────┐     ┌─────────────┐
│ Client │────▶│  Edge  │────▶│  Identity    │────▶│   Backend   │
└────────┘     │Gateway │     │(Auth Check)  │     │   Service   │
               └────────┘     └──────────────┘     └─────────────┘
                   │                                      │
                   │         ┌──────────────────────┐     │
                   └────────▶│ Add HMAC Signature   │─────┘
                             └──────────────────────┘

Inter-Service Calls:
════════════════════

Tenant-BFF ──HTTP──▶ Identity Service     (User auth, org data)
Tenant-BFF ──HTTP──▶ File-Storage Service (File operations)
Tenant-BFF ──HTTP──▶ Notification Service (Send notifications)
Identity   ──HTTP──▶ File-Storage Service (Avatar upload)
```

### 2. Asynchronous (Event-Driven)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ASYNCHRONOUS COMMUNICATION                        │
└─────────────────────────────────────────────────────────────────────┘

Outbox Pattern (Identity Service):
══════════════════════════════════

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Business   │────▶│   Outbox     │────▶│  Scheduled   │────▶│  Redpanda    │
│   Logic      │     │   Table      │     │    Job       │     │  (Kafka)     │
└──────────────┘     └──────────────┘     │ (5s poll)    │     └──────────────┘
                                          └──────────────┘            │
                                                                      ▼
                                                            ┌──────────────────┐
                                                            │   Consumers      │
                                                            │ • Email Service  │
                                                            │ • Analytics      │
                                                            └──────────────────┘

Event Topics:
═════════════
notification.email.send  → Email delivery
identity.user.created    → User analytics
identity.org.updated     → Audit logging
```

### 3. Real-time (WebSocket)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME COMMUNICATION                         │
└─────────────────────────────────────────────────────────────────────┘

Chat Service:
═════════════
┌────────┐                    ┌──────────────┐
│ Client │◄═══WebSocket═══════│ Chat Service │
│   A    │     (Socket.io)    │              │
└────────┘                    │  • message   │
                              │  • typing    │
┌────────┐                    │  • presence  │
│ Client │◄═══WebSocket═══════│              │
│   B    │                    └──────────────┘
└────────┘

Notification Service:
═════════════════════
┌────────┐                    ┌──────────────────┐
│ Client │◄═══WebSocket═══════│ Notification     │
│        │     (Socket.io)    │ Service          │
└────────┘                    │                  │
                              │ • new_notification│
                              │ • online_status  │
                              └──────────────────┘
```

---

## SECURITY FLOW

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

1. Login Request:
═════════════════
┌────────┐  POST /auth/token   ┌──────────────┐
│ Client │────────────────────▶│   Identity   │
│        │  {email, password}  │   Service    │
└────────┘                     └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │ Validate     │
                               │ Credentials  │
                               └──────┬───────┘
                                      │
                                      ▼
┌────────┐  {accessToken,      ┌──────────────┐
│ Client │◄────refreshToken}───│   Generate   │
│        │  (HttpOnly Cookie)  │   JWT/RSA    │
└────────┘                     └──────────────┘

2. Authenticated Request:
═════════════════════════
┌────────┐                     ┌────────┐                    ┌─────────────┐
│ Client │──Bearer Token──────▶│  Edge  │──Verify Token─────▶│  Identity   │
│        │                     │Gateway │                    │  Service    │
└────────┘                     └────┬───┘                    └─────────────┘
                                    │
                                    │ Token Valid?
                                    ▼
                               ┌─────────────────────┐
                               │ Add HMAC Signature  │
                               │ X-Signature: ...    │
                               │ X-Timestamp: ...    │
                               └──────────┬──────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │  Backend Service    │
                               │  (Verify HMAC)      │
                               └─────────────────────┘
```

### Token Types

| Token | Purpose | Expiry | Storage |
|-------|---------|--------|---------|
| Access Token | API Authentication | 15 min | Memory/LocalStorage |
| Refresh Token | Token Renewal | 7 days | HttpOnly Cookie |
| HMAC Signature | Inter-service Auth | Per-request | Request Header |

---

## DATABASE MATRIX

| Service | Database | Type | Use Case |
|---------|----------|------|----------|
| Identity | PostgreSQL | RDBMS | Users, orgs, roles, audit |
| PM | PostgreSQL | RDBMS | Projects, issues, sprints |
| Chat | Cassandra | NoSQL (Wide-column) | Messages, threads |
| Notification | PostgreSQL | RDBMS | Notification history |
| File-Storage | MongoDB | NoSQL (Document) | File metadata |
| Identity (Cache) | Redis | In-memory | Sessions, tokens, cache |

### Why Polyglot Persistence?

```
PostgreSQL (Identity, PM, Notification):
├── ACID transactions
├── Complex queries & joins
├── Relational data model
└── Strong consistency

Cassandra (Chat):
├── High write throughput
├── Time-series optimization
├── Horizontal scalability
└── Partition by conversation

MongoDB (File-Storage):
├── Flexible schema
├── Document model for metadata
├── GridFS support (optional)
└── Easy aggregation

Redis (Cache):
├── Sub-millisecond latency
├── Session management
├── Rate limiting counters
└── Pub/sub capabilities
```

---

## INFRASTRUCTURE (Docker Compose)

### Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVICE DEPENDENCY GRAPH                         │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │   Edge   │
                              │ Gateway  │
                              └────┬─────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Identity      │     │   Tenant-BFF    │     │   PM Service    │
│   Service       │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         ▼                       │                       ▼
┌─────────────────┐              │              ┌─────────────────┐
│   PostgreSQL    │◄─────────────┼──────────────│   PostgreSQL    │
└─────────────────┘              │              └─────────────────┘
         ▲                       │
         │                       │
┌─────────────────┐              │
│     Redis       │◄─────────────┤
└─────────────────┘              │
         ▲                       │
         │                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Redpanda      │◄────│  Notification   │────▶│    Mailhog      │
│   (Kafka)       │     │   Service       │     │   (SMTP Dev)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Chat Service   │────▶│   Cassandra     │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  File-Storage   │────▶│    MongoDB      │     │     MinIO       │
│   Service       │────▶│                 │     │  (S3 Storage)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|---------------|---------------|----------|
| Edge Gateway | 80 | 8080 | HTTP |
| Identity | 3000 | - | HTTP |
| Tenant-BFF | 3000 | - | HTTP |
| PM | 3001 | - | HTTP |
| Chat | 3000 | - | HTTP/WS |
| Notification | 3000 | - | HTTP/WS |
| File-Storage | 3000 | - | HTTP |
| PostgreSQL | 5432 | ${PG_PORT} | TCP |
| Redis | 6379 | ${REDIS_PORT} | TCP |
| Cassandra | 9042 | 41600 | TCP |
| MongoDB | 27017 | ${MONGO_PORT} | TCP |
| MinIO API | 41200 | ${MINIO_API_PORT} | HTTP |
| MinIO Console | 41201 | ${MINIO_CONSOLE_PORT} | HTTP |
| Redpanda | 9092/19092 | ${KAFKA_PORT} | TCP |
| OpenSearch | 9200 | ${OPENSEARCH_PORT} | HTTP |
| Mailhog UI | 8025 | ${MAILHOG_HTTP_PORT} | HTTP |

---

## TECHNOLOGY STACK SUMMARY

| Layer | Technologies |
|-------|--------------|
| **API Gateway** | OpenResty (Nginx + Lua), HMAC signing |
| **Backend Services** | NestJS (TypeScript), Spring Boot (Java) |
| **Databases** | PostgreSQL, MongoDB, Cassandra, Redis |
| **Object Storage** | MinIO (S3-compatible) |
| **Message Queue** | Redpanda (Kafka-compatible) |
| **Real-time** | Socket.io (WebSockets) |
| **Search/Analytics** | OpenSearch + Dashboards |
| **ORM/Query** | Prisma (TypeScript), TypeORM, Hibernate/JPA |
| **Validation** | Zod, Class-Validator, Jakarta Validation |
| **Logging** | Pino (Structured), SLF4J |
| **API Docs** | Swagger/OpenAPI |
| **Testing** | Jest, JUnit, Supertest |
| **Container** | Docker, Docker Compose |

---

## KEY ARCHITECTURAL DECISIONS

### 1. Microservices Pattern
Mỗi domain (PM, Chat, Identity, Notifications) được tách riêng để:
- Độc lập deployment
- Scale theo nhu cầu
- Technology flexibility

### 2. API Gateway Pattern
Edge service làm single entry point:
- Centralized authentication
- Rate limiting
- Request routing
- CORS handling

### 3. Polyglot Architecture
- Java (Identity): Enterprise security, OAuth2
- TypeScript/NestJS (others): Rapid development, async I/O

### 4. Polyglot Persistence
Mỗi database được chọn theo use case:
- PostgreSQL: Transactional data
- Cassandra: Time-series messages
- MongoDB: Flexible metadata
- Redis: Caching, sessions

### 5. Event-Driven Communication
Outbox pattern cho reliable messaging:
- Eventual consistency
- Loose coupling
- Audit trail

### 6. HMAC-based Inter-Service Auth
Stateless service-to-service authentication:
- No shared sessions
- Request signing
- Timestamp validation

### 7. Multi-tenancy
OrgId-based isolation across all services:
- Data segregation
- Access control
- Resource isolation

---

## MONITORING & OBSERVABILITY

### Health Checks
Tất cả services đều có health endpoint:
```
GET /health              - Liveness probe
GET /actuator/health     - Spring Boot (Identity)
```

### Logging
- Structured logging (JSON format)
- Pino (NestJS services)
- SLF4J (Spring Boot)
- Request tracing via correlation ID

### Metrics (Planned)
- Prometheus metrics
- Grafana dashboards
- OpenSearch for log aggregation

---

## FUTURE IMPROVEMENTS

1. **Service Mesh**: Istio/Linkerd cho advanced traffic management
2. **Distributed Tracing**: Jaeger/Zipkin integration
3. **Circuit Breaker**: Resilience4j cho fault tolerance
4. **API Versioning**: Version management strategy
5. **Event Sourcing**: Full audit trail với event store
6. **CQRS**: Command Query Responsibility Segregation cho read scaling
