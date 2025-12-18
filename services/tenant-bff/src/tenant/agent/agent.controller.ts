import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import { AgentChatRequestDto, AgentChatResponseDto } from './dto/agent.dto';
import { HmacGuard } from '../../common/guards/hmac.guard';

@ApiTags('Agent')
@ApiBearerAuth()
@Controller('agent')
@UseGuards(HmacGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat with UTS Agent',
    description: 'Send a message to UTS Agent and get AI-powered response based on workspace context',
  })
  @SwaggerApiResponse({ status: 200, type: AgentChatResponseDto })
  async chat(
    @Req() req: any,
    @Body() dto: AgentChatRequestDto,
  ): Promise<AgentChatResponseDto> {
    const orgId = req.orgId;
    const userId = req.userId;
    return this.agentService.chat(orgId, userId, dto);
  }

  @Post('chat/stream')
  @ApiOperation({
    summary: 'Stream chat with UTS Agent',
    description: 'Send a message to UTS Agent and get streaming AI-powered response via SSE',
  })
  async chatStream(
    @Req() req: any,
    @Body() dto: AgentChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const orgId = req.orgId;
    const userId = req.userId;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const chunk of this.agentService.chatStream(orgId, userId, dto)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      // Send done event
      res.write(`data: [DONE]\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
    } finally {
      res.end();
    }
  }
}
