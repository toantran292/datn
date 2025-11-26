import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { types as CassandraTypes } from 'cassandra-driver';

export type RequestContext = {
  userId: CassandraTypes.Uuid;
  orgId: CassandraTypes.Uuid;
};

export const Ctx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.context as RequestContext;
  },
);
