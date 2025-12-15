import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Headers,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  StoredNotificationService,
  CreateNotificationDto,
  NotificationResponseDto,
  PagedNotificationsDto,
} from './stored-notification.service';

@Controller('notifications')
export class StoredNotificationController {
  constructor(private readonly service: StoredNotificationService) {}

  @Get()
  async getNotifications(
    @Headers('x-user-id') userId: string,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ): Promise<PagedNotificationsDto> {
    return this.service.getNotifications(userId, page, size);
  }

  @Get('unread')
  async getUnreadNotifications(
    @Headers('x-user-id') userId: string,
  ): Promise<NotificationResponseDto[]> {
    return this.service.getUnreadNotifications(userId);
  }

  @Get('unread-count')
  async getUnreadCount(
    @Headers('x-user-id') userId: string,
  ): Promise<{ count: number }> {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<NotificationResponseDto> {
    return this.service.markAsRead(userId, notificationId);
  }

  @Patch('mark-all-read')
  async markAllAsRead(
    @Headers('x-user-id') userId: string,
  ): Promise<{ marked: number }> {
    return this.service.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<void> {
    return this.service.deleteNotification(userId, notificationId);
  }

  @Delete()
  async deleteAllNotifications(
    @Headers('x-user-id') userId: string,
  ): Promise<{ deleted: number }> {
    return this.service.deleteAllNotifications(userId);
  }

  // Internal endpoint for creating notifications from other services
  @Post('internal')
  async createNotification(
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.service.createNotification(dto);
  }
}
