import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notifications
   * Get paginated notifications for current user.
   * Ordered by createdAt DESC. Max page size = 50.
   */
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  /**
   * GET /notifications/unread-count
   * Get unread notification count for current user.
   * Optimized for navbar badge.
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(
      req.user.userId,
    );
    return { count };
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read.
   * Validates ownership.
   */
  @Patch(':id/read')
  @HttpCode(200)
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const success = await this.notificationService.markAsRead(
      id,
      req.user.userId,
    );
    return { success };
  }

  /**
   * PATCH /notifications/read-all
   * Mark all unread notifications as read for current user.
   */
  @Patch('read-all')
  @HttpCode(200)
  async markAllAsRead(@Request() req: any) {
    const count = await this.notificationService.markAllAsRead(req.user.userId);
    return { count };
  }
}
