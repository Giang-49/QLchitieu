import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Trả về danh sách cảnh báo nợ đến hạn/quá hạn và cảnh báo ngân sách
   */
  @Get()
  async getNotifications(@Request() req: any) {
    const notifications = await this.notificationsService.getUserNotifications(
      req.user.id,
    );
    return {
      message: 'Lấy danh sách thông báo thành công',
      data: notifications,
    };
  }
}
