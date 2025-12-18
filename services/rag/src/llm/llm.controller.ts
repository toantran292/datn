import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LLMService } from './llm.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  SummarizeConversationRequestDto,
  SummarizeResponseDto,
  ExtractActionsRequestDto,
  ExtractActionsResponseDto,
  SummarizeDocumentRequestDto,
  TranslateRequestDto,
  TranslateResponseDto,
  SummarizeTranscriptionRequestDto,
} from './dto/llm.dto';

@Controller('llm')
@ApiTags('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generic chat completion',
    description: 'Send messages to LLM and get a response. Supports streaming.',
  })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(
    @Body() dto: ChatRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatResponseDto | void> {
    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of this.llmService.streamChat(dto.messages, dto.config)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    const response = await this.llmService.chat(dto.messages, dto.config);
    return { response };
  }

  @Post('summarize/conversation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Summarize a conversation',
    description: 'Generate a summary of a conversation. Supports streaming.',
  })
  @ApiResponse({ status: 200, type: SummarizeResponseDto })
  async summarizeConversation(
    @Body() dto: SummarizeConversationRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SummarizeResponseDto | void> {
    // Convert string dates to Date objects
    const messages = dto.messages.map(m => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));

    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of this.llmService.streamSummarizeConversation(
        messages,
        dto.config,
        dto.customPrompt,
      )) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    const summary = await this.llmService.summarizeConversation(
      messages,
      dto.config,
      dto.customPrompt,
    );
    return { summary };
  }

  @Post('extract/actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extract action items from conversation',
    description: 'Extract tasks and action items from a conversation. Supports streaming (markdown format).',
  })
  @ApiResponse({ status: 200, type: ExtractActionsResponseDto })
  async extractActions(
    @Body() dto: ExtractActionsRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExtractActionsResponseDto | void> {
    // Convert string dates to Date objects
    const messages = dto.messages.map(m => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));

    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of this.llmService.streamExtractActionItems(messages, dto.config)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    const items = await this.llmService.extractActionItems(messages, dto.config);
    return { items };
  }

  @Post('summarize/document')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Summarize a document',
    description: 'Generate a summary of document content. Supports streaming.',
  })
  @ApiResponse({ status: 200, type: SummarizeResponseDto })
  async summarizeDocument(
    @Body() dto: SummarizeDocumentRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SummarizeResponseDto | void> {
    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of this.llmService.streamSummarizeDocument(
        dto.content,
        dto.documentName,
        dto.config,
        dto.customPrompt,
      )) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    const summary = await this.llmService.summarizeDocument(
      dto.content,
      dto.documentName,
      dto.config,
      dto.customPrompt,
    );
    return { summary };
  }

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Translate text',
    description: 'Translate text to target language. Supports streaming.',
  })
  @ApiResponse({ status: 200, type: TranslateResponseDto })
  async translate(
    @Body() dto: TranslateRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TranslateResponseDto | void> {
    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of this.llmService.streamTranslate(
        dto.text,
        dto.targetLanguage,
        dto.sourceLanguage,
        dto.config,
      )) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    const translation = await this.llmService.translate(
      dto.text,
      dto.targetLanguage,
      dto.sourceLanguage,
      dto.config,
    );
    return { translation };
  }

  @Post('summarize/transcription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Summarize audio/video transcription',
    description: 'Generate a summary of audio/video transcription. Supports streaming.',
  })
  @ApiResponse({ status: 200, type: SummarizeResponseDto })
  async summarizeTranscription(
    @Body() dto: SummarizeTranscriptionRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SummarizeResponseDto | void> {
    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of this.llmService.streamSummarizeTranscription(
        dto.transcription,
        dto.fileName,
        dto.config,
      )) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    const summary = await this.llmService.summarizeTranscription(
      dto.transcription,
      dto.fileName,
      dto.config,
    );
    return { summary };
  }
}
