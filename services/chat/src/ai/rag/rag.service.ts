import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EmbeddingService, IndexDocumentDto } from './embedding.service';
import { DocumentProcessorService } from './document-processor.service';
import { SearchResult } from './embedding.repository';
import { MessagesRepository, PersistedMessage } from '../../chat/repositories/messages.repository';
import { AttachmentsRepository } from '../../chat/repositories/attachments.repository';
import { FileStorageClient } from '../../common/file-storage/file-storage.client';
import { LLMService } from '../llm.service';
import { ChannelAIConfigRepository } from '../repositories/channel-ai-config.repository';
import { RoomsRepository } from '../../rooms/repositories/room.repository';

export interface RAGQueryResult {
  answer: string;
  sources: Array<{
    type: 'message' | 'attachment';
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  confidence: number;
}

export interface IndexingResult {
  indexed: number;
  skipped: number;
  errors: string[];
}

export interface BulkIndexingResult {
  totalRooms: number;
  successfulRooms: number;
  totalIndexed: number;
  totalSkipped: number;
  errors: string[];
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly messagesRepo: MessagesRepository,
    private readonly attachmentsRepo: AttachmentsRepository,
    private readonly fileStorageClient: FileStorageClient,
    private readonly llmService: LLMService,
    private readonly aiConfigRepo: ChannelAIConfigRepository,
    private readonly roomsRepo: RoomsRepository,
  ) {}

  /**
   * RAG-enhanced question answering
   */
  async askQuestion(
    roomId: string,
    orgId: string,
    question: string,
    options?: {
      includeAttachments?: boolean;
      maxSources?: number;
      minSimilarity?: number;
    },
  ): Promise<RAGQueryResult> {
    const maxSources = options?.maxSources ?? 10;
    const minSimilarity = options?.minSimilarity ?? 0.7;

    // 1. Semantic search for relevant context
    const searchResults = await this.embeddingService.search(question, {
      roomId,
      limit: maxSources,
      minSimilarity,
      sourceTypes: options?.includeAttachments
        ? ['message', 'attachment']
        : ['message'],
    });

    // 2. Also get recent messages for recency context
    const recentMessages = await this.messagesRepo.listByRoom(roomId, { pageSize: 20 });

    // 3. Build context from search results and recent messages
    const context = this.buildContext(searchResults, recentMessages.items);

    // 4. Get AI config for the room
    const config = await this.aiConfigRepo.getOrCreate(roomId);

    // 5. Generate answer using LLM
    const answer = await this.generateAnswer(question, context, {
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // 6. Calculate confidence based on search scores
    const avgScore = searchResults.length > 0
      ? searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
      : 0;

    return {
      answer,
      sources: searchResults.map(r => ({
        type: r.sourceType as 'message' | 'attachment',
        id: r.sourceId,
        content: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
        score: r.similarity,
        metadata: r.metadata,
      })),
      confidence: avgScore,
    };
  }

  /**
   * Index a single message
   */
  async indexMessage(message: PersistedMessage): Promise<void> {
    // Only index messages with meaningful content
    if (!message.content || message.content.trim().length < 10) {
      return;
    }

    await this.embeddingService.indexShortText({
      sourceType: 'message',
      sourceId: message.id,
      roomId: message.roomId,
      orgId: message.orgId,
      content: message.content,
      metadata: {
        userId: message.userId,
        createdAt: message.createdAt.toISOString(),
        threadId: message.threadId,
      },
    });
  }

  /**
   * Index an attachment
   */
  async indexAttachment(
    attachmentId: string,
    messageId: string,
    roomId: string,
    orgId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get attachment info
      const attachments = await this.attachmentsRepo.findByMessageId(messageId);
      const attachment = attachments.find(a => a.id === attachmentId);

      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Check if processor supports this file type
      if (!this.documentProcessor.canProcess(attachment.mimeType)) {
        return { success: false, error: `Unsupported file type: ${attachment.mimeType}` };
      }

      // Download file content
      const presignedUrl = await this.fileStorageClient.getPresignedGetUrl(attachment.fileId);
      const response = await fetch(presignedUrl.presignedUrl);

      if (!response.ok) {
        return { success: false, error: 'Failed to download file' };
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Process document
      const chunks = await this.documentProcessor.process(buffer, {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.fileSize,
        sourceId: attachmentId,
        roomId,
        orgId,
      });

      if (chunks.length === 0) {
        return { success: false, error: 'No content extracted from document' };
      }

      // Index each chunk
      for (const chunk of chunks) {
        await this.embeddingService.indexDocument({
          sourceType: 'attachment',
          sourceId: attachmentId,
          roomId,
          orgId,
          content: chunk.content,
          metadata: {
            ...chunk.metadata,
            fileName: attachment.fileName,
            messageId,
          },
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Index all messages in a room
   */
  async indexRoom(roomId: string, orgId: string): Promise<IndexingResult> {
    const result: IndexingResult = { indexed: 0, skipped: 0, errors: [] };

    // Get all messages in the room
    let pageState: string | undefined;
    do {
      const messages = await this.messagesRepo.listByRoom(roomId, {
        pageSize: 100,
        pageState,
      });

      for (const message of messages.items) {
        try {
          if (message.content && message.content.trim().length >= 10) {
            await this.indexMessage(message);
            result.indexed++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Message ${message.id}: ${errorMessage}`);
        }
      }

      pageState = messages.pageState;
    } while (pageState);

    return result;
  }

  /**
   * Clear all embeddings for a room
   */
  async clearRoomEmbeddings(roomId: string): Promise<number> {
    return this.embeddingService.deleteByRoom(roomId);
  }

  /**
   * Get indexing stats for a room
   */
  async getRoomStats(roomId: string): Promise<{ totalEmbeddings: number }> {
    return this.embeddingService.getRoomStats(roomId);
  }

  /**
   * Index all rooms in an organization
   */
  async indexAllRooms(orgId: string): Promise<BulkIndexingResult> {
    const result: BulkIndexingResult = {
      totalRooms: 0,
      successfulRooms: 0,
      totalIndexed: 0,
      totalSkipped: 0,
      errors: [],
    };

    this.logger.log(`Starting bulk indexing for org ${orgId}`);

    // Get all rooms in org
    let pagingState: string | undefined;
    const allRoomIds: string[] = [];

    do {
      const roomsResult = await this.roomsRepo.listByOrg(orgId, {
        limit: 100,
        pagingState,
      });

      for (const room of roomsResult.items) {
        allRoomIds.push(room.id);
      }

      pagingState = roomsResult.pagingState;
    } while (pagingState);

    result.totalRooms = allRoomIds.length;
    this.logger.log(`Found ${allRoomIds.length} rooms to index`);

    // Index each room
    for (const roomId of allRoomIds) {
      try {
        this.logger.log(`Indexing room ${roomId}...`);
        const roomResult = await this.indexRoom(roomId, orgId);

        result.totalIndexed += roomResult.indexed;
        result.totalSkipped += roomResult.skipped;

        if (roomResult.errors.length > 0) {
          result.errors.push(...roomResult.errors.slice(0, 5)); // Limit errors per room
        }

        result.successfulRooms++;
        this.logger.log(`Room ${roomId}: indexed ${roomResult.indexed}, skipped ${roomResult.skipped}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Room ${roomId}: ${errorMessage}`);
        this.logger.error(`Failed to index room ${roomId}: ${errorMessage}`);
      }
    }

    this.logger.log(`Bulk indexing complete: ${result.successfulRooms}/${result.totalRooms} rooms, ${result.totalIndexed} messages indexed`);

    return result;
  }

  /**
   * Build context string from search results and recent messages
   */
  private buildContext(
    searchResults: SearchResult[],
    recentMessages: PersistedMessage[],
  ): string {
    const contextParts: string[] = [];

    // Add search results (semantic matches)
    if (searchResults.length > 0) {
      contextParts.push('=== Relevant Context (Semantic Search) ===');
      for (const result of searchResults) {
        const source = result.sourceType === 'message' ? 'Message' : 'Document';
        contextParts.push(`[${source}] (relevance: ${(result.similarity * 100).toFixed(1)}%)`);
        contextParts.push(result.content);
        contextParts.push('');
      }
    }

    // Add recent messages for recency context
    if (recentMessages.length > 0) {
      contextParts.push('=== Recent Messages ===');
      for (const msg of recentMessages.slice(0, 10)) {
        contextParts.push(`[${msg.createdAt.toISOString()}] User ${msg.userId}: ${msg.content}`);
      }
    }

    return contextParts.join('\n');
  }

  /**
   * Generate answer using LLM with context
   */
  private async generateAnswer(
    question: string,
    context: string,
    config: { modelName: string; temperature: number; maxTokens: number },
  ): Promise<string> {
    const systemPrompt = `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh hội thoại và tài liệu.

Quy tắc:
- Chỉ trả lời dựa trên thông tin có trong ngữ cảnh được cung cấp
- Nếu không tìm thấy thông tin liên quan, hãy nói rõ
- Trả lời ngắn gọn, súc tích và chính xác
- Nếu có nhiều nguồn thông tin, hãy tổng hợp chúng
- Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi`;

    const userPrompt = `Ngữ cảnh:
${context}

Câu hỏi: ${question}`;

    return this.llmService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      config,
    );
  }
}
