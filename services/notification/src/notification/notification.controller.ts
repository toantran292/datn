import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get online users in an organization
   */
  @Get('presence/org/:orgId/online')
  async getOnlineUsersInOrg(@Param('orgId') orgId: string) {
    return this.notificationService.getOnlineUsersInOrg(orgId);
  }

  /**
   * Get online status for multiple users
   */
  @Post('presence/users/status')
  @HttpCode(HttpStatus.OK)
  async getUsersOnlineStatus(@Body() data: { userIds: string[] }) {
    return this.notificationService.getUsersOnlineStatus(data.userIds);
  }

  /**
   * Get online status for multiple users (GET with query)
   */
  @Get('presence/users/status')
  async getUsersOnlineStatusGet(@Query('user_ids') userIds: string) {
    const ids = userIds ? userIds.split(',').map((id) => id.trim()) : [];
    return this.notificationService.getUsersOnlineStatus(ids);
  }

  /**
   * Send a single notification
   * Generic endpoint that other services can call
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  /**
   * Send multiple notifications in bulk
   * Useful for batch operations
   */
  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulk(@Body() dtos: SendNotificationDto[]) {
    return this.notificationService.sendBulk(dtos);
  }

  /**
   * Broadcast a message to all connected users
   */
  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(
    @Body()
    data: {
      title: string;
      message: string;
      metadata?: any;
    },
  ) {
    return this.notificationService.broadcast(
      data.message,
      data.title,
      data.metadata,
    );
  }

  /**
   * Get connection statistics
   * Shows how many users are connected via WebSocket
   */
  @Get('stats')
  getStats() {
    return this.notificationService.getConnectionStats();
  }

  /**
   * Check if a user is currently online
   */
  @Get('user/:userId/online')
  async checkUserOnlineStatus(@Param('userId') userId: string) {
    return this.notificationService.checkUserOnlineStatus(userId);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'notification-api',
      timestamp: new Date(),
    };
  }
}
