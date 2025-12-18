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

export const SKIP_CONTEXT_KEY = 'skipContext';

// Simple UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

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
    const body = req.body;

    console.log({body});

    const dto = plainToInstance(HeadersContextDto, headers, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });

    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
      console.error('RequestContextGuard validation errors:', errors);
      throw new BadRequestException('Missing/invalid x-user-id or x-org-id headers');
    }

    if (!isValidUuid(dto.userId) || !isValidUuid(dto.orgId)) {
      throw new BadRequestException('Invalid UUID in headers');
    }

    req.context = { userId: dto.userId, orgId: dto.orgId };
    return true;
  }
}
