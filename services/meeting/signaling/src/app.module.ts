import { Module } from '@nestjs/common';
import { RoomsController } from './controllers/room.controller';
import { RecordingController } from './controllers/recording.controller';
import { SessionsController } from './controllers/sessions.controller';
import { JwtService } from './token.service';
import { TurnService } from './turn.service';
import { AuthorizationService } from './services/authorization.service';
import { MeetingService } from './services/meeting.service';
import { RecordingService } from './services/recording.service';
import { PrismaService } from './prisma.service';

@Module({
    imports: [],
    controllers: [
        RoomsController,
        RecordingController,
        SessionsController,
    ],
    providers: [
        PrismaService,
        JwtService,
        TurnService,
        AuthorizationService,
        MeetingService,
        RecordingService,
    ],
})
export class AppModule { }
