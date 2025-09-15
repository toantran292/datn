```
datn/
├─ services/
│  ├─ bff/                                    # Backend-for-Frontend (NestJS) – public REST for clients
│  │  ├─ app/                                 # NestJS source (controllers, modules, middlewares)
│  │  ├─ configs/                             # App config (rate limit, cache, env schema)
│  │  ├─ contracts/                           # OpenAPI spec exposed to clients
│  │  ├─ tests/                               # Unit/integration tests
│  │  └─ Dockerfile
│  │
│  ├─ auth/                                   # Auth Service (Go) – verify JWT (JWKS) + sign HMAC context
│  │  ├─ app/                                 # Go source (main.go, handlers, gRPC clients)
│  │  ├─ configs/                             # JWKS URL, cache TTL, HMAC secret
│  │  ├─ contracts/                           # Proto/gRPC client stubs to Identity
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ edge/                                   # Edge Gateway (Nginx) – TLS termination + reverse proxy
│  │  ├─ configs/                             # nginx.conf and snippets
│  │  ├─ certs/                               # TLS certs (dev/test)
│  │  ├─ tests/
│  │  └─ Dockerfile                           # FROM nginx:alpine + COPY configs
│  │
│  ├─ identity/                               # Identity & Verification (IdP: OIDC/JWKS)
│  │  ├─ app/                                 # Keycloak adapter or custom IdP
│  │  ├─ realm/                               # Realm-as-code, themes, scripts
│  │  ├─ contracts/                           # OpenAPI/events for Identity
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ billing/                                # Billing & Quota
│  │  ├─ app/                                 # Domain/application logic (CQRS)
│  │  ├─ jobs/                                # Usage aggregator, invoicer, schedulers
│  │  ├─ contracts/                           # OpenAPI/events billing.*
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ file/                                   # File & Media Service
│  │  ├─ app/
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ notify/                                 # Notification + WS hub
│  │  ├─ app/                                 # HTTP + WebSocket + workers (email/push)
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ search/                                 # Unified Search
│  │  ├─ app/                                 # Indexers, query APIs, context providers
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ chat/                                   # Chat Service
│  │  ├─ api/                                 # Backend service (Nest/Go)
│  │  ├─ sdk/                                 # Client SDK (TS) + WS adapters
│  │  ├─ workers/                             # Kafka consumers, outbox publishers
│  │  ├─ contracts/                           # OpenAPI + events chat.*
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ meeting/                                # Meeting Service
│  │  ├─ signaling/                           # Signaling API
│  │  ├─ recorder/                            # Media ingest → S3
│  │  ├─ sdk/
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  └─ pm/                                     # Project Management Service
│     ├─ api/
│     ├─ sdk/
│     ├─ workers/
│     ├─ contracts/
│     ├─ tests/
│     └─ Dockerfile
│
├─ apps/                                      # User-facing frontends (shells)
│  ├─ unified-teamespace/                     # Integrated app embedding chat/meet/pm UI
│  ├─ chat-app/
│  ├─ meet-app/
│  └─ pm-app/
│
├─ packages/                                  # Shared libraries
│  ├─ design-system/                           # Tokens, theme, base components
│  ├─ fe-utils/                                # Frontend utils (logger, telemetry, i18n…)
│  ├─ be-utils/                                # Backend utils (JSON logger, tracing, http, outbox)
│  ├─ api-clients/                             # Generated OpenAPI/SDK clients
│  ├─ auth-client/                             # OIDC helpers (browser & server)
│  └─ event-schemas/                           # Avro/JSON Schemas + codegen types
│
├─ infra/
│  ├─ docker/                                  # Local dev with Docker Compose
│  │  ├─ compose.dev.yml
│  │  └─ env/.env.example
│  ├─ certs/                                   # TLS certs for local/stage (if needed)
│  └─ scripts/                                 # Infra tooling (seed, migrate, codegen)
│
├─ contracts/                                  # Central source of truth (if not inside each service)
│  ├─ openapi/
│  └─ events/
│
├─ diagrams/                                   # Architecture docs (Mermaid/C4)
│  ├─ architecture.md
│  └─ system-context.md
│
├─ docs/                                       # ADRs, runbooks, standards
│  ├─ adr/
│  └─ runbooks/
│
├─ scripts/                                    # Shared dev scripts/tools
├─ Makefile
├─ pnpm-workspace.yaml                         # or nx/turbo
└─ .github/workflows/                          # CI pipelines
   ├─ ci.yml                                   # build+test+lint+scan
   ├─ docker-publish.yml                       # build & push Docker images
   └─ compose-deploy.yml                       # deploy via docker compose
```