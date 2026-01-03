import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Use string literals for new enums until Prisma client is regenerated in API workspace
type NotificationType =
  | 'BOOKING_REQUEST'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED' // FIX: Added missing type
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_RELEASED'
  | 'ESCROW_REMINDER'
  | 'DEPOSIT_APPROVED'
  | 'DEPOSIT_REJECTED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_UPDATE'
  | 'SYSTEM_ALERT'
  | 'URGENT' // FIX: Added missing type
  | 'ADMIN_ALERT' // FIX: Added missing type
  | 'SESSION_REMINDER' // Phase 1: Session start reminders (1 hour before)
  | 'ACCOUNT_UPDATE'; // Phase 1: Teacher application status, profile changes

const NotificationStatus = {
  READ: 'READ',
  UNREAD: 'UNREAD',
  ARCHIVED: 'ARCHIVED',
} as const;

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: any;
  dedupeKey?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  templateId: string;
  payload: any;
}

interface NotifyUserParams extends CreateNotificationParams {
  email?: SendEmailParams;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Create an in-app notification with optional idempotency via dedupeKey.
   * If dedupeKey is provided and a duplicate exists, skip silently (log warning only).
   */
  async createInAppNotification(
    params: CreateNotificationParams,
  ): Promise<boolean> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          link: params.link,
          metadata: params.metadata as Prisma.InputJsonValue,
          dedupeKey: params.dedupeKey,
          status: NotificationStatus.UNREAD,
        },
      });
      return true;
    } catch (error: any) {
      // Handle unique constraint violation for dedupeKey
      if (error.code === 'P2002' && params.dedupeKey) {
        this.logger.warn(`Duplicate notification skipped: ${params.dedupeKey}`);
        return false;
      }
      // For other errors, log and rethrow
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Enqueue an email for async delivery via EmailOutbox.
   * NEVER sends email synchronously.
   */
  async enqueueEmail(params: SendEmailParams): Promise<void> {
    await this.prisma.emailOutbox.create({
      data: {
        to: params.to,
        subject: params.subject,
        templateId: params.templateId,
        payload: params.payload as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`Email enqueued: ${params.templateId} to ${params.to}`);
  }

  /**
   * Orchestrator: Create in-app notification and optionally enqueue email.
   * PHONE-FIRST: Email is optional and never blocks the notification.
   * If user has no email or email fails to enqueue, we log but continue.
   */
  async notifyUser(params: NotifyUserParams): Promise<void> {
    // MANDATORY: Always create in-app notification (phone-first)
    await this.createInAppNotification({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      metadata: params.metadata,
      dedupeKey: params.dedupeKey,
    });

    // OPTIONAL: Enqueue email if provided and has valid recipient
    if (params.email?.to) {
      try {
        await this.enqueueEmail(params.email);
      } catch (error: any) {
        // Email is secondary - log error but don't fail
        this.logger.error(
          `Failed to enqueue email for user ${params.userId}: ${error.message}`,
          error.stack,
        );
      }
    } else if (params.email) {
      this.logger.warn(
        `Email params provided but missing 'to' field for user ${params.userId}`,
      );
    }
  }

  /**
   * Get paginated notifications for a user.
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const take = Math.min(limit, 50); // Max page size = 50
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit: take,
        pages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Mark a single notification as read.
   * Validates ownership.
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return result.count > 0;
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get unread notification count for a user.
   * Optimized query using index.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  // ========================================
  // Dispute Window Notification Methods
  // ========================================

  async notifySessionComplete(params: {
    bookingId: string;
    parentUserId: string;
    teacherName: string;
    disputeDeadline: Date;
  }): Promise<void> {
    const { bookingId, parentUserId, teacherName, disputeDeadline } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: parentUserId },
      select: { email: true, phoneNumber: true },
    });

    await this.notifyUser({
      userId: parentUserId,
      title: 'جلسة مكتملة - Session Completed',
      message: `أكمل المعلم الجلسة. لديك 48 ساعة للمراجعة أو فتح نزاع إذا لزم الأمر.`,
      type: 'BOOKING_APPROVED',
      link: `/bookings/${bookingId}`,
      metadata: { bookingId, disputeDeadline },
      email: user?.email
        ? {
          to: user.email,
          subject: 'Session Completed - Review Within 48 Hours',
          templateId: 'session-completed',
          payload: {
            teacherName,
            bookingUrl: `${process.env.FRONTEND_URL || ''}/bookings/${bookingId}`,
          },
        }
        : undefined,
    });
  }

  async notifyDisputeWindowReminder(params: {
    bookingId: string;
    parentUserId: string;
    hoursRemaining: number;
    teacherName: string;
  }): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.parentUserId },
      select: { email: true },
    });

    await this.notifyUser({
      userId: params.parentUserId,
      title: `تذكير: ${params.hoursRemaining} ساعة متبقية`,
      message: `لديك ${params.hoursRemaining} ساعة لمراجعة الجلسة أو فتح نزاع.`,
      type: 'ESCROW_REMINDER',
      link: `/bookings/${params.bookingId}`,
      metadata: {
        bookingId: params.bookingId,
        hoursRemaining: params.hoursRemaining,
      },
      email: user?.email
        ? {
          to: user.email,
          subject: `Reminder: ${params.hoursRemaining} Hours to Review Session`,
          templateId: 'dispute-window-reminder',
          payload: {
            hoursRemaining: params.hoursRemaining,
            teacherName: params.teacherName,
          },
        }
        : undefined,
    });
  }

  async notifyTeacherPaymentReleased(params: {
    bookingId: string;
    teacherId: string;
    amount: number;
    releaseType: 'AUTO' | 'CONFIRMED';
  }): Promise<void> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: params.teacherId },
      select: { email: true, phoneNumber: true },
    });

    if (!teacher) return;

    const releaseTypeArabic =
      params.releaseType === 'AUTO' ? 'تلقائي' : 'تأكيد الطالب';

    await this.notifyUser({
      userId: params.teacherId,
      title: '💰 تم إطلاق الدفع - Payment Released',
      message: `تم إطلاق دفع ${params.amount} ريال إلى محفظتك (${releaseTypeArabic})`,
      type: 'PAYMENT_RELEASED',
      link: '/teacher/wallet',
      metadata: {
        bookingId: params.bookingId,
        amount: params.amount,
        releaseType: params.releaseType,
      },
      email: teacher.email
        ? {
          to: teacher.email,
          subject: 'Payment Released to Your Wallet',
          templateId: 'teacher-payment-released',
          payload: {
            amount: params.amount,
            releaseType:
              params.releaseType === 'AUTO'
                ? 'Automatic'
                : 'Student Confirmation',
          },
        }
        : undefined,
    });
  }
}
