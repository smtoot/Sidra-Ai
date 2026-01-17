import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BookingConstants } from './booking.constants';

@Injectable()
export class BookingCronService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private getSafeDisplayName(user: any, fallback: string) {
    if (!user) return fallback;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.displayName || fallback;
  }

  // Cron: Expire old pending requests (24 hours) and unpaid bookings.
  @Cron(CronExpression.EVERY_HOUR)
  async expireOldRequests() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.prisma.bookings.updateMany({
      where: {
        status: 'PENDING_TEACHER_APPROVAL',
        createdAt: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });

    await this.expireUnpaidBookings();

    return { expired: result.count };
  }

  // Cron Job: Expire bookings waiting for payment where deadline has passed.
  async expireUnpaidBookings() {
    const now = new Date();

    const unpaidBookings = await this.prisma.bookings.findMany({
      where: {
        status: 'WAITING_FOR_PAYMENT',
        paymentDeadline: { lt: now },
      },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
      },
    });

    if (unpaidBookings.length === 0) return;

    const logger = new Logger('BookingCleanup');
    logger.log(`Found ${unpaidBookings.length} unpaid bookings to expire`);

    for (const booking of unpaidBookings) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.bookings.update({
            where: { id: booking.id },
            data: { status: 'EXPIRED' },
          });
        });

        await this.notificationService.notifyUser({
          userId: booking.bookedByUserId,
          title: 'انتهاء مهلة الدفع',
          message: `نأسف، تم إلغاء حجزك مع ${this.getSafeDisplayName(booking.teacher_profiles.users, 'المعلم')} لعدم سداد المبلغ في الوقت المحدد.`,
          type: 'SYSTEM_ALERT',
          link: '/parent/bookings',
          dedupeKey: `PAYMENT_EXPIRED:${booking.id}`,
        });

        await this.notificationService.notifyUser({
          userId: booking.teacher_profiles.users.id,
          title: 'إلغاء حجز لعدم الدفع',
          message: `تم إلغاء الحجز المعلق من ${this.getSafeDisplayName(booking.users_bookings_bookedByUserIdTousers, 'ولي الأمر')} لعدم سداد المبلغ. الموعد متاح مرة أخرى.`,
          type: 'SYSTEM_ALERT',
          link: '/teacher/sessions',
          dedupeKey: `PAYMENT_EXPIRED:${booking.id}`,
        });
      } catch (error) {
        logger.error(`Failed to expire booking ${booking.id}`, error);
      }
    }
  }

  // P1-2 FIX: Auto-Complete Safety Net Cron - Runs every hour to catch stuck scheduled sessions.
  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteScheduledSessions() {
    const GRACE_PERIOD_HOURS =
      BookingConstants.AUTO_COMPLETE_GRACE_PERIOD_HOURS;
    const cutoffTime = new Date(
      Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000,
    );

    const stuckBookings = await this.prisma.bookings.findMany({
      where: {
        status: 'SCHEDULED',
        endTime: { lt: cutoffTime },
      },
      take: 100,
    });

    const logger = new Logger('BookingAutoComplete');

    for (const booking of stuckBookings) {
      try {
        await this.prisma.bookings.update({
          where: { id: booking.id, status: 'SCHEDULED' },
          data: {
            status: 'PENDING_CONFIRMATION',
            disputeWindowOpensAt: new Date(),
            disputeWindowClosesAt: new Date(
              Date.now() +
                BookingConstants.DISPUTE_WINDOW_HOURS * 60 * 60 * 1000,
            ),
          },
        });
        logger.log(`Auto-completed stuck booking ${booking.id}`);
      } catch (e) {
        logger.error(`Failed to auto-complete booking ${booking.id}`, e);
      }
    }
  }

  /**
   * Cron Job: Send reminders for scheduled sessions without meeting links
   * Runs every 10 minutes to check for sessions starting in 30 minutes
   */
  @Cron('*/10 * * * *') // Every 10 minutes
  async sendMeetingLinkReminders() {
    const logger = new Logger('MeetingLinkReminder');

    const now = new Date();
    const in20Minutes = new Date(
      now.getTime() +
        BookingConstants.MEETING_LINK_REMINDER_WINDOW_MINUTES_START * 60 * 1000,
    );
    const in40Minutes = new Date(
      now.getTime() +
        BookingConstants.MEETING_LINK_REMINDER_WINDOW_MINUTES_END * 60 * 1000,
    );

    const sessionsNeedingReminder = await this.prisma.bookings.findMany({
      where: {
        status: 'SCHEDULED',
        meetingLink: null,
        meetingLinkReminderSentAt: null,
        startTime: {
          gte: in20Minutes,
          lte: in40Minutes,
        },
      },
      include: {
        teacher_profiles: {
          include: { users: true },
        },
        children: true,
        users_bookings_studentUserIdTousers: true,
        subjects: true,
      },
    });

    if (sessionsNeedingReminder.length === 0) {
      logger.debug('No sessions needing meeting link reminders');
      return { remindersSent: 0 };
    }

    logger.log(
      `Found ${sessionsNeedingReminder.length} sessions needing meeting link reminders`,
    );

    let remindersSent = 0;

    for (const booking of sessionsNeedingReminder) {
      try {
        const teacherUserId = booking.teacher_profiles.userId;
        const studentName = booking.children?.name
          ? booking.children.name
          : this.getSafeDisplayName(
              booking.users_bookings_studentUserIdTousers,
              'الطالب',
            );
        const subjectName = booking.subjects?.nameAr || 'الدرس';
        const minutesUntilStart = Math.round(
          (booking.startTime.getTime() - now.getTime()) / (60 * 1000),
        );

        await this.notificationService.notifyUser({
          userId: teacherUserId,
          type: 'MEETING_LINK_REMINDER' as any,
          title: '⚠️ رابط الاجتماع مفقود',
          message: `لديك حصة مع ${studentName} (${subjectName}) تبدأ بعد ${minutesUntilStart} دقيقة ولكن لم تقم بإضافة رابط الاجتماع بعد. يرجى إضافة الرابط الآن.`,
          metadata: {
            bookingId: booking.id,
            action: 'ADD_MEETING_LINK',
          },
        });

        await this.prisma.bookings.update({
          where: { id: booking.id },
          data: { meetingLinkReminderSentAt: new Date() },
        });

        logger.log(
          `Sent meeting link reminder for booking ${booking.id} to teacher ${teacherUserId}`,
        );
        remindersSent++;
      } catch (error) {
        logger.error(
          `Failed to send meeting link reminder for booking ${booking.id}:`,
          error,
        );
      }
    }

    logger.log(`Successfully sent ${remindersSent} meeting link reminders`);
    return { remindersSent };
  }
}
