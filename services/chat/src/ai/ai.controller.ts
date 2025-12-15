import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { AIService } from './ai.service';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import type { AIFeature } from '../database/entities/channel-ai-config.entity';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

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
    return this.aiService.updateAIConfig(roomId, ctx.userId, body);
  }

  @Put('config/:roomId/features/:feature')
  async toggleAIFeature(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Param('feature') feature: AIFeature,
    @Body('enabled') enabled: boolean,
  ) {
    return this.aiService.toggleAIFeature(roomId, ctx.userId, feature, enabled);
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
}
