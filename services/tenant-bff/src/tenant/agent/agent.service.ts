import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RagClient, SearchResultItem } from '../../common/rag/rag.client';
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
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
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
    // 1. Gather context from various services + RAG search
    const context = await this.gatherContext(orgId, userId, request.projectId, request.message);

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
        ragResults: context.ragResults.length,
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
    // 1. Gather context from various services + RAG search
    const context = await this.gatherContext(orgId, userId, request.projectId, request.message);

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
    userQuery?: string,
  ): Promise<{
    projects: ProjectSummary[];
    tasks: TaskSummary[];
    members: MemberSummary[];
    currentUser: { id: string; name?: string };
    ragResults: SearchResultItem[];
  }> {
    const [projects, tasks, members, ragResults] = await Promise.all([
      this.fetchProjects(orgId, projectId),
      this.fetchTasks(orgId, userId, projectId),
      this.fetchMembers(orgId),
      userQuery ? this.searchRAG(orgId, userQuery, projectId) : Promise.resolve([]),
    ]);

    return {
      projects,
      tasks,
      members,
      currentUser: { id: userId },
      ragResults,
    };
  }

  /**
   * Search RAG for relevant content based on user query
   */
  private async searchRAG(
    orgId: string,
    query: string,
    projectId?: string,
  ): Promise<SearchResultItem[]> {
    try {
      const searchOptions: any = {
        orgId,
        limit: 10,
        minSimilarity: 0.6,
      };

      // If projectId provided, search in that namespace
      if (projectId) {
        searchOptions.namespaceId = projectId;
        searchOptions.namespaceType = 'project';
      }

      const response = await this.ragClient.search(query, searchOptions);
      return response.results || [];
    } catch (err) {
      this.logger.error(`Failed to search RAG: ${err.message}`);
      return [];
    }
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

      // Map response to TaskSummary with additional fields
      return (res.data || []).map((t: any) => ({
        id: t.id,
        title: t.title || t.name,
        status: t.status || t.state,
        priority: t.priority || 'MEDIUM',
        projectName: t.project?.name || t.projectName,
        assigneeName: t.assignee?.displayName || t.assignee?.fullName || t.assignee?.email || t.assigneeName,
        createdAt: t.createdAt || t.created_at,
        updatedAt: t.updatedAt || t.updated_at,
        completedAt: t.completedAt || t.completed_at,
      }));
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
    ragResults: SearchResultItem[];
  }): string {
    const projectsSummary = context.projects.length > 0
      ? context.projects.map(p => `- ${p.name} (${p.identifier}): ${p.issueCount || 0} issues`).join('\n')
      : 'Không có dự án nào.';

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString('vi-VN');
      } catch {
        return dateStr;
      }
    };

    const tasksSummary = context.tasks.length > 0
      ? context.tasks.slice(0, 15).map(t => {
          let detail = `- [${t.status}] "${t.title}" (Ưu tiên: ${t.priority})`;
          if (t.assigneeName) detail += ` | Người thực hiện: ${t.assigneeName}`;
          if (t.projectName) detail += ` | Dự án: ${t.projectName}`;
          if (t.status === 'DONE' && t.completedAt) detail += ` | Hoàn thành: ${formatDate(t.completedAt)}`;
          else if (t.updatedAt) detail += ` | Cập nhật: ${formatDate(t.updatedAt)}`;
          return detail;
        }).join('\n')
      : 'Không có công việc nào.';

    const membersSummary = context.members.length > 0
      ? context.members.slice(0, 10).map(m => `- ${m.name} (${m.role})`).join('\n')
      : 'Không có thành viên nào.';

    const todoCount = context.tasks.filter(t => t.status === 'TODO' || t.status === 'BACKLOG').length;
    const inProgressCount = context.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const doneCount = context.tasks.filter(t => t.status === 'DONE').length;

    // Build RAG context if available
    const ragContext = context.ragResults.length > 0
      ? context.ragResults.map((r, idx) => {
          const sourceLabel = r.sourceType === 'message' ? 'Tin nhắn' :
                              r.sourceType === 'document' ? 'Tài liệu' :
                              r.sourceType === 'file' ? 'File' : r.sourceType;
          const metadata = r.metadata || {};
          const metaInfo = metadata.fileName ? ` (${metadata.fileName})` :
                           metadata.title ? ` (${metadata.title})` : '';
          return `[${idx + 1}] [${sourceLabel}${metaInfo}] (độ liên quan: ${(r.similarity * 100).toFixed(0)}%)\n${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}`;
        }).join('\n\n')
      : '';

    let prompt = `Bạn là UTS Agent - trợ lý AI chuyên biệt cho hệ thống quản lý công việc UTS Workspace.

## GIỚI HẠN PHẠM VI (RẤT QUAN TRỌNG):
- Bạn CHỈ trả lời các câu hỏi liên quan đến:
  + Quản lý dự án (projects)
  + Công việc/task (issues, tasks)
  + Tiến độ dự án
  + Thành viên trong workspace
  + Phân công công việc
  + Báo cáo tiến độ
  + Nội dung tài liệu/file trong workspace
- Nếu người dùng hỏi về bất kỳ chủ đề nào KHÁC (ví dụ: lập trình, kiến thức chung, giải trí, tin tức, v.v.), hãy từ chối lịch sự và nhắc họ rằng bạn chỉ hỗ trợ về quản lý công việc.
- Ví dụ câu từ chối: "Xin lỗi, tôi là trợ lý chuyên về quản lý công việc trong UTS Workspace. Tôi chỉ có thể hỗ trợ bạn về dự án, task, tiến độ và thành viên. Bạn có câu hỏi gì về công việc không?"

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
${membersSummary}`;

    // Add RAG context if available
    if (ragContext) {
      prompt += `

### Thông tin liên quan từ tài liệu/hội thoại (${context.ragResults.length} kết quả):
${ragContext}`;
    }

    prompt += `

## Hướng dẫn trả lời:
- Trả lời bằng tiếng Việt
- CHỈ trả lời dựa trên thông tin workspace ở trên
- Nếu có thông tin từ RAG, ưu tiên sử dụng và trích dẫn nguồn
- Nếu được hỏi về tiến độ, hãy tính % dựa trên số liệu thực
- Nếu được hỏi "hôm nay làm gì", hãy gợi ý các task đang có
- Format response với markdown cho dễ đọc
- Ngắn gọn, súc tích, đi thẳng vào vấn đề
- KHÔNG trả lời các câu hỏi ngoài phạm vi quản lý công việc`;

    return prompt;
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
