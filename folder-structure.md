```
datn/
├─ fe/                                        # Frontend (tất cả UI/SDK nằm tại đây)
│  ├─ apps/                                   # Standalone apps
│  │  ├─ chat-app/                            # Standalone Chat (imports chat-core-ui)
│  │  ├─ meet-app/                            # Standalone Meet (imports meet-core-ui)
│  │  └─ pm-app/                              # Standalone PM (imports pm-core-ui; embeds chat/meet)
│  ├─ unified/                                # Unified TeamSpace (integrated UI)
│  │  ├─ modules/
│  │  │  ├─ pm/                               # PM integrated shell (uses pm-core-ui)
│  │  │  ├─ chat-embed/                       # Slim shell around chat-core-ui
│  │  │  └─ meet-embed/                       # Slim shell around meet-core-ui
│  │  └─ middleware/tenant.ts                 # Resolve <tenant> from subdomain
│  ├─ packages/                               # Core UI & shared FE libs
│  │  ├─ design-system/                       # tokens, themes, base components
│  │  ├─ chat-core-ui/
│  │  │  ├─ headless/                         # hooks: useChannel, useMessages, useTyping…
│  │  │  ├─ components/                       # headless + minimal UI (overridable)
│  │  │  └─ adapters/                         # http/ws clients (OpenAPI-generated)
│  │  ├─ meet-core-ui/
│  │  │  ├─ headless/                         # useRoom, useParticipants, useMediaControl…
│  │  │  ├─ components/
│  │  │  └─ adapters/                         # signaling/SFU SDK wrappers
│  │  ├─ pm-core-ui/
│  │  │  ├─ headless/                         # useBoard, useTask, useSprint…
│  │  │  └─ components/
│  │  ├─ api-clients/                         # OpenAPI-generated REST/WS clients (TS)
│  │  ├─ auth-client/                         # OIDC (Keycloak) helpers (browser)
│  │  └─ utils/                               # logger, telemetry, date, formatters
│  └─ sdks/                                   # Optional: external embeddable bundles
│     ├─ chat-widget/                         # Build MF/Web Component from chat-core-ui
│     └─ meet-widget/                         # Meet widget (iframe/WebRTC wrapper)
│
├─ be/                                        # Backend (tất cả dịch vụ BE)
│  ├─ gateway/                                # API Gateway / BFF (NestJS/Express/Go)
│  │  ├─ src/
│  │  │  ├─ middleware/                       # auth, tenant, quota
│  │  │  └─ routes/                           # proxy/compose to services
│  │  └─ .env.example
│  ├─ bounded-contexts/
│  │  ├─ pm/                                  # Project Management (Spring Boot + Postgres)
│  │  │  ├─ domain/
│  │  │  ├─ application/                      # CQRS, services, handlers
│  │  │  ├─ interfaces/
│  │  │  │  ├─ rest/                          # Spring Web + OpenAPI binding
│  │  │  │  └─ messaging/                     # Event handlers / outbox publisher
│  │  │  └─ infrastructure/
│  │  │     ├─ persistence/                   # JPA/Repository, Flyway
│  │  │     ├─ config/                        # Spring config, security
│  │  │     └─ outbox/                        # Transactional outbox
│  │  ├─ chat/                                # Chat (NestJS + Scylla/Cassandra)
│  │  │  ├─ domain/
│  │  │  ├─ application/                      # services, command/query handlers
│  │  │  ├─ interfaces/
│  │  │  │  ├─ ws/                            # WebSocket gateway
│  │  │  │  ├─ rest/                          # Nest controllers
│  │  │  │  └─ messaging/                     # consumers/producers (events)
│  │  │  └─ infrastructure/
│  │  │     ├─ db/                            # Prisma/TypeORM/CQL schema, migrations
│  │  │     ├─ cache/                         # Redis (presence, rate limiting)
│  │  │     └─ outbox/
│  │  ├─ meeting/                             # Meeting (Java signaling + Node recorder)
│  │  │  ├─ signaling/                        # Java/Ktor/Spring
│  │  │  │  ├─ domain/
│  │  │  │  ├─ application/                   # createRoom, issueToken, join/leave…
│  │  │  │  ├─ interfaces/
│  │  │  │  │  ├─ rest/                       # join/invite/tokens
│  │  │  │  │  └─ messaging/                  # meet.room.created, meet.participant.joined
│  │  │  │  └─ infrastructure/
│  │  │  │     ├─ persistence/                # Postgres/Redis, migrations
│  │  │  │     ├─ sfu/                        # Adapter to SFU (LiveKit/Jitsi)
│  │  │  │     └─ outbox/
│  │  │  ├─ recorder/                         # Node service: receive SFU media → S3
│  │  │  │  └─ src/{ingest,storage,emit}/
│  │  │  └─ jobs/                             # Transcriber, summarizer queues
│  │  └─ foundation/                          # FOUNDATION SERVICES (Core Platform)
│  │     ├─ identity/                         # Realm-as-code, themes, scripts (Keycloak external)
│  │     ├─ billing/
│  │     │  ├─ domain/                        # Plan, Subscription, Quota, UsageLedger
│  │     │  ├─ application/                   # Policy engine, quota checks API
│  │     │  ├─ interfaces/
│  │     │  │  ├─ rest/                       # /plans /subscriptions /quota/check
│  │     │  │  └─ webhooks/                   # Stripe, VNPay webhooks
│  │     │  └─ infrastructure/                # Postgres ledger, cache, geo/IP resolver
│  │     ├─ file/
│  │     │  ├─ domain/ application/ interfaces/rest/ infrastructure/s3/
│  │     ├─ notify/
│  │     │  ├─ domain/ application/ interfaces/ infrastructure/  # SES/SMTP, WS push
│  │     └─ search/
│  │        ├─ domain/                        # Doc, ACL, RelevancePolicy
│  │        ├─ application/                   # indexers, query, context-provider
│  │        ├─ interfaces/rest/               # /search/query, /search/context
│  │        └─ infrastructure/                # OpenSearch client, pgvector/Qdrant
│  ├─ packages/                               # Shared technical libs (server-side)
│  │  ├─ api-clients/                         # OpenAPI generators for BE (Java/TS)
│  │  ├─ auth-client/                         # Keycloak helpers (server)
│  │  └─ utils/                               # logger, tracing, common tooling
│  └─ shared-kernel/                          # Technical shared code (no domain logic)
│     ├─ ts/
│     └─ java/
│
├─ infra/                                     # Infrastructure as Code & ops
│  ├─ terraform/
│  │  ├─ modules/                             # vpc, eks, rds, s3, opensearch, redis/msk, alb/nlb, route53, acm, kms, waf
│  │  └─ envs/{dev,stage,prod}/
│  ├─ k8s/
│  │  ├─ base/                                # Helm charts/manifests per service
│  │  └─ ingress/                             # wildcard *.domain, tenant routing
│  ├─ docker/                                 # dev compose: postgres, scylla/cassandra, minio, opensearch, redis, keycloak
│  └─ certs/
│
├─ diagrams/                                  # All architecture diagrams
│  ├─ c4/                                     # L1 Context, L2 Container, L3 Component
│  └─ sequences/                              # Sequence diagrams (search, billing quota…)
│
├─ docs/                                      # Documentation
│  ├─ adr/                                    # Architecture Decision Records
│  └─ runbooks/                               # SSO, quota, backup/restore, incident
│
├─ scripts/                                   # Tooling & automation scripts
│  ├─ codegen.sh                              # generate clients from OpenAPI
│  ├─ kc-export.sh / kc-import.sh             # Keycloak realm-as-code
│  └─ seed-dev.sh                             # seed sample data
│
├─ contracts/                                 # Source of truth for APIs & Events
│  ├─ openapi/
│  │  ├─ pm.yaml
│  │  ├─ chat.yaml
│  │  ├─ meeting.yaml
│  │  ├─ billing.yaml
│  │  ├─ file.yaml
│  │  ├─ notify.yaml
│  │  └─ search.yaml
│  └─ events/                                 # Avro/JSON schemas (pm.task.created, …)
│
├─ pnpm-workspace.yaml / turbo.json           # Build graph/workspaces
├─ Makefile                                   # dev-up / build / test / deploy
└─ .github/workflows/ci.yml                   # CI: path filters, contract-tests, quality gates
```