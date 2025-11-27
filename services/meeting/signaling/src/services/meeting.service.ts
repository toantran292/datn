import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Meeting, Participant, MeetingStatus, ParticipantRole, ParticipantStatus } from '@prisma/client';

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
  userName?: string;
  userAvatar?: string;
  role: ParticipantRole;
  joinedAt: Date;
}

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(private readonly prisma: PrismaService) {}

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
   */
  async getOrCreateMeeting(dto: CreateMeetingDto): Promise<Meeting> {
    let meeting = await this.prisma.meeting.findUnique({
      where: { roomId: dto.roomId },
    });

    if (!meeting) {
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

    return participant;
  }

  /**
   * Remove participant from meeting (user left)
   */
  async removeParticipant(meetingId: string, userId: string): Promise<void> {
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
  async getActiveMeetings(): Promise<Meeting[]> {
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
      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
        },
      });

      await this.createEvent(meetingId, 'meeting_auto_ended');
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
}
