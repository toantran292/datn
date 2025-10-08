import { Module } from '@nestjs/common';
import { RoomsController } from './room.controller';
import { JwtService } from './token.service';
import { TurnService } from './turn.service';
import { JoinMeetingFake } from './services/join-meeting-fake.service';
import { RoomMappingService } from './services/room-mapping.service';

@Module({
    imports: [],
    controllers: [RoomsController],
    providers: [JwtService, TurnService, JoinMeetingFake, RoomMappingService],
})
export class AppModule { }
