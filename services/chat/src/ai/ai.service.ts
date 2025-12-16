import { Injectable, ForbiddenException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { LLMService, ConversationMessage, ActionItem, QAResult } from './llm.service';
import { ChannelAIConfigRepository } from './repositories/channel-ai-config.repository';
import { MessagesRepository, PersistedMessage } from '../chat/repositories/messages.repository';
import { RoomMembersRepository } from '../rooms/repositories/room-members.repository';
import { AttachmentsRepository } from '../chat/repositories/attachments.repository';
import { FileStorageClient } from '../common/file-storage/file-storage.client';
import { IdentityService } from '../common/identity/identity.service';
import { EmbeddingService } from './rag/embedding.service';
import { EmbeddingSourceType } from '../database/entities/document-embedding.entity';
import { AIFeature } from '../database/entities/channel-ai-config.entity';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly llmService: LLMService,
    private readonly aiConfigRepo: ChannelAIConfigRepository,
    private readonly messagesRepo: MessagesRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    private readonly attachmentsRepo: AttachmentsRepository,
    private readonly fileStorageClient: FileStorageClient,
    private readonly identityService: IdentityService,
    private readonly embeddingService: EmbeddingService,
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

    const summary = await this.llmService.summarizeConversation(
      conversationMessages,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        modelProvider: config.modelProvider,
      },
      config.customSystemPrompt ?? undefined,
    );

    return {
      summary,
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

    const items = await this.llmService.extractActionItems(
      conversationMessages,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        modelProvider: config.modelProvider,
      },
      config.customSystemPrompt ?? undefined,
    );

    return {
      items,
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

    const config = await this.aiConfigRepo.getOrCreate(roomId);
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

    const contextMessages = messages.map(m => ({
      id: m.id,
      userId: m.userId,
      content: m.content,
      createdAt: m.createdAt,
    }));

    const result = await this.llmService.answerQuestion(
      question,
      contextMessages,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        modelProvider: config.modelProvider,
      },
      config.customSystemPrompt ?? undefined,
    );

    return result;
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

    if (content.length > 50000) {
      throw new BadRequestException('Document is too large to summarize (max 50KB)');
    }

    const summary = await this.llmService.summarizeDocument(
      content,
      attachment.fileName,
      {
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        modelProvider: config.modelProvider,
      },
      config.customSystemPrompt ?? undefined,
    );

    return {
      summary,
      documentName: attachment.fileName,
      documentType: attachment.mimeType,
    };
  }

  // ============== Streaming Methods ==============

  /**
   * UC14: Stream summarize document
   */
  async *streamSummarizeDocument(
    roomId: string,
    userId: string,
    attachmentId: string,
  ): AsyncGenerator<{ type: 'chunk' | 'done' | 'error'; data: string; documentName?: string; documentType?: string }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'document_summary');

    const config = await this.aiConfigRepo.getOrCreate(roomId);

    // Get attachment by ID
    const attachment = await this.attachmentsRepo.findById(attachmentId);

    if (!attachment) {
      yield { type: 'error', data: 'Attachment not found' };
      return;
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
      yield { type: 'error', data: 'Only text-based documents can be summarized' };
      return;
    }

    // Download file content
    const presignedUrl = await this.fileStorageClient.getPresignedGetUrl(attachment.fileId);

    const response = await fetch(presignedUrl.presignedUrl);
    if (!response.ok) {
      yield { type: 'error', data: 'Could not fetch document content' };
      return;
    }

    const content = await response.text();

    if (content.length > 50000) {
      yield { type: 'error', data: 'Document is too large to summarize (max 50KB)' };
      return;
    }

    try {
      const stream = this.llmService.streamSummarizeDocument(
        content,
        attachment.fileName,
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          modelProvider: config.modelProvider,
        },
        config.customSystemPrompt ?? undefined,
      );

      for await (const chunk of stream) {
        yield { type: 'chunk', data: chunk };
      }

      yield {
        type: 'done',
        data: '',
        documentName: attachment.fileName,
        documentType: attachment.mimeType,
      };
    } catch (error) {
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
      const stream = this.llmService.streamSummarizeConversation(
        conversationMessages,
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          modelProvider: config.modelProvider,
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
      const stream = this.llmService.streamExtractActionItems(
        conversationMessages,
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          modelProvider: config.modelProvider,
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
   * UC13: Stream Q&A with sources (RAG-first approach)
   * 1. Try semantic search via embeddings first
   * 2. Fallback to recent messages if no embeddings exist
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
      // RAG-first: Try semantic search
      let contextMessages: Array<{ id: string; userId: string; content: string; createdAt: Date }> = [];
      let usedRAG = false;

      const ragResults = await this.embeddingService.search(question, {
        roomId,
        sourceTypes: ['message' as EmbeddingSourceType],
        limit: 10,
        minSimilarity: 0.6,
      });

      if (ragResults.length > 0) {
        // Use RAG results as context
        usedRAG = true;
        this.logger.log(`RAG found ${ragResults.length} relevant messages for room ${roomId}`);

        // Fetch full message details for RAG results
        const messageIds = ragResults.map(r => r.sourceId);
        const messagesMap = await this.messagesRepo.findByIds(messageIds);

        contextMessages = ragResults
          .map(r => {
            const msg = messagesMap.get(r.sourceId);
            if (msg) {
              return {
                id: msg.id,
                userId: msg.userId,
                content: msg.content,
                createdAt: msg.createdAt,
              };
            }
            // Fallback: use RAG content if message not found
            return {
              id: r.sourceId,
              userId: r.metadata?.userId || 'unknown',
              content: r.content,
              createdAt: r.createdAt,
            };
          })
          .filter(Boolean);

        // Also add some recent messages for recency context
        const recentResult = await this.messagesRepo.listByRoom(roomId, { pageSize: 10 });
        const recentMessages = recentResult.items
          .filter(m => !messageIds.includes(m.id))
          .slice(0, 5)
          .map(m => ({
            id: m.id,
            userId: m.userId,
            content: m.content,
            createdAt: m.createdAt,
          }));

        contextMessages = [...contextMessages, ...recentMessages];
      }

      // Fallback: no RAG results, use recent messages
      if (contextMessages.length === 0) {
        this.logger.log(`No RAG results, falling back to recent messages for room ${roomId}`);

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

        contextMessages = messages.map(m => ({
          id: m.id,
          userId: m.userId,
          content: m.content,
          createdAt: m.createdAt,
        }));
      }

      // Get relevant sources (for display)
      let sources: Array<{ messageId: string; content: string; userId: string; createdAt: string }>;

      if (usedRAG) {
        // Use RAG results as sources directly
        sources = contextMessages.slice(0, 3).map(m => ({
          messageId: m.id,
          content: m.content,
          userId: m.userId,
          createdAt: m.createdAt.toISOString(),
        }));
      } else {
        // Use LLM to find relevant sources
        sources = await this.llmService.getRelevantSources(
          question,
          contextMessages,
          {
            modelName: config.modelName,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            modelProvider: config.modelProvider,
          },
        );
      }

      // Send sources first
      yield { type: 'sources', data: '', sources };

      // Then stream the answer
      const stream = this.llmService.streamAnswerQuestion(
        question,
        contextMessages,
        {
          modelName: config.modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          modelProvider: config.modelProvider,
        },
        config.customSystemPrompt ?? undefined,
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
