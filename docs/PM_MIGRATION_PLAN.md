# PM Backend Migration Plan: Java/Spring Boot to NestJS

## Document Information
- **Created**: 2025-11-26
- **Project**: PM (Project Management) Service
- **Current Stack**: Java 17 + Spring Boot 3.5.6
- **Target Stack**: Node.js + NestJS + TypeScript
- **Database**: PostgreSQL (No change required)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Migration Objectives](#migration-objectives)
4. [Target Architecture](#target-architecture)
5. [Migration Strategy](#migration-strategy)
6. [Implementation Plan](#implementation-plan)
7. [Risk Assessment](#risk-assessment)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Strategy](#deployment-strategy)
10. [Success Criteria](#success-criteria)

---

## 1. Executive Summary

### Purpose
Migrate the PM (Project Management) backend service from Java/Spring Boot to NestJS to achieve better alignment with the existing frontend stack, improved developer productivity, and unified technology stack across the organization.

### Scope
- **In Scope**:
  - All REST API endpoints (17 endpoints total)
  - Business logic for Projects, Sprints, and Issues
  - Database schema (maintain as-is)
  - Validation and error handling
  - CORS configuration
  - Complex issue reordering algorithm

- **Out of Scope**:
  - Database migration (PostgreSQL remains unchanged)
  - Frontend modifications
  - Authentication/authorization (to be added as separate phase)
  - Multi-tenancy enforcement (to be added as separate phase)

### Timeline
- **Estimated Duration**: 2-3 weeks
- **Resource Requirement**: 1 Backend Developer (Full-time)

---

## 2. Current System Analysis

### 2.1 Technology Stack
```yaml
Language: Java 17
Framework: Spring Boot 3.5.6
ORM: Hibernate (Spring Data JPA)
Database: PostgreSQL 14+
Migration Tool: Flyway
API Documentation: SpringDoc OpenAPI
Build Tool: Maven/Gradle
```

### 2.2 Architecture Overview
```
┌─────────────────────────────────────────┐
│         Controllers Layer                │
│  (ProjectController, SprintController,   │
│   IssueController)                       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Services Layer                   │
│  (ProjectService, SprintService,         │
│   IssueService)                          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Repository Layer                    │
│  (Spring Data JPA Repositories)          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Database Layer                   │
│         PostgreSQL                       │
└─────────────────────────────────────────┘
```

### 2.3 Core Entities
1. **Project** (Main entity)
   - Identifier (unique, human-readable)
   - Organization ID (multi-tenancy)
   - Project lead and default assignee
   - One-to-many with Sprints and Issues

2. **Sprint** (Agile sprint management)
   - Belongs to a Project
   - Has start/end dates and goals
   - One-to-many with Issues

3. **Issue** (Task/bug tracking)
   - Belongs to a Project (required)
   - Can be assigned to a Sprint (optional)
   - Supports hierarchy (parent-child relationships)
   - JSONB field for assignees
   - Complex sort_order field for drag-and-drop

### 2.4 Key Features
- **CRUD Operations**: Full CRUD for all 3 entities
- **Validation**: Multi-layer validation (Bean validation + Business logic)
- **Relationship Management**: Complex cascading and orphaning rules
- **Issue Reordering**: Advanced drag-and-drop with fractional positioning
- **Error Handling**: Comprehensive error responses with field-level details
- **CORS**: Configured for localhost frontend

### 2.5 API Endpoints Summary
```
Projects (6 endpoints):
  POST   /api/projects                                  - Create
  GET    /api/projects                                  - List all (lite)
  GET    /api/projects/{id}                             - Get by ID
  GET    /api/projects/check-identifier?identifier=X    - Check availability
  PUT    /api/projects/{id}                             - Update
  DELETE /api/projects/{id}                             - Delete

Sprints (5 endpoints):
  POST   /api/sprints                                   - Create
  GET    /api/sprints/{id}                              - Get by ID
  GET    /api/projects/{projectId}/sprints              - List by project
  PUT    /api/sprints/{id}                              - Update
  DELETE /api/sprints/{id}                              - Delete

Issues (6 endpoints):
  POST   /api/issues                                    - Create
  GET    /api/issues/{id}                               - Get by ID
  GET    /api/projects/{projectId}/issues               - List by project
  GET    /api/sprints/{sprintId}/issues                 - List by sprint
  PUT    /api/issues/{id}                               - Update
  POST   /api/projects/{projectId}/issues/{issueId}/reorder  - Reorder
  DELETE /api/issues/{id}                               - Delete
```

### 2.6 Critical Business Logic

#### Issue Reordering Algorithm (Most Complex)
```java
Algorithm: Fractional Positioning with Normalization
- Uses BigDecimal with 6-decimal precision
- Inserts issues BEFORE, AFTER, or at END
- Calculates new sort order as midpoint between neighbors
- Auto-normalizes when precision drops below 0.000001
- Normalization: Resets all sort orders to 1000, 2000, 3000...
```

**Example:**
```
Initial:  [A:1000] [B:2000] [C:3000]
Insert D after A:
  D.sortOrder = (A.sortOrder + B.sortOrder) / 2
  D.sortOrder = (1000 + 2000) / 2 = 1500
Result:   [A:1000] [D:1500] [B:2000] [C:3000]

After many insertions, gaps become tiny:
  [A:1000.000001] [D:1000.000002]
When gap < 0.000001, normalize all to [1000, 2000, 3000...]
```

### 2.7 Database Schema Highlights
```sql
-- PostgreSQL with advanced features
Extensions:
  - uuid-ossp (UUID generation)
  - pg_trgm (Text search)

Key Constraints:
  - CASCADE DELETE: project -> sprint, issue
  - SET NULL: sprint -> issue (orphaning)
  - UNIQUE: project.identifier

Triggers:
  - Auto-update updated_at on all tables

JSONB Fields:
  - issue.assignees_json: Array of UUID strings
```

---

## 3. Migration Objectives

### 3.1 Primary Goals
1. **Technology Stack Alignment**
   - Unify backend stack with Node.js/TypeScript
   - Leverage existing Node.js expertise in team
   - Share types between frontend and backend

2. **Maintainability**
   - Reduce context switching between Java and JavaScript
   - Improve code readability with TypeScript
   - Better IDE support and type safety

3. **Developer Productivity**
   - Faster development cycles with hot-reload
   - Smaller dependency footprint
   - More familiar ecosystem for full-stack developers

4. **Feature Parity**
   - Maintain 100% API compatibility
   - Preserve all business logic
   - Keep database schema unchanged

### 3.2 Non-Goals
- Performance optimization (maintain current performance)
- Database schema changes
- API redesign
- New feature development during migration

---

## 4. Target Architecture

### 4.1 Technology Stack
```yaml
Language: TypeScript 5.x
Framework: NestJS 10.x
Runtime: Node.js 20 LTS
ORM: TypeORM 0.3.x
Database: PostgreSQL 14+ (unchanged)
Migration Tool: TypeORM migrations or keep Flyway
Validation: class-validator + class-transformer
Documentation: @nestjs/swagger
Testing: Jest (built-in with NestJS)
```

### 4.2 NestJS Architecture
```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── common/                          # Shared utilities
│   ├── exceptions/
│   │   ├── validation.exception.ts
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   └── decorators/
│       └── api-response.decorator.ts
├── config/                          # Configuration
│   ├── database.config.ts
│   ├── app.config.ts
│   └── cors.config.ts
├── modules/
│   ├── project/
│   │   ├── project.module.ts
│   │   ├── project.controller.ts
│   │   ├── project.service.ts
│   │   ├── entities/
│   │   │   └── project.entity.ts
│   │   ├── dto/
│   │   │   ├── create-project.dto.ts
│   │   │   ├── update-project.dto.ts
│   │   │   ├── project-response.dto.ts
│   │   │   └── project-lite-response.dto.ts
│   │   └── project.repository.ts (if needed)
│   ├── sprint/
│   │   ├── sprint.module.ts
│   │   ├── sprint.controller.ts
│   │   ├── sprint.service.ts
│   │   ├── entities/
│   │   │   └── sprint.entity.ts
│   │   └── dto/
│   │       ├── create-sprint.dto.ts
│   │       ├── update-sprint.dto.ts
│   │       └── sprint-response.dto.ts
│   └── issue/
│       ├── issue.module.ts
│       ├── issue.controller.ts
│       ├── issue.service.ts
│       ├── entities/
│       │   └── issue.entity.ts
│       ├── dto/
│       │   ├── create-issue.dto.ts
│       │   ├── update-issue.dto.ts
│       │   ├── issue-response.dto.ts
│       │   └── issue-reorder.dto.ts
│       ├── enums/
│       │   ├── issue-state.enum.ts
│       │   ├── issue-priority.enum.ts
│       │   └── issue-type.enum.ts
│       └── services/
│           └── issue-reorder.service.ts
└── database/
    ├── migrations/                  # TypeORM migrations
    └── seeds/                       # Optional seed data
```

### 4.3 Module Dependencies
```
AppModule
├── ConfigModule (global)
├── DatabaseModule (global)
├── ProjectModule
│   └── TypeOrmModule.forFeature([Project])
├── SprintModule
│   ├── TypeOrmModule.forFeature([Sprint])
│   └── ProjectModule (for validation)
└── IssueModule
    ├── TypeOrmModule.forFeature([Issue])
    ├── ProjectModule (for validation)
    └── SprintModule (for validation)
```

### 4.4 Key Libraries
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/swagger": "^7.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.1.3",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

---

## 5. Migration Strategy

### 5.1 Approach: Parallel Development with Cutover

**Strategy**: Build NestJS app alongside Java app, then switch traffic

**Phases**:
1. **Phase 1**: Setup and Infrastructure (Week 1, Days 1-2)
2. **Phase 2**: Core Entity Migration (Week 1, Days 3-5)
3. **Phase 3**: Business Logic Migration (Week 2, Days 1-3)
4. **Phase 4**: Testing and Validation (Week 2, Days 4-5)
5. **Phase 5**: Deployment and Cutover (Week 3, Days 1-2)
6. **Phase 6**: Monitoring and Cleanup (Week 3, Days 3-5)

### 5.2 Migration Sequence

**Priority Order** (based on complexity and dependencies):
1. **Project Module** (Simplest, no dependencies)
2. **Sprint Module** (Depends on Project)
3. **Issue Module** (Most complex, depends on Project and Sprint)

### 5.3 Rollback Strategy
- Keep Java application running in parallel initially
- Use feature flags or routing rules to switch traffic
- Can instantly rollback by switching traffic back to Java
- Maintain both deployments for 2 weeks post-migration

### 5.4 Data Migration
**No data migration required** - Database schema remains unchanged

**Database compatibility checklist**:
- ✅ PostgreSQL version: Same (14+)
- ✅ Table structure: No changes
- ✅ Triggers: Continue to function
- ✅ Constraints: Remain enforced
- ✅ JSONB fields: TypeORM supports JSONB
- ✅ UUIDs: TypeORM supports UUID columns
- ✅ Enums: Map Java enums to TypeScript enums

---

## 6. Implementation Plan

### Phase 1: Setup and Infrastructure (Days 1-2)

#### Day 1: Project Initialization
- [ ] Create new NestJS project
  ```bash
  nest new pm-api
  cd pm-api
  ```
- [ ] Install dependencies
  ```bash
  npm install @nestjs/typeorm typeorm pg
  npm install @nestjs/config
  npm install class-validator class-transformer
  npm install @nestjs/swagger
  ```
- [ ] Configure TypeScript (tsconfig.json)
  ```json
  {
    "compilerOptions": {
      "module": "commonjs",
      "declaration": true,
      "removeComments": true,
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "allowSyntheticDefaultImports": true,
      "target": "ES2021",
      "sourceMap": true,
      "outDir": "./dist",
      "baseUrl": "./",
      "incremental": true,
      "skipLibCheck": true,
      "strictNullChecks": true,
      "noImplicitAny": true,
      "strictBindCallApply": false,
      "forceConsistentCasingInFileNames": false,
      "noFallthroughCasesInSwitch": false
    }
  }
  ```

#### Day 2: Database and Config Setup
- [ ] Configure database connection
  ```typescript
  // src/config/database.config.ts
  import { TypeOrmModuleOptions } from '@nestjs/typeorm';

  export const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'pm_user',
    password: 'pm_pass',
    database: 'pm_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Use migrations instead
    logging: true,
  };
  ```

- [ ] Configure CORS
  ```typescript
  // src/main.ts
  app.enableCors({
    origin: 'http://localhost:40401',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
  ```

- [ ] Set up global validation pipe
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  ```

- [ ] Configure Swagger/OpenAPI
  ```typescript
  const config = new DocumentBuilder()
    .setTitle('PM API')
    .setDescription('Project Management API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  ```

- [ ] Create global exception filter
  ```typescript
  // src/common/exceptions/http-exception.filter.ts
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      // Match Java's ApiErrorResponse format
    }
  }
  ```

---

### Phase 2: Core Entity Migration (Days 3-5)

#### Day 3: Project Module

**Step 1: Create Entity**
```typescript
// src/modules/project/entities/project.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Sprint } from '../../sprint/entities/sprint.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id', type: 'text', nullable: false })
  orgId: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ name: 'project_lead', type: 'uuid', nullable: true })
  projectLead: string | null;

  @Column({ name: 'default_assignee', type: 'uuid', nullable: true })
  defaultAssignee: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Sprint, (sprint) => sprint.project, { cascade: true })
  sprints: Sprint[];
}
```

**Step 2: Create DTOs**
```typescript
// src/modules/project/dto/create-project.dto.ts
import { IsNotEmpty, IsString, IsUUID, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orgId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  identifier: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectLead?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultAssignee?: string;
}

// src/modules/project/dto/project-response.dto.ts
export class ProjectResponseDto {
  id: string;
  orgId: string;
  identifier: string;
  name: string;
  projectLead: string | null;
  defaultAssignee: string | null;
  createdAt: Date;
  updatedAt: Date;
  sprintIds: string[];
}

// src/modules/project/dto/project-lite-response.dto.ts
export class ProjectLiteResponseDto {
  id: string;
  identifier: string;
  name: string;
  orgId: string;
  projectLead: string | null;
}
```

**Step 3: Create Service**
```typescript
// src/modules/project/project.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createDto: CreateProjectDto): Promise<Project> {
    // Sanitize inputs
    const identifier = createDto.identifier.trim().toUpperCase();
    const name = createDto.name.trim();

    // Check unique identifier (case-insensitive)
    const existingByIdentifier = await this.projectRepository
      .createQueryBuilder('project')
      .where('LOWER(project.identifier) = LOWER(:identifier)', { identifier })
      .getOne();

    if (existingByIdentifier) {
      throw new ConflictException({
        identifier: `Project with identifier '${identifier}' already exists`,
      });
    }

    // Check unique name (case-insensitive)
    const existingByName = await this.projectRepository
      .createQueryBuilder('project')
      .where('LOWER(project.name) = LOWER(:name)', { name })
      .getOne();

    if (existingByName) {
      throw new ConflictException({
        name: `Project with name '${name}' already exists`,
      });
    }

    const project = this.projectRepository.create({
      ...createDto,
      identifier,
      name,
    });

    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['sprints'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async checkIdentifierAvailability(identifier: string): Promise<boolean> {
    const existing = await this.projectRepository
      .createQueryBuilder('project')
      .where('LOWER(project.identifier) = LOWER(:identifier)', { identifier })
      .getOne();

    return !existing;
  }

  async update(id: string, updateDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    // Validation logic similar to create...

    Object.assign(project, updateDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }
}
```

**Step 4: Create Controller**
```typescript
// src/modules/project/project.controller.ts
@Controller('api/projects')
@ApiTags('Projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectService.create(createDto);
    return this.toResponseDto(project);
  }

  @Get()
  async findAll(): Promise<ProjectLiteResponseDto[]> {
    const projects = await this.projectService.findAll();
    return projects.map(p => this.toLiteDto(p));
  }

  @Get('check-identifier')
  async checkIdentifier(@Query('identifier') identifier: string) {
    const available = await this.projectService.checkIdentifierAvailability(identifier);
    return { identifier, available };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponseDto> {
    const project = await this.projectService.findOne(id);
    return this.toResponseDto(project);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.update(id, updateDto);
    return this.toResponseDto(project);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectService.remove(id);
  }

  private toResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      orgId: project.orgId,
      identifier: project.identifier,
      name: project.name,
      projectLead: project.projectLead,
      defaultAssignee: project.defaultAssignee,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      sprintIds: project.sprints?.map(s => s.id) || [],
    };
  }

  private toLiteDto(project: Project): ProjectLiteResponseDto {
    return {
      id: project.id,
      identifier: project.identifier,
      name: project.name,
      orgId: project.orgId,
      projectLead: project.projectLead,
    };
  }
}
```

**Step 5: Create Module**
```typescript
// src/modules/project/project.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
```

#### Day 4: Sprint Module
- [ ] Create Sprint entity with TypeORM decorators
- [ ] Create Sprint DTOs (CreateSprintDto, UpdateSprintDto, SprintResponseDto)
- [ ] Implement SprintService with CRUD operations
- [ ] Add validation for project existence
- [ ] Create SprintController with all endpoints
- [ ] Create SprintModule and export service

**Key Implementation Notes**:
- Sprint must validate that project exists before creation
- Inject ProjectService into SprintService for validation
- Handle cascade delete from project level
- Map issues to issueIds in response DTO

#### Day 5: Issue Module - Part 1 (Basic CRUD)
- [ ] Create Issue entity with all fields
  - Handle JSONB column for assignees
  - Map enums (IssueState, IssuePriority, IssueType)
  - Set up relationships to Project, Sprint, and self (parent)
- [ ] Create enum files
- [ ] Create Issue DTOs
- [ ] Implement basic IssueService CRUD
- [ ] Add relationship validation (project, sprint, parent)
- [ ] Create IssueController (without reorder endpoint)

**JSONB Handling Example**:
```typescript
@Column({ name: 'assignees_json', type: 'jsonb', default: [] })
assignees: string[];
```

---

### Phase 3: Business Logic Migration (Days 6-8)

#### Day 6: Issue Reordering - Part 2 (Complex Logic)

**Step 1: Create Reorder Service**
```typescript
// src/modules/issue/services/issue-reorder.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../entities/issue.entity';
import { IssueReorderDto, ReorderPosition } from '../dto/issue-reorder.dto';
import Decimal from 'decimal.js';

@Injectable()
export class IssueReorderService {
  private static readonly NORMALIZATION_THRESHOLD = new Decimal('0.000001');
  private static readonly NORMALIZATION_INCREMENT = new Decimal('1000');

  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
  ) {}

  async reorderIssue(
    projectId: string,
    issueId: string,
    dto: IssueReorderDto,
  ): Promise<Issue> {
    // 1. Fetch the issue to be moved
    const issue = await this.issueRepository.findOne({
      where: { id: issueId, projectId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // 2. Update sprint if needed
    if (dto.toSprintId !== undefined) {
      issue.sprintId = dto.toSprintId;
    }

    const targetSprintId = dto.toSprintId ?? issue.sprintId;

    // 3. Calculate new sort order
    const newSortOrder = await this.calculateNewSortOrder(
      projectId,
      targetSprintId,
      dto.destinationIssueId,
      dto.position,
      issueId,
    );

    issue.sortOrder = newSortOrder.toString();

    // 4. Save the issue
    const savedIssue = await this.issueRepository.save(issue);

    // 5. Check if normalization is needed
    await this.normalizeIfNeeded(projectId, targetSprintId);

    return savedIssue;
  }

  private async calculateNewSortOrder(
    projectId: string,
    sprintId: string | null,
    destinationIssueId: string | null,
    position: ReorderPosition,
    movingIssueId: string,
  ): Promise<Decimal> {
    const queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.id != :movingIssueId', { movingIssueId });

    if (sprintId) {
      queryBuilder.andWhere('issue.sprintId = :sprintId', { sprintId });
    } else {
      queryBuilder.andWhere('issue.sprintId IS NULL');
    }

    if (position === ReorderPosition.END) {
      // Place at the end
      const maxSortOrder = await queryBuilder
        .select('MAX(issue.sortOrder)', 'max')
        .getRawOne();

      if (!maxSortOrder.max) {
        return new Decimal('1000');
      }

      return new Decimal(maxSortOrder.max).plus(1000);
    }

    // Position is BEFORE or AFTER
    const destinationIssue = await queryBuilder
      .andWhere('issue.id = :destinationIssueId', { destinationIssueId })
      .getOne();

    if (!destinationIssue) {
      throw new NotFoundException('Destination issue not found');
    }

    const destinationSort = new Decimal(destinationIssue.sortOrder);

    if (position === ReorderPosition.BEFORE) {
      // Find the issue before the destination
      const beforeIssue = await queryBuilder
        .andWhere('issue.sortOrder < :destinationSort', {
          destinationSort: destinationSort.toString(),
        })
        .orderBy('issue.sortOrder', 'DESC')
        .getOne();

      if (!beforeIssue) {
        // Destination is first, insert before it
        return destinationSort.dividedBy(2);
      }

      const beforeSort = new Decimal(beforeIssue.sortOrder);
      return beforeSort.plus(destinationSort).dividedBy(2);
    } else {
      // AFTER
      const afterIssue = await queryBuilder
        .andWhere('issue.sortOrder > :destinationSort', {
          destinationSort: destinationSort.toString(),
        })
        .orderBy('issue.sortOrder', 'ASC')
        .getOne();

      if (!afterIssue) {
        // Destination is last, insert after it
        return destinationSort.plus(1000);
      }

      const afterSort = new Decimal(afterIssue.sortOrder);
      return destinationSort.plus(afterSort).dividedBy(2);
    }
  }

  private async normalizeIfNeeded(
    projectId: string,
    sprintId: string | null,
  ): Promise<void> {
    const queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId });

    if (sprintId) {
      queryBuilder.andWhere('issue.sprintId = :sprintId', { sprintId });
    } else {
      queryBuilder.andWhere('issue.sprintId IS NULL');
    }

    const issues = await queryBuilder.orderBy('issue.sortOrder', 'ASC').getMany();

    if (issues.length < 2) {
      return;
    }

    // Check minimum gap
    let minGap: Decimal | null = null;
    for (let i = 0; i < issues.length - 1; i++) {
      const gap = new Decimal(issues[i + 1].sortOrder).minus(issues[i].sortOrder);
      if (!minGap || gap.lessThan(minGap)) {
        minGap = gap;
      }
    }

    // Normalize if gap is too small
    if (minGap && minGap.lessThan(IssueReorderService.NORMALIZATION_THRESHOLD)) {
      let currentSort = IssueReorderService.NORMALIZATION_INCREMENT;

      for (const issue of issues) {
        issue.sortOrder = currentSort.toString();
        currentSort = currentSort.plus(IssueReorderService.NORMALIZATION_INCREMENT);
      }

      await this.issueRepository.save(issues);
    }
  }
}
```

**Step 2: Install decimal.js**
```bash
npm install decimal.js
npm install -D @types/decimal.js
```

**Step 3: Add Reorder Endpoint to Controller**
```typescript
@Post('projects/:projectId/issues/:issueId/reorder')
async reorderIssue(
  @Param('projectId', ParseUUIDPipe) projectId: string,
  @Param('issueId', ParseUUIDPipe) issueId: string,
  @Body() dto: IssueReorderDto,
): Promise<IssueResponseDto> {
  const issue = await this.issueReorderService.reorderIssue(projectId, issueId, dto);
  return this.toResponseDto(issue);
}
```

#### Day 7: Validation and Error Handling

**Step 1: Custom Exceptions**
```typescript
// src/common/exceptions/validation.exception.ts
export class ValidationException extends BadRequestException {
  constructor(errors: Record<string, string>) {
    super({
      message: 'Validation failed',
      errors,
    });
  }
}
```

**Step 2: Global Exception Filter**
```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let fieldErrors = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        fieldErrors = (exceptionResponse as any).fieldErrors;
      }
    }

    response.status(status).json({
      timestamp: new Date().toISOString(),
      status,
      error: HttpStatus[status],
      message,
      path: request.url,
      ...(fieldErrors && { fieldErrors }),
    });
  }
}
```

**Step 3: Apply Global Filter**
```typescript
// src/main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

#### Day 8: Integration and Module Wiring
- [ ] Wire all modules in AppModule
- [ ] Configure environment variables
- [ ] Set up database migrations (if using TypeORM migrations)
- [ ] Add health check endpoint
- [ ] Test all endpoints manually

**AppModule Example**:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './modules/project/project.module';
import { SprintModule } from './modules/sprint/sprint.module';
import { IssueModule } from './modules/issue/issue.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    ProjectModule,
    SprintModule,
    IssueModule,
  ],
})
export class AppModule {}
```

---

### Phase 4: Testing and Validation (Days 9-10)

#### Day 9: Unit Testing

**Project Service Test Example**:
```typescript
// src/modules/project/project.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: Repository<Project>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    repository = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto = {
        orgId: 'org-1',
        identifier: 'PROJ',
        name: 'Test Project',
      };

      const project = { id: 'uuid', ...createDto };

      jest.spyOn(repository, 'create').mockReturnValue(project as any);
      jest.spyOn(repository, 'save').mockResolvedValue(project as any);
      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.create(createDto);

      expect(result).toEqual(project);
    });

    it('should throw ConflictException for duplicate identifier', async () => {
      const createDto = {
        orgId: 'org-1',
        identifier: 'PROJ',
        name: 'Test Project',
      };

      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing' }),
      } as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });
});
```

**Testing Checklist**:
- [ ] Project Service unit tests
- [ ] Sprint Service unit tests
- [ ] Issue Service unit tests
- [ ] Issue Reorder Service unit tests (critical)
- [ ] Controller unit tests
- [ ] DTO validation tests

#### Day 10: Integration Testing and API Comparison

**Integration Test Setup**:
```typescript
// test/project.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProjectController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/projects (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/projects')
      .send({
        orgId: 'org-1',
        identifier: 'TEST',
        name: 'Test Project',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.identifier).toBe('TEST');
      });
  });

  it('/api/projects (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/projects')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

**API Comparison Testing**:
- [ ] Run both Java and NestJS apps side-by-side on different ports
- [ ] Create test script to call both APIs with same requests
- [ ] Compare responses for exact match
- [ ] Test all 17 endpoints

**Comparison Script Example**:
```bash
#!/bin/bash
# compare-apis.sh

JAVA_URL="http://localhost:8080"
NESTJS_URL="http://localhost:3000"

echo "Testing: POST /api/projects"
curl -X POST $JAVA_URL/api/projects -H "Content-Type: application/json" \
  -d '{"orgId":"org1","identifier":"JAVA","name":"Java Test"}' > java-response.json

curl -X POST $NESTJS_URL/api/projects -H "Content-Type: application/json" \
  -d '{"orgId":"org1","identifier":"NEST","name":"NestJS Test"}' > nestjs-response.json

# Compare structure (excluding dynamic fields like id, timestamps)
echo "Comparing response structures..."
```

**Manual Testing Checklist**:
- [ ] Test all CRUD operations for Projects
- [ ] Test all CRUD operations for Sprints
- [ ] Test all CRUD operations for Issues
- [ ] Test issue reordering (BEFORE, AFTER, END)
- [ ] Test validation errors
- [ ] Test relationship constraints
- [ ] Test cascade deletes
- [ ] Test CORS configuration
- [ ] Test error response format
- [ ] Verify database state matches between implementations

---

### Phase 5: Deployment and Cutover (Days 11-12)

#### Day 11: Deployment Preparation

**Step 1: Environment Configuration**
```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_HOST=prod-db-host
DATABASE_PORT=5432
DATABASE_USER=pm_user
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=pm_db
CORS_ORIGIN=https://app.example.com
```

**Step 2: Build Production Bundle**
```bash
npm run build
```

**Step 3: Docker Setup (Optional)**
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

**Step 4: Health Check Endpoint**
```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

#### Day 12: Production Deployment and Cutover

**Deployment Steps**:
1. [ ] Deploy NestJS app to staging environment
2. [ ] Run full test suite on staging
3. [ ] Monitor logs for errors
4. [ ] Verify database connections
5. [ ] Test all endpoints on staging

**Cutover Strategy**:

**Option A: Blue-Green Deployment**
```
1. Deploy NestJS (Green) alongside Java (Blue)
2. Route 10% traffic to Green
3. Monitor for 24 hours
4. Gradually increase to 50%, 75%, 100%
5. Keep Blue running for 1 week
6. Decommission Blue
```

**Option B: DNS/Load Balancer Switch**
```
1. Deploy NestJS on new instances
2. Update load balancer/DNS
3. Instant cutover
4. Keep Java running as fallback
5. Rollback via DNS if needed
```

**Monitoring Setup**:
- [ ] Set up application logs (Winston, Pino)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up performance monitoring (New Relic, DataDog)
- [ ] Create alerts for critical errors
- [ ] Monitor database query performance

---

### Phase 6: Post-Migration and Cleanup (Days 13-15)

#### Day 13: Monitoring and Bug Fixes
- [ ] Monitor application logs for errors
- [ ] Check database query performance
- [ ] Verify no data inconsistencies
- [ ] Fix any bugs discovered in production
- [ ] Gather user feedback

#### Day 14: Performance Optimization
- [ ] Analyze slow queries
- [ ] Add database indexes if needed
- [ ] Optimize N+1 queries
- [ ] Configure connection pooling
- [ ] Add caching if necessary

#### Day 15: Documentation and Cleanup
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for operations team
- [ ] Archive Java codebase
- [ ] Update README and contribution guidelines

---

## 7. Risk Assessment

### 7.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Issue reordering algorithm precision loss** | High | Medium | Use decimal.js library, implement comprehensive tests, verify precision in unit tests |
| **TypeORM behavior differs from Hibernate** | Medium | Medium | Thorough testing of cascade deletes, relationship handling, and transactions |
| **JSONB column handling issues** | Low | Low | TypeORM supports JSONB natively, test thoroughly |
| **Enum serialization differences** | Low | Low | Use TypeScript enums, configure proper serialization |
| **Database trigger compatibility** | Low | Very Low | Triggers are database-level, unaffected by ORM change |
| **Migration causes downtime** | High | Low | Use parallel deployment, blue-green strategy |
| **Performance degradation** | Medium | Low | Benchmark both implementations, optimize queries |

### 7.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **API breaking changes** | Critical | Low | Strict API contract testing, compare responses |
| **Data loss or corruption** | Critical | Very Low | No database changes, extensive testing |
| **User-facing bugs** | High | Medium | Phased rollout, quick rollback plan |
| **Timeline delays** | Medium | Medium | Buffer time in schedule, prioritize core features |

### 7.3 Rollback Plan

**Immediate Rollback** (< 1 hour):
1. Switch traffic back to Java application
2. No database rollback needed (schema unchanged)
3. Investigate issues offline

**Partial Rollback**:
1. Route percentage of traffic back to Java
2. Debug NestJS issues with remaining traffic
3. Gradual re-migration

---

## 8. Testing Strategy

### 8.1 Testing Levels

**Unit Tests** (Target: 80% coverage)
- All service methods
- Complex business logic (especially reordering)
- DTO validation
- Mapper functions

**Integration Tests**
- Database operations
- Repository queries
- Transaction handling
- Cascade deletes

**E2E Tests**
- Full API endpoint coverage
- Request/response validation
- Error scenarios
- Edge cases

**Comparison Tests**
- Side-by-side API response comparison
- Performance benchmarks
- Load testing

### 8.2 Test Data

**Test Database**:
- Use separate test database
- Seed with realistic data
- Include edge cases (null values, empty arrays, etc.)

**Test Scenarios**:
1. **Happy Paths**: All CRUD operations succeed
2. **Validation Errors**: Invalid inputs, missing required fields
3. **Relationship Errors**: Non-existent foreign keys
4. **Duplicate Errors**: Unique constraint violations
5. **Cascade Deletes**: Verify orphaning and deletion behavior
6. **Reordering Edge Cases**:
   - Reorder first item
   - Reorder last item
   - Reorder to empty sprint
   - Trigger normalization

### 8.3 Performance Benchmarks

**Baseline Metrics** (from Java app):
- Average response time per endpoint
- Database query counts
- Memory usage
- CPU usage

**Target Metrics** (NestJS):
- Within 10% of Java performance
- No N+1 query problems
- Comparable resource usage

---

## 9. Deployment Strategy

### 9.1 Infrastructure Requirements

**Development**:
- Node.js 20 LTS runtime
- PostgreSQL 14+ (shared with Java)
- Development tools (npm, TypeScript compiler)

**Production**:
- Container platform (Docker/Kubernetes) or VM
- Load balancer (for blue-green deployment)
- Monitoring and logging infrastructure

### 9.2 Configuration Management

**Environment Variables**:
```bash
# Database
DATABASE_HOST
DATABASE_PORT
DATABASE_USER
DATABASE_PASSWORD
DATABASE_NAME

# Application
PORT
NODE_ENV
CORS_ORIGIN

# Logging
LOG_LEVEL

# Optional
SENTRY_DSN
NEW_RELIC_LICENSE_KEY
```

### 9.3 Deployment Checklist

**Pre-Deployment**:
- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance benchmarks acceptable
- [ ] Documentation updated
- [ ] Rollback plan documented

**Deployment**:
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor logs

**Post-Deployment**:
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user functionality
- [ ] Communicate success to stakeholders

---

## 10. Success Criteria

### 10.1 Functional Requirements
- ✅ All 17 API endpoints functional
- ✅ 100% API compatibility with Java version
- ✅ All business logic preserved
- ✅ Database schema unchanged
- ✅ No data loss or corruption

### 10.2 Non-Functional Requirements
- ✅ Response times within 10% of Java baseline
- ✅ Zero downtime deployment
- ✅ 80%+ test coverage
- ✅ No critical bugs in first week
- ✅ Successful rollback plan tested

### 10.3 Quality Metrics
- ✅ TypeScript strict mode enabled
- ✅ All DTOs properly typed
- ✅ No `any` types in production code
- ✅ ESLint/Prettier configured
- ✅ API documentation generated

### 10.4 Acceptance Criteria
- ✅ Frontend team confirms API compatibility
- ✅ QA team approves functionality
- ✅ Operations team confirms deployment process
- ✅ Product owner approves migration

---

## Appendix A: Key Code Mappings

### Java to NestJS Equivalents

| Java/Spring | NestJS | Notes |
|-------------|--------|-------|
| `@RestController` | `@Controller()` | HTTP endpoint handlers |
| `@Service` | `@Injectable()` | Business logic services |
| `@Repository` | `Repository<T>` (TypeORM) | Data access |
| `@Entity` | `@Entity()` | ORM entities |
| `@Transactional` | `@Transaction()` or QueryRunner | Transaction management |
| `@NotNull`, `@NotBlank` | `@IsNotEmpty()`, `@IsString()` | Validation decorators |
| `ResponseEntity<T>` | Return type + `@HttpCode()` | HTTP responses |
| `@PathVariable` | `@Param()` | URL parameters |
| `@RequestBody` | `@Body()` | Request body |
| `@RequestParam` | `@Query()` | Query parameters |
| `ResponseStatusException` | `NotFoundException`, `ConflictException` | HTTP exceptions |
| `@RestControllerAdvice` | `@Catch()` exception filter | Global error handling |
| `Optional<T>` | `T | null` or `T | undefined` | Nullable types |
| `UUID` | `string` (with validation) | UUID type |
| `BigDecimal` | `Decimal` (decimal.js) | Arbitrary precision |
| `LocalDate` | `Date` or `string` | Date handling |
| `OffsetDateTime` | `Date` | Timestamp with timezone |

---

## Appendix B: Dependencies Comparison

### Java (pom.xml)
```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
  </dependency>
</dependencies>
```

### NestJS (package.json)
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "decimal.js": "^10.4.3"
  }
}
```

---

## Appendix C: Database Migration Notes

### No Schema Changes Required

The database schema will remain **completely unchanged**:
- Same table structure
- Same constraints and indexes
- Same triggers
- Same data types

### Migration Tool Options

**Option 1: Keep Flyway** (Recommended for minimal risk)
- Continue using existing Flyway migrations
- Run Flyway from NestJS application startup
- Install: `npm install flyway`

**Option 2: Migrate to TypeORM Migrations**
- Convert Flyway SQL to TypeORM migration files
- More integrated with TypeORM
- Requires migration file creation

**Recommendation**: Keep Flyway initially, migrate to TypeORM later if needed.

---

## Appendix D: Useful Resources

### Documentation
- [NestJS Official Docs](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [class-validator](https://github.com/typestack/class-validator)
- [Decimal.js](https://mikemcl.github.io/decimal.js/)

### Migration Guides
- [Spring Boot to NestJS Migration Guide](https://docs.nestjs.com/)
- [Hibernate to TypeORM Comparison](https://typeorm.io/)

### Testing
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-26 | Migration Team | Initial plan created |

---

**END OF MIGRATION PLAN**
