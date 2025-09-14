// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.GATEWAY_PORT ?? '8080';
  await app.listen(Number(PORT));
  console.log(`Gateway listening on :${PORT}`);
}
bootstrap();
