import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class VacationScheduler {
  private readonly logger = new Logger(VacationScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Run every hour to auto-end expired vacations
   *
   * Logic:
   * - Find teachers where isOnVacation=true AND vacationEndDate <= now
   * - Set isOnVacation=false and clear vacation fields
   * - Send notification to teacher
   *
   * TODO: Use teacher timezone for more accurate end time (currently uses server UTC)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleVacationExpiry() {
    this.logger.log('Running vacation expiry check...');
    const now = new Date();

    try {
      // Find teachers with expired vacations
      const expiredTeachers = await this.prisma.teacher_profiles.findMany({
        where: {
          isOnVacation: true,
          vacationEndDate: { lte: now },
        },
        include: {
          users: { select: { id: true } },
        },
      });

      if (expiredTeachers.length === 0) {
        this.logger.log('No expired vacations found');
        return;
      }

      this.logger.log(
        `Found ${expiredTeachers.length} expired vacations to process`,
      );

      // Update all expired vacations
      const updateResult = await this.prisma.teacher_profiles.updateMany({
        where: {
          isOnVacation: true,
          vacationEndDate: { lte: now },
        },
        data: {
          isOnVacation: false,
          vacationStartDate: null,
          vacationEndDate: null,
          vacationReason: null,
        },
      });

      this.logger.log(
        `Auto-returned ${updateResult.count} teachers from vacation`,
      );

      // Send notifications to affected teachers
      for (const teacher of expiredTeachers) {
        try {
          await this.notificationService.notifyUser({
            userId: teacher.users.id,
            title: 'انتهت فترة إجازتك',
            message:
              'تم إيقاف وضع الإجازة تلقائياً. أنت الآن متاح للحجوزات الجديدة.',
            type: 'SYSTEM_ALERT',
            link: '/teacher/settings',
            dedupeKey: `VACATION_ENDED:${teacher.id}:${now.toISOString().split('T')[0]}`,
          });
        } catch (error) {
          this.logger.error(
            `Failed to notify teacher ${teacher.id} about vacation end`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Vacation expiry cron job failed', error);
    }
  }
}
