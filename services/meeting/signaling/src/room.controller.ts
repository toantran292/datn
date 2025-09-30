import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { TurnService } from './turn.service';
import { JwtService } from './token.service';
import { MeetingTokenDto } from './dto/meeting-token.dto';

@Controller()
export class RoomsController {
    constructor(
        private readonly turn: TurnService,
        private readonly jwt: JwtService,
    ) {}

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
    async getMeetingToken(@Body() body: MeetingTokenDto) {
        if (!body?.room_id) throw new BadRequestException('room_id is required');
        if (!body?.user?.id || !body?.user?.name) {
            throw new BadRequestException('user.id & user.name are required');
        }

        const payload = {
            aud: process.env.MEET_AUD ?? 'meet',
            iss: process.env.MEET_ISS ?? 'meet-auth',
            sub: process.env.MEET_SUB ?? 'meet.local',
            room: body.room_id,
            context: {
                user: {
                    id: body.user.id,
                    name: body.user.name,
                    email: body.user.email,
                    moderator: body.isModerator ? 'true' : 'false',
                },
            },
        };

        return {
            token: this.jwt.sign(payload),
            // Nếu Prosody là HTTP (port 5280), dùng WS (không phải WSS)
            websocket_url:
                process.env.MEET_WS ??
                'ws://192.168.100.195:40680/xmpp-websocket',
        };
    }
}
