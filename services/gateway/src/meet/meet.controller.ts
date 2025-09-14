import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Controller('/o/:org/meet')
export class MeetController {
  constructor(@Inject('MEET_SERVICE') private readonly meet: ClientProxy) {}

  @Get('health')
  health(@Param('org') org: string) {
    return this.meet.send('meet.health', { org });
  }

  @Post('echo')
  echo(@Param('org') org: string, @Body() body: any, @Req() req: any) {
    const userId = req.headers['x-user-id'];
    return this.meet.send('meet.echo', { org, userId, body });
  }
}

