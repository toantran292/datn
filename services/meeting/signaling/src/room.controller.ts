import { Controller, Post, Body } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { TurnService } from './turn.service';
import { JwtService } from './token.service';

@Controller()
export class RoomsController {
    constructor(private readonly turn: TurnService, private readonly jwt: JwtService) {}

    @Post('rooms')
    async createRoom(@Body('hostUserId') hostUserId: string) {
        const room_id = uuid();
        return {
            room_id,
            ice_servers: this.turn.iceServers(),
            policy: { moderators: [hostUserId], ttlMin: 60 },
        };
    }

    @Post('meet/token')
    async getMeetingToken(@Body() body: { room_id: string; user: any; isModerator?: boolean }) {
        const token = this.jwt.sign({
            aud: process.env.MEET_AUD || 'meet',
            iss: process.env.MEET_ISS || 'meet-auth',
            sub: process.env.MEET_SUB || 'meet.local',
            room: body.room_id,
            context: {
                user: body.user,
                moderator: !!body.isModerator,
            },
        });
        return {
            token,
            websocket_url: process.env.MEET_WS || 'ws://192.168.100.195:40680/xmpp-websocket',
        };
    }
}
