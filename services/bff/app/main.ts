import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = parseInt(process.env.PORT || '', 10) || 40800;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`BFF listening on http://0.0.0.0:${port}`);
}

bootstrap();

