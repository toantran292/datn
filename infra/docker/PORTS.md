Dev Port Convention

This repo uses a consistent port scheme for local development. Host ports are mapped to container ports via Docker Compose. Identity Service must be reachable on host port 40000 by convention.

Summary
- Base per-service block: 40x00
- HTTP/API port: 40x00
- WS (WebSocket) port: 40x01
- Console/Admin/Dashboard: 40x02
- Infra (databases, brokers): 41xxx

Assigned Ports

ID | Service | HTTP/API | WS | Console/Admin | In-Container
-- | ------- | -------- | -- | ------------- | -----------
—  | API Gateway (Edge)   | —        | —      | —             | 8080 (HTTP)
—  | BFF (NestJS)         | —        | —      | —             | 40800 (HTTP)
—  | Auth Service (Go)    | —        | —      | —             | 40900 (HTTP)
0  | Identity Service     | 40000    | 40001  | 40002         | 40000 (HTTP)
1  | Notification Service | 40100    | 40101  | 40102         | (service default)
2  | Billing Service      | 40200    | 40201  | 40202         | (service default)
3  | File Service         | 40300    | 40301  | 40302         | (service default)
4  | Project Management   | 40400    | 40401  | 40402         | (service default)
5  | Chat Service         | 40500    | 40501  | 40502         | (service default; WS on 40501)
6  | Meeting Service      | 40600    | 40601  | 40602         | (service default; WS on 40601)
—  | RAG Service          | 41600    | —      | —             | 3000
7  | Postgres             | 41000    | —      | —             | 5432
8  | Redis                | 41100    | —      | —             | 6379
9  | MinIO API            | 41200    | —      | 41201         | 9000/9001
10 | OpenSearch           | 41300    | —      | 41301         | 9200/9201
11 | Kafka (Redpanda)     | 41400    | —      | —             | 19092
12 | Pandaproxy           | 41401    | —      | —             | 8082
13 | MailHog HTTP         | 41500    | —      | —             | 8025
14 | MailHog SMTP         | 41501    | —      | —             | 1025


Notes
- Identity Service must be exposed at host port 40000 (HTTP). This is the default expected by other components and examples.
- Chat and Meeting typically expose their signaling endpoints on the WS port (40501, 40601).
- If a service has an embedded admin console, prefer mapping it to the …02 slot.

Compose Mapping Examples

Identity (Spring Boot inside container at 40000):

```
services:
  identity:
    build: ../../services/identity
    container_name: uts_identity
    env_file:
      - ./.env.dev
    environment:
      - PORT=40000
    ports:
      - "40000:40000"   # HTTP/API (same in-container)
      # - "40001:???"  # WS (if enabled)
      # - "40002:???"  # Admin/console (optional)
    networks: [uts_net]
```

Gateway (NestJS):

```
services:
  gateway:
    build:
      context: ../../services/gateway
      dockerfile: Dockerfile
    environment:
      - GATEWAY_PORT=8080
      - IDENTITY_BASE_URL=http://host.docker.internal:40000  # or http://identity:8080 if identity runs in Docker
    ports:
      - "8080:8080"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks: [uts_net]
```

Chat Service (example):

```
services:
  chat:
    build: ../../services/chat
    ports:
      - "40500:8080"   # HTTP/API (if any)
      - "40501:40501"  # WS signaling
      - "40502:9001"   # Console/Admin (example)
```

Environment Variables

Identity in Docker uses the infra .env values by default:
- DB_URL=jdbc:postgresql://postgres:5432/${PG_DB}
- DB_USER=${PG_USER}
- DB_PASSWORD=${PG_PASSWORD}
- RSA_PRIVATE_KEY_PATH=/app/private.pem
- RSA_PUBLIC_KEY_PATH=/app/public.pem

Gateway uses IDENTITY_BASE_URL to reach Identity:
- When Identity runs on host: http://host.docker.internal:40000
- When Identity runs in Docker: http://identity:8080

Conventions
- Reserve 40000 for Identity HTTP on host. Tooling and docs assume this default.
- Use …01 and …02 slots for WS and admin consistently to reduce conflicts.
- Infra ports (Postgres, Redis, etc.) live in the 41xxx range and map to their standard in-container ports.
- Prefer using Docker service names on the internal network; use host.docker.internal only for reaching host services from containers.
