import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });
    const port = Number(process.env.PORT_HTTP ?? 40610);
    await app.listen(port, '0.0.0.0');
    console.log(`[REST] :${port}`);
}
bootstrap();
