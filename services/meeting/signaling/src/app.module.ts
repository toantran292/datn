import { Module } from '@nestjs/common';
import { RoomsController } from './room.controller';
import { JwtService } from './token.service';
import { TurnService } from './turn.service';

@Module({
    imports: [],
    controllers: [RoomsController],
    providers: [JwtService, TurnService],
})
export class AppModule {}
