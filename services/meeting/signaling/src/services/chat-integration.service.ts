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
    } catch (error: unknown) {
      // Don't throw - huddle message failure shouldn't block meeting
      this.logger.warn(
        `Failed to notify chat service about huddle start: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    } catch (error: unknown) {
      // Don't throw - participant update failure shouldn't block meeting
      this.logger.warn(
        `Failed to notify chat service about participant update: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    hasTranscript?: boolean;
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
          hasTranscript: dto.hasTranscript,
        })
      );

      this.logger.log(`Successfully notified chat service about huddle end`);
    } catch (error: unknown) {
      // Don't throw - huddle message failure shouldn't block meeting
      this.logger.warn(
        `Failed to notify chat service about huddle end: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send a meeting chat message to the chat service
   * This will create a thread reply under the huddle message
   */
  async sendMeetingChatMessage(dto: {
    chatId: string;
    userId: string;
    orgId: string;
    meetingId: string;
    content: string;
    senderName?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const url = `${CHAT_SERVICE_URL}/internal/rooms/${dto.chatId}/meeting-chat`;

      this.logger.log(`Sending meeting chat message to chat service: ${dto.chatId}`);

      const response = await firstValueFrom(
        this.httpService.post(url, {
          userId: dto.userId,
          orgId: dto.orgId,
          meetingId: dto.meetingId,
          content: dto.content,
          senderName: dto.senderName,
        })
      );

      if (response.data.success) {
        this.logger.log(`Successfully sent meeting chat message: ${response.data.message?.id}`);
        return { success: true, messageId: response.data.message?.id };
      } else {
        this.logger.warn(`Failed to send meeting chat message: ${response.data.error}`);
        return { success: false };
      }
    } catch (error: unknown) {
      // Don't throw - chat message failure shouldn't block meeting
      this.logger.warn(
        `Failed to send meeting chat message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { success: false };
    }
  }

  /**
   * Get meeting chat messages from the chat service
   */
  async getMeetingChatMessages(dto: {
    chatId: string;
    meetingId: string;
  }): Promise<any[]> {
    try {
      const url = `${CHAT_SERVICE_URL}/internal/rooms/${dto.chatId}/meeting-chat/${dto.meetingId}`;

      this.logger.log(`Getting meeting chat messages from chat service: ${dto.chatId}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data.success) {
        this.logger.log(`Successfully got ${response.data.messages?.length || 0} meeting chat messages`);
        return response.data.messages || [];
      } else {
        this.logger.warn(`Failed to get meeting chat messages: ${response.data.error}`);
        return [];
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to get meeting chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }
}
