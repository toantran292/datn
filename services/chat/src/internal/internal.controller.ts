import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import { SkipContext } from '../common/context/skip-context.decorator';
import { IdentityService } from '../common/identity/identity.service';
import { PresenceService } from '../common/presence/presence.service';
import { ChatsService } from '../chat/chat.service';
import { ChatsGateway } from '../chat/chat.gateway';
import { RoomsRepository } from '../rooms/repositories/room.repository';

interface CreateHuddleMessageBody {
  type: 'huddle_started' | 'huddle_ended';
  userId: string;
  orgId: string;
  meetingId: string;
  meetingRoomId: string;
  duration?: number;
  participantCount?: number;
}

interface UpdateHuddleParticipantsBody {
  meetingId: string;
  participantCount: number;
}

@Controller('internal')
export class InternalController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly presenceService: PresenceService,
    private readonly chatsService: ChatsService,
    private readonly chatsGateway: ChatsGateway,
    private readonly roomsRepository: RoomsRepository,
  ) {}

  /**
   * List users in the organization
   * orgId is taken from context (X-Org-ID header set by Edge)
   */
  @Get('users')
  async listOrgUsers(
    @Ctx() ctx: RequestContext,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    // Get all users/members from the organization via Identity service
    // orgId comes from context (set by Edge from JWT)
    const members = await this.identityService.getOrgMembers(ctx.orgId, page || 0, size || 100);

    if (!members) {
      return [];
    }

    // Get user IDs and check online status
    const userIds = members.items.map(item => item.user.id);
    const onlineStatus = this.presenceService.getOnlineStatus(userIds);

    // Extract user info from membership data with online status
    return members.items.map(item => ({
      userId: item.user.id,
      email: item.user.email,
      displayName: item.user.display_name || item.user.email.split('@')[0],
      disabled: item.user.disabled,
      avatarUrl: item.user.avatar_url || null,
      isOnline: onlineStatus.get(item.user.id) ?? false,
    }));
  }

  /**
   * Create a huddle message in a chat room
   * Called by meeting service when huddle starts/ends
   */
  @SkipContext()
  @Post('rooms/:roomId/huddle')
  async createHuddleMessage(
    @Param('roomId') roomId: string,
    @Body() body: CreateHuddleMessageBody,
  ) {
    const message = await this.chatsService.createHuddleMessage({
      roomId,
      userId: body.userId,
      orgId: body.orgId,
      type: body.type,
      meetingId: body.meetingId,
      meetingRoomId: body.meetingRoomId,
      duration: body.duration,
      participantCount: body.participantCount,
    });

    // Broadcast to room via WebSocket
    this.chatsGateway.broadcastHuddleMessage(body.orgId, roomId, message);

    return message;
  }

  /**
   * Update huddle participant count
   * Called by meeting service when participants join/leave
   */
  @SkipContext()
  @Post('rooms/:roomId/huddle/participants')
  async updateHuddleParticipants(
    @Param('roomId') roomId: string,
    @Body() body: UpdateHuddleParticipantsBody,
  ) {
    // Get room to find orgId
    const room = await this.roomsRepository.findById(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Broadcast participant count update via WebSocket
    this.chatsGateway.broadcastHuddleParticipantUpdate(room.orgId, roomId, {
      meetingId: body.meetingId,
      participantCount: body.participantCount,
    });

    return { success: true };
  }
}

