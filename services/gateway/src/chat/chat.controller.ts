import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Controller('/o/:org/chat')
export class ChatController {
  constructor(@Inject('CHAT_SERVICE') private readonly chat: ClientProxy) {}

  @Get('health')
  health(@Param('org') org: string) {
    return this.chat.send('chat.health', { org });
  }

  @Post('echo')
  echo(@Param('org') org: string, @Body() body: any, @Req() req: any) {
    const userId = req.headers['x-user-id'];
    return this.chat.send('chat.echo', { org, userId, body });
  }
}

