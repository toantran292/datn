import { Injectable } from '@nestjs/common';
import { IssueType, RefineDescriptionDto } from './dto/refine-description.dto';
import { EstimatePointsDto } from './dto/estimate-points.dto';

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
}
