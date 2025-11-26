import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMS_KEY } from '../decorators/perms.decorator';

interface RequestWithUser {
  user?: { id: string; roles: string[]; perms: string[] };
}

@Injectable()
export class PermsGuard implements CanActivate {
  constructor(private refl: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const need = this.refl.get<string[]>(PERMS_KEY, ctx.getHandler()) || [];
    if (!need.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const have: string[] = req.user?.perms || [];

    if (!need.every((p) => have.includes(p))) {
      throw new ForbiddenException('insufficient_permissions');
    }

    return true;
  }
}
