import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { HeadersContextDto } from './headers-context.dto';
import { Reflector } from '@nestjs/core';
import { types } from 'cassandra-driver';

export const SKIP_CONTEXT_KEY = 'skipContext';

@Injectable()
export class RequestContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(ctx: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CONTEXT_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return true;

    const req = ctx.switchToHttp().getRequest();
    const headers = req.headers;

    const dto = plainToInstance(HeadersContextDto, headers, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });

    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
      throw new BadRequestException('Missing/invalid x-user-id or x-org-id headers');
    }

    try {
      const userId = types.Uuid.fromString(dto.userId);
      const orgId = types.Uuid.fromString(dto.orgId);
      req.context = { userId, orgId };
      return true;
    } catch {
      throw new BadRequestException('Invalid UUID in headers');
    }
  }
}
