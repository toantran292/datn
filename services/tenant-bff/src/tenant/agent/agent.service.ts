import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RagClient } from '../../common/rag/rag.client';
import { AgentChatRequestDto, AgentChatResponseDto, ChatMessageDto } from './dto/agent.dto';

interface ProjectSummary {
  id: string;
  name: string;
  identifier: string;
  issueCount?: number;
  completedCount?: number;
}

interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectName?: string;
  assigneeName?: string;
}

interface MemberSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  taskCount?: number;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly pmBaseUrl: string;
  private readonly identityBaseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly ragClient: RagClient,
  ) {
    this.pmBaseUrl = this.config.get('PM_BASE_URL', 'http://pm:3000');
    this.identityBaseUrl = this.config.get('IDENTITY_BASE_URL', 'http://identity:3000');
  }

  async chat(
    orgId: string,
    userId: string,
    request: AgentChatRequestDto,
  ): Promise<AgentChatResponseDto> {
    // 1. Gather context from various services
    const context = await this.gatherContext(orgId, userId, request.projectId);

    // 2. Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(context);

    // 3. Build messages for LLM
    const messages = this.buildMessages(systemPrompt, request.message, request.history);

    // 4. Call RAG service
    const result = await this.ragClient.chat(messages, {
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      response: result.response,
      context: {
        projects: context.projects.length,
        tasks: context.tasks.length,
        members: context.members.length,
      },
    };
  }

  /**
   * Streaming chat - returns AsyncGenerator for SSE
   */
  async *chatStream(
    orgId: string,
    userId: string,
    request: AgentChatRequestDto,
  ): AsyncGenerator<string, void, unknown> {
    // 1. Gather context from various services
    const context = await this.gatherContext(orgId, userId, request.projectId);

    // 2. Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(context);

    // 3. Build messages for LLM
    const messages = this.buildMessages(systemPrompt, request.message, request.history);

    // 4. Stream from RAG service
    for await (const chunk of this.ragClient.chatStream(messages, {
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    })) {
      yield chunk;
    }
  }

  private async gatherContext(
    orgId: string,
    userId: string,
    projectId?: string,
  ): Promise<{
    projects: ProjectSummary[];
    tasks: TaskSummary[];
    members: MemberSummary[];
    currentUser: { id: string; name?: string };
  }> {
    const [projects, tasks, members] = await Promise.all([
      this.fetchProjects(orgId, projectId),
      this.fetchTasks(orgId, userId, projectId),
      this.fetchMembers(orgId),
    ]);

    return {
      projects,
      tasks,
      members,
      currentUser: { id: userId },
    };
  }

  private async fetchProjects(orgId: string, projectId?: string): Promise<ProjectSummary[]> {
    try {
      const url = projectId
        ? `${this.pmBaseUrl}/api/projects/${projectId}`
        : `${this.pmBaseUrl}/api/projects/all`;

      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );

      const data = res.data;
      if (projectId) {
        return data ? [data] : [];
      }
      return data || [];
    } catch (err) {
      this.logger.error(`Failed to fetch projects: ${err.message}`);
      return [];
    }
  }

  private async fetchTasks(orgId: string, userId: string, projectId?: string): Promise<TaskSummary[]> {
    try {
      const url = projectId
        ? `${this.pmBaseUrl}/api/projects/${projectId}/issues`
        : `${this.pmBaseUrl}/api/issues/assigned`;

      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
            'X-User-Id': userId,
          },
        }),
      );

      return res.data || [];
    } catch (err) {
      this.logger.error(`Failed to fetch tasks: ${err.message}`);
      return [];
    }
  }

  private async fetchMembers(orgId: string): Promise<MemberSummary[]> {
    try {
      const url = `${this.identityBaseUrl}/internal/orgs/${orgId}/members`;

      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'bff' },
        }),
      );

      return (res.data || []).map((m: any) => ({
        id: m.userId || m.id,
        name: m.displayName || m.fullName || m.email,
        email: m.email,
        role: m.role,
      }));
    } catch (err) {
      this.logger.error(`Failed to fetch members: ${err.message}`);
      return [];
    }
  }

  private buildSystemPrompt(context: {
    projects: ProjectSummary[];
    tasks: TaskSummary[];
    members: MemberSummary[];
    currentUser: { id: string; name?: string };
  }): string {
    const projectsSummary = context.projects.length > 0
      ? context.projects.map(p => `- ${p.name} (${p.identifier}): ${p.issueCount || 0} issues`).join('\n')
      : 'Không có dự án nào.';

    const tasksSummary = context.tasks.length > 0
      ? context.tasks.slice(0, 10).map(t => `- [${t.status}] ${t.title} (${t.priority})`).join('\n')
      : 'Không có công việc nào.';

    const membersSummary = context.members.length > 0
      ? context.members.slice(0, 10).map(m => `- ${m.name} (${m.role})`).join('\n')
      : 'Không có thành viên nào.';

    const todoCount = context.tasks.filter(t => t.status === 'TODO' || t.status === 'BACKLOG').length;
    const inProgressCount = context.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const doneCount = context.tasks.filter(t => t.status === 'DONE').length;

    return `Bạn là UTS Agent - trợ lý AI thông minh cho hệ thống quản lý công việc UTS Workspace.

## Thông tin Workspace hiện tại:

### Dự án (${context.projects.length} dự án):
${projectsSummary}

### Công việc của người dùng (${context.tasks.length} tasks):
- Chưa làm: ${todoCount}
- Đang làm: ${inProgressCount}
- Hoàn thành: ${doneCount}

Chi tiết:
${tasksSummary}

### Thành viên (${context.members.length} người):
${membersSummary}

## Hướng dẫn:
- Trả lời bằng tiếng Việt
- Tập trung vào thông tin workspace thực tế ở trên
- Nếu được hỏi về tiến độ, hãy tính % dựa trên số liệu thực
- Nếu được hỏi "hôm nay làm gì", hãy gợi ý các task đang có
- Format response với markdown cho dễ đọc
- Ngắn gọn, súc tích, đi thẳng vào vấn đề`;
  }

  private buildMessages(
    systemPrompt: string,
    userMessage: string,
    history?: ChatMessageDto[],
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    if (history && history.length > 0) {
      for (const msg of history.slice(-10)) { // Keep last 10 messages
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }
}
