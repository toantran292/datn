import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MeetingAnalysisService } from './meeting-analysis.service';
import { OpenAIService } from '../ai/openai.service';
import { IssueService } from '../issue/issue.service';
import {
  AnalyzeMeetingDto,
  AnalyzeMeetingResponseDto,
  TaskPreviewDto,
  BulkCreateTasksDto,
  BulkCreateTasksResponseDto,
  TaskType,
  TaskPriority,
} from './dto';
import { IssuePriority } from '../issue/enums/issue-priority.enum';
import { IssueType } from '../issue/enums/issue-type.enum';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingAnalysisService: MeetingAnalysisService,
    private readonly openaiService: OpenAIService,
    private readonly issueService: IssueService,
  ) {}

  /**
   * Analyze meeting from video/audio/text
   */
  async analyzeMeeting(
    dto: AnalyzeMeetingDto,
    file: Express.Multer.File | null,
    orgId: string,
    userId: string,
  ): Promise<AnalyzeMeetingResponseDto> {
    this.logger.log(`Analyzing meeting for project: ${dto.projectId}`);

    // Validate project
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, orgId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let transcript: string;
    let sourceType: string;
    let sourceUrl: string | null = null;

    // Extract transcript
    if (file) {
      this.logger.log(`Processing uploaded file: ${file.originalname}`);

      // Determine source type
      if (file.mimetype.startsWith('video/')) {
        sourceType = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        sourceType = 'audio';
      } else {
        throw new BadRequestException('Invalid file type. Only video and audio files are supported.');
      }

      // TODO: Upload to S3 and store sourceUrl
      // For now, we'll transcribe directly

      // Transcribe audio/video
      transcript = await this.openaiService.transcribeAudio(
        file.buffer,
        file.originalname,
      );
    } else if (dto.transcript) {
      transcript = dto.transcript;
      sourceType = 'text';
    } else {
      throw new BadRequestException('Either file or transcript must be provided');
    }

    // Create meeting transcript record
    const meeting = await this.prisma.meetingTranscript.create({
      data: {
        orgId,
        projectId: dto.projectId,
        title: dto.title || `Meeting ${new Date().toLocaleDateString()}`,
        transcript,
        sourceType,
        sourceUrl,
        createdBy: userId,
      },
    });

    this.logger.log(`Meeting transcript created: ${meeting.id}`);

    // Analyze transcript and extract tasks
    const tasks = await this.meetingAnalysisService.analyzeTranscript(
      transcript,
      dto.projectId,
    );

    // Calculate stats
    const stats = this.calculateStats(tasks);

    return {
      meetingId: meeting.id,
      transcript,
      tasks,
      stats,
    };
  }

  /**
   * Bulk create tasks from meeting
   */
  async bulkCreateTasks(
    meetingId: string,
    dto: BulkCreateTasksDto,
    orgId: string,
    userId: string,
  ): Promise<BulkCreateTasksResponseDto> {
    this.logger.log(`Bulk creating ${dto.tasks.length} tasks from meeting: ${meetingId}`);

    // Validate meeting exists
    const meeting = await this.prisma.meetingTranscript.findFirst({
      where: { id: meetingId, orgId },
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Create tasks sequentially to avoid sequence_id conflicts
    const created: any[] = [];
    const failed: any[] = [];

    for (let index = 0; index < dto.tasks.length; index++) {
      const task = dto.tasks[index];

      try {
        const result = await this.createSingleTask(
          task,
          meetingId,
          dto.projectId,
          orgId,
          userId,
          index,
        );

        created.push({
          tempId: `temp-${index}`,
          issueId: result.id,
          issueKey: result.key,
          title: task.title,
        });

        this.logger.log(`Created task ${index + 1}/${dto.tasks.length}: ${task.title}`);
      } catch (error) {
        this.logger.error(`Failed to create task ${index + 1}/${dto.tasks.length}: ${task.title}`, error.stack);

        failed.push({
          tempId: `temp-${index}`,
          title: task.title,
          error: error.message || 'Unknown error',
          code: error.code,
        });
      }
    }

    this.logger.log(
      `Created ${created.length}/${dto.tasks.length} tasks successfully`,
    );

    return {
      success: failed.length === 0,
      stats: {
        total: dto.tasks.length,
        succeeded: created.length,
        failed: failed.length,
      },
      created,
      failed,
    };
  }

  /**
   * Create single task from meeting
   */
  private async createSingleTask(
    task: any,
    meetingId: string,
    projectId: string,
    orgId: string,
    userId: string,
    orderIndex: number,
  ): Promise<any> {
    // Map priorities
    const priorityMap: Record<TaskPriority, IssuePriority> = {
      [TaskPriority.URGENT]: IssuePriority.CRITICAL, // Map URGENT -> CRITICAL
      [TaskPriority.HIGH]: IssuePriority.HIGH,
      [TaskPriority.MEDIUM]: IssuePriority.MEDIUM,
      [TaskPriority.LOW]: IssuePriority.LOW,
    };

    // Map types
    const typeMap: Record<TaskType, IssueType> = {
      [TaskType.BUG]: IssueType.BUG,
      [TaskType.TASK]: IssueType.TASK,
      [TaskType.STORY]: IssueType.STORY,
      [TaskType.FEATURE]: IssueType.EPIC, // Map FEATURE -> EPIC
    };

    // Create issue
    const issue = await this.issueService.create(
      {
        projectId,
        name: task.title,
        description: task.description,
        priority: priorityMap[task.priority] || IssuePriority.MEDIUM,
        type: typeMap[task.type] || IssueType.TASK,
        point: task.estimatedPoints,
        assignees: task.assigneeId ? [task.assigneeId] : [],
      },
      orgId,
      userId,
    );

    // Update issue with meeting context
    await this.prisma.issue.update({
      where: { id: issue.id },
      data: {
        meetingTranscriptId: meetingId,
        meetingOrder: orderIndex + 1,
        meetingContext: task.context,
      },
    });

    // Generate issue key (PROJECT-123 format)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { identifier: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      ...issue,
      key: `${project.identifier}-${issue.sequenceId}`,
    };
  }

  /**
   * Calculate statistics for tasks
   */
  private calculateStats(tasks: TaskPreviewDto[]) {
    const byPriority = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byType = {
      bug: 0,
      task: 0,
      story: 0,
      feature: 0,
    };

    let totalPoints = 0;

    tasks.forEach((task) => {
      byPriority[task.priority]++;
      byType[task.type]++;
      totalPoints += task.estimatedPoints;
    });

    return {
      totalTasks: tasks.length,
      totalPoints,
      byPriority,
      byType,
    };
  }
}
