import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Meeting, Participant, MeetingStatus, ParticipantRole, ParticipantStatus } from '@prisma/client';
import { ChatIntegrationService } from './chat-integration.service';

export type MeetingWithParticipants = Meeting & { participants: Participant[] };

export interface CreateMeetingDto {
  roomId: string;
  subjectType: 'chat' | 'project';
  subjectId: string;
  hostUserId: string;
  orgId?: string;
  maxParticipants?: number;
}

export interface JoinMeetingDto {
  meetingId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  role?: ParticipantRole;
}

export interface ParticipantInfo {
  id: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  role: ParticipantRole;
  joinedAt: Date;
}

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatIntegration: ChatIntegrationService,
  ) {}

  /**
   * Create a new meeting
   */
  async createMeeting(dto: CreateMeetingDto): Promise<Meeting> {
    this.logger.log(`Creating meeting for room ${dto.roomId}`);

    const meeting = await this.prisma.meeting.create({
      data: {
        roomId: dto.roomId,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        hostUserId: dto.hostUserId,
        orgId: dto.orgId,
        maxParticipants: dto.maxParticipants,
        status: 'ACTIVE',
      },
    });

    // Create event
    await this.createEvent(meeting.id, 'meeting_created', dto.hostUserId);

    return meeting;
  }

  /**
   * Get or create meeting by roomId
   * If existing meeting is ENDED, create a new one
   */
  async getOrCreateMeeting(dto: CreateMeetingDto): Promise<Meeting> {
    let meeting = await this.prisma.meeting.findUnique({
      where: { roomId: dto.roomId },
    });

    // If no meeting or meeting is ended, create new one
    if (!meeting || meeting.status === 'ENDED') {
      // If there was an ended meeting, delete it first (unique constraint on roomId)
      if (meeting && meeting.status === 'ENDED') {
        await this.prisma.meeting.delete({
          where: { id: meeting.id },
        });
      }
      meeting = await this.createMeeting(dto);
    }

    return meeting;
  }

  /**
   * Add participant to meeting
   */
  async addParticipant(dto: JoinMeetingDto): Promise<Participant> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: dto.meetingId },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== 'ACTIVE') {
      throw new ForbiddenException('Meeting is not active');
    }

    if (meeting.locked) {
      // Only allow if user is already a participant or is host
      const isExistingParticipant = meeting.participants.some(p => p.userId === dto.userId);
      if (!isExistingParticipant && meeting.hostUserId !== dto.userId) {
        throw new ForbiddenException('Meeting is locked');
      }
    }

    if (meeting.maxParticipants && meeting.participants.length >= meeting.maxParticipants) {
      throw new ForbiddenException('Meeting is full');
    }

    // Check if participant already exists
    const existingParticipant = await this.prisma.participant.findFirst({
      where: {
        meetingId: dto.meetingId,
        userId: dto.userId,
      },
    });

    let participant: Participant;

    if (existingParticipant) {
      // Update existing participant (rejoin)
      participant = await this.prisma.participant.update({
        where: { id: existingParticipant.id },
        data: {
          status: 'JOINED',
          userName: dto.userName,
          userAvatar: dto.userAvatar,
          role: dto.role || existingParticipant.role,
          leftAt: null,
        },
      });
    } else {
      // Create new participant
      participant = await this.prisma.participant.create({
        data: {
          meetingId: dto.meetingId,
          userId: dto.userId,
          userName: dto.userName,
          userAvatar: dto.userAvatar,
          role: dto.role || 'GUEST',
        },
      });
    }

    // Create event
    await this.createEvent(dto.meetingId, 'participant_joined', dto.userId);

    this.logger.log(`User ${dto.userId} joined meeting ${dto.meetingId}`);

    // Notify chat service if this is a chat huddle
    if (meeting.subjectType === 'chat' && meeting.orgId) {
      const isFirstParticipant = !existingParticipant && meeting.participants.length === 0;
      if (isFirstParticipant) {
        this.chatIntegration.notifyHuddleStarted({
          chatId: meeting.subjectId,
          userId: dto.userId,
          orgId: meeting.orgId,
          meetingId: meeting.id,
          meetingRoomId: meeting.roomId,
        });
      }

      // Always notify participant count update
      // Check if this user was already in the JOINED participants list
      const wasAlreadyJoined = meeting.participants.some(p => p.userId === dto.userId);
      const currentCount = meeting.participants.length + (wasAlreadyJoined ? 0 : 1);
      this.chatIntegration.notifyParticipantUpdate({
        chatId: meeting.subjectId,
        meetingId: meeting.id,
        participantCount: currentCount,
      });
    }

    return participant;
  }

  /**
   * Remove participant from meeting (user left)
   */
  async removeParticipant(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
      },
    });

    if (!meeting) {
      return;
    }

    const participant = await this.prisma.participant.findFirst({
      where: {
        meetingId,
        userId,
        status: 'JOINED',
      },
    });

    if (!participant) {
      return; // Already left
    }

    await this.prisma.participant.update({
      where: { id: participant.id },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    // Create event
    await this.createEvent(meetingId, 'participant_left', userId);

    this.logger.log(`User ${userId} left meeting ${meetingId}`);

    // Notify chat service about participant count update
    if (meeting.subjectType === 'chat' && meeting.orgId) {
      const remainingCount = meeting.participants.length - 1; // -1 because current user left
      this.chatIntegration.notifyParticipantUpdate({
        chatId: meeting.subjectId,
        meetingId: meeting.id,
        participantCount: Math.max(0, remainingCount),
      });
    }

    // Check if meeting should end (no participants left)
    await this.checkAndEndMeeting(meetingId);
  }

  /**
   * Kick participant from meeting
   */
  async kickParticipant(
    meetingId: string,
    targetUserId: string,
    kickedBy: string,
    reason?: string,
  ): Promise<void> {
    const participant = await this.prisma.participant.findFirst({
      where: {
        meetingId,
        userId: targetUserId,
        status: 'JOINED',
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    await this.prisma.participant.update({
      where: { id: participant.id },
      data: {
        status: 'KICKED',
        leftAt: new Date(),
        kickedBy,
        kickReason: reason,
      },
    });

    // Create event
    await this.createEvent(meetingId, 'participant_kicked', kickedBy, targetUserId, {
      reason,
    });

    this.logger.log(`User ${targetUserId} kicked from meeting ${meetingId} by ${kickedBy}`);
  }

  /**
   * Lock/unlock meeting
   */
  async setMeetingLock(meetingId: string, locked: boolean, userId: string): Promise<Meeting> {
    const meeting = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: { locked },
    });

    // Create event
    await this.createEvent(meetingId, locked ? 'room_locked' : 'room_unlocked', userId);

    this.logger.log(`Meeting ${meetingId} ${locked ? 'locked' : 'unlocked'} by ${userId}`);

    return meeting;
  }

  /**
   * End meeting
   */
  async endMeeting(meetingId: string, endedBy: string): Promise<Meeting> {
    const meeting = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    // Mark all active participants as left
    await this.prisma.participant.updateMany({
      where: {
        meetingId,
        status: 'JOINED',
      },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    // Create event
    await this.createEvent(meetingId, 'meeting_ended', endedBy);

    this.logger.log(`Meeting ${meetingId} ended by ${endedBy}`);

    return meeting;
  }

  /**
   * Terminate meeting (force end)
   */
  async terminateMeeting(meetingId: string, terminatedBy: string): Promise<Meeting> {
    const meeting = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'TERMINATED',
        endedAt: new Date(),
      },
    });

    // Mark all active participants as left
    await this.prisma.participant.updateMany({
      where: {
        meetingId,
        status: 'JOINED',
      },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    // Create event
    await this.createEvent(meetingId, 'meeting_terminated', terminatedBy);

    this.logger.log(`Meeting ${meetingId} terminated by ${terminatedBy}`);

    return meeting;
  }

  /**
   * Get meeting by ID
   */
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    return this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
        recordings: true,
      },
    });
  }

  /**
   * Get meeting by room ID
   */
  async getMeetingByRoomId(roomId: string): Promise<Meeting | null> {
    return this.prisma.meeting.findUnique({
      where: { roomId },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
        recordings: true,
      },
    });
  }

  /**
   * Get active participants
   */
  async getActiveParticipants(meetingId: string): Promise<ParticipantInfo[]> {
    const participants = await this.prisma.participant.findMany({
      where: {
        meetingId,
        status: 'JOINED',
      },
      select: {
        id: true,
        userId: true,
        userName: true,
        userAvatar: true,
        role: true,
        joinedAt: true,
      },
    });

    return participants;
  }

  /**
   * Get active meetings
   */
  async getActiveMeetings(): Promise<MeetingWithParticipants[]> {
    return this.prisma.meeting.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Get user's active meeting
   */
  async getUserActiveMeeting(userId: string): Promise<Meeting | null> {
    const participant = await this.prisma.participant.findFirst({
      where: {
        userId,
        status: 'JOINED',
        meeting: {
          status: 'ACTIVE',
        },
      },
      include: {
        meeting: {
          include: {
            participants: {
              where: { status: 'JOINED' },
            },
          },
        },
      },
    });

    return participant?.meeting || null;
  }

  /**
   * Create meeting event
   */
  private async createEvent(
    meetingId: string,
    eventType: string,
    userId?: string,
    targetUserId?: string,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.meetingEvent.create({
      data: {
        meetingId,
        eventType,
        userId,
        targetUserId,
        metadata,
      },
    });
  }

  /**
   * Check if meeting should end (no active participants)
   */
  private async checkAndEndMeeting(meetingId: string): Promise<void> {
    const activeCount = await this.prisma.participant.count({
      where: {
        meetingId,
        status: 'JOINED',
      },
    });

    if (activeCount === 0) {
      this.logger.log(`No active participants in meeting ${meetingId}, ending meeting`);

      // Get meeting details before ending
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          participants: true,
        },
      });

      const endedAt = new Date();
      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: 'ENDED',
          endedAt,
        },
      });

      await this.createEvent(meetingId, 'meeting_auto_ended');

      // Notify chat service if this is a chat huddle
      if (meeting && meeting.subjectType === 'chat' && meeting.orgId) {
        const duration = Math.floor((endedAt.getTime() - meeting.startedAt.getTime()) / 1000);
        const participantCount = meeting.participants.length;

        this.chatIntegration.notifyHuddleEnded({
          chatId: meeting.subjectId,
          userId: meeting.hostUserId,
          orgId: meeting.orgId,
          meetingId: meeting.id,
          meetingRoomId: meeting.roomId,
          duration,
          participantCount,
        });
      }
    }
  }

  /**
   * Get meeting statistics
   */
  async getMeetingStats(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: true,
        recordings: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const activeParticipants = meeting.participants.filter(p => p.status === 'JOINED').length;
    const totalParticipants = meeting.participants.length;
    const duration = meeting.endedAt
      ? Math.floor((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000)
      : Math.floor((Date.now() - meeting.startedAt.getTime()) / 1000);

    return {
      meetingId: meeting.id,
      roomId: meeting.roomId,
      status: meeting.status,
      activeParticipants,
      totalParticipants,
      duration,
      recordings: meeting.recordings.length,
      locked: meeting.locked,
    };
  }

  // ==================== Admin Methods ====================

  /**
   * Get all meetings for admin (cross-org)
   */
  async getAllMeetingsForAdmin(options: {
    status?: 'ACTIVE' | 'ENDED' | 'WAITING';
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { status, limit = 50, offset = 0, search } = options;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { roomId: { contains: search, mode: 'insensitive' } },
        { subjectId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          participants: {
            where: { status: 'JOINED' },
            select: {
              id: true,
              userId: true,
              userName: true,
              role: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    // Calculate duration for each meeting
    const meetingsWithDuration = meetings.map(m => {
      const duration = m.endedAt
        ? Math.floor((m.endedAt.getTime() - m.startedAt.getTime()) / 1000)
        : Math.floor((Date.now() - m.startedAt.getTime()) / 1000);

      // Find host name from participants
      const host = m.participants.find(p => p.role === 'HOST');

      return {
        id: m.id,
        roomId: m.roomId,
        subjectType: m.subjectType,
        subjectId: m.subjectId,
        orgId: m.orgId,
        hostUserId: m.hostUserId,
        hostName: host?.userName || 'Unknown',
        status: m.status,
        participantCount: m.participants.length,
        startedAt: m.startedAt.toISOString(),
        endedAt: m.endedAt?.toISOString() || null,
        duration,
        locked: m.locked,
      };
    });

    return {
      meetings: meetingsWithDuration,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get meeting detail for admin
   */
  async getMeetingDetailForAdmin(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          orderBy: { joinedAt: 'desc' },
        },
        recordings: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Get recent events
    const events = await this.prisma.meetingEvent.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const duration = meeting.endedAt
      ? Math.floor((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000)
      : Math.floor((Date.now() - meeting.startedAt.getTime()) / 1000);

    return {
      id: meeting.id,
      roomId: meeting.roomId,
      subjectType: meeting.subjectType,
      subjectId: meeting.subjectId,
      orgId: meeting.orgId,
      hostUserId: meeting.hostUserId,
      status: meeting.status,
      locked: meeting.locked,
      maxParticipants: meeting.maxParticipants,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt?.toISOString() || null,
      duration,
      participants: meeting.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        userAvatar: p.userAvatar,
        role: p.role,
        status: p.status,
        joinedAt: p.joinedAt.toISOString(),
        leftAt: p.leftAt?.toISOString() || null,
        kickedBy: p.kickedBy,
        kickReason: p.kickReason,
      })),
      recordings: meeting.recordings.map(r => ({
        id: r.id,
        status: r.status,
        startedAt: r.startedAt?.toISOString() || null,
        stoppedAt: r.stoppedAt?.toISOString() || null,
        duration: r.duration,
        fileSize: r.fileSize,
      })),
      events: events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        userId: e.userId,
        targetUserId: e.targetUserId,
        timestamp: e.timestamp.toISOString(),
        metadata: e.metadata,
      })),
    };
  }

  /**
   * Terminate meeting as admin
   */
  async terminateMeetingAsAdmin(
    meetingId: string,
    adminUserId: string,
    reason?: string,
  ): Promise<Meeting> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== 'ACTIVE') {
      throw new ForbiddenException('Meeting is not active');
    }

    // End the meeting
    const endedAt = new Date();
    const updated = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'TERMINATED',
        endedAt,
      },
    });

    // Mark all active participants as left
    await this.prisma.participant.updateMany({
      where: {
        meetingId,
        status: 'JOINED',
      },
      data: {
        status: 'LEFT',
        leftAt: endedAt,
      },
    });

    // Create admin event
    await this.createEvent(meetingId, 'meeting_terminated_by_admin', adminUserId, undefined, {
      reason,
      terminatedBy: adminUserId,
    });

    this.logger.log(`Meeting ${meetingId} terminated by admin ${adminUserId}, reason: ${reason}`);

    // Notify chat service if this is a chat huddle
    if (meeting.subjectType === 'chat' && meeting.orgId) {
      const duration = Math.floor((endedAt.getTime() - meeting.startedAt.getTime()) / 1000);
      this.chatIntegration.notifyHuddleEnded({
        chatId: meeting.subjectId,
        userId: adminUserId,
        orgId: meeting.orgId,
        meetingId: meeting.id,
        meetingRoomId: meeting.roomId,
        duration,
        participantCount: meeting.participants.length,
      });
    }

    return updated;
  }

  /**
   * Kick participant as admin
   */
  async kickParticipantAsAdmin(
    meetingId: string,
    targetUserId: string,
    adminUserId: string,
    reason?: string,
  ): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== 'ACTIVE') {
      throw new ForbiddenException('Meeting is not active');
    }

    const participant = await this.prisma.participant.findFirst({
      where: {
        meetingId,
        userId: targetUserId,
        status: 'JOINED',
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found or not active');
    }

    // Kick the participant
    await this.prisma.participant.update({
      where: { id: participant.id },
      data: {
        status: 'KICKED',
        leftAt: new Date(),
        kickedBy: adminUserId,
        kickReason: reason || 'Kicked by admin',
      },
    });

    // Create event
    await this.createEvent(meetingId, 'participant_kicked_by_admin', adminUserId, targetUserId, {
      reason,
      kickedBy: adminUserId,
    });

    this.logger.log(
      `Participant ${targetUserId} kicked from meeting ${meetingId} by admin ${adminUserId}`,
    );
  }
}
