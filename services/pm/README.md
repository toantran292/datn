# PM Service (NestJS)

Project Management backend service built with NestJS and PostgreSQL.

## Prerequisites

- Node.js 20.x
- Docker & Docker Compose
- pnpm

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

Copy the example environment file:

```bash
cp .env.example .env
```

### 3. Start Database

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5433 with:
- Database: `pm_db`
- User: `pm_user`
- Password: `pm_pass`

### 4. Run Migrations

Migrations are located in `database/migrations/`. To run them:

```bash
# Connect to the database
docker exec -i pm-nestjs-postgres psql -U pm_user -d pm_db < database/migrations/V1__init_pm_schema.sql
docker exec -i pm-nestjs-postgres psql -U pm_user -d pm_db < database/migrations/V2__alter_project_org_id_to_text.sql
docker exec -i pm-nestjs-postgres psql -U pm_user -d pm_db < database/migrations/V3__change_issue_sort_order_to_numeric.sql
```

Or use the migration script:

```bash
pnpm run migrate
```

### 5. Start Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `pnpm run start` - Start production server
- `pnpm run start:dev` - Start development server with watch mode
- `pnpm run start:debug` - Start debug server
- `pnpm run build` - Build for production
- `pnpm run lint` - Lint and fix code
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run e2e tests
- `pnpm run test:cov` - Run tests with coverage
- `pnpm run migrate` - Run database migrations

## Database Schema

The service uses PostgreSQL with the following main entities:

- **Project** - Project management entity
- **Sprint** - Sprint/iteration entity
- **Issue** - Task/issue tracking entity

## API Documentation

API documentation is available at:
- Development: `http://localhost:3000/api-docs` (when Swagger is configured)

## Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f

# Reset database (⚠️ destroys all data)
docker-compose down -v
docker-compose up -d
```

## Migration from Java/Spring Boot

This service is a migration from the Java/Spring Boot version (`services/pm-java`).

### Port Differences

- **Java version**: `http://localhost:8080`
- **NestJS version**: `http://localhost:3000`
- **Java DB**: port `5432`
- **NestJS DB**: port `5433` (to run in parallel during migration)

### Database Compatibility

Both services use the same PostgreSQL schema. Migrations are copied from the Java version.

## Project Structure

```
services/pm/
├── src/
│   ├── modules/          # Feature modules
│   ├── common/           # Shared utilities
│   ├── config/           # Configuration
│   └── main.ts          # Application entry point
├── database/
│   └── migrations/       # SQL migrations
├── docker/
│   └── postgres/         # Database init scripts
├── test/                 # Tests
├── docker-compose.yml    # Database setup
├── .env                  # Environment variables (not committed)
└── .env.example         # Environment template
```

## Troubleshooting

### Port already in use

If port 5433 is already in use, update `docker-compose.yml` and `.env`:

```yaml
# docker-compose.yml
ports:
  - "5434:5432"  # Change external port
```

```bash
# .env
DATABASE_PORT=5434
```

### TypeScript errors

Restart TypeScript server in VS Code:
1. `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter

## License

UNLICENSED
