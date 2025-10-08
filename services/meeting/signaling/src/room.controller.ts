import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { TurnService } from './turn.service';
import { JwtService } from './token.service';
import { JoinMeetingFake } from './services/join-meeting-fake.service';
import { RoomMappingService } from './services/room-mapping.service';

type Subject = 'chat' | 'project';

@Controller()
export class RoomsController {
    constructor(
        private readonly turn: TurnService,
        private readonly jwt: JwtService,
        private readonly joinAuth: JoinMeetingFake,
        private readonly roomMapping: RoomMappingService
    ) { }

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
    async getMeetingToken(@Body() body: {
        user_id: string;
        subject_type: Subject;
        chat_id?: string;     // required when subject_type = 'chat'
        project_id?: string;  // required when subject_type = 'project'
        room_id?: string;     // optional for project
    }) {
        console.log('[meet/token] body =', body);
        const { user_id, subject_type, chat_id, project_id } = body;
        if (!user_id) throw new BadRequestException('user_id required');

        // ---------- CHAT ----------
        if (subject_type === 'chat') {
            if (!chat_id) throw new BadRequestException('chat_id required for chat');

            const { ok, roomId } = await this.joinAuth.canIssueToken({
                userId: user_id,
                subjectType: 'chat',
                chatId: chat_id,
            });
            if (!ok) throw new UnauthorizedException('Not a member of this chat channel');

            const token = this.jwt.sign({
                aud: process.env.MEET_AUD || 'meet',
                iss: process.env.MEET_ISS || 'meet-auth',
                sub: process.env.MEET_SUB || 'meet.local',
                room: roomId, // "chat-global"
                context: { user_id, subject_type, chat_id },
            });

            return {
                token,
                room_id: roomId,
                websocket_url: process.env.MEET_WS || 'ws://192.168.100.195:40680/xmpp-websocket',
            };
        }

        // ---------- PROJECT ----------
        if (!project_id) throw new BadRequestException('project_id required for project');

        // nếu client không gửi room_id thì tạo mới
        const roomIdToUse = (body.room_id?.trim() || `project-room-${uuid()}`);

        const { ok } = await this.joinAuth.canIssueToken({
            userId: user_id,
            subjectType: 'project',
            projectId: project_id,
            roomId: roomIdToUse,
        });
        if (!ok) throw new UnauthorizedException('Not authorized for this project/room');

        const token = this.jwt.sign({
            aud: process.env.MEET_AUD || 'meet',
            iss: process.env.MEET_ISS || 'meet-auth',
            sub: process.env.MEET_SUB || 'meet.local',
            room: roomIdToUse,
            context: { user_id, subject_type, project_id },
        });

        return {
            token,
            room_id: roomIdToUse,
            websocket_url: process.env.MEET_WS || 'ws://192.168.100.195:40680/xmpp-websocket',
        };
    }

    @Post('rooms/list')
    getAllRooms() {
        return {
            rooms: this.roomMapping.getAllRooms(),
            message: 'Active rooms by project+group',
        };
    }
}
