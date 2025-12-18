import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RoomsController } from './controllers/room.controller';
import { RecordingController } from './controllers/recording.controller';
import { SessionsController } from './controllers/sessions.controller';
import { AdminMeetingController } from './controllers/admin.controller';
import { TranscriptController } from './controllers/transcript.controller';
import { JwtService } from './token.service';
import { TurnService } from './turn.service';
import { AuthorizationService } from './services/authorization.service';
import { MeetingService } from './services/meeting.service';
import { RecordingService } from './services/recording.service';
import { ChatIntegrationService } from './services/chat-integration.service';
import { IdentityService } from './services/identity.service';
import { FileStorageService } from './services/file-storage.service';
import { TranscriptService } from './services/transcript.service';
import { MediaProcessorService } from './services/media-processor.service';
import { PrismaService } from './prisma.service';
import { AIModule } from './ai/ai.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule,
        AIModule,
    ],
    controllers: [
        RoomsController,
        RecordingController,
        SessionsController,
        AdminMeetingController,
        TranscriptController,
    ],
    providers: [
        PrismaService,
        JwtService,
        TurnService,
        AuthorizationService,
        MeetingService,
        RecordingService,
        ChatIntegrationService,
        IdentityService,
        FileStorageService,
        TranscriptService,
        MediaProcessorService,
    ],
})
export class AppModule { }
