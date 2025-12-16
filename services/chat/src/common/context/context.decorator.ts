import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestContext {
  userId: string;
  orgId: string;
}

export const Ctx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.context as RequestContext;
  },
);
