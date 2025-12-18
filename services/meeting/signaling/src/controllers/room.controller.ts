import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Put,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { TurnService } from '../turn.service';
import { JwtService } from '../token.service';
import { AuthorizationService } from '../services/authorization.service';
import { MeetingService } from '../services/meeting.service';
import { ChatIntegrationService } from '../services/chat-integration.service';

type Subject = 'chat' | 'project';

@Controller()
export class RoomsController {
  constructor(
    private readonly turn: TurnService,
    private readonly jwt: JwtService,
    private readonly authService: AuthorizationService,
    private readonly meetingService: MeetingService,
    private readonly chatService: ChatIntegrationService,
  ) {}

  /**
   * Create a new room (legacy endpoint)
   */
  @Post('rooms')
  async createRoom(@Body('hostUserId') hostUserId: string) {
    const room_id = uuid();
    return {
      room_id,
      ice_servers: this.turn.iceServers(),
      policy: { moderators: [hostUserId], ttlMin: 60 },
    };
  }

  /**
   * Get meeting token (main entry point)
   */
  @Post('meet/token')
  async getMeetingToken(
    @Body()
    body: {
      user_id: string;
      subject_type: Subject;
      chat_id?: string;
      project_id?: string;
      room_id?: string;
      org_id?: string;
      user_name?: string;
      user_avatar?: string;
    },
  ) {
    console.log('[meet/token] body =', body);
    const { user_id, subject_type, chat_id, project_id, org_id, user_name, user_avatar } = body;

    if (!user_id) {
      throw new BadRequestException('user_id required');
    }

    // Validate authorization
    const authResult = await this.authService.canIssueToken({
      userId: user_id,
      subjectType: subject_type,
      chatId: chat_id,
      projectId: project_id,
      roomId: body.room_id,
      orgId: org_id,
    });

    if (!authResult.ok) {
      throw new UnauthorizedException('Not authorized to join this meeting');
    }

    const roomId = authResult.roomId!;
    const subjectId = subject_type === 'chat' ? chat_id! : project_id!;

    // Get or create meeting
    const meeting = await this.meetingService.getOrCreateMeeting({
      roomId,
      subjectType: subject_type,
      subjectId,
      hostUserId: user_id,
      orgId: org_id,
    });

    // Add user as participant
    await this.meetingService.addParticipant({
      meetingId: meeting.id,
      userId: user_id,
      userName: user_name,
      userAvatar: user_avatar,
      role: authResult.role || 'GUEST',
    });

    // Generate JWT token
    const token = this.jwt.sign({
      aud: process.env.MEET_AUD || 'meet',
      iss: process.env.MEET_ISS || 'meet-auth',
      sub: process.env.MEET_SUB || 'meet.local',
      room: roomId,
      context: {
        user_id,
        subject_type,
        chat_id,
        project_id,
        meeting_id: meeting.id,
      },
    });

    return {
      token,
      room_id: roomId,
      meeting_id: meeting.id,
      websocket_url: process.env.MEET_WS || 'ws://192.168.100.195:40680/xmpp-websocket',
      ice_servers: this.turn.iceServers(),
    };
  }

  /**
   * Leave meeting
   */
  @Post('meet/:meetingId/leave')
  async leaveMeeting(
    @Param('meetingId') meetingId: string,
    @Body('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id required');
    }

    await this.meetingService.removeParticipant(meetingId, userId);

    return { success: true };
  }

  /**
   * Get meeting info
   */
  @Get('meet/:meetingId')
  async getMeeting(@Param('meetingId') meetingId: string) {
    const meeting = await this.meetingService.getMeeting(meetingId);

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  /**
   * Get meeting by room ID
   */
  @Get('meet/room/:roomId')
  async getMeetingByRoomId(@Param('roomId') roomId: string) {
    const meeting = await this.meetingService.getMeetingByRoomId(roomId);

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  /**
   * Get active participants
   */
  @Get('meet/:meetingId/participants')
  async getParticipants(@Param('meetingId') meetingId: string) {
    const participants = await this.meetingService.getActiveParticipants(meetingId);
    return { participants };
  }

  /**
   * Kick participant (moderator/host only)
   */
  @Post('meet/:meetingId/kick')
  async kickParticipant(
    @Param('meetingId') meetingId: string,
    @Body() body: { user_id: string; target_user_id: string; reason?: string },
  ) {
    const { user_id, target_user_id, reason } = body;

    if (!user_id || !target_user_id) {
      throw new BadRequestException('user_id and target_user_id required');
    }

    // Check if user has moderator permissions
    const isModerator = await this.authService.isModerator(user_id, meetingId);
    if (!isModerator) {
      throw new ForbiddenException('Only moderators can kick participants');
    }

    await this.meetingService.kickParticipant(meetingId, target_user_id, user_id, reason);

    return { success: true };
  }

  /**
   * Lock/unlock meeting (host only)
   */
  @Put('meet/:meetingId/lock')
  async lockMeeting(
    @Param('meetingId') meetingId: string,
    @Body() body: { user_id: string; locked: boolean },
  ) {
    const { user_id, locked } = body;

    if (!user_id || locked === undefined) {
      throw new BadRequestException('user_id and locked required');
    }

    // Check if user is host
    const isHost = await this.authService.isHost(user_id, meetingId);
    if (!isHost) {
      throw new ForbiddenException('Only host can lock/unlock meeting');
    }

    const meeting = await this.meetingService.setMeetingLock(meetingId, locked, user_id);

    return meeting;
  }

  /**
   * End meeting (host only)
   */
  @Post('meet/:meetingId/end')
  async endMeeting(
    @Param('meetingId') meetingId: string,
    @Body('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id required');
    }

    // Check if user is host
    const isHost = await this.authService.isHost(userId, meetingId);
    if (!isHost) {
      throw new ForbiddenException('Only host can end meeting');
    }

    const meeting = await this.meetingService.endMeeting(meetingId, userId);

    return meeting;
  }

  /**
   * Terminate meeting (admin endpoint)
   */
  @Delete('meet/:meetingId/terminate')
  async terminateMeeting(
    @Param('meetingId') meetingId: string,
    @Body('admin_user_id') adminUserId: string,
  ) {
    if (!adminUserId) {
      throw new BadRequestException('admin_user_id required');
    }

    // TODO: Add admin authorization check
    const meeting = await this.meetingService.terminateMeeting(meetingId, adminUserId);

    return meeting;
  }

  /**
   * Get meeting statistics
   */
  @Get('meet/:meetingId/stats')
  async getMeetingStats(@Param('meetingId') meetingId: string) {
    return this.meetingService.getMeetingStats(meetingId);
  }

  /**
   * Get all active meetings
   */
  @Get('meetings/active')
  async getActiveMeetings() {
    const meetings = await this.meetingService.getActiveMeetings();
    return { meetings };
  }

  /**
   * Get user's active meeting
   */
  @Get('users/:userId/active-meeting')
  async getUserActiveMeeting(@Param('userId') userId: string) {
    const meeting = await this.meetingService.getUserActiveMeeting(userId);

    if (!meeting) {
      return { meeting: null };
    }

    return { meeting };
  }

  /**
   * Send chat message in meeting
   */
  @Post('meet/:meetingId/chat')
  async sendMeetingChatMessage(
    @Param('meetingId') meetingId: string,
    @Body() body: { content: string; userId: string; userName?: string },
  ) {
    const { content, userId, userName } = body;

    if (!content || !userId) {
      throw new BadRequestException('content and userId required');
    }

    // Get meeting to find chatId
    const meeting = await this.meetingService.getMeeting(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Only support chat subject type for now
    if (meeting.subjectType !== 'chat') {
      throw new BadRequestException('Chat is only available for chat meetings');
    }

    // Send message via chat integration service
    const result = await this.chatService.sendMeetingChatMessage({
      chatId: meeting.subjectId,
      userId,
      orgId: meeting.orgId || '',
      meetingId,
      content,
      senderName: userName,
    });

    if (!result.success) {
      throw new BadRequestException('Failed to send message');
    }

    return { success: true, id: result.messageId };
  }

  /**
   * Get chat messages in meeting
   */
  @Get('meet/:meetingId/chat')
  async getMeetingChatMessages(@Param('meetingId') meetingId: string) {
    // Get meeting to find chatId
    const meeting = await this.meetingService.getMeeting(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Only support chat subject type for now
    if (meeting.subjectType !== 'chat') {
      throw new BadRequestException('Chat is only available for chat meetings');
    }

    // Get messages via chat integration service
    const result = await this.chatService.getMeetingChatMessages({
      chatId: meeting.subjectId,
      meetingId,
    });

    return { success: true, messages: result };
  }

  /**
   * List all rooms (legacy endpoint)
   */
  @Post('rooms/list')
  async getAllRooms() {
    const meetings = await this.meetingService.getActiveMeetings();

    return {
      rooms: meetings.map((m) => ({
        room_id: m.roomId,
        meeting_id: m.id,
        subject_type: m.subjectType,
        subject_id: m.subjectId,
        host_user_id: m.hostUserId,
        status: m.status,
        participants_count: m.participants?.length || 0,
        started_at: m.startedAt,
      })),
      message: 'Active meetings',
    };
  }
}
