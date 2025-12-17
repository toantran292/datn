import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://chat-api:3000';

export interface HuddleMessageDto {
  chatId: string;
  userId: string;
  orgId: string;
  meetingId: string;
  meetingRoomId: string;
  type: 'huddle_started' | 'huddle_ended';
  duration?: number;
  participantCount?: number;
}

@Injectable()
export class ChatIntegrationService {
  private readonly logger = new Logger(ChatIntegrationService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Notify chat service that a huddle has started
   */
  async notifyHuddleStarted(dto: {
    chatId: string;
    userId: string;
    orgId: string;
    meetingId: string;
    meetingRoomId: string;
  }): Promise<void> {
    try {
      const url = `${CHAT_SERVICE_URL}/internal/rooms/${dto.chatId}/huddle`;

      this.logger.log(`Notifying chat service about huddle start: ${dto.chatId}`);

      await firstValueFrom(
        this.httpService.post(url, {
          type: 'huddle_started',
          userId: dto.userId,
          orgId: dto.orgId,
          meetingId: dto.meetingId,
          meetingRoomId: dto.meetingRoomId,
        })
      );

      this.logger.log(`Successfully notified chat service about huddle start`);
    } catch (error) {
      // Don't throw - huddle message failure shouldn't block meeting
      this.logger.warn(
        `Failed to notify chat service about huddle start: ${error.message}`
      );
    }
  }

  /**
   * Notify chat service about participant count update
   */
  async notifyParticipantUpdate(dto: {
    chatId: string;
    meetingId: string;
    participantCount: number;
  }): Promise<void> {
    try {
      const url = `${CHAT_SERVICE_URL}/internal/rooms/${dto.chatId}/huddle/participants`;

      this.logger.log(`Notifying chat service about participant update: ${dto.chatId}, count: ${dto.participantCount}`);

      await firstValueFrom(
        this.httpService.post(url, {
          meetingId: dto.meetingId,
          participantCount: dto.participantCount,
        })
      );

      this.logger.log(`Successfully notified chat service about participant update`);
    } catch (error) {
      // Don't throw - participant update failure shouldn't block meeting
      this.logger.warn(
        `Failed to notify chat service about participant update: ${error.message}`
      );
    }
  }

  /**
   * Notify chat service that a huddle has ended
   */
  async notifyHuddleEnded(dto: {
    chatId: string;
    userId: string;
    orgId: string;
    meetingId: string;
    meetingRoomId: string;
    duration: number;
    participantCount: number;
  }): Promise<void> {
    try {
      const url = `${CHAT_SERVICE_URL}/internal/rooms/${dto.chatId}/huddle`;

      this.logger.log(`Notifying chat service about huddle end: ${dto.chatId}`);

      await firstValueFrom(
        this.httpService.post(url, {
          type: 'huddle_ended',
          userId: dto.userId,
          orgId: dto.orgId,
          meetingId: dto.meetingId,
          meetingRoomId: dto.meetingRoomId,
          duration: dto.duration,
          participantCount: dto.participantCount,
        })
      );

      this.logger.log(`Successfully notified chat service about huddle end`);
    } catch (error) {
      // Don't throw - huddle message failure shouldn't block meeting
      this.logger.warn(
        `Failed to notify chat service about huddle end: ${error.message}`
      );
    }
  }
}
