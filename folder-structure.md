```
lvtn2025/
├─ context-map/
│  ├─ contexts.md                  # Bounded contexts map, upstream/downstream
│  └─ integrations.md              # Integration contracts, policies, events
├─ apps/
│  ├─ app-web/                     # Unified UI (React/Next.js, tenant subdomain)
│  │  ├─ modules/
│  │  │  ├─ pm/                    # PM integrated shell (uses pm-core-ui)
│  │  │  ├─ chat-embed/            # Embedded Chat UI (uses chat-core-ui)
│  │  │  └─ meet-embed/            # Embedded Meet UI (uses meet-core-ui)
│  │  └─ middleware/tenant.ts      # Resolve <tenant> from subdomain
│  ├─ chat-app/                    # Standalone Chat UI (full UI)
│  ├─ meet-app/                    # Standalone Meet UI (full UI)
│  └─ pm-app/                      # Standalone PM UI (full UI)
├─ gateway/                        # API Gateway / BFF (NestJS/Express/Go)
│  ├─ src/
│  │  ├─ middleware/               # auth, tenant, quota
│  │  └─ routes/                   # proxy/compose to services
│  └─ .env.example
├─ sdks/                           # Cross-embed widgets/SDKs
│  ├─ chat-widget/                 # Build MF/Web Component from chat-core-ui
│  └─ meet-widget/                 # Meet widget (iframe/WebRTC wrapper)
├─ bounded-contexts/
│  ├─ pm/                          # Project Management (Java Spring Boot + Postgres)
│  │  ├─ domain/                   # Entities, Aggregates, Value Objects
│  │  ├─ application/              # Use cases (CQRS), services, handlers
│  │  ├─ interfaces/
│  │  │  ├─ rest/                  # Controllers (Spring Web) + OpenAPI binding
│  │  │  └─ messaging/             # Event handlers / outbox publisher
│  │  ├─ infrastructure/
│  │  │  ├─ persistence/           # JPA/Repository, Flyway migrations
│  │  │  ├─ config/                # Spring config, security
│  │  │  └─ outbox/                # Transactional outbox
│  │  └─ acl/                      # Anti-Corruption Layer mapping from Chat/Meet
│  ├─ chat/                        # Chat (NestJS + Scylla/Cassandra)
│  │  ├─ domain/
│  │  ├─ application/              # services, command/query handlers
│  │  ├─ interfaces/
│  │  │  ├─ ws/                    # WebSocket gateway
│  │  │  ├─ rest/                  # Controllers (Nest)
│  │  │  └─ messaging/             # consumers/producers (events)
│  │  ├─ infrastructure/
│  │  │  ├─ db/                    # Prisma/TypeORM/CQL schema, migrations
│  │  │  ├─ cache/                 # Redis (presence, rate limiting)
│  │  │  └─ outbox/
│  │  └─ acl/
│  ├─ meeting/                     # Meeting (Java signaling + Node recorder)
│  │  ├─ signaling/                # Java/Ktor/Spring: room token, permissions
│  │  │  ├─ domain/ application/ interfaces/ infrastructure/
│  │  ├─ recorder/                 # Node service: receive SFU media → S3
│  │  └─ jobs/                     # Transcriber, summarizer queues
│  └─ foundation/                  # FOUNDATION SERVICES (Core Platform)
│     ├─ identity/                 # Realm-as-code, themes, scripts (Keycloak external)
│     ├─ billing/                  # Stripe + VNPay; plan/quota; metering
│     │  ├─ domain/                # Plan, Subscription, Quota, UsageLedger
│     │  ├─ application/           # Policy engine, quota checks API
│     │  ├─ interfaces/
│     │  │  ├─ rest/               # /plans /subscriptions /quota/check
│     │  │  └─ webhooks/           # Stripe, VNPay webhooks
│     │  └─ infrastructure/        # Ledger DB (Postgres), cache, geo/IP resolver
│     ├─ file/                     # File & Media (S3/MinIO)
│     │  ├─ domain/ application/ interfaces/rest/ infrastructure/s3/
│     ├─ notify/                   # Notification (in-app/email)
│     │  ├─ domain/ application/ interfaces/ infrastructure/ (SES/SMTP, WS push)
│     └─ search/                   # Unified Search (OpenSearch + Vector)
│        ├─ domain/                # Doc, ACL, RelevancePolicy
│        ├─ application/           # indexers, query, context-provider
│        ├─ interfaces/rest/       # /search/query, /search/context
│        └─ infrastructure/        # OpenSearch client, pgvector/Qdrant adapter
├─ packages/                       # UI/FE core & shared libraries
│  ├─ design-system/               # tokens, themes, base components
│  ├─ chat-core-ui/                # headless hooks + minimal UI for Chat
│  ├─ meet-core-ui/                # headless hooks + minimal UI for Meet
│  ├─ pm-core-ui/                  # headless hooks + minimal UI for PM
│  ├─ api-clients/                 # clients generated from OpenAPI (TS)
│  ├─ auth-client/                 # OIDC (Keycloak) helpers
│  └─ utils/                       # logger, tracing, date, formatting
├─ contracts/                      # Source of truth for APIs & Events
│  ├─ openapi/
│  │  ├─ pm.yaml
│  │  ├─ chat.yaml
│  │  ├─ meeting.yaml
│  │  ├─ billing.yaml
│  │  ├─ file.yaml
│  │  ├─ notify.yaml
│  │  └─ search.yaml
│  └─ events/                      # Avro/JSON schemas (pm.task.created, …)
├─ shared-kernel/                  # Technical shared libs (no domain logic)
│  ├─ ts/                          # http, event SDK, telemetry (OTel)
│  └─ java/                        # base entity, result, outbox client
├─ infra/
│  ├─ terraform/
│  │  ├─ modules/                  # vpc, eks, rds, s3, opensearch, redis/msk, alb/nlb, route53, acm, kms, waf
│  │  └─ envs/{dev,stage,prod}/
│  ├─ k8s/
│  │  ├─ base/                     # Helm charts/manifests per service
│  │  └─ ingress/                  # wildcard *.domain, tenant routing
│  ├─ docker/                      # dev compose: postgres, cassandra/scylla, minio, opensearch, redis, keycloak
│  └─ certs/
├─ docs/
│  ├─ adr/                         # Architecture Decision Records
│  └─ runbooks/                    # SSO, quota, backup/restore, incident
├─ scripts/
│  ├─ codegen.sh                   # generate clients from OpenAPI
│  ├─ kc-export.sh / kc-import.sh  # realm-as-code for dev/stage/prod
│  └─ seed-dev.sh                  # seed sample data
├─ pnpm-workspace.yaml / turbo.json
├─ Makefile                        # quick dev-up / build / test / deploy
└─ .github/workflows/ci.yml        # CI: path filters, contract-tests, quality gates
```