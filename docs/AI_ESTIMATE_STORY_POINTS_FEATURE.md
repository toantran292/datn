# AI Estimate Story Points Feature

## 📋 Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Technical Design](#technical-design)
- [Implementation Plan](#implementation-plan)
- [API Specification](#api-specification)
- [UI/UX Design](#uiux-design)
- [Success Metrics](#success-metrics)

---

## 🎯 Overview

**AI Estimate Story Points** là tính năng sử dụng AI để tự động đề xuất story points cho các issues dựa trên phân tích description, acceptance criteria, và issue type. Tính năng này giúp team tiết kiệm thời gian trong quá trình estimation và tạo baseline cho planning poker sessions.

### Key Benefits
- ⚡ **Tăng tốc Planning**: Giảm 60-70% thời gian estimation meetings
- 🎯 **Consistency**: Đảm bảo estimation đồng nhất dựa trên complexity analysis
- 📊 **Data-driven**: AI học từ pattern của issues tương tự
- 🤝 **Team Collaboration**: Dùng AI estimation làm starting point cho discussion

---

## 🔴 Problem Statement

### Current Pain Points

#### 1. **Time-consuming Estimation Process**
- Planning poker sessions thường tốn 1-2 giờ cho mỗi sprint
- Team phải discuss từng ticket một, đặc biệt với team distributed/remote
- New joiners không biết estimate như thế nào

#### 2. **Inconsistent Estimation**
- Different team members có understanding khác nhau về complexity
- Không có baseline reference cho similar tasks
- Estimation bias dựa trên ai là người viết issue

#### 3. **Lack of Historical Context**
- Khó so sánh với issues tương tự đã làm trước đó
- Không có data về accuracy của past estimations
- Team không learn được từ velocity history

### User Personas Affected

**👨‍💼 Product Manager/Owner**
- Cần quick estimation để prioritize backlog
- Muốn hiểu effort trước khi commit với stakeholders

**👥 Scrum Master**
- Phải facilitate planning meetings hiệu quả
- Cần tools để speed up estimation process

**👨‍💻 Development Team**
- Bận rộn với coding, không muốn spend too much time estimating
- Cần reference để calibrate estimation

---

## ✅ Solution

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Estimation Flow                      │
└─────────────────────────────────────────────────────────────┘

User opens issue detail
         │
         ▼
  Clicks "AI Estimate" button
         │
         ▼
AI analyzes:                          ┌─────────────────────┐
  • Issue type (BUG/STORY/TASK/EPIC)  │                     │
  • Description complexity            │  OpenAI GPT-4o-mini │
  • Acceptance criteria count         │                     │
  • Technical keywords                │  Prompt Engineering │
  • Similar issues (optional)         └─────────────────────┘
         │
         ▼
AI returns:
  • Suggested story points (1/2/3/5/8/13)
  • Confidence level (Low/Medium/High)
  • Reasoning breakdown
  • Complexity factors
         │
         ▼
User reviews and can:
  • Accept suggestion → Auto-update issue
  • Adjust manually → Save custom value
  • Dismiss → Keep current estimation
```

### Core Features

#### 1. **Intelligent Analysis**
- Phân tích description length và complexity
- Detect technical terms (API, database, migration, etc.)
- Count acceptance criteria items
- Identify scope (frontend, backend, fullstack)

#### 2. **Fibonacci Scale Support**
- Support standard Fibonacci: 1, 2, 3, 5, 8, 13, 21
- Explain reasoning cho mỗi mức points
- Handle edge cases (0 points for trivial tasks)

#### 3. **Confidence Scoring**
- **High (80-100%)**: Clear requirements, well-defined AC
- **Medium (50-79%)**: Some ambiguity, need clarification
- **Low (0-49%)**: Vague description, missing details

#### 4. **Reasoning Transparency**
- Explain WHY AI chose specific points
- Breakdown factors: complexity, scope, uncertainty
- Suggest improvements to increase accuracy

---

## 🏗️ Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  IssueDetailPanel Component                          │  │
│  │    • AI Estimate Button                              │  │
│  │    • AIEstimateSection (result display)              │  │
│  │    • Story Points Field Integration                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ useAIEstimate hook               │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Client (/pm/api/ai/estimate-points)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AIController.estimatePoints()                       │  │
│  │    • Validate input                                  │  │
│  │    • Call AIService                                  │  │
│  │    • Return estimation result                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AIService.estimateStoryPoints()                     │  │
│  │    • Get prompt from PromptService                   │  │
│  │    • Call OpenAI API                                 │  │
│  │    • Parse & validate response                       │  │
│  │    • Calculate confidence                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PromptService.getEstimatePrompt()                   │  │
│  │    • Build system prompt                             │  │
│  │    • Build user prompt with context                  │  │
│  │    • Include estimation guidelines                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OpenAIService                                       │  │
│  │    • Token estimation                                │  │
│  │    • API call with retry logic                       │  │
│  │    • Error handling                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Call
                            ▼
                  ┌─────────────────────┐
                  │   OpenAI GPT-4o-mini│
                  └─────────────────────┘
```

### Data Models

#### Request DTO
```typescript
// EstimatePointsDto
{
  issueId: string;
  issueName: string;
  issueType: IssueType; // BUG | STORY | TASK | EPIC
  priority: IssuePriority; // URGENT | HIGH | MEDIUM | LOW
  currentDescription: string;
  acceptanceCriteriaCount?: number;
  context?: {
    projectName?: string;
    sprintGoal?: string;
    similarIssues?: Array<{
      name: string;
      points: number;
      type: IssueType;
    }>;
  };
}
```

#### Response DTO
```typescript
// EstimatePointsResponseDto
{
  success: boolean;
  data?: {
    suggestedPoints: number; // 1, 2, 3, 5, 8, 13, 21
    confidence: number; // 0.0 - 1.0
    reasoning: {
      summary: string; // "This is a medium-complexity task..."
      factors: Array<{
        factor: string; // "Description Length", "Technical Complexity"
        impact: string; // "Medium", "High", "Low"
        description: string;
      }>;
      recommendations?: string[]; // Optional suggestions to improve clarity
    };
    alternatives?: Array<{
      points: number;
      likelihood: number; // 0.0 - 1.0
      reason: string;
    }>;
  };
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### AI Prompt Design

#### System Prompt
```
You are an expert Scrum estimation specialist with 10+ years of experience in Agile software development.
Your task is to estimate story points for issues using the Fibonacci scale (1, 2, 3, 5, 8, 13, 21).

FIBONACCI SCALE GUIDELINES:
- 1 point: Trivial task, < 2 hours, no unknowns (e.g., text change, minor CSS fix)
- 2 points: Simple task, 2-4 hours, minimal risk (e.g., add new field to form)
- 3 points: Small task, 4-8 hours, some complexity (e.g., new CRUD endpoint)
- 5 points: Medium task, 1-2 days, moderate complexity (e.g., new feature page)
- 8 points: Large task, 2-3 days, significant complexity (e.g., integration with 3rd party)
- 13 points: Very large task, 3-5 days, high uncertainty (e.g., new module)
- 21 points: Epic-sized, > 1 week, should be broken down into subtasks

ESTIMATION FACTORS:
1. Description Clarity (0-30%):
   - Well-defined requirements with acceptance criteria → Lower points
   - Vague description or missing details → Higher points

2. Technical Complexity (0-40%):
   - Number of components/layers affected
   - Technical keywords: API, database, migration, refactoring, integration
   - Technology stack complexity

3. Scope (0-20%):
   - Frontend only → Lower
   - Backend only → Medium
   - Fullstack → Higher
   - Multiple services → Highest

4. Uncertainty/Risk (0-10%):
   - Known technology and patterns → Lower
   - New technology or unfamiliar domain → Higher

ISSUE TYPE ADJUSTMENTS:
- BUG: Usually 1-5 points (investigation + fix)
- STORY: Usually 3-8 points (feature development)
- TASK: Usually 1-5 points (well-defined work)
- EPIC: Usually 13-21 points (or suggest breaking down)

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "suggestedPoints": <number>,
  "confidence": <0.0-1.0>,
  "reasoning": {
    "summary": "<1-2 sentence explanation>",
    "factors": [
      {
        "factor": "<factor name>",
        "impact": "Low|Medium|High",
        "description": "<brief explanation>"
      }
    ],
    "recommendations": ["<optional suggestion 1>", ...]
  },
  "alternatives": [
    {
      "points": <number>,
      "likelihood": <0.0-1.0>,
      "reason": "<why this could also be valid>"
    }
  ]
}

Be conservative: when uncertain, estimate higher and suggest breaking down the task.
```

#### User Prompt Template
```
Estimate story points for this issue:

Issue Type: {issueType}
Priority: {priority}
Title: {issueName}

Description:
{currentDescription}

Acceptance Criteria Count: {acceptanceCriteriaCount || 'Not specified'}

{contextInfo}

Please analyze and provide your estimation.
```

---

## 📝 Implementation Plan

### Phase 1: Backend Implementation (2-3 days)

#### Day 1: Core Service
- [ ] Create `EstimatePointsDto` and `EstimatePointsResponseDto`
- [ ] Add `estimateStoryPoints()` method to `AIService`
- [ ] Add `getEstimatePrompt()` method to `PromptService`
- [ ] Write unit tests for estimation logic

#### Day 2: API Endpoint
- [ ] Add `estimatePoints()` endpoint to `AIController`
- [ ] Add validation and error handling
- [ ] Add `@SkipOrgCheck()` decorator (dev mode)
- [ ] Test endpoint with Postman/curl

#### Day 3: Testing & Refinement
- [ ] Test with various issue types and complexities
- [ ] Fine-tune prompt based on results
- [ ] Add confidence calculation logic
- [ ] Document API in Swagger

### Phase 2: Frontend Implementation (2-3 days)

#### Day 1: Hook & API Client
- [ ] Create `useAIEstimate` hook
- [ ] Add API client method `estimatePoints()`
- [ ] Add types for estimation response
- [ ] Test API integration

#### Day 2: UI Components
- [ ] Create `AIEstimateSection` component (similar to `AIRefineSection`)
- [ ] Add "AI Estimate" button to `IssueDetailPanel`
- [ ] Add loading and error states
- [ ] Style with existing design system

#### Day 3: Integration & Polish
- [ ] Integrate with story points field
- [ ] Add "Accept" / "Adjust" / "Dismiss" actions
- [ ] Add toast notifications
- [ ] Test full user flow
- [ ] Fix bugs and edge cases

### Phase 3: Testing & Documentation (1 day)

- [ ] End-to-end testing with real issues
- [ ] Cross-browser testing
- [ ] Write user documentation
- [ ] Create demo video
- [ ] Update changelog

---

## 🔌 API Specification

### Endpoint

```
POST /pm/api/ai/estimate-points
```

### Headers
```
Content-Type: application/json
X-Org-ID: <organization-id>  (optional in dev mode)
```

### Request Body
```json
{
  "issueId": "issue_123",
  "issueName": "Implement user authentication with OAuth2",
  "issueType": "STORY",
  "priority": "HIGH",
  "currentDescription": "<p>As a user, I want to login using Google OAuth...</p>",
  "acceptanceCriteriaCount": 5,
  "context": {
    "projectName": "PM-WEB",
    "sprintGoal": "Complete authentication module"
  }
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "suggestedPoints": 8,
    "confidence": 0.85,
    "reasoning": {
      "summary": "This is a large story requiring OAuth integration, user management, and security implementation.",
      "factors": [
        {
          "factor": "Technical Complexity",
          "impact": "High",
          "description": "OAuth integration requires understanding of authentication flows, token management, and security best practices."
        },
        {
          "factor": "Scope",
          "impact": "High",
          "description": "Fullstack work involving backend API, frontend UI, and database schema changes."
        },
        {
          "factor": "Acceptance Criteria",
          "impact": "Medium",
          "description": "5 acceptance criteria indicate well-defined requirements with moderate complexity."
        }
      ],
      "recommendations": [
        "Consider breaking down into subtasks: Google OAuth setup, UI components, error handling",
        "Add security review as separate task"
      ]
    },
    "alternatives": [
      {
        "points": 5,
        "likelihood": 0.3,
        "reason": "If OAuth library is already integrated and team has experience"
      },
      {
        "points": 13,
        "likelihood": 0.2,
        "reason": "If this includes comprehensive security audit and testing"
      }
    ]
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "tokensUsed": 850,
    "processingTime": 2340
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to estimate story points. Please try again.",
    "details": {
      "reason": "OpenAI API timeout"
    }
  }
}
```

---

## 🎨 UI/UX Design

### Component Layout

```
┌────────────────────────────────────────────────────────────┐
│ Issue Detail Panel                                         │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Issue Title: Implement user authentication             ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Description                                            ││
│ │ [Rich text editor content...]                          ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Properties                                 │           ││
│ │                                            │           ││
│ │ Story Points:  [  5  ▾]   [✨ AI Estimate]│           ││
│ │                             ^^^^^^^^^^^^^^             ││
│ │                             NEW BUTTON                 ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ [AI Estimate Section appears here when clicked]           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### AI Estimate Section

```
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ✨ AI Story Points Estimation                        │  │
│ │                                          [─] Collapse │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Suggested Points: 8                                  │  │
│ │ Confidence: High (85%)                               │  │
│ │                                                      │  │
│ │ 💡 Reasoning:                                        │  │
│ │ This is a large story requiring OAuth integration,  │  │
│ │ user management, and security implementation.       │  │
│ │                                                      │  │
│ │ 📊 Complexity Factors:                               │  │
│ │ • Technical Complexity: High                        │  │
│ │   OAuth integration requires understanding of...    │  │
│ │                                                      │  │
│ │ • Scope: High                                       │  │
│ │   Fullstack work involving backend API...          │  │
│ │                                                      │  │
│ │ • Acceptance Criteria: Medium                       │  │
│ │   5 criteria indicate well-defined requirements... │  │
│ │                                                      │  │
│ │ 💭 Alternative Estimates:                            │  │
│ │ • 5 points (30% chance) - If OAuth already setup   │  │
│ │ • 13 points (20% chance) - If includes security... │  │
│ │                                                      │  │
│ │ ⚠️ Recommendations:                                  │  │
│ │ • Consider breaking into subtasks                   │  │
│ │ • Add security review as separate task              │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │  [Cancel]              [Adjust Points] [✓ Accept]   │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### User Interactions

#### 1. **Click "AI Estimate" Button**
- Show loading spinner
- Disable button during processing
- Display "Đang phân tích..." text

#### 2. **View Estimation Result**
- Animate section slide-down
- Highlight suggested points value
- Color-code confidence:
  - 🟢 High (>80%): Green badge
  - 🟡 Medium (50-80%): Yellow badge
  - 🔴 Low (<50%): Red badge

#### 3. **Accept Estimation**
- Update story points field immediately
- Show success toast: "Story points updated to 8"
- Close AI Estimate section
- Save to backend

#### 4. **Adjust Points**
- Open story points dropdown
- Pre-fill with suggested value
- User can change to different Fibonacci number
- Save custom value

#### 5. **Dismiss**
- Close AI Estimate section
- Keep existing story points unchanged
- No backend call

---

## 📊 Success Metrics

### Quantitative Metrics

#### 1. **Adoption Rate**
- **Target**: 60% of issues have AI estimation used
- **Measure**: Track API calls vs total issues created

#### 2. **Acceptance Rate**
- **Target**: 70% of AI suggestions accepted without modification
- **Measure**: Track "Accept" vs "Adjust" vs "Dismiss" actions

#### 3. **Time Savings**
- **Target**: 40% reduction in estimation time
- **Measure**:
  - Before: Average planning meeting duration
  - After: Average planning meeting duration

#### 4. **Estimation Accuracy**
- **Target**: AI suggestions within ±1 Fibonacci number of final team consensus
- **Measure**: Compare AI estimation vs final agreed points

#### 5. **Performance**
- **Target**: 95th percentile response time < 3 seconds
- **Measure**: API response time metrics

### Qualitative Metrics

#### 1. **User Satisfaction**
- Post-feature survey (1-5 scale):
  - "AI estimation is helpful": Target > 4.0
  - "Reasoning is clear": Target > 4.0
  - "Would use again": Target > 80%

#### 2. **Confidence in AI**
- Track confidence scores distribution
- Target: 60% of estimations have High confidence

#### 3. **Team Feedback**
- Conduct user interviews after 2 sprints
- Gather qualitative feedback on:
  - Accuracy
  - Usefulness of reasoning
  - Improvements needed

---

## 🔄 Future Enhancements

### V2 Features

1. **Historical Learning**
   - Train on team's past estimations
   - Learn team velocity patterns
   - Personalized estimation based on team composition

2. **Bulk Estimation**
   - Estimate multiple issues at once
   - Compare complexity across backlog
   - Sort backlog by estimated effort

3. **Estimation Comparison**
   - Show AI vs Team estimation over time
   - Track accuracy improvements
   - Highlight patterns where AI diverges

4. **Custom Fibonacci Scale**
   - Support different scales (0.5, 1, 2, 4, 8...)
   - Team-specific configuration
   - T-shirt sizing option (XS, S, M, L, XL)

5. **Integration with Sprint Planning**
   - Auto-estimate all sprint backlog items
   - Suggest sprint capacity based on velocity
   - Warn when sprint is overcommitted

---

## 🛠️ Development Guidelines

### Testing Strategy

#### Unit Tests
```typescript
describe('AIService.estimateStoryPoints', () => {
  it('should return 1 point for trivial task', async () => {
    const dto = {
      issueType: IssueType.TASK,
      issueName: 'Update button text',
      currentDescription: 'Change "Submit" to "Save"',
    };
    const result = await aiService.estimateStoryPoints(dto);
    expect(result.data.suggestedPoints).toBe(1);
  });

  it('should return high confidence for well-defined story', async () => {
    const dto = {
      issueType: IssueType.STORY,
      issueName: 'Add user profile page',
      currentDescription: '<detailed description with AC>',
      acceptanceCriteriaCount: 6,
    };
    const result = await aiService.estimateStoryPoints(dto);
    expect(result.data.confidence).toBeGreaterThan(0.7);
  });

  it('should handle OpenAI API errors gracefully', async () => {
    jest.spyOn(openaiService, 'createChatCompletion').mockRejectedValue(
      new Error('API timeout')
    );
    const result = await aiService.estimateStoryPoints(validDto);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AI_SERVICE_ERROR');
  });
});
```

#### Integration Tests
```typescript
describe('POST /pm/api/ai/estimate-points', () => {
  it('should return estimation for valid request', async () => {
    const response = await request(app.getHttpServer())
      .post('/pm/api/ai/estimate-points')
      .send(validEstimateDto)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.suggestedPoints).toBeDefined();
    expect([1, 2, 3, 5, 8, 13, 21]).toContain(
      response.body.data.suggestedPoints
    );
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/pm/api/ai/estimate-points')
      .send({})
      .expect(400);

    expect(response.body.message).toContain('validation failed');
  });
});
```

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier
- **Test Coverage**: Minimum 80% for new code
- **Documentation**: JSDoc comments for public methods
- **Error Handling**: Consistent error response format
- **Logging**: Structured logging with correlation IDs

---

## 📚 References

- [Agile Estimation Techniques](https://www.mountaingoatsoftware.com/agile/planning-poker)
- [Story Points vs Hours](https://www.atlassian.com/agile/project-management/estimation)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Fibonacci Sequence in Scrum](https://www.scruminc.com/fibonacci-sequence/)

---

## 📝 Changelog

### Version 1.0.0 (Planned)
- Initial implementation
- Support for BUG, STORY, TASK, EPIC types
- Fibonacci scale (1, 2, 3, 5, 8, 13, 21)
- Confidence scoring
- Reasoning breakdown
- Alternative suggestions

---

**Document Version**: 1.0.0
**Last Updated**: 2024-12-15
**Author**: AI Architecture Team
**Status**: 📝 Planning Phase
