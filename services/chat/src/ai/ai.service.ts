import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { LLMService, ConversationMessage, ActionItem, QAResult } from './llm.service';
import { ChannelAIConfigRepository } from './repositories/channel-ai-config.repository';
import { MessagesRepository } from '../chat/repositories/messages.repository';
import { RoomMembersRepository } from '../rooms/repositories/room-members.repository';
import { AttachmentsRepository } from '../chat/repositories/attachments.repository';
import { FileStorageClient } from '../common/file-storage/file-storage.client';
import { AIFeature } from '../database/entities/channel-ai-config.entity';

@Injectable()
export class AIService {
  constructor(
    private readonly llmService: LLMService,
    private readonly aiConfigRepo: ChannelAIConfigRepository,
    private readonly messagesRepo: MessagesRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    private readonly attachmentsRepo: AttachmentsRepository,
    private readonly fileStorageClient: FileStorageClient,
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
    data: {
      aiEnabled?: boolean;
      enabledFeatures?: AIFeature[];
      modelName?: string;
      temperature?: number;
      maxTokens?: number;
      customSystemPrompt?: string | null;
    },
  ) {
    await this.checkAdminRole(roomId, userId);

    const config = await this.aiConfigRepo.update(roomId, {
      ...data,
      configuredBy: userId,
    });

    return this.formatConfig(config);
  }

  async toggleAIFeature(roomId: string, userId: string, feature: AIFeature, enabled: boolean) {
    await this.checkAdminRole(roomId, userId);

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
  ): Promise<{ summary: string; documentName: string }> {
    await this.checkMembership(roomId, userId);
    await this.checkFeatureEnabled(roomId, 'document_summary');

    const config = await this.aiConfigRepo.getOrCreate(roomId);

    // Get attachment info - need to find it
    // For now, fetch from attachments repo by searching
    const attachments = await this.attachmentsRepo.findByMessageId(attachmentId);
    const attachment = attachments.find(a => a.id === attachmentId);

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
    };
  }

  // ============== Private Helpers ==============

  private async checkMembership(roomId: string, userId: string): Promise<void> {
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member to use AI features');
    }
  }

  private async checkAdminRole(roomId: string, userId: string): Promise<void> {
    const member = await this.roomMembersRepo.get(roomId, userId);
    if (!member) {
      throw new ForbiddenException('You must be a member to configure AI');
    }
    if (member.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can configure AI settings');
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
