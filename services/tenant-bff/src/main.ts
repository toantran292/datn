import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Tenant BFF')
      .setVersion('1.0')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, doc);
  }

  const port = Number(process.env.PORT || 8085);
  await app.listen(port);
  console.log(`Tenant BFF listening on ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
