import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type Subject = 'chat' | 'project';

export interface CanIssueTokenRequest {
  userId: string;
  subjectType: Subject;
  chatId?: string;
  projectId?: string;
  roomId?: string;
  orgId?: string;
}

export interface CanIssueTokenResponse {
  ok: boolean;
  roomId?: string;
  role?: 'HOST' | 'MODERATOR' | 'GUEST';
  userName?: string;
  userAvatar?: string;
}

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates if a user can join/create a meeting
   * This replaces the JoinMeetingFake service with real authorization
   */
  async canIssueToken(args: CanIssueTokenRequest): Promise<CanIssueTokenResponse> {
    this.logger.log(`Checking authorization for user ${args.userId} on ${args.subjectType}`);

    try {
      if (args.subjectType === 'chat') {
        return await this.authorizeChatMeeting(args);
      } else if (args.subjectType === 'project') {
        return await this.authorizeProjectMeeting(args);
      }

      return { ok: false };
    } catch (error) {
      this.logger.error('Authorization failed', error);
      return { ok: false };
    }
  }

  /**
   * Authorize chat meeting
   * For now, uses simple validation. Can be extended to check chat service
   */
  private async authorizeChatMeeting(
    args: CanIssueTokenRequest,
  ): Promise<CanIssueTokenResponse> {
    if (!args.chatId) {
      return { ok: false };
    }

    // Check if there's an existing meeting for this chat
    const existingMeeting = await this.prisma.meeting.findFirst({
      where: {
        subjectType: 'chat',
        subjectId: args.chatId,
        status: 'ACTIVE',
      },
      include: {
        participants: {
          where: { userId: args.userId, status: 'JOINED' },
        },
      },
    });

    // Determine role
    let role: 'HOST' | 'MODERATOR' | 'GUEST' = 'GUEST';
    if (existingMeeting) {
      // If meeting exists, check if user is host
      if (existingMeeting.hostUserId === args.userId) {
        role = 'HOST';
      }
      return {
        ok: true,
        roomId: existingMeeting.roomId,
        role,
      };
    }

    // New meeting - user becomes host
    return {
      ok: true,
      roomId: args.chatId,
      role: 'HOST',
    };
  }

  /**
   * Authorize project meeting
   * TODO: Integrate with PM service to validate project membership
   */
  private async authorizeProjectMeeting(
    args: CanIssueTokenRequest,
  ): Promise<CanIssueTokenResponse> {
    if (!args.projectId) {
      return { ok: false };
    }

    // TODO: Call PM service to validate if user is member of project
    // For now, we'll allow and track in database
    const isProjectMember = await this.validateProjectMembership(args.userId, args.projectId);

    if (!isProjectMember) {
      this.logger.warn(`User ${args.userId} is not a member of project ${args.projectId}`);
      return { ok: false };
    }

    // Check for existing meeting
    let meeting = await this.prisma.meeting.findFirst({
      where: {
        subjectType: 'project',
        subjectId: args.projectId,
        status: 'ACTIVE',
      },
    });

    let role: 'HOST' | 'MODERATOR' | 'GUEST' = 'GUEST';

    if (meeting) {
      // Meeting exists
      if (meeting.hostUserId === args.userId) {
        role = 'HOST';
      }

      // Validate roomId if provided
      if (args.roomId && meeting.roomId !== args.roomId) {
        this.logger.warn(`Room ID mismatch: provided ${args.roomId}, expected ${meeting.roomId}`);
        return { ok: false };
      }

      return {
        ok: true,
        roomId: meeting.roomId,
        role,
      };
    }

    // New meeting - use provided roomId or generate one
    const roomId = args.roomId || `project-${args.projectId}-${Date.now()}`;
    role = 'HOST'; // First user becomes host

    return {
      ok: true,
      roomId,
      role,
    };
  }

  /**
   * Validate project membership
   * TODO: Replace with actual PM service call
   */
  private async validateProjectMembership(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    // Temporary implementation - always allow
    // In production, this should call the PM service:
    // const response = await this.httpService.get(`${PM_SERVICE_URL}/projects/${projectId}/members/${userId}`)
    // return response.data.isMember

    this.logger.debug(`Validating project membership for user ${userId} in project ${projectId}`);
    return true; // TODO: Replace with real validation
  }

  /**
   * Check if user is host of a meeting
   */
  async isHost(userId: string, meetingId: string): Promise<boolean> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    return meeting?.hostUserId === userId;
  }

  /**
   * Check if user is moderator or host
   */
  async isModerator(userId: string, meetingId: string): Promise<boolean> {
    const participant = await this.prisma.participant.findFirst({
      where: {
        meetingId,
        userId,
        status: 'JOINED',
        role: { in: ['HOST', 'MODERATOR'] },
      },
    });

    return !!participant;
  }

  /**
   * Get user's role in a meeting
   */
  async getUserRole(
    userId: string,
    meetingId: string,
  ): Promise<'HOST' | 'MODERATOR' | 'GUEST' | null> {
    const participant = await this.prisma.participant.findFirst({
      where: {
        meetingId,
        userId,
        status: 'JOINED',
      },
    });

    return participant?.role || null;
  }
}
