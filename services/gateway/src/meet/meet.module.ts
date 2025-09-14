import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MeetController } from './meet.controller';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MEET_SERVICE',
        transport: Transport.NATS,
        options: { servers: [NATS_URL] },
      },
    ]),
  ],
  controllers: [MeetController],
})
export class MeetModule {}

