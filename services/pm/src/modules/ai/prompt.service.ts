import { Injectable } from '@nestjs/common';
import { IssueType, RefineDescriptionDto } from './dto/refine-description.dto';

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
}
