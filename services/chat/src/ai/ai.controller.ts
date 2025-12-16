import { Controller, Get, Post, Put, Delete, Param, Body, Sse, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AIService } from './ai.service';
import { RagService } from './rag/rag.service';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import type { AIFeature } from '../database/entities/channel-ai-config.entity';

interface SSEMessage {
  data: string;
}

@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly ragService: RagService,
  ) {}

  // ============== UC03: Channel AI Config ==============

  @Get('config/:roomId')
  async getAIConfig(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.aiService.getAIConfig(roomId, ctx.userId);
  }

  @Put('config/:roomId')
  async updateAIConfig(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: {
      aiEnabled?: boolean;
      enabledFeatures?: AIFeature[];
      modelName?: string;
      temperature?: number;
      maxTokens?: number;
      customSystemPrompt?: string | null;
    },
  ) {
    return this.aiService.updateAIConfig(roomId, ctx.userId, ctx.orgId, body);
  }

  @Put('config/:roomId/features/:feature')
  async toggleAIFeature(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Param('feature') feature: AIFeature,
    @Body('enabled') enabled: boolean,
  ) {
    return this.aiService.toggleAIFeature(roomId, ctx.userId, ctx.orgId, feature, enabled);
  }

  // ============== UC11: Conversation Summary ==============

  @Post('summary/:roomId')
  async summarizeConversation(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: {
      messageCount?: number;
      threadId?: string;
    },
  ) {
    return this.aiService.summarizeConversation(roomId, ctx.userId, body);
  }

  // ============== UC12: Extract Action Items ==============

  @Post('action-items/:roomId')
  async extractActionItems(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: {
      messageCount?: number;
      threadId?: string;
    },
  ) {
    return this.aiService.extractActionItems(roomId, ctx.userId, body);
  }

  // ============== UC13: RAG Q&A ==============

  @Post('ask/:roomId')
  async askQuestion(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: {
      question: string;
      contextMessageCount?: number;
      threadId?: string;
    },
  ) {
    return this.aiService.askQuestion(roomId, ctx.userId, body.question, {
      contextMessageCount: body.contextMessageCount,
      threadId: body.threadId,
    });
  }

  // ============== UC14: Document Summary ==============

  @Post('document-summary/:roomId')
  async summarizeDocument(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body('attachmentId') attachmentId: string,
  ) {
    return this.aiService.summarizeDocument(roomId, ctx.userId, attachmentId);
  }

  // ============== RAG: Semantic Search & Indexing ==============

  @Post('rag/ask/:roomId')
  async ragAskQuestion(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: {
      question: string;
      includeAttachments?: boolean;
      maxSources?: number;
      minSimilarity?: number;
    },
  ) {
    return this.ragService.askQuestion(roomId, ctx.orgId, body.question, {
      includeAttachments: body.includeAttachments,
      maxSources: body.maxSources,
      minSimilarity: body.minSimilarity,
    });
  }

  @Post('rag/index-room/:roomId')
  async indexRoom(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.ragService.indexRoom(roomId, ctx.orgId);
  }

  @Post('rag/index-all-rooms')
  async indexAllRooms(@Ctx() ctx: RequestContext) {
    return this.ragService.indexAllRooms(ctx.orgId);
  }

  @Post('rag/index-attachment/:roomId')
  async indexAttachment(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: {
      attachmentId: string;
      messageId: string;
    },
  ) {
    return this.ragService.indexAttachment(
      body.attachmentId,
      body.messageId,
      roomId,
      ctx.orgId,
    );
  }

  @Delete('rag/embeddings/:roomId')
  async clearRoomEmbeddings(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    const deleted = await this.ragService.clearRoomEmbeddings(roomId);
    return { deleted };
  }

  @Get('rag/stats/:roomId')
  async getRoomStats(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.ragService.getRoomStats(roomId);
  }

  // ============== Streaming Endpoints ==============

  @Sse('stream/summary/:roomId')
  streamSummarize(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Query('messageCount') messageCount?: string,
    @Query('threadId') threadId?: string,
  ): Observable<SSEMessage> {
    return new Observable(subscriber => {
      const generator = this.aiService.streamSummarizeConversation(
        roomId,
        ctx.userId,
        {
          messageCount: messageCount ? parseInt(messageCount, 10) : undefined,
          threadId,
        },
      );

      (async () => {
        try {
          for await (const event of generator) {
            subscriber.next({ data: JSON.stringify(event) });
          }
          subscriber.complete();
        } catch (error) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              data: error instanceof Error ? error.message : 'Unknown error',
            }),
          });
          subscriber.complete();
        }
      })();
    });
  }

  @Sse('stream/action-items/:roomId')
  streamActionItems(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Query('messageCount') messageCount?: string,
    @Query('threadId') threadId?: string,
  ): Observable<SSEMessage> {
    return new Observable(subscriber => {
      const generator = this.aiService.streamExtractActionItems(
        roomId,
        ctx.userId,
        {
          messageCount: messageCount ? parseInt(messageCount, 10) : undefined,
          threadId,
        },
      );

      (async () => {
        try {
          for await (const event of generator) {
            subscriber.next({ data: JSON.stringify(event) });
          }
          subscriber.complete();
        } catch (error) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              data: error instanceof Error ? error.message : 'Unknown error',
            }),
          });
          subscriber.complete();
        }
      })();
    });
  }

  @Sse('stream/ask/:roomId')
  streamAsk(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Query('question') question: string,
    @Query('contextMessageCount') contextMessageCount?: string,
    @Query('threadId') threadId?: string,
  ): Observable<SSEMessage> {
    return new Observable(subscriber => {
      const generator = this.aiService.streamAskQuestion(
        roomId,
        ctx.userId,
        question,
        {
          contextMessageCount: contextMessageCount ? parseInt(contextMessageCount, 10) : undefined,
          threadId,
        },
      );

      (async () => {
        try {
          for await (const event of generator) {
            subscriber.next({ data: JSON.stringify(event) });
          }
          subscriber.complete();
        } catch (error) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              data: error instanceof Error ? error.message : 'Unknown error',
            }),
          });
          subscriber.complete();
        }
      })();
    });
  }

  @Sse('stream/document-summary/:roomId')
  streamDocumentSummary(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Query('attachmentId') attachmentId: string,
    @Query('regenerate') regenerate?: string,
  ): Observable<SSEMessage> {
    return new Observable(subscriber => {
      const generator = this.aiService.streamSummarizeDocument(
        roomId,
        ctx.userId,
        attachmentId,
        regenerate === 'true',
      );

      (async () => {
        try {
          for await (const event of generator) {
            subscriber.next({ data: JSON.stringify(event) });
          }
          subscriber.complete();
        } catch (error) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              data: error instanceof Error ? error.message : 'Unknown error',
            }),
          });
          subscriber.complete();
        }
      })();
    });
  }
}
