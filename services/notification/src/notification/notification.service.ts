import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import {
  NotificationRequest,
  NotificationResponse,
  NotificationType,
} from '../types/notification.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async send(request: NotificationRequest): Promise<NotificationResponse> {
    const errors: string[] = [];
    const id = this.generateNotificationId();

    this.logger.log(
      `Processing notification ${id} of type ${request.type} with priority ${request.priority || 'medium'}`,
    );

    // Validate request based on type
    this.validateRequest(request);

    try {
      // Handle email notification
      if (
        request.type === NotificationType.EMAIL ||
        request.type === NotificationType.BOTH
      ) {
        if (request.email) {
          await this.emailService.sendEmail(request.email);
          this.logger.log(`Email notification ${id} sent successfully`);
        }
      }

      // Handle in-app notification
      if (
        request.type === NotificationType.IN_APP ||
        request.type === NotificationType.BOTH
      ) {
        if (request.inApp) {
          this.notificationGateway.sendToUser(
            request.inApp.userId,
            request.inApp,
          );
          this.logger.log(
            `In-app notification ${id} sent to user ${request.inApp.userId}`,
          );
        }
      }

      return {
        id,
        status: 'success',
        message: 'Notification sent successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${id}: ${error.message}`,
        error.stack,
      );

      errors.push(error.message);

      return {
        id,
        status: 'failed',
        message: 'Failed to send notification',
        timestamp: new Date(),
        errors,
      };
    }
  }

  async sendBulk(
    requests: NotificationRequest[],
  ): Promise<NotificationResponse[]> {
    this.logger.log(`Processing ${requests.length} bulk notifications`);

    const results = await Promise.allSettled(
      requests.map((request) => this.send(request)),
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: this.generateNotificationId(),
          status: 'failed' as const,
          message: 'Failed to send notification',
          timestamp: new Date(),
          errors: [result.reason?.message || 'Unknown error'],
        };
      }
    });
  }

  async broadcast(message: string, title: string, metadata?: any) {
    this.logger.log(`Broadcasting message: ${title}`);

    this.notificationGateway.broadcast({
      title,
      message,
      metadata,
    });

    return {
      id: this.generateNotificationId(),
      status: 'success' as const,
      message: 'Broadcast sent successfully',
      timestamp: new Date(),
    };
  }

  getConnectionStats() {
    return {
      activeUsers: this.notificationGateway.getActiveUsersCount(),
      totalConnections: this.notificationGateway.getTotalConnectionsCount(),
      timestamp: new Date(),
    };
  }

  async checkUserOnlineStatus(userId: string) {
    return {
      userId,
      isOnline: this.notificationGateway.isUserOnline(userId),
      timestamp: new Date(),
    };
  }

  private validateRequest(request: NotificationRequest) {
    if (
      (request.type === NotificationType.EMAIL ||
        request.type === NotificationType.BOTH) &&
      !request.email
    ) {
      throw new BadRequestException(
        'Email payload is required for EMAIL notification type',
      );
    }

    if (
      (request.type === NotificationType.IN_APP ||
        request.type === NotificationType.BOTH) &&
      !request.inApp
    ) {
      throw new BadRequestException(
        'In-app payload is required for IN_APP notification type',
      );
    }
  }

  private generateNotificationId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
