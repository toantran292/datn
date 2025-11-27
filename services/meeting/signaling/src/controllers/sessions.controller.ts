import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MeetingStatus } from '@prisma/client';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's meeting sessions
   */
  @Get('users/:userId')
  async getUserSessions(
    @Param('userId') userId: string,
    @Query('status') status?: MeetingStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const where: any = {
      participants: {
        some: {
          userId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    const sessions = await this.prisma.meeting.findMany({
      where,
      include: {
        participants: {
          select: {
            userId: true,
            userName: true,
            userAvatar: true,
            role: true,
            status: true,
            joinedAt: true,
            leftAt: true,
          },
        },
        recordings: {
          select: {
            id: true,
            sessionId: true,
            status: true,
            duration: true,
            s3Url: true,
            startedAt: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await this.prisma.meeting.count({ where });

    return {
      sessions: sessions.map((s) => ({
        meeting_id: s.id,
        room_id: s.roomId,
        subject_type: s.subjectType,
        subject_id: s.subjectId,
        status: s.status,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        duration: s.endedAt
          ? Math.floor((s.endedAt.getTime() - s.startedAt.getTime()) / 1000)
          : null,
        participants: s.participants,
        recordings: s.recordings,
        is_host: s.hostUserId === userId,
      })),
      total,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  /**
   * Get session details
   */
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.prisma.meeting.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userAvatar: true,
            role: true,
            status: true,
            joinedAt: true,
            leftAt: true,
            kickedBy: true,
            kickReason: true,
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        recordings: {
          select: {
            id: true,
            sessionId: true,
            status: true,
            startedBy: true,
            stoppedBy: true,
            startedAt: true,
            stoppedAt: true,
            duration: true,
            fileSize: true,
            s3Url: true,
            error: true,
          },
        },
      },
    });

    if (!session) {
      return { session: null };
    }

    const duration = session.endedAt
      ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
      : Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    return {
      session: {
        meeting_id: session.id,
        room_id: session.roomId,
        subject_type: session.subjectType,
        subject_id: session.subjectId,
        host_user_id: session.hostUserId,
        org_id: session.orgId,
        status: session.status,
        locked: session.locked,
        max_participants: session.maxParticipants,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        duration,
        participants: session.participants,
        recordings: session.recordings,
      },
    };
  }

  /**
   * Get session events
   */
  @Get(':sessionId/events')
  async getSessionEvents(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const events = await this.prisma.meetingEvent.findMany({
      where: { meetingId: sessionId },
      orderBy: { timestamp: 'asc' },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await this.prisma.meetingEvent.count({
      where: { meetingId: sessionId },
    });

    return {
      events: events.map((e) => ({
        id: e.id,
        event_type: e.eventType,
        user_id: e.userId,
        target_user_id: e.targetUserId,
        metadata: e.metadata,
        timestamp: e.timestamp,
      })),
      total,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  /**
   * Get sessions by subject (chat or project)
   */
  @Get('subject/:subjectType/:subjectId')
  async getSubjectSessions(
    @Param('subjectType') subjectType: string,
    @Param('subjectId') subjectId: string,
    @Query('status') status?: MeetingStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const where: any = {
      subjectType,
      subjectId,
    };

    if (status) {
      where.status = status;
    }

    const sessions = await this.prisma.meeting.findMany({
      where,
      include: {
        participants: {
          where: { status: 'JOINED' },
          select: {
            userId: true,
            userName: true,
            userAvatar: true,
            role: true,
          },
        },
        recordings: {
          select: {
            id: true,
            status: true,
            duration: true,
            s3Url: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await this.prisma.meeting.count({ where });

    return {
      sessions: sessions.map((s) => ({
        meeting_id: s.id,
        room_id: s.roomId,
        status: s.status,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        participants_count: s.participants.length,
        recordings_count: s.recordings.length,
      })),
      total,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  /**
   * Get meeting statistics by org
   */
  @Get('org/:orgId/stats')
  async getOrgStats(@Param('orgId') orgId: string) {
    const totalMeetings = await this.prisma.meeting.count({
      where: { orgId },
    });

    const activeMeetings = await this.prisma.meeting.count({
      where: { orgId, status: 'ACTIVE' },
    });

    const totalParticipants = await this.prisma.participant.count({
      where: {
        meeting: { orgId },
      },
    });

    const totalRecordings = await this.prisma.recording.count({
      where: {
        meeting: { orgId },
      },
    });

    const completedRecordings = await this.prisma.recording.count({
      where: {
        meeting: { orgId },
        status: 'COMPLETED',
      },
    });

    return {
      org_id: orgId,
      total_meetings: totalMeetings,
      active_meetings: activeMeetings,
      total_participants: totalParticipants,
      total_recordings: totalRecordings,
      completed_recordings: completedRecordings,
    };
  }
}
