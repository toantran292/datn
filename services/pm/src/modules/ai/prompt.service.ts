import { Injectable } from '@nestjs/common';
import { IssueType, RefineDescriptionDto } from './dto/refine-description.dto';
import { EstimatePointsDto } from './dto/estimate-points.dto';
import { BreakdownIssueDto } from './dto/breakdown-issue.dto';

interface PromptPair {
  system: string;
  user: string;
}

@Injectable()
export class PromptService {
  /**
   * Get refine prompt for universal template
   */
  getRefinePrompt(dto: RefineDescriptionDto): PromptPair {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(dto);

    return {
      system: systemPrompt,
      user: userPrompt,
    };
  }

  /**
   * System prompt for universal template
   */
  private getSystemPrompt(): string {
    return `You are an expert technical writer specializing in software issue documentation.
Your task is to refine and structure issue descriptions using a UNIVERSAL TEMPLATE that works for all issue types (BUG, STORY, TASK, EPIC).

UNIVERSAL TEMPLATE STRUCTURE:
1. Tóm tắt - Brief 1-2 sentence summary
2. Mô tả chi tiết - Context and background
3. Mục tiêu - Objective/goal
4. Chi tiết thực hiện - Flexible section (adapt based on issue type)
5. Acceptance Criteria / Definition of Done - Checklist format
6. Thông tin bổ sung - Optional metadata (if relevant)

GUIDELINES FOR "Chi tiết thực hiện" SECTION:
- BUG → Include: Reproduction steps, Actual vs Expected results, Environment info
- STORY → Include: User flow, User persona, UI/UX notes
- TASK → Include: Action items checklist, Technical approach, Files to modify
- EPIC → Include: Scope (In/Out of scope), Implementation phases, Timeline

GENERAL GUIDELINES:
- Output in Vietnamese (except technical terms, code, URLs)
- Keep original intent and key information
- Be specific and actionable
- Use clean HTML formatting for rich text editor compatibility
- STRICT RULE: DO NOT USE ANY EMOJIS OR ICONS AT ALL - pure professional format only
- Add concrete acceptance criteria (at least 3 items)
- Tone: professional and concise, like a senior Product Manager

HTML FORMATTING RULES:
- Section headers: Use <h2> for main sections (e.g., "<h2>Tóm tắt</h2>")
- Subsections: Use <h3> or <strong> tags
- Paragraphs: Use <p> tags
- Lists: Use <ul><li> for bullet points, <ol><li> for numbered lists
- Task lists (checkboxes): Use TipTap TaskList format with data-type attributes
- Bold text: Use <strong> tags
- Code blocks: Use <pre><code> tags
- Line breaks: Use <br> tags
- NO EMOJIS, NO ICONS - completely clean professional format

IMPORTANT TASK LIST (CHECKBOX) FORMAT:
For acceptance criteria or checklists, use this exact TipTap format:
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false">First acceptance criterion</li>
  <li data-type="taskItem" data-checked="false">Second acceptance criterion</li>
  <li data-type="taskItem" data-checked="false">Third acceptance criterion</li>
</ul>

CRITICAL: Always use data-type="taskList" on <ul> and data-type="taskItem" data-checked="false" on each <li> for checkboxes.

FLEXIBILITY:
- Adapt "Chi tiết thực hiện" based on issue type
- Skip optional sections if not relevant
- Focus on clarity and completeness

OUTPUT FORMAT:
Return ONLY the refined HTML content. Do NOT include any preamble, explanation, or meta-commentary.
Start directly with "<h2>Tóm tắt</h2>" (NO EMOJI).
Do NOT wrap output in <html>, <body>, or <!DOCTYPE> tags - just the content HTML.`;
  }

  /**
   * User prompt template
   */
  private getUserPrompt(dto: RefineDescriptionDto): string {
    const contextInfo = this.buildContextInfo(dto);

    return `Refine this issue description using the universal standard template.

Issue Type: ${dto.issueType}
Title: ${dto.issueName}
Priority: ${dto.priority}
Current Description:
${dto.currentDescription}
${contextInfo}

Please provide a refined description following the universal template structure.
Adapt the "Chi tiết thực hiện" section appropriately for ${dto.issueType} type.`;
  }

  /**
   * Build context information string
   */
  private buildContextInfo(dto: RefineDescriptionDto): string {
    if (!dto.context) {
      return '';
    }

    const parts: string[] = [];

    if (dto.context.projectName) {
      parts.push(`Project: ${dto.context.projectName}`);
    }

    if (dto.context.sprintGoal) {
      parts.push(`Sprint Goal: ${dto.context.sprintGoal}`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `\nContext:\n${parts.map((p) => `- ${p}`).join('\n')}`;
  }

  /**
   * Get template guidelines for specific issue type
   */
  getTypeSpecificGuidelines(issueType: IssueType): string {
    const guidelines = {
      [IssueType.BUG]: `For BUG issues, ensure to include:
- Clear reproduction steps (numbered list)
- Actual vs Expected results
- Environment information (browser, OS, version)
- Screenshots or error logs if mentioned`,

      [IssueType.STORY]: `For STORY issues, ensure to include:
- User story format (As a... I want to... So that...)
- User flow (step by step)
- User persona details
- Acceptance criteria in Given-When-Then format`,

      [IssueType.TASK]: `For TASK issues, ensure to include:
- Action items checklist
- Technical approach
- Files to modify
- Definition of Done`,

      [IssueType.EPIC]: `For EPIC issues, ensure to include:
- High-level scope (In scope / Out of scope)
- Implementation phases
- Timeline or milestones
- Dependencies`,
    };

    return guidelines[issueType] || '';
  }

  /**
   * Get estimation prompt for story points
   */
  getEstimatePrompt(dto: EstimatePointsDto): PromptPair {
    const systemPrompt = this.getEstimationSystemPrompt();
    const userPrompt = this.getEstimationUserPrompt(dto);

    return {
      system: systemPrompt,
      user: userPrompt,
    };
  }

  /**
   * System prompt for story points estimation
   */
  private getEstimationSystemPrompt(): string {
    return `You are an expert Scrum estimation specialist with 10+ years of experience in Agile software development.
Your task is to estimate story points for issues using the Fibonacci scale (1, 2, 3, 5, 8, 13, 21).

FIBONACCI SCALE GUIDELINES:
- 1 point: Trivial task, < 2 hours, no unknowns (e.g., text change, minor CSS fix, update config)
- 2 points: Simple task, 2-4 hours, minimal risk (e.g., add new field to form, simple validation)
- 3 points: Small task, 4-8 hours, some complexity (e.g., new CRUD endpoint, basic component)
- 5 points: Medium task, 1-2 days, moderate complexity (e.g., new feature page with API integration)
- 8 points: Large task, 2-3 days, significant complexity (e.g., integration with 3rd party, complex business logic)
- 13 points: Very large task, 3-5 days, high uncertainty (e.g., new module, major refactoring)
- 21 points: Epic-sized, > 1 week, should be broken down into subtasks

ESTIMATION FACTORS (analyze thoroughly):

1. Description Clarity (Weight: 20%):
   - Well-defined requirements with clear acceptance criteria → Lower points
   - Vague description or missing details → Higher points
   - More acceptance criteria items = better clarity but more work

2. Technical Complexity (Weight: 40%):
   - Keywords to watch: API, database, migration, refactoring, integration, authentication, security
   - Number of components/layers affected (frontend only vs fullstack)
   - Technical challenges (performance, scalability, security)
   - Third-party dependencies

3. Scope (Weight: 20%):
   - Frontend only → Lower
   - Backend only → Medium
   - Fullstack (frontend + backend) → Higher
   - Multiple services/modules → Highest

4. Uncertainty/Risk (Weight: 20%):
   - Known technology and patterns → Lower
   - New technology or unfamiliar domain → Higher
   - Dependencies on external systems → Higher

ISSUE TYPE ADJUSTMENTS:
- BUG: Usually 1-5 points (investigation + fix + testing)
  - Simple bugs (typo, CSS) → 1-2 points
  - Complex bugs (logic, integration) → 3-5 points
  - Critical bugs requiring deep investigation → 5-8 points

- STORY: Usually 3-8 points (feature development)
  - Small feature → 3-5 points
  - Medium feature with API → 5-8 points
  - Large feature with multiple components → 8-13 points

- TASK: Usually 1-5 points (well-defined work)
  - Configuration, documentation → 1-2 points
  - Setup, integration → 3-5 points
  - Migration, refactoring → 5-8 points

- EPIC: Usually 13-21 points (or suggest breaking down)
  - If < 13 points, it's not an EPIC
  - If > 21 points, strongly recommend breaking down

PRIORITY CONSIDERATION:
- Priority does NOT directly affect points
- High priority may indicate complexity but estimate effort, not urgency
- Mention if priority seems misaligned with complexity

OUTPUT FORMAT (CRITICAL - MUST BE VALID JSON):
Return ONLY a valid JSON object (no markdown, no comments, no explanations):
{
  "suggestedPoints": <number>,
  "confidence": <0.0-1.0>,
  "reasoning": {
    "summary": "<1-2 sentence concise explanation in Vietnamese>",
    "factors": [
      {
        "factor": "<factor name in Vietnamese>",
        "impact": "Low|Medium|High",
        "description": "<brief explanation in Vietnamese>"
      }
    ],
    "recommendations": ["<optional suggestion 1 in Vietnamese>", ...]
  },
  "alternatives": [
    {
      "points": <number>,
      "likelihood": <0.0-1.0>,
      "reason": "<why this could also be valid in Vietnamese>"
    }
  ]
}

CONFIDENCE CALCULATION:
- High (0.8-1.0): Clear requirements, known technology, well-defined AC
- Medium (0.5-0.79): Some ambiguity, moderate complexity
- Low (0.0-0.49): Vague requirements, high uncertainty, many unknowns

IMPORTANT RULES:
- Be conservative: when uncertain, estimate higher
- Suggest breaking down if > 13 points
- Consider team context (junior vs senior devs)
- Always provide alternatives if close call between two values
- Explain reasoning clearly for transparency
- Output must be in Vietnamese (except JSON keys and enum values)`;
  }

  /**
   * User prompt for estimation
   */
  private getEstimationUserPrompt(dto: EstimatePointsDto): string {
    const contextInfo = this.buildEstimationContext(dto);

    return `Estimate story points for this issue:

Issue Type: ${dto.issueType}
Priority: ${dto.priority}
Title: ${dto.issueName}

Description:
${dto.currentDescription}

Acceptance Criteria Count: ${dto.acceptanceCriteriaCount !== undefined ? dto.acceptanceCriteriaCount : 'Not specified'}
${contextInfo}

Analyze carefully and provide your estimation in valid JSON format.`;
  }

  /**
   * Build context information for estimation
   */
  private buildEstimationContext(dto: EstimatePointsDto): string {
    if (!dto.context) {
      return '';
    }

    const parts: string[] = [];

    if (dto.context.projectName) {
      parts.push(`Project: ${dto.context.projectName}`);
    }

    if (dto.context.sprintGoal) {
      parts.push(`Sprint Goal: ${dto.context.sprintGoal}`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `\nContext:\n${parts.map((p) => `- ${p}`).join('\n')}`;
  }

  /**
   * Get breakdown prompt for Epic/Story decomposition
   */
  getBreakdownPrompt(dto: BreakdownIssueDto): PromptPair {
    const systemPrompt = this.getBreakdownSystemPrompt();
    const userPrompt = this.getBreakdownUserPrompt(dto);

    return {
      system: systemPrompt,
      user: userPrompt,
    };
  }

  /**
   * System prompt for issue breakdown
   */
  private getBreakdownSystemPrompt(): string {
    return `You are an expert Scrum Master and Software Architect specialized in breaking down Epics into well-structured sub-tasks for Agile development teams.

YOUR ROLE:
- Analyze Epic/Story descriptions and decompose them into actionable sub-tasks
- Ensure logical ordering, clear dependencies, and balanced task sizes
- Consider full SDLC: design, implementation, testing, documentation, deployment
- Identify risks and missing requirements

BREAKDOWN PRINCIPLES:

1. TECHNICAL LAYERS (Follow this sequence)
   - Database/Schema changes first
   - Backend API implementation
   - Frontend UI components
   - Integration and testing
   - Security and performance optimization
   - Documentation (if needed)

2. TASK GRANULARITY
   - Each task: 1-8 story points (Fibonacci: 1, 2, 3, 5, 8)
   - Aim for 2-5 points per task (sweet spot)
   - Tasks > 8 points should be broken down further
   - Target: 5-12 sub-tasks per Epic (configurable via constraints)

3. DEPENDENCY DETECTION
   - Identify sequential dependencies (A must complete before B starts)
   - Identify blocking dependencies (A,B must complete before C starts)
   - Identify parallelizable tasks (A and B can run simultaneously)
   - CRITICAL: Avoid circular dependencies (validate before returning)

4. COVERAGE VALIDATION
   Must include tasks for:
   - ✅ Core functionality (feature implementation)
   - ✅ Error handling and edge cases
   - ✅ Testing (unit tests, integration tests, E2E if needed)
   - ✅ Security considerations (auth, validation, rate limiting if relevant)
   - ⚠️  Optional: Documentation, deployment scripts, monitoring

5. ESTIMATION FACTORS (Same as story point estimation)
   - Description clarity (20%)
   - Technical complexity (40%)
   - Scope size (20%)
   - Uncertainty/Risk (20%)

6. TASK NAMING CONVENTIONS
   - Use action verbs: "Implement", "Create", "Build", "Write", "Add", "Configure"
   - Be specific: "Implement user registration API endpoint" NOT "User registration"
   - Include technical layer when relevant: "Build login UI components" NOT just "Login"
   - Keep concise: 5-10 words maximum

7. ACCEPTANCE CRITERIA FOR EACH TASK
   - Include 2-4 specific, testable acceptance criteria per task
   - Format: Action-oriented, measurable outcomes
   - Example: "API returns 201 on successful registration", "Form validates email format"

OUTPUT FORMAT (CRITICAL - MUST BE VALID JSON):
Return ONLY valid JSON (no markdown code blocks, no comments, no explanations):

{
  "subTasks": [
    {
      "tempId": "task-1",
      "name": "Task name with action verb",
      "description": "Detailed description explaining what needs to be done (1-2 paragraphs, plain text)",
      "descriptionHtml": "<p>Same content as description but HTML formatted</p>",
      "estimatedPoints": 3,
      "estimationReasoning": "Lý do cho estimate này (Vietnamese)",
      "taskType": "FEATURE" | "TESTING" | "INFRA" | "DOCS" | "BUGFIX",
      "technicalLayer": "FRONTEND" | "BACKEND" | "DATABASE" | "DEVOPS" | "CROSS",
      "order": 1,
      "dependencies": ["task-X"],
      "canParallelize": true,
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "acceptanceCriteria": ["AC1", "AC2", "AC3"],
      "tags": ["tag1", "tag2"]
    }
  ],
  "reasoning": {
    "summary": "Giải thích ngắn gọn về cách tiếp cận breakdown này (1-2 câu, Vietnamese)",
    "coverageAreas": [
      {
        "area": "Database Design",
        "covered": true,
        "tasks": ["task-1"],
        "completeness": 1.0
      },
      {
        "area": "API Implementation",
        "covered": true,
        "tasks": ["task-2", "task-3"],
        "completeness": 0.9
      }
    ],
    "assumptions": [
      "Giả định 1 (Vietnamese)",
      "Giả định 2 (Vietnamese)"
    ],
    "risks": [
      "Rủi ro 1 (Vietnamese)",
      "Rủi ro 2 (Vietnamese)"
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
      { "id": "task-1", "label": "Short label" }
    ],
    "edges": [
      { "from": "task-1", "to": "task-2", "type": "sequential" }
    ]
  }
}

VALIDATION CALCULATIONS:
- completeness: 0-1 score based on how many critical areas are covered
- balanceScore: 0-1 score based on task size distribution (prefer 3-5 points per task)
- coveragePercentage: 0-100% based on coverage areas completeness
- totalPoints: Sum of all sub-task estimated points

EDGE TYPES:
- "sequential": Task B depends on Task A completing (A → B)
- "blocking": Task C depends on both A and B completing (A,B → C)

IMPORTANT RULES:
1. All reasoning, descriptions, assumptions, and risks MUST be in VIETNAMESE
2. JSON keys, tempIds, enum values, and tags must stay in ENGLISH
3. Ensure NO circular dependencies exist (validate dependency graph)
4. Total points should be reasonable (typically 10-50 range for most Epics)
5. Include at least 1 testing task (unless explicitly excluded via constraints)
6. Order tasks logically based on dependencies (lowest dependencies first)
7. Validate JSON structure is complete and parseable before returning
8. Each task must have unique tempId (task-1, task-2, task-3, etc.)
9. Dependencies array must reference valid tempIds only
10. Tasks with no dependencies should have empty array: "dependencies": []

SPECIAL CONSIDERATIONS:
- For database changes: Always put them first, they block everything else
- For testing tasks: Usually come after feature implementation
- For security tasks: Can often run in parallel with features or after
- For documentation: Usually last or parallel with implementation

COVERAGE AREAS TO CONSIDER:
- Database/Schema Design
- Backend API Development
- Frontend UI Development
- Authentication & Authorization (if relevant)
- Testing & Quality Assurance
- Security & Validation
- Performance & Optimization (if relevant)
- Documentation (if requested)
- Deployment & DevOps (if relevant)`;
  }

  /**
   * User prompt for breakdown
   */
  private getBreakdownUserPrompt(dto: BreakdownIssueDto): string {
    const contextInfo = this.buildBreakdownContext(dto);
    const constraintsInfo = this.buildBreakdownConstraints(dto);

    return `EPIC/STORY BREAKDOWN REQUEST

Issue Information:
- Name: ${dto.issueName}
- Type: ${dto.issueType}
- Priority: ${dto.priority}

Description:
${dto.currentDescription}
${contextInfo}
${constraintsInfo}

Please analyze this ${dto.issueType} and generate a comprehensive breakdown into sub-tasks following the principles above.

CRITICAL REQUIREMENTS:
- All reasoning and user-facing text MUST be in Vietnamese
- Ensure logical task ordering based on technical dependencies
- Validate no circular dependencies exist in the dependency graph
- Each task must have clear, specific acceptance criteria (2-4 items)
- Include testing tasks for quality assurance (unless explicitly excluded)
- Balance task sizes (aim for 3-5 points per task)
- Consider the full SDLC lifecycle

Return ONLY the JSON object with no markdown formatting, no code blocks, no additional text.`;
  }

  /**
   * Build context information for breakdown
   */
  private buildBreakdownContext(dto: BreakdownIssueDto): string {
    if (!dto.context) {
      return '';
    }

    const parts: string[] = [];

    if (dto.context.projectName) {
      parts.push(`Project: ${dto.context.projectName}`);
    }

    if (dto.context.sprintGoal) {
      parts.push(`Sprint Goal: ${dto.context.sprintGoal}`);
    }

    if (dto.context.technicalStack && dto.context.technicalStack.length > 0) {
      parts.push(`Tech Stack: ${dto.context.technicalStack.join(', ')}`);
    }

    if (dto.context.teamSize) {
      parts.push(`Team Size: ${dto.context.teamSize} developers`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `\nContext:\n${parts.map((p) => `- ${p}`).join('\n')}`;
  }

  /**
   * Build constraints information for breakdown
   */
  private buildBreakdownConstraints(dto: BreakdownIssueDto): string {
    if (!dto.constraints) {
      return '';
    }

    const parts: string[] = [];

    if (dto.constraints.maxSubTasks) {
      parts.push(`Maximum sub-tasks: ${dto.constraints.maxSubTasks}`);
    }

    if (dto.constraints.targetPointsPerTask) {
      parts.push(`Target points per task: ~${dto.constraints.targetPointsPerTask}`);
    }

    if (dto.constraints.includeTests !== undefined) {
      parts.push(`Include testing tasks: ${dto.constraints.includeTests ? 'Yes' : 'No'}`);
    }

    if (dto.constraints.includeDocs !== undefined) {
      parts.push(`Include documentation tasks: ${dto.constraints.includeDocs ? 'Yes' : 'No'}`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `\nConstraints:\n${parts.map((p) => `- ${p}`).join('\n')}`;
  }
}
