import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatController } from './chat.controller';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CHAT_SERVICE',
        transport: Transport.NATS,
        options: { servers: [NATS_URL] },
      },
    ]),
  ],
  controllers: [ChatController],
})
export class ChatModule {}

