import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    const { method, originalUrl } = req;
    const started = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - started;
      this.logger.log(`${method} ${originalUrl} ${statusCode} +${duration}ms`);
    });

    next();
  }
}

