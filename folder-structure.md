```
datn/
├─ services/
│  ├─ gateway/                                 # API Gateway (entrypoint)
│  │  ├─ app/                                  # gateway code (Nest/Go/…)
│  │  ├─ charts/uts-gateway/                   # Helm chart for gateway
│  │  ├─ configs/                              # route map, rate-limit, auth policy
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ identity/                                # Foundation: Identity & Verification
│  │  ├─ app/                                  # adapter to Keycloak or custom service
│  │  ├─ realm/                                # realm-as-code, themes, scripts
│  │  ├─ charts/uts-identity/
│  │  ├─ contracts/                            # OpenAPI/Events specific to this service (if any)
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ billing/
│  │  ├─ app/                                  # domain, application, interfaces (CQRS)
│  │  ├─ jobs/                                 # usage aggregator, invoicer…
│  │  ├─ charts/uts-billing/
│  │  ├─ contracts/                            # openapi/events billing.*
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ file/                                    # Foundation: File & Media
│  │  ├─ app/
│  │  ├─ charts/uts-file/
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ notify/                                  # Foundation: Notification + WS hub
│  │  ├─ app/                                  # http + ws + workers (email/push)
│  │  ├─ charts/uts-notify/
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ search/                                  # Foundation: Unified Search
│  │  ├─ app/                                  # indexers, query, context-provider
│  │  ├─ charts/uts-search/
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ chat/                                    # Product team: Chat
│  │  ├─ api/                                  # backend service (Nest/Go/…)
│  │  ├─ ui/                                   # frontend module/app (standalone or embedded)
│  │  ├─ sdk/                                  # client sdk (ts) + ws adapters
│  │  ├─ workers/                              # consumers, outbox publisher
│  │  ├─ charts/uts-chat/
│  │  ├─ contracts/                            # openapi + events chat.*
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  ├─ meeting/                                 # Product team: Meeting
│  │  ├─ signaling/                            # signaling api
│  │  ├─ recorder/                             # ingest media -> S3
│  │  ├─ ui/
│  │  ├─ sdk/
│  │  ├─ charts/uts-meeting/
│  │  ├─ contracts/
│  │  ├─ tests/
│  │  └─ Dockerfile
│  │
│  └─ pm/                                      # Product team: Project Management
│     ├─ api/
│     ├─ ui/
│     ├─ sdk/
│     ├─ workers/
│     ├─ charts/uts-pm/
│     ├─ contracts/
│     ├─ tests/
│     └─ Dockerfile
│
├─ apps/                                       # Aggregated user-facing applications (shells)
│  ├─ unified-teamespace/                      # Integrated app (embeds chat/meet/pm UI)
│  ├─ chat-app/                                # Standalone Chat app (if needed)
│  ├─ meet-app/
│  └─ pm-app/
│
├─ packages/                                   # Shared libraries reused across services
│  ├─ design-system/                           # tokens, theme, base components
│  ├─ fe-utils/                                # frontend utils: logger, telemetry, date, i18n
│  ├─ be-utils/                                # backend utils: JSON logger, tracing, http, outbox, idempotency
│  ├─ api-clients/                             # generated OpenAPI/SDK clients (ts/java)
│  ├─ auth-client/                             # OIDC helpers (browser & server)
│  └─ event-schemas/                           # Avro/JSON Schemas + codegen types
│
├─ infra/
│  ├─ docker/                                  # compose.dev.yml (pg, redis, minio, opensearch, redpanda, mailhog)
│  ├─ k8s/                                     # kind config, wildcard ingress, base manifests
│  ├─ helm/                                    # library chart + global values
│  ├─ terraform/                               # (prod) vpc, eks, rds, s3, opensearch, route53…
│  └─ certs/
│
├─ contracts/                                  # Central source of truth (if not kept inside each service)
│  ├─ openapi/                                 # can sync from each service via CI
│  └─ events/
│
├─ diagrams/                                   # Mermaid/C4/sequence diagrams (ELK layout)
│  ├─ architecture.md
│  └─ system-context.md
│
├─ docs/                                       # ADR, runbooks, standards
│  ├─ adr/
│  └─ runbooks/
│
├─ scripts/                                    # shared tools: codegen, kc-export/import, seed
├─ Makefile
├─ pnpm-workspace.yaml                         # or nx/turbo workspaces
├─ turbo.json                                  # (optional) build graph
└─ .github/workflows/                          # CI pipelines
   ├─ ci.yml                                   # build+test+lint+scan
   ├─ docker-publish.yml                       # build & push docker images
   └─ helm-deploy.yml                          # helm lint & deploy per namespace
```