import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { Ctx } from 'src/common/context/context.decorator';
import type { RequestContext } from 'src/common/context/context.decorator';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() body: CreateUserDto, @Ctx() ctx: RequestContext) {
    return this.usersService.createUser(ctx.userId, ctx.orgId, body.displayName);
  }
}
