import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './logger.middleware';
import { ContextAuthMiddleware } from './context-auth.middleware';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer
      .apply(ContextAuthMiddleware)
      .exclude({ path: 'healthz', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
