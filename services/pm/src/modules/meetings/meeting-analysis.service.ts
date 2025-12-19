import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OpenAIService } from '../ai/openai.service';
import { TaskPreviewDto, TaskType, TaskPriority } from './dto';
import { v4 as uuidv4 } from 'uuid';

const COMPREHENSIVE_MEETING_ANALYSIS_PROMPT = `You are an expert project manager and scrum master.

Analyze this meeting transcript and extract ALL action items as COMPLETE, READY-TO-IMPLEMENT tasks.

For EACH task, provide FULL information (no user intervention needed):

1. **title**: Short, actionable Vietnamese title (5-10 words)
   - Format: Động từ + Đối tượng
   - Example: "Triển khai API xác thực người dùng"
   - MUST BE IN VIETNAMESE

2. **description**: DETAILED, REFINED HTML description ready for developers
   - CRITICAL: Format as clean HTML (NO markdown, NO emojis)
   - MUST BE IN VIETNAMESE (except technical terms, code, URLs)
   - Use UNIVERSAL TEMPLATE structure:

   REQUIRED HTML STRUCTURE:
   <h2>Tóm tắt</h2>
   <p>Brief 1-2 sentence summary in Vietnamese</p>

   <h2>Mô tả chi tiết</h2>
   <p>Detailed context and background explaining what and why</p>

   <h2>Mục tiêu</h2>
   <p>Clear objective/goal to achieve</p>

   <h2>Chi tiết thực hiện</h2>
   <ul>
     <li>Implementation detail 1</li>
     <li>Implementation detail 2</li>
     <li>Implementation detail 3</li>
   </ul>

   <h2>Acceptance Criteria</h2>
   <ul data-type="taskList">
     <li data-type="taskItem" data-checked="false">First acceptance criterion</li>
     <li data-type="taskItem" data-checked="false">Second acceptance criterion</li>
     <li data-type="taskItem" data-checked="false">Third acceptance criterion</li>
   </ul>

   HTML FORMATTING RULES:
   - Section headers: <h2> tags
   - Paragraphs: <p> tags
   - Lists: <ul><li> for bullets, <ol><li> for numbers
   - Task lists (checkboxes): <ul data-type="taskList"><li data-type="taskItem" data-checked="false">
   - Bold: <strong> tags
   - Code: <code> or <pre><code> tags
   - NO EMOJIS, NO ICONS - completely clean professional format
   - Start directly with "<h2>Tóm tắt</h2>"
   - Must be specific enough that a developer can start immediately

3. **type**: Classify as "bug" | "task" | "story" | "feature"
   - bug: Fixing errors or defects
   - task: Regular technical work
   - story: User-facing features
   - feature: Large feature development

4. **priority**: Analyze urgency and importance: "urgent" | "high" | "medium" | "low"
   - urgent: Blocking other work, immediate deadline
   - high: Critical path, high business value
   - medium: Normal priority
   - low: Nice to have, can defer

5. **order**: Sequence number (1, 2, 3...)
   - Analyze dependencies carefully
   - Lower number = must do first
   - Consider technical dependencies and logical workflow

6. **estimatedPoints**: Story points (1, 2, 3, 5, 8, 13)
   - 1: Very simple (< 2 hours)
   - 2: Simple (2-4 hours)
   - 3: Medium (4-8 hours, ~1 day)
   - 5: Complex (1-2 days)
   - 8: Very complex (2-3 days)
   - 13: Extremely complex (3-5 days)

7. **suggestedAssignee**: Extract person's name if mentioned, else null

8. **dependencies**: Array of task order numbers this depends on

9. **context**: Brief context from meeting in Vietnamese (1-2 sentences)

Guidelines:
- Extract EVERY actionable task mentioned
- ALL text MUST BE IN VIETNAMESE (except code, technical terms, URLs)
- Write descriptions as if briefing a Vietnamese developer
- Description MUST be HTML format following the template above
- Be specific and technical
- Include at least 3 acceptance criteria in checkbox format
- Analyze dependencies accurately
- Prioritize based on business value + technical dependencies
- NO EMOJIS in any field

Return JSON array sorted by order (ascending). CRITICAL: Return ONLY valid JSON array. No explanation, no markdown code blocks, just the JSON.`;

@Injectable()
export class MeetingAnalysisService {
  private readonly logger = new Logger(MeetingAnalysisService.name);

  constructor(private readonly openaiService: OpenAIService) {}

  async analyzeTranscript(
    transcript: string,
    projectId: string,
  ): Promise<TaskPreviewDto[]> {
    this.logger.log('Starting comprehensive meeting analysis');

    if (!transcript || transcript.trim().length < 50) {
      throw new BadRequestException('Transcript too short to analyze');
    }

    try {
      // Call GPT-4 with comprehensive prompt
      const prompt = `${COMPREHENSIVE_MEETING_ANALYSIS_PROMPT}\n\nMeeting Transcript:\n${transcript}`;

      const response = await this.openaiService.createChatCompletion({
        model: 'gpt-4o-mini', // Using faster, cheaper model - still excellent for task extraction
        messages: [
          {
            role: 'system',
            content: 'You are an expert project manager. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Low for consistency
        max_tokens: 4000, // Increase for detailed descriptions
      });

      this.logger.log('Received AI response, parsing...');

      // Parse response
      let parsedResponse: any;
      try {
        // Clean response content - remove markdown code blocks if present
        let cleanedContent = response.content.trim();

        // Remove ```json and ``` wrappers
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
        }

        parsedResponse = JSON.parse(cleanedContent);
      } catch (error) {
        this.logger.error('Failed to parse AI response as JSON', error);
        this.logger.error('Response content:', response.content);
        throw new BadRequestException('AI returned invalid JSON response');
      }

      // Extract tasks array (AI might wrap in object)
      let tasksArray: any[];
      if (Array.isArray(parsedResponse)) {
        tasksArray = parsedResponse;
      } else if (parsedResponse.tasks && Array.isArray(parsedResponse.tasks)) {
        tasksArray = parsedResponse.tasks;
      } else {
        this.logger.error('AI response does not contain tasks array', parsedResponse);
        throw new BadRequestException('AI response missing tasks array');
      }

      if (tasksArray.length === 0) {
        this.logger.warn('No tasks found in transcript');
        return [];
      }

      // Validate and enrich tasks
      const tasks = tasksArray.map((task, index) =>
        this.validateAndEnrichTask(task, index),
      );

      this.logger.log(`Successfully analyzed ${tasks.length} tasks`);
      return tasks;
    } catch (error) {
      this.logger.error('Error analyzing meeting transcript', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to analyze meeting: ${error.message}`,
      );
    }
  }

  private validateAndEnrichTask(task: any, index: number): TaskPreviewDto {
    // Generate temp ID
    const id = uuidv4();

    // Validate required fields
    if (!task.title || typeof task.title !== 'string') {
      throw new BadRequestException(
        `Task ${index + 1} missing or invalid title`,
      );
    }

    if (!task.description || typeof task.description !== 'string') {
      throw new BadRequestException(
        `Task ${index + 1} missing or invalid description`,
      );
    }

    // Validate and normalize type
    let type: TaskType;
    if (
      task.type &&
      Object.values(TaskType).includes(task.type.toLowerCase())
    ) {
      type = task.type.toLowerCase() as TaskType;
    } else {
      this.logger.warn(`Task ${index + 1} has invalid type: ${task.type}, defaulting to 'task'`);
      type = TaskType.TASK;
    }

    // Validate and normalize priority
    let priority: TaskPriority;
    if (
      task.priority &&
      Object.values(TaskPriority).includes(task.priority.toLowerCase())
    ) {
      priority = task.priority.toLowerCase() as TaskPriority;
    } else {
      this.logger.warn(
        `Task ${index + 1} has invalid priority: ${task.priority}, defaulting to 'medium'`,
      );
      priority = TaskPriority.MEDIUM;
    }

    // Validate order
    const order =
      typeof task.order === 'number' && task.order > 0
        ? task.order
        : index + 1;

    // Validate story points
    const validPoints = [1, 2, 3, 5, 8, 13];
    let estimatedPoints: number;
    if (validPoints.includes(task.estimatedPoints)) {
      estimatedPoints = task.estimatedPoints;
    } else {
      this.logger.warn(
        `Task ${index + 1} has invalid points: ${task.estimatedPoints}, defaulting to 3`,
      );
      estimatedPoints = 3;
    }

    // Validate dependencies
    const dependencies = Array.isArray(task.dependencies)
      ? task.dependencies.filter((d) => typeof d === 'number' && d > 0)
      : [];

    // Build task preview
    return {
      id,
      title: task.title.trim(),
      description: task.description.trim(),
      type,
      priority,
      order,
      estimatedPoints,
      suggestedAssignee: task.suggestedAssignee?.trim() || null,
      assigneeId: undefined, // Will be resolved later
      dependencies,
      context: task.context?.trim() || '',
    };
  }
}
