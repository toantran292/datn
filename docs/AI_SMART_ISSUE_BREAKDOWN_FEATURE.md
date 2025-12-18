# AI Smart Issue Breakdown Feature

## 1. Problem Statement

### Current Challenges

1. **Manual Task Breakdown is Time-Consuming**
   - Product Owners/Scrum Masters spend significant time breaking down Epics into actionable sub-tasks
   - Requires deep technical understanding and domain knowledge
   - Often inconsistent across different team members

2. **Incomplete or Poorly Structured Breakdowns**
   - Missing critical tasks (testing, documentation, deployment)
   - Unclear dependencies between tasks
   - Tasks with unbalanced size (some too large, others too granular)

3. **Lack of Coverage Analysis**
   - Hard to verify if breakdown covers all requirements
   - No systematic approach to ensure completeness
   - Missing edge cases or non-functional requirements

4. **Estimation Overhead**
   - Each sub-task needs individual estimation
   - Team has to estimate 5-10+ items instead of 1
   - Takes up significant planning meeting time

### Impact

- **Planning Meetings Run Long**: 2-3 hours instead of 1 hour
- **Sprint Execution Issues**: Incomplete breakdowns lead to scope creep mid-sprint
- **Inconsistent Quality**: Quality depends on who does the breakdown
- **Cognitive Load**: Teams avoid breaking down work properly due to effort required

## 2. Solution Design

### Overview

AI Smart Issue Breakdown automatically analyzes an Epic or large Story and generates a comprehensive breakdown into sub-tasks with:

- **Logical Task Decomposition**: Frontend → Backend → Testing flow
- **Automatic Estimation**: Story points for each sub-task
- **Dependency Mapping**: Sequential vs parallel tasks
- **Coverage Analysis**: Ensures all aspects are covered (features, testing, docs, deployment)
- **Editable Results**: Users can modify, accept, or regenerate

### Key Features

#### 2.1 Intelligent Task Generation
```
Input: Epic "Build user authentication system"
Output: 8 sub-tasks organized by:
  - Technical layers (DB, API, UI)
  - Logical sequence (schema → API → UI → tests)
  - Balanced granularity (2-8 points each)
```

#### 2.2 Smart Estimation
- Each sub-task gets automatic story point estimation
- Based on task complexity and type
- Sum validates against Epic's expected size

#### 2.3 Dependency Detection
```
Task Dependencies:
  - Sequential: Schema design → API implementation
  - Parallel: Login UI || Registration UI
  - Blocking: All features → Integration tests
```

#### 2.4 Coverage Validation
Ensures breakdown includes:
- ✅ Core functionality
- ✅ Error handling
- ✅ Testing (unit, integration, E2E)
- ✅ Documentation
- ✅ Security considerations
- ✅ Performance/scalability (if needed)

## 3. Technical Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐      ┌────────────────────────┐   │
│  │ IssueDetailPanel    │      │ AIBreakdownSection     │   │
│  │                     │      │                         │   │
│  │ - "AI Breakdown"    │────▶ │ - Task List            │   │
│  │   Button            │      │ - Dependency Graph     │   │
│  │ - Show for Epic/    │      │ - Edit/Accept/Cancel   │   │
│  │   Large Stories     │      │ - Regenerate Option    │   │
│  └─────────────────────┘      └────────────────────────┘   │
│           │                              │                   │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          useAIBreakdown Hook                          │  │
│  │                                                        │  │
│  │  - breakdown(issueId, description, type)             │  │
│  │  - isBreakingDown: boolean                           │  │
│  │  - error: string | null                              │  │
│  │  - result: BreakdownData | null                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────│───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/ai/breakdown-issue                                │
│  {                                                            │
│    issueId, issueName, issueType,                           │
│    description, priority,                                    │
│    context: { projectName, sprintGoal }                     │
│  }                                                            │
│                                                               │
└──────────────────────────│───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (NestJS)                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐      ┌─────────────────────────┐   │
│  │  AIController      │      │     AIService           │   │
│  │                    │      │                          │   │
│  │  - breakdownIssue()│────▶ │ - breakdownEpic()       │   │
│  │  - Cache check     │      │ - validateBreakdown()   │   │
│  │  - Rate limiting   │      │ - estimateSubTasks()    │   │
│  └────────────────────┘      └─────────────────────────┘   │
│                                         │                     │
│                                         │                     │
│                                         ▼                     │
│                          ┌─────────────────────────────┐    │
│                          │    PromptService            │    │
│                          │                              │    │
│                          │  - getBreakdownPrompt()     │    │
│                          │  - buildTaskContext()       │    │
│                          │  - validateOutput()         │    │
│                          └─────────────────────────────┘    │
│                                         │                     │
└─────────────────────────────────────────│─────────────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────┐
                           │   OpenAI GPT-4o-mini    │
                           │                          │
                           │   Structured Output      │
                           │   JSON Mode              │
                           └──────────────────────────┘
```

### 3.2 Data Flow

```
1. User clicks "AI Breakdown" button on Epic
2. Frontend validates: type=EPIC or points>13
3. Call POST /api/ai/breakdown-issue
4. Backend checks cache (key: issueId + description hash)
5. If cache miss → Call OpenAI with structured prompt
6. AI returns JSON with sub-tasks array
7. Backend validates:
   - All tasks have name, description, points
   - Points sum is reasonable
   - Dependencies are valid
   - No circular dependencies
8. Cache result for 24 hours
9. Return to frontend
10. Display AIBreakdownSection with:
    - Task cards with drag-to-reorder
    - Dependency visualization
    - Edit inline capability
11. User reviews and clicks "Create Sub-tasks"
12. Frontend calls IssueService.createBulkIssues()
13. All sub-tasks created with parent_id = epic.id
14. Success toast + refresh issue list
```

## 4. API Specification

### 4.1 Request DTO

**Endpoint:** `POST /api/ai/breakdown-issue`

```typescript
interface BreakdownIssueRequest {
  // Required fields
  issueId: string;              // Epic/Story ID
  issueName: string;            // Epic title
  issueType: "EPIC" | "STORY";  // Must be EPIC or large STORY
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  currentDescription: string;   // Epic description (HTML or plain text)

  // Optional context
  context?: {
    projectName?: string;       // Project name for domain context
    sprintGoal?: string;        // Current sprint goal
    technicalStack?: string[];  // [React, NestJS, PostgreSQL]
    teamSize?: number;          // For task sizing
  };

  // Optional constraints
  constraints?: {
    maxSubTasks?: number;       // Default: 10, Max: 20
    targetPointsPerTask?: number; // Default: 3-8 range
    includeTests?: boolean;     // Default: true
    includeDocs?: boolean;      // Default: false
  };
}
```

### 4.2 Response DTO

```typescript
interface BreakdownIssueResponse {
  success: boolean;
  data?: BreakdownData;
  metadata?: BreakdownMetadata;
  error?: AIError;
}

interface BreakdownData {
  // Generated sub-tasks
  subTasks: SubTask[];

  // Breakdown reasoning
  reasoning: {
    summary: string;              // Why this breakdown approach
    coverageAreas: CoverageArea[]; // What's covered
    assumptions: string[];        // Any assumptions made
    risks: string[];              // Potential risks identified
  };

  // Validation metrics
  validation: {
    totalPoints: number;          // Sum of all sub-task points
    completeness: number;         // 0-1 score
    balanceScore: number;         // 0-1 score (task size distribution)
    coveragePercentage: number;   // % of Epic covered
  };

  // Visual dependency graph data
  dependencyGraph?: {
    nodes: { id: string; label: string }[];
    edges: { from: string; to: string; type: "sequential" | "blocking" }[];
  };
}

interface SubTask {
  // Basic info
  tempId: string;                 // Temporary ID (task-1, task-2)
  name: string;                   // Task title
  description: string;            // Detailed description
  descriptionHtml: string;        // HTML formatted description

  // Estimation
  estimatedPoints: number;        // 1, 2, 3, 5, 8, 13
  estimationReasoning: string;    // Why this estimate

  // Classification
  taskType: "FEATURE" | "TESTING" | "INFRA" | "DOCS" | "BUGFIX";
  technicalLayer: "FRONTEND" | "BACKEND" | "DATABASE" | "DEVOPS" | "CROSS";

  // Ordering & Dependencies
  order: number;                  // Suggested execution order
  dependencies: string[];         // Array of tempIds this task depends on
  canParallelize: boolean;        // Can run in parallel with others?

  // Metadata
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  acceptanceCriteria?: string[];  // List of ACs
  tags?: string[];                // [api, authentication, security]
}

interface CoverageArea {
  area: string;                   // "Authentication", "Testing", "Security"
  covered: boolean;               // true/false
  tasks: string[];                // tempIds covering this area
  completeness: number;           // 0-1 score
}

interface BreakdownMetadata {
  model: string;                  // "gpt-4o-mini"
  tokensUsed: number;
  processingTime: number;         // milliseconds
  cacheHit: boolean;
  timestamp: string;
}
```

### 4.3 Example Request/Response

**Request:**
```json
{
  "issueId": "issue-123",
  "issueName": "Build User Authentication System",
  "issueType": "EPIC",
  "priority": "HIGH",
  "currentDescription": "<p>Implement complete user authentication with JWT tokens...</p>",
  "context": {
    "projectName": "TaskMaster PM",
    "technicalStack": ["React", "NestJS", "PostgreSQL", "JWT"]
  },
  "constraints": {
    "maxSubTasks": 10,
    "includeTests": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subTasks": [
      {
        "tempId": "task-1",
        "name": "Design database schema for users and sessions",
        "description": "Create database tables for users, refresh_tokens, and sessions with proper indexes",
        "descriptionHtml": "<p>Create database tables...</p>",
        "estimatedPoints": 2,
        "estimationReasoning": "Straightforward schema design, low complexity",
        "taskType": "INFRA",
        "technicalLayer": "DATABASE",
        "order": 1,
        "dependencies": [],
        "canParallelize": false,
        "priority": "HIGH",
        "acceptanceCriteria": [
          "Users table with email, password_hash, created_at",
          "Refresh_tokens table with token, user_id, expires_at",
          "Indexes on email and token columns"
        ],
        "tags": ["database", "schema", "migration"]
      },
      {
        "tempId": "task-2",
        "name": "Implement user registration API endpoint",
        "description": "POST /api/auth/register with email validation, password hashing, and user creation",
        "descriptionHtml": "<p>POST /api/auth/register...</p>",
        "estimatedPoints": 5,
        "estimationReasoning": "Medium complexity: validation, hashing, error handling",
        "taskType": "FEATURE",
        "technicalLayer": "BACKEND",
        "order": 2,
        "dependencies": ["task-1"],
        "canParallelize": false,
        "priority": "HIGH",
        "acceptanceCriteria": [
          "Validates email format and uniqueness",
          "Hashes password with bcrypt",
          "Returns 201 with user ID on success",
          "Returns 400 for validation errors"
        ],
        "tags": ["api", "authentication", "backend"]
      },
      {
        "tempId": "task-3",
        "name": "Implement login/logout API endpoints",
        "description": "POST /api/auth/login and POST /api/auth/logout with JWT token generation",
        "descriptionHtml": "<p>POST /api/auth/login...</p>",
        "estimatedPoints": 5,
        "estimationReasoning": "Medium complexity: JWT generation, refresh token logic",
        "taskType": "FEATURE",
        "technicalLayer": "BACKEND",
        "order": 3,
        "dependencies": ["task-2"],
        "canParallelize": false,
        "priority": "HIGH",
        "tags": ["api", "authentication", "jwt"]
      },
      {
        "tempId": "task-4",
        "name": "Create JWT authentication middleware",
        "description": "Middleware to validate JWT tokens on protected routes",
        "descriptionHtml": "<p>Middleware to validate...</p>",
        "estimatedPoints": 3,
        "estimationReasoning": "Small task, standard JWT middleware pattern",
        "taskType": "FEATURE",
        "technicalLayer": "BACKEND",
        "order": 4,
        "dependencies": ["task-3"],
        "canParallelize": false,
        "priority": "HIGH",
        "tags": ["middleware", "jwt", "security"]
      },
      {
        "tempId": "task-5",
        "name": "Build login page UI components",
        "description": "React components for login form with email/password fields and error display",
        "descriptionHtml": "<p>React components...</p>",
        "estimatedPoints": 5,
        "estimationReasoning": "Medium complexity: form validation, state management, UI polish",
        "taskType": "FEATURE",
        "technicalLayer": "FRONTEND",
        "order": 5,
        "dependencies": ["task-3"],
        "canParallelize": true,
        "priority": "HIGH",
        "tags": ["ui", "react", "forms"]
      },
      {
        "tempId": "task-6",
        "name": "Build registration page UI components",
        "description": "React components for registration form with validation",
        "descriptionHtml": "<p>React components...</p>",
        "estimatedPoints": 5,
        "estimationReasoning": "Similar to login UI, parallel work",
        "taskType": "FEATURE",
        "technicalLayer": "FRONTEND",
        "order": 6,
        "dependencies": ["task-2"],
        "canParallelize": true,
        "priority": "MEDIUM",
        "tags": ["ui", "react", "forms"]
      },
      {
        "tempId": "task-7",
        "name": "Write integration tests for auth flow",
        "description": "End-to-end tests covering register → login → protected route access",
        "descriptionHtml": "<p>End-to-end tests...</p>",
        "estimatedPoints": 5,
        "estimationReasoning": "Medium complexity: multiple test scenarios, setup/teardown",
        "taskType": "TESTING",
        "technicalLayer": "CROSS",
        "order": 7,
        "dependencies": ["task-5", "task-6"],
        "canParallelize": false,
        "priority": "HIGH",
        "tags": ["testing", "e2e", "integration"]
      },
      {
        "tempId": "task-8",
        "name": "Add security headers and rate limiting",
        "description": "Implement rate limiting on auth endpoints and add security headers (CORS, CSP)",
        "descriptionHtml": "<p>Implement rate limiting...</p>",
        "estimatedPoints": 3,
        "estimationReasoning": "Small task, standard security practices",
        "taskType": "FEATURE",
        "technicalLayer": "BACKEND",
        "order": 8,
        "dependencies": ["task-4"],
        "canParallelize": true,
        "priority": "MEDIUM",
        "tags": ["security", "rate-limiting", "headers"]
      }
    ],
    "reasoning": {
      "summary": "Breakdown follows standard authentication implementation flow: Database → Backend API → Frontend UI → Testing → Security hardening. Tasks are ordered by technical dependencies.",
      "coverageAreas": [
        {
          "area": "Database Design",
          "covered": true,
          "tasks": ["task-1"],
          "completeness": 1.0
        },
        {
          "area": "Authentication API",
          "covered": true,
          "tasks": ["task-2", "task-3", "task-4"],
          "completeness": 1.0
        },
        {
          "area": "User Interface",
          "covered": true,
          "tasks": ["task-5", "task-6"],
          "completeness": 0.9
        },
        {
          "area": "Testing",
          "covered": true,
          "tasks": ["task-7"],
          "completeness": 0.8
        },
        {
          "area": "Security",
          "covered": true,
          "tasks": ["task-8"],
          "completeness": 0.7
        }
      ],
      "assumptions": [
        "Using JWT tokens (not sessions)",
        "PostgreSQL database",
        "React frontend framework",
        "No social login (OAuth) required"
      ],
      "risks": [
        "Password reset flow not included in this breakdown",
        "Email verification not included",
        "No multi-factor authentication (2FA)"
      ]
    },
    "validation": {
      "totalPoints": 33,
      "completeness": 0.85,
      "balanceScore": 0.9,
      "coveragePercentage": 85
    },
    "dependencyGraph": {
      "nodes": [
        { "id": "task-1", "label": "DB Schema" },
        { "id": "task-2", "label": "Register API" },
        { "id": "task-3", "label": "Login API" },
        { "id": "task-4", "label": "JWT Middleware" },
        { "id": "task-5", "label": "Login UI" },
        { "id": "task-6", "label": "Register UI" },
        { "id": "task-7", "label": "Integration Tests" },
        { "id": "task-8", "label": "Security" }
      ],
      "edges": [
        { "from": "task-1", "to": "task-2", "type": "sequential" },
        { "from": "task-2", "to": "task-3", "type": "sequential" },
        { "from": "task-3", "to": "task-4", "type": "sequential" },
        { "from": "task-3", "to": "task-5", "type": "sequential" },
        { "from": "task-2", "to": "task-6", "type": "sequential" },
        { "from": "task-5", "to": "task-7", "type": "blocking" },
        { "from": "task-6", "to": "task-7", "type": "blocking" },
        { "from": "task-4", "to": "task-8", "type": "sequential" }
      ]
    }
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "tokensUsed": 2847,
    "processingTime": 3421,
    "cacheHit": false,
    "timestamp": "2025-12-16T10:30:45Z"
  }
}
```

## 5. UI/UX Design

### 5.1 Entry Point

**Location:** Issue Detail Panel (for EPIC or STORY with points > 13)

```
┌─────────────────────────────────────────────────────────────┐
│ Issue Detail: EPIC-123 - Build User Authentication         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Properties Panel]                                           │
│                                                              │
│ ⚡ Type: Epic                                               │
│ 🎯 Priority: High                                           │
│ 📊 Story Points: 34                                         │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │  💡 This Epic is large enough to break down          │   │
│ │                                                        │   │
│ │  [✨ AI Breakdown] [➕ Manual Subtask]               │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Subtasks (0):                                                │
│ [Empty state - Use AI Breakdown to generate subtasks]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Breakdown Result Display

```
┌─────────────────────────────────────────────────────────────┐
│ AI Breakdown Results                              [✕]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📋 Summary                                            │   │
│ │                                                        │   │
│ │ Generated 8 sub-tasks (33 total points)              │   │
│ │ Coverage: 85% ● Balance: 90% ● Completeness: 85%    │   │
│ │                                                        │   │
│ │ Breakdown follows authentication flow: DB → API →    │   │
│ │ UI → Testing → Security hardening                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📊 Dependency Visualization              [Show Graph] │   │
│ │                                                        │   │
│ │   task-1 ──▶ task-2 ──▶ task-3 ──┬──▶ task-5        │   │
│ │                              │     │                   │   │
│ │                              │     └──▶ task-6        │   │
│ │                              ▼                         │   │
│ │                           task-4 ──▶ task-8           │   │
│ │                                                        │   │
│ │                      task-5 ─┐                        │   │
│ │                               ├──▶ task-7             │   │
│ │                      task-6 ─┘                        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ✅ Sub-tasks (8)                      [Reorder ⇅]    │   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────┐   │   │
│ │ │ 1. 💾 Design database schema                   │   │   │
│ │ │    Backend · 2 points · No dependencies       │   │   │
│ │ │    [Edit] [Delete]                             │   │   │
│ │ └────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────┐   │   │
│ │ │ 2. 🔧 Implement registration API               │   │   │
│ │ │    Backend · 5 points · Depends on: #1        │   │   │
│ │ │    [Edit] [Delete]                             │   │   │
│ │ └────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────┐   │   │
│ │ │ 3. 🔧 Implement login/logout API               │   │   │
│ │ │    Backend · 5 points · Depends on: #2        │   │   │
│ │ │    [Edit] [Delete]                             │   │   │
│ │ └────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ... (5 more tasks)                                    │   │
│ │                                                        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ⚠️ Coverage Analysis                                  │   │
│ │                                                        │   │
│ │ ✅ Database Design (100%)                             │   │
│ │ ✅ Authentication API (100%)                          │   │
│ │ ✅ User Interface (90%)                               │   │
│ │ ✅ Testing (80%)                                       │   │
│ │ ⚠️  Security (70%) - Consider adding: password reset  │   │
│ │                                                        │   │
│ │ ⚠️ Missing: Email verification, 2FA                   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [Cancel] [🔄 Regenerate] [✅ Create Sub-tasks (8)]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Edit Task Dialog

```
┌────────────────────────────────────────────┐
│ Edit Sub-task                         [✕]  │
├────────────────────────────────────────────┤
│                                             │
│ Name:                                       │
│ ┌─────────────────────────────────────┐   │
│ │ Implement registration API          │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Description:                                │
│ ┌─────────────────────────────────────┐   │
│ │ POST /api/auth/register with email │   │
│ │ validation, password hashing...     │   │
│ │                                     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Story Points:    Type:                     │
│ ┌──────┐        ┌──────────────┐          │
│ │  5   │        │ FEATURE  ▼   │          │
│ └──────┘        └──────────────┘          │
│                                             │
│ Layer:           Priority:                 │
│ ┌──────────────┐ ┌──────────────┐         │
│ │ BACKEND  ▼   │ │ HIGH     ▼   │         │
│ └──────────────┘ └──────────────┘         │
│                                             │
│ Dependencies:                               │
│ ☑ Task 1: Design database schema           │
│ ☐ Task 3: Implement login API              │
│                                             │
│       [Cancel] [Save Changes]              │
│                                             │
└────────────────────────────────────────────┘
```

### 5.4 Interactive Features

1. **Drag & Drop Reordering**
   - Users can drag tasks to reorder execution sequence
   - Dependency arrows update automatically

2. **Inline Editing**
   - Click task name/description to edit inline
   - Click story points to adjust estimate

3. **Dependency Management**
   - Click task to highlight dependencies
   - Add/remove dependencies with dropdown

4. **Bulk Actions**
   - Select multiple tasks → Delete, Adjust points, Change priority

5. **Visual Feedback**
   - ✅ Green: All validations passed
   - ⚠️  Yellow: Missing coverage areas
   - 🔴 Red: Validation errors (circular deps, invalid points)

## 6. Prompt Engineering

### 6.1 System Prompt

```
You are an expert Scrum Master and Software Architect specialized in breaking down Epics into well-structured sub-tasks for Agile development teams.

YOUR ROLE:
- Analyze Epic descriptions and decompose them into actionable sub-tasks
- Ensure logical ordering, clear dependencies, and balanced task sizes
- Consider full SDLC: design, implementation, testing, documentation, deployment
- Identify risks and missing requirements

BREAKDOWN PRINCIPLES:

1. TECHNICAL LAYERS
   - Database/Schema changes first
   - Backend API implementation
   - Frontend UI components
   - Integration and testing
   - Security and performance optimization

2. TASK GRANULARITY
   - Each task: 1-8 story points (Fibonacci: 1, 2, 3, 5, 8)
   - Aim for 2-5 points per task (sweet spot)
   - Tasks > 8 points should be broken down further
   - Target: 5-12 sub-tasks per Epic

3. DEPENDENCY DETECTION
   - Identify sequential dependencies (A must complete before B)
   - Identify blocking dependencies (A,B must complete before C)
   - Identify parallelizable tasks (A and B can run simultaneously)
   - Avoid circular dependencies

4. COVERAGE VALIDATION
   Must include:
   - ✅ Core functionality (features)
   - ✅ Error handling and edge cases
   - ✅ Testing (unit tests, integration tests)
   - ✅ Security considerations (auth, validation, rate limiting)
   - ⚠️  Optional: Documentation, deployment, monitoring

5. ESTIMATION FACTORS (Same as AI Estimate)
   - Description clarity (20%)
   - Technical complexity (40%)
   - Scope size (20%)
   - Uncertainty/Risk (20%)

6. TASK NAMING
   - Use action verbs: "Implement", "Create", "Build", "Write", "Add"
   - Be specific: "Implement user registration API" not "User registration"
   - Include technical layer: "Build login UI components" not just "Login"

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown code blocks):

{
  "subTasks": [
    {
      "tempId": "task-1",
      "name": "Task name with action verb",
      "description": "Detailed description (1-2 paragraphs)",
      "descriptionHtml": "<p>HTML formatted description</p>",
      "estimatedPoints": 3,
      "estimationReasoning": "Why this estimate in Vietnamese",
      "taskType": "FEATURE" | "TESTING" | "INFRA" | "DOCS" | "BUGFIX",
      "technicalLayer": "FRONTEND" | "BACKEND" | "DATABASE" | "DEVOPS" | "CROSS",
      "order": 1,
      "dependencies": ["task-X"],
      "canParallelize": true/false,
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "acceptanceCriteria": ["AC1", "AC2"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "reasoning": {
    "summary": "Giải thích cách tiếp cận breakdown (Vietnamese)",
    "coverageAreas": [
      {
        "area": "Database Design",
        "covered": true,
        "tasks": ["task-1"],
        "completeness": 1.0
      }
    ],
    "assumptions": ["Assumption 1 in Vietnamese"],
    "risks": ["Risk 1 in Vietnamese"]
  },
  "validation": {
    "totalPoints": 33,
    "completeness": 0.85,
    "balanceScore": 0.9,
    "coveragePercentage": 85
  }
}

IMPORTANT RULES:
1. All reasoning and descriptions for users must be in VIETNAMESE
2. JSON keys, tempIds, and enum values must stay in ENGLISH
3. Ensure NO circular dependencies (validate dependency graph)
4. Total points should be reasonable (10-50 range for most Epics)
5. Include at least 1 testing task
6. Order tasks logically (dependencies first)
7. Validate output JSON structure before returning
```

### 6.2 User Prompt Template

```typescript
function buildBreakdownUserPrompt(dto: BreakdownIssueRequest): string {
  return `
EPIC BREAKDOWN REQUEST

Epic Information:
- Name: ${dto.issueName}
- Type: ${dto.issueType}
- Priority: ${dto.priority}
- Description:
${dto.currentDescription}

Context:
${dto.context?.projectName ? `- Project: ${dto.context.projectName}` : ''}
${dto.context?.sprintGoal ? `- Sprint Goal: ${dto.context.sprintGoal}` : ''}
${dto.context?.technicalStack ? `- Tech Stack: ${dto.context.technicalStack.join(', ')}` : ''}

Constraints:
- Maximum sub-tasks: ${dto.constraints?.maxSubTasks || 10}
- Target points per task: ${dto.constraints?.targetPointsPerTask || '3-8'}
- Include tests: ${dto.constraints?.includeTests !== false ? 'Yes' : 'No'}
- Include docs: ${dto.constraints?.includeDocs ? 'Yes' : 'No'}

Please analyze this Epic and generate a comprehensive breakdown into sub-tasks following the principles above.

IMPORTANT:
- All reasoning and user-facing text MUST be in Vietnamese
- Ensure logical task ordering based on technical dependencies
- Validate no circular dependencies exist
- Each task must have clear acceptance criteria
- Include testing tasks for quality assurance
`;
}
```

## 7. Implementation Plan

### Phase 1: Backend Foundation (Days 1-3)

**Day 1: DTOs and Types**
- [ ] Create `breakdown-issue.dto.ts`
  - BreakdownIssueDto (request)
  - SubTaskDto
  - BreakdownDataDto
  - BreakdownResponseDto
- [ ] Export from `dto/index.ts`
- [ ] Add validation decorators

**Day 2: AI Service Logic**
- [ ] Add `getBreakdownPrompt()` to PromptService
- [ ] Add `buildBreakdownUserPrompt()` to PromptService
- [ ] Add `breakdownEpic()` method to AIService
- [ ] Implement `parseBreakdownResponse()` with JSON validation
- [ ] Implement `validateDependencies()` to detect circular deps
- [ ] Add error handling

**Day 3: API Controller & Testing**
- [ ] Add `breakdownIssue()` endpoint to AIController
- [ ] Implement caching (24h)
- [ ] Add Swagger documentation
- [ ] Test with Postman/Insomnia
- [ ] Test error cases (invalid JSON, circular deps)

### Phase 2: Frontend Components (Days 4-6)

**Day 4: Types & Service**
- [ ] Update `src/core/types/ai.ts` with breakdown types
- [ ] Add `breakdownIssue()` to AIService
- [ ] Create `useAIBreakdown` hook
- [ ] Error handling with toast notifications

**Day 5: UI Components**
- [ ] Create `AIBreakdownSection` component
  - Task list with cards
  - Summary header with metrics
  - Coverage analysis panel
  - Edit/Delete per task
- [ ] Create `AIBreakdownTaskCard` sub-component
  - Display task info
  - Inline edit mode
  - Dependency badges
- [ ] Create `AIDependencyGraph` component (optional)
  - Visual dependency visualization
  - Using react-flow or similar

**Day 6: Integration**
- [ ] Add "AI Breakdown" button to IssueDetailPanel
- [ ] Show button only for EPIC or STORY with points > 13
- [ ] Integrate AIBreakdownSection display
- [ ] Implement "Create Sub-tasks" bulk action
- [ ] Handle create multiple issues API call
- [ ] Refresh issue list after creation
- [ ] Success/error toast notifications

### Phase 3: Polish & Documentation (Days 7-8)

**Day 7: UX Enhancements**
- [ ] Add drag & drop task reordering
- [ ] Add loading states with skeleton UI
- [ ] Add empty states
- [ ] Add confirmation dialogs
- [ ] Improve error messages
- [ ] Add keyboard shortcuts (Esc to cancel, Enter to confirm)

**Day 8: Testing & Documentation**
- [ ] Write unit tests for AIService.breakdownEpic()
- [ ] Write integration tests for endpoint
- [ ] Test with various Epic descriptions
- [ ] Document usage in README
- [ ] Create demo video/screenshots
- [ ] Update feature documentation

### Phase 4: Advanced Features (Optional, Days 9-10)

**Day 9: Dependency Graph Visualization**
- [ ] Install react-flow or d3.js
- [ ] Render dependency graph
- [ ] Interactive node selection
- [ ] Highlight critical path

**Day 10: Smart Suggestions**
- [ ] "Regenerate with different approach" option
- [ ] "Add missing coverage" suggestions
- [ ] Save breakdown templates for reuse
- [ ] Historical breakdown analytics

## 8. Success Metrics

### 8.1 Technical Metrics

1. **Breakdown Quality**
   - Completeness score: Target ≥ 85%
   - Balance score: Target ≥ 80%
   - Valid dependencies: 100% (no circular deps)
   - Coverage percentage: Target ≥ 80%

2. **Performance**
   - Response time: < 5 seconds (95th percentile)
   - Cache hit rate: > 30% after 1 week
   - API success rate: > 95%

3. **Accuracy**
   - User acceptance rate: Target ≥ 70% (users create tasks without major edits)
   - Edit rate: < 30% of tasks get edited before creation
   - Deletion rate: < 10% of tasks get deleted

### 8.2 User Adoption Metrics

1. **Usage**
   - Breakdown feature usage: Target 40% of Epics
   - Repeat usage rate: Target ≥ 60%
   - Average breakdown per week: Track trend

2. **Time Savings**
   - Manual breakdown time: ~30-45 minutes
   - AI breakdown + review: ~10-15 minutes
   - Time saved: ~20-30 minutes per Epic (60% reduction)

3. **User Satisfaction**
   - Feature rating: Target ≥ 4.0/5.0
   - Would recommend: Target ≥ 75%
   - Net Promoter Score: Track

### 8.3 Business Impact

1. **Planning Efficiency**
   - Sprint planning duration: Track before/after
   - Epic breakdown completion rate: Target 100% (vs ~60% manual)
   - Number of "missed tasks" discovered mid-sprint: Reduce by 40%

2. **Execution Quality**
   - Sprint commitment accuracy: Improve by 15%
   - Task completion rate: Improve by 10%
   - Rework due to incomplete breakdown: Reduce by 30%

## 9. Risks & Mitigation

### 9.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI generates invalid dependencies | High | Implement circular dependency detection; validate graph structure |
| Token limit exceeded for large Epics | Medium | Truncate description to 4000 chars; summarize if needed |
| Inconsistent task estimates | Medium | Use same estimation logic as AI Estimate feature; allow manual override |
| JSON parsing failures | High | Robust error handling; retry with fixed prompt; fallback to manual |

### 9.2 User Experience Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users blindly accept bad breakdowns | High | Show coverage analysis; highlight missing areas; educate users |
| Too many sub-tasks generated | Medium | Default max: 10 tasks; allow user configuration |
| Dependencies too complex | Medium | Simplify dependency graph; group parallel tasks |
| Users expect perfect breakdown | Medium | Set expectations: "AI-assisted" not "AI-automated"; emphasize review step |

### 9.3 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption rate | Medium | User training; showcase benefits; integrate into workflow |
| Doesn't save time (review takes too long) | High | Optimize AI accuracy; improve UI for quick edits; pre-select good defaults |
| Teams become over-reliant on AI | Low | Encourage critical thinking; AI as assistant not replacement |

## 10. Future Enhancements

### V2 Features (Post-Launch)

1. **Learning from Team History**
   - Analyze team's past breakdowns
   - Learn team-specific patterns
   - Personalized suggestions per team

2. **Template Library**
   - Save successful breakdowns as templates
   - "Authentication Epic template"
   - "CRUD feature template"
   - Share templates across teams

3. **Intelligent Regeneration**
   - "Too granular? Merge some tasks"
   - "Too coarse? Break down further"
   - "Rebalance task sizes"
   - "Focus on testing/security"

4. **Integration with Velocity**
   - Consider team velocity when sizing
   - Warn if breakdown exceeds sprint capacity
   - Suggest sprint allocation

5. **Collaborative Editing**
   - Multiple team members review breakdown simultaneously
   - Voting on task acceptance
   - Comments on individual tasks

6. **Auto-Assignment Suggestions**
   - Based on task type and team member skills
   - "Task X best suited for Developer Y"
   - Load balancing across team

## 11. Academic Value (For Thesis)

### Research Contributions

1. **Structured Task Decomposition via LLM**
   - Novel application of LLMs to Agile planning
   - Constraint satisfaction with dependencies
   - Coverage validation algorithms

2. **Evaluation Framework**
   - Metrics for breakdown quality
   - Comparison: AI vs manual breakdowns
   - User study on time savings and accuracy

3. **Technical Challenges Solved**
   - Circular dependency detection
   - Balanced task sizing
   - Multi-dimensional coverage analysis

### Potential Paper Sections

1. **Introduction**: Problem of manual Epic breakdown
2. **Related Work**: LLMs in software engineering, task planning
3. **Methodology**: Prompt engineering, validation algorithms
4. **Implementation**: System architecture, UI/UX design
5. **Evaluation**: Quantitative metrics + user study
6. **Discussion**: Limitations, future work
7. **Conclusion**: Benefits and lessons learned

### Comparison with Baselines

- **Manual breakdown** (baseline)
- **Simple AI** (no dependencies, no validation)
- **Smart AI** (full system with dependencies & coverage)

**Metrics to compare:**
- Time to complete breakdown
- Quality scores (completeness, balance, coverage)
- User satisfaction
- Sprint success rate after using breakdown

---

## Conclusion

AI Smart Issue Breakdown is a high-impact feature that addresses a real pain point in Agile development. It combines:

✅ **Practical utility** - Saves 60% time in Epic breakdown
✅ **Technical complexity** - NLP, graph algorithms, constraint satisfaction
✅ **Visual appeal** - Dependency graphs, coverage analysis, interactive UI
✅ **Academic value** - Novel application, measurable evaluation, research contributions

This feature will significantly enhance your PM tool and provide strong content for your thesis.
