import { Injectable, ForbiddenException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ChannelAIConfigRepository } from './repositories/channel-ai-config.repository';
import { DocumentSummaryRepository } from './repositories/document-summary.repository';
import { MessagesRepository, PersistedMessage } from '../chat/repositories/messages.repository';
import { RoomMembersRepository } from '../rooms/repositories/room-members.repository';
import { AttachmentsRepository } from '../chat/repositories/attachments.repository';
import { FileStorageClient } from '../common/file-storage/file-storage.client';
import { IdentityService } from '../common/identity/identity.service';
import { AIFeature } from '../database/entities/channel-ai-config.entity';
import { RagClient, ConversationMessage, ActionItem } from '../common/rag';

export interface QAResult {
  answer: string;
  sources: Array<{
    messageId: string;
    content: string;
    userId: string;
    createdAt: string;
  }>;
  confidence: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly ragClient: RagClient,
    private readonly aiConfigRepo: ChannelAIConfigRepository,
    private readonly documentSummaryRepo: DocumentSummaryRepository,
    private readonly messagesRepo: MessagesRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    private readonly attachmentsRepo: AttachmentsRepository,
    private readonly fileStorageClient: FileStorageClient,
    private readonly identityService: IdentityService,
  ) {}

  // ============== UC03: Channel AI Config ==============

  async getAIConfig(roomId: string, userId: string) {
    await this.checkMembership(roomId, userId);
    const config = await this.aiConfigRepo.getOrCreate(roomId, userId);
    return this.formatConfig(config);
  }

  async updateAIConfig(
    roomId: string,
    userId: string,
    orgId: string,
    data: {
      aiEnabled?: boolean;
      enabledFeatures?: AIFeature[];
      modelName?: string;
      temperature?: number;
      maxTokens?: number;
      customSystemPrompt?: string | null;
    },
  ) {
    await this.checkAdminRole(roomId, userId, orgId);

    const config = await this.aiConfigRepo.update(roomId, {
      ...data,
      configuredBy: userId,
    });

    return this.formatConfig(config);
  }

  async toggleAIFeature(roomId: string, userId: string, orgId: string, feature: AIFeature, enabled: boolean) {
    await this.checkAdminRole(roomId, userId, orgId);

    const config = await this.aiConfigRepo.getOrCreate(roomId, userId);
    let features = [...config.enabledFeatures];

    if (enabled && !features.includes(feature)) {
      features.push(feature);
    } else if (!enabled) {
      features = features.filter(f => f !== feature);
    }

    const updated = await this.aiConfigRepo.update(roomId, {
      enabledFeatures: features,
      configuredBy: userId,
    });

    return this.formatConfig(updated);
  }

  // ============== UC11: Conversation Summary ==============

  async summarizeConversation(
    roomId: string,
    userId: string,
    options?: {
      messageCount?: number;
      threadId?: string;
    },
  ): Promise<{ summary: string; messageCount: number }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'summary');

    const config = await this.aiConfigRepo.getOrCreate(roomId);
    const messageCount = options?.messageCount ?? 50;

    // Fetch recent messages
    let messages;
    if (options?.threadId) {
      const result = await this.messagesRepo.listByThread(roomId, options.threadId, { pageSize: messageCount });
      messages = result.items;
    } else {
      const result = await this.messagesRepo.listByRoom(roomId, { pageSize: messageCount });
      messages = result.items;
    }

    if (messages.length === 0) {
      return { summary: 'Không có tin nhắn để tóm tắt.', messageCount: 0 };
    }

    // Sort by date (oldest first for context)
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const conversationMessages: ConversationMessage[] = messages.map(m => ({
      userId: m.userId,
      content: m.content,
      createdAt: m.createdAt,
    }));

    const result = await this.ragClient.summarizeConversation(
      conversationMessages,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
      config.customSystemPrompt ?? undefined,
    );

    return {
      summary: result.summary,
      messageCount: messages.length,
    };
  }

  // ============== UC12: Extract Action Items ==============

  async extractActionItems(
    roomId: string,
    userId: string,
    options?: {
      messageCount?: number;
      threadId?: string;
    },
  ): Promise<{ items: ActionItem[]; messageCount: number }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'action_items');

    const config = await this.aiConfigRepo.getOrCreate(roomId);
    const messageCount = options?.messageCount ?? 50;

    // Fetch recent messages
    let messages;
    if (options?.threadId) {
      const result = await this.messagesRepo.listByThread(roomId, options.threadId, { pageSize: messageCount });
      messages = result.items;
    } else {
      const result = await this.messagesRepo.listByRoom(roomId, { pageSize: messageCount });
      messages = result.items;
    }

    if (messages.length === 0) {
      return { items: [], messageCount: 0 };
    }

    // Sort by date
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const conversationMessages: ConversationMessage[] = messages.map(m => ({
      userId: m.userId,
      content: m.content,
      createdAt: m.createdAt,
    }));

    const result = await this.ragClient.extractActionItems(
      conversationMessages,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
    );

    return {
      items: result.items,
      messageCount: messages.length,
    };
  }

  // ============== UC13: RAG Q&A ==============

  async askQuestion(
    roomId: string,
    userId: string,
    question: string,
    options?: {
      contextMessageCount?: number;
      threadId?: string;
    },
  ): Promise<QAResult> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'qa');

    if (!question || question.trim().length < 3) {
      throw new BadRequestException('Question must be at least 3 characters');
    }

    const contextCount = options?.contextMessageCount ?? 100;

    // Fetch context messages
    let messages;
    if (options?.threadId) {
      const result = await this.messagesRepo.listByThread(roomId, options.threadId, { pageSize: contextCount });
      messages = result.items;
    } else {
      const result = await this.messagesRepo.listByRoom(roomId, { pageSize: contextCount });
      messages = result.items;
    }

    if (messages.length === 0) {
      return {
        answer: 'Không có ngữ cảnh hội thoại để trả lời câu hỏi.',
        sources: [],
        confidence: 0,
      };
    }

    // Sort by date
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Build context for RAG
    const contextMessages = messages.map(m => ({
      role: 'user' as const,
      content: `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`,
    }));

    // Use RAG client to chat with context
    const chatResponse = await this.ragClient.chat(
      [
        {
          role: 'system',
          content: `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh hội thoại.
Chỉ trả lời dựa trên thông tin có trong ngữ cảnh.
Nếu không tìm thấy câu trả lời, hãy nói rõ.
Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi.`,
        },
        {
          role: 'user',
          content: `Ngữ cảnh hội thoại:\n${contextMessages.map(m => m.content).join('\n')}\n\nCâu hỏi: ${question}`,
        },
      ],
    );

    // Get recent messages as sources
    const recentMessages = messages.slice(-3);
    const sources = recentMessages.map(m => ({
      messageId: m.id,
      content: m.content,
      userId: m.userId,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      answer: chatResponse.response,
      sources,
      confidence: 0.7,
    };
  }

  // ============== UC14: Document Summary ==============

  async summarizeDocument(
    roomId: string,
    userId: string,
    attachmentId: string,
  ): Promise<{ summary: string; documentName: string; documentType: string }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'document_summary');

    const config = await this.aiConfigRepo.getOrCreate(roomId);

    // Get attachment by ID
    const attachment = await this.attachmentsRepo.findById(attachmentId);

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if it's a text-based file
    const textMimeTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/pdf',
      'text/html',
    ];

    if (!textMimeTypes.some(type => attachment.mimeType.startsWith(type.split('/')[0]))) {
      throw new BadRequestException('Only text-based documents can be summarized');
    }

    // Download file content
    const presignedUrl = await this.fileStorageClient.getPresignedGetUrl(attachment.fileId);

    // Fetch content (simplified - in production would handle large files differently)
    const response = await fetch(presignedUrl.presignedUrl);
    if (!response.ok) {
      throw new BadRequestException('Could not fetch document content');
    }

    const content = await response.text();

    if (content.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Document is too large to summarize (max 5MB)');
    }

    const result = await this.ragClient.summarizeDocument(
      content,
      attachment.fileName,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
      config.customSystemPrompt ?? undefined,
    );

    return {
      summary: result.summary,
      documentName: attachment.fileName,
      documentType: attachment.mimeType,
    };
  }

  // ============== UC14: Document Summary with Cache ==============

  /**
   * Get cached document summary if available
   */
  async getDocumentSummary(
    roomId: string,
    userId: string,
    attachmentId: string,
  ): Promise<{
    cached: boolean;
    summary?: string;
    transcription?: string;
    documentName?: string;
    documentType?: string;
    generatedAt?: string;
  }> {
    await this.checkMembership(roomId, userId);

    const cached = await this.documentSummaryRepo.findByAttachmentId(attachmentId);

    if (cached) {
      return {
        cached: true,
        summary: cached.summary,
        transcription: cached.transcription || undefined,
        documentName: cached.fileName,
        documentType: cached.mimeType,
        generatedAt: cached.updatedAt.toISOString(),
      };
    }

    return { cached: false };
  }

  // ============== Streaming Methods ==============

  /**
   * UC14: Stream summarize document (supports text documents and audio files)
   * @param regenerate - Force regenerate even if cached
   */
  async *streamSummarizeDocument(
    roomId: string,
    userId: string,
    attachmentId: string,
    regenerate: boolean = false,
  ): AsyncGenerator<{ type: 'chunk' | 'done' | 'error' | 'cached'; data: string; documentName?: string; documentType?: string; transcription?: string }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'document_summary');

    const config = await this.aiConfigRepo.getOrCreate(roomId);

    // Get attachment by ID
    const attachment = await this.attachmentsRepo.findById(attachmentId);

    if (!attachment) {
      yield { type: 'error', data: 'Attachment not found' };
      return;
    }

    // Check cache first (unless regenerate is requested)
    if (!regenerate) {
      const cached = await this.documentSummaryRepo.findByAttachmentId(attachmentId);
      if (cached) {
        this.logger.log(`Using cached summary for attachment: ${attachmentId}`);
        yield {
          type: 'cached',
          data: cached.summary,
          documentName: cached.fileName,
          documentType: cached.mimeType,
          transcription: cached.transcription || undefined,
        };
        return;
      }
    }

    // Check if it's an audio/video file - process via RAG service
    const audioMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/m4a'];
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const isAudio = audioMimeTypes.some(type => attachment.mimeType.startsWith(type.split('/')[0]) || attachment.mimeType === type);
    const isVideo = videoMimeTypes.some(type => attachment.mimeType === type);

    // Check if it's a text-based file
    const textMimeTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/pdf',
      'text/html',
    ];
    const isText = textMimeTypes.some(type => attachment.mimeType.startsWith(type.split('/')[0]));

    if (!isAudio && !isVideo && !isText) {
      yield { type: 'error', data: 'Only text-based documents, audio, and video files can be summarized' };
      return;
    }

    // Download file content
    const presignedUrl = await this.fileStorageClient.getPresignedGetUrl(attachment.fileId);

    const response = await fetch(presignedUrl.presignedUrl);
    if (!response.ok) {
      yield { type: 'error', data: 'Could not fetch file content' };
      return;
    }

    let fullSummary = '';
    let transcription: string | undefined;

    try {
      if (isAudio || isVideo) {
        // For audio/video, use RAG service's process endpoint
        const mediaBuffer = Buffer.from(await response.arrayBuffer());
        const base64Content = mediaBuffer.toString('base64');

        // Process document via RAG service
        const processResult = await this.ragClient.processDocument({
          namespaceId: roomId,
          namespaceType: 'room',
          orgId: '', // orgId will be determined by the room
          sourceId: attachmentId,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          content: base64Content,
          metadata: { attachmentId },
        });

        if (!processResult.success) {
          yield { type: 'error', data: processResult.message || 'Failed to process media file' };
          return;
        }

        // Use RAG service to summarize (simplified - actual transcription would come from processing)
        fullSummary = `Tệp ${isVideo ? 'video' : 'audio'} "${attachment.fileName}" đã được xử lý thành công với ${processResult.chunksCreated} chunks.`;

        yield { type: 'chunk', data: fullSummary };
      } else {
        // Handle text-based document
        const content = await response.text();

        if (content.length > 5 * 1024 * 1024) {
          yield { type: 'error', data: 'Document is too large to summarize (max 5MB)' };
          return;
        }

        // Stream summarize using RAG client
        const stream = this.ragClient.streamSummarizeDocument(
          content,
          attachment.fileName,
          {
            modelName: config.modelName,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          },
          config.customSystemPrompt ?? undefined,
        );

        for await (const chunk of stream) {
          fullSummary += chunk;
          yield { type: 'chunk', data: chunk };
        }
      }

      // Save to cache
      await this.documentSummaryRepo.upsert({
        attachmentId,
        roomId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        summary: fullSummary,
        transcription,
        generatedBy: userId,
      });

      this.logger.log(`Summary cached for attachment: ${attachmentId}`);

      yield {
        type: 'done',
        data: '',
        documentName: attachment.fileName,
        documentType: attachment.mimeType,
        transcription,
      };
    } catch (error) {
      this.logger.error(`Error processing file: ${error}`);
      yield { type: 'error', data: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * UC11: Stream summarize conversation
   */
  async *streamSummarizeConversation(
    roomId: string,
    userId: string,
    options?: {
      messageCount?: number;
      threadId?: string;
    },
  ): AsyncGenerator<{ type: 'chunk' | 'done' | 'error'; data: string; messageCount?: number }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'summary');

    const config = await this.aiConfigRepo.getOrCreate(roomId);
    const messageCount = options?.messageCount ?? 50;

    let messages;
    if (options?.threadId) {
      const result = await this.messagesRepo.listByThread(roomId, options.threadId, { pageSize: messageCount });
      messages = result.items;
    } else {
      const result = await this.messagesRepo.listByRoom(roomId, { pageSize: messageCount });
      messages = result.items;
    }

    if (messages.length === 0) {
      yield { type: 'done', data: 'Không có tin nhắn để tóm tắt.', messageCount: 0 };
      return;
    }

    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const conversationMessages: ConversationMessage[] = messages.map(m => ({
      userId: m.userId,
      content: m.content,
      createdAt: m.createdAt,
    }));

    try {
      const stream = this.ragClient.streamSummarizeConversation(
        conversationMessages,
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        },
        config.customSystemPrompt ?? undefined,
      );

      for await (const chunk of stream) {
        yield { type: 'chunk', data: chunk };
      }

      yield { type: 'done', data: '', messageCount: messages.length };
    } catch (error) {
      yield { type: 'error', data: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * UC12: Stream extract action items
   */
  async *streamExtractActionItems(
    roomId: string,
    userId: string,
    options?: {
      messageCount?: number;
      threadId?: string;
    },
  ): AsyncGenerator<{ type: 'chunk' | 'done' | 'error'; data: string; messageCount?: number }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'action_items');

    const config = await this.aiConfigRepo.getOrCreate(roomId);
    const messageCount = options?.messageCount ?? 50;

    let messages;
    if (options?.threadId) {
      const result = await this.messagesRepo.listByThread(roomId, options.threadId, { pageSize: messageCount });
      messages = result.items;
    } else {
      const result = await this.messagesRepo.listByRoom(roomId, { pageSize: messageCount });
      messages = result.items;
    }

    if (messages.length === 0) {
      yield { type: 'done', data: 'Không có tin nhắn để trích xuất action items.', messageCount: 0 };
      return;
    }

    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const conversationMessages: ConversationMessage[] = messages.map(m => ({
      userId: m.userId,
      content: m.content,
      createdAt: m.createdAt,
    }));

    try {
      const stream = this.ragClient.streamExtractActionItems(
        conversationMessages,
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        },
      );

      for await (const chunk of stream) {
        yield { type: 'chunk', data: chunk };
      }

      yield { type: 'done', data: '', messageCount: messages.length };
    } catch (error) {
      yield { type: 'error', data: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * UC13: Stream Q&A with sources
   */
  async *streamAskQuestion(
    roomId: string,
    userId: string,
    question: string,
    options?: {
      contextMessageCount?: number;
      threadId?: string;
    },
  ): AsyncGenerator<{
    type: 'sources' | 'chunk' | 'done' | 'error';
    data: string;
    sources?: Array<{ messageId: string; content: string; userId: string; createdAt: string }>;
  }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'qa');

    if (!question || question.trim().length < 3) {
      yield { type: 'error', data: 'Question must be at least 3 characters' };
      return;
    }

    const config = await this.aiConfigRepo.getOrCreate(roomId);
    const contextCount = options?.contextMessageCount ?? 100;

    try {
      // Fetch context messages
      let messages: PersistedMessage[];
      if (options?.threadId) {
        const result = await this.messagesRepo.listByThread(roomId, options.threadId, { pageSize: contextCount });
        messages = result.items;
      } else {
        const result = await this.messagesRepo.listByRoom(roomId, { pageSize: contextCount });
        messages = result.items;
      }

      if (messages.length === 0) {
        yield { type: 'done', data: 'Không có ngữ cảnh hội thoại để trả lời câu hỏi.', sources: [] };
        return;
      }

      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Get recent messages as sources
      const sources = messages.slice(-3).map(m => ({
        messageId: m.id,
        content: m.content,
        userId: m.userId,
        createdAt: m.createdAt.toISOString(),
      }));

      // Send sources first
      yield { type: 'sources', data: '', sources };

      // Build context for streaming
      const contextText = messages
        .map(m => `[${m.createdAt.toISOString()}] ${m.content}`)
        .join('\n');

      // Stream the answer using RAG client
      const stream = this.ragClient.streamChat(
        [
          {
            role: 'system',
            content: `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh hội thoại.
Chỉ trả lời dựa trên thông tin có trong ngữ cảnh.
Nếu không tìm thấy câu trả lời, hãy nói rõ.
Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi.
Format câu trả lời bằng Markdown.`,
          },
          {
            role: 'user',
            content: `Ngữ cảnh hội thoại:\n${contextText}\n\nCâu hỏi: ${question}`,
          },
        ],
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        },
      );

      for await (const chunk of stream) {
        yield { type: 'chunk', data: chunk };
      }

      yield { type: 'done', data: '' };
    } catch (error) {
      yield { type: 'error', data: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ============== Private Helpers ==============

  private async checkMembership(roomId: string, userId: string): Promise<void> {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member to use AI features');
    }
  }

  /**
   * Check if user can configure AI settings for a room
   * Only OWNER/ADMIN of workspace can configure AI
   */
  private async checkAdminRole(roomId: string, userId: string, orgId: string): Promise<void> {
    // Check if user is org owner (has OWNER role in organization)
    const isOrgOwner = await this.identityService.isOrgOwner(userId, orgId);
    if (isOrgOwner) {
      return; // Org owner can configure AI for any room
    }

    // Check if user is room admin
    const member = await this.roomMembersRepo.get(roomId, userId);
    if (!member) {
      throw new ForbiddenException('You must be a workspace owner or admin to configure AI');
    }
    if (member.role !== 'ADMIN') {
      throw new ForbiddenException('Only workspace owners and admins can configure AI settings');
    }
  }

  private async checkFeatureEnabled(roomId: string, feature: AIFeature): Promise<void> {
    const isEnabled = await this.aiConfigRepo.isFeatureEnabled(roomId, feature);
    if (!isEnabled) {
      throw new ForbiddenException(`AI feature '${feature}' is disabled for this channel`);
    }
  }

  private formatConfig(config: any) {
    return {
      roomId: config.roomId,
      aiEnabled: config.aiEnabled,
      enabledFeatures: config.enabledFeatures,
      modelProvider: config.modelProvider,
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      customSystemPrompt: config.customSystemPrompt,
      configuredBy: config.configuredBy,
      updatedAt: config.updatedAt?.toISOString(),
    };
  }
}
