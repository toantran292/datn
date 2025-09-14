import { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
export declare class OrgResolverMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void;
}
