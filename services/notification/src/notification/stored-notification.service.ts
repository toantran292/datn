import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../persistence/notification.repository';
import {
  NotificationEntity,
  StoredNotificationType,
} from '../persistence/entities/notification.entity';
import { NotificationGateway } from '../websocket/notification.gateway';

export interface CreateNotificationDto {
  userId: string;
  orgId?: string;
  type: StoredNotificationType;
  title: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResponseDto {
  id: string;
  userId: string;
  orgId: string | null;
  type: string;
  category: string;
  title: string;
  content: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PagedNotificationsDto {
  items: NotificationResponseDto[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class StoredNotificationService {
  private readonly logger = new Logger(StoredNotificationService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly gateway: NotificationGateway,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.repository.create(dto);
    this.logger.log(`Notification created: ${notification.id} for user ${dto.userId}`);

    // Send real-time notification via WebSocket
    this.gateway.sendToUser(dto.userId, {
      userId: dto.userId,
      title: dto.title,
      message: dto.content || '',
      metadata: {
        ...dto.metadata,
        notificationId: notification.id,
        type: dto.type,
      },
    });

    return this.toResponseDto(notification);
  }

  async getNotifications(
    userId: string,
    page: number = 0,
    size: number = 20,
  ): Promise<PagedNotificationsDto> {
    const [notifications, total] = await this.repository.findByUserId(userId, page, size);
    const totalPages = Math.ceil(total / size);

    return {
      items: notifications.map((n) => this.toResponseDto(n)),
      page,
      size,
      total,
      totalPages,
    };
  }

  async getUnreadNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.repository.findUnreadByUserId(userId);
    return notifications.map((n) => this.toResponseDto(n));
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repository.countUnreadByUserId(userId);
    return { count };
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    const success = await this.repository.markAsRead(notificationId, userId);
    if (!success) {
      throw new NotFoundException('Notification not found');
    }

    const notification = await this.repository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.toResponseDto(notification);
  }

  async markAllAsRead(userId: string): Promise<{ marked: number }> {
    const marked = await this.repository.markAllAsRead(userId);
    return { marked };
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const success = await this.repository.deleteById(notificationId, userId);
    if (!success) {
      throw new NotFoundException('Notification not found');
    }
    this.logger.log(`Notification deleted: ${notificationId}`);
  }

  async deleteAllNotifications(userId: string): Promise<{ deleted: number }> {
    const deleted = await this.repository.deleteAllByUserId(userId);
    return { deleted };
  }

  // Helper methods for common notification types
  async notifyInvitation(
    userId: string,
    orgId: string,
    orgName: string,
    inviterEmail: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      orgId,
      type: StoredNotificationType.ORG_INVITATION,
      title: `Invitation to ${orgName}`,
      content: `You have been invited to join ${orgName} by ${inviterEmail}`,
      metadata: { orgName, inviterEmail },
    });
  }

  async notifyMemberJoined(
    userId: string,
    orgId: string,
    orgName: string,
    memberEmail: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      orgId,
      type: StoredNotificationType.ORG_MEMBER_JOINED,
      title: `New member in ${orgName}`,
      content: `${memberEmail} has joined ${orgName}`,
      metadata: { orgName, memberEmail },
    });
  }

  async notifyRoleChanged(
    userId: string,
    orgId: string,
    orgName: string,
    newRole: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      orgId,
      type: StoredNotificationType.ORG_ROLE_CHANGED,
      title: `Role updated in ${orgName}`,
      content: `Your role in ${orgName} has been changed to ${newRole}`,
      metadata: { orgName, newRole },
    });
  }

  async notifyReportCompleted(
    userId: string,
    orgId: string,
    reportId: string,
    reportName: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      orgId,
      type: StoredNotificationType.REPORT_COMPLETED,
      title: 'Report completed',
      content: `Your report "${reportName}" has been generated successfully`,
      metadata: { reportId, reportName },
    });
  }

  async notifyReportFailed(
    userId: string,
    orgId: string,
    reportId: string,
    reportName: string,
    error: string,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      orgId,
      type: StoredNotificationType.REPORT_FAILED,
      title: 'Report failed',
      content: `Your report "${reportName}" failed to generate: ${error}`,
      metadata: { reportId, reportName, error },
    });
  }

  async notifyMention(
    userId: string,
    orgId: string,
    data: {
      messageId: string;
      roomId: string;
      roomName: string;
      senderId: string;
      senderName: string;
      messagePreview: string;
    },
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId,
      orgId,
      type: StoredNotificationType.CHAT_MENTION,
      title: `${data.senderName} mentioned you`,
      content: data.messagePreview,
      metadata: {
        messageId: data.messageId,
        roomId: data.roomId,
        roomName: data.roomName,
        senderId: data.senderId,
        senderName: data.senderName,
      },
    });
  }

  private toResponseDto(entity: NotificationEntity): NotificationResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      orgId: entity.orgId,
      type: entity.type,
      category: entity.getCategory(),
      title: entity.title,
      content: entity.content,
      metadata: entity.metadata,
      isRead: entity.isRead,
      readAt: entity.readAt?.toISOString() || null,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
