import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AdminUser {
  userId: string;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.adminUser;
  },
);
