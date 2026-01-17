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

  constructor(private prisma: PrismaService) {}

  private logMetric(event: string, payload: Record<string, unknown>) {
    // Never log user-facing content; only safe metadata.
    this.logger.log(`[METRIC] ${event} ${JSON.stringify(payload)}`);
  }

  private sanitizeText(text: string): string {
    if (!text) return text;

    let result = text;

    // Redact emails
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    result = result.replace(emailRegex, '[redacted]');

    // Redact phone-like sequences (8-15 digits total after stripping separators)
    const phoneCandidateRegex = /(\+?\d[\d\s().-]{6,}\d)/g;
    result = result.replace(phoneCandidateRegex, (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 8 && digits.length <= 15) return '[redacted]';
      return match;
    });

    return result;
  }

  private sanitizeJson(value: any, depth: number = 0): any {
    if (value == null) return value;
    if (depth >= 4) return value;

    if (typeof value === 'string') return this.sanitizeText(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeJson(item, depth + 1));
    }

    if (typeof value === 'object') {
      const output: Record<string, any> = {};
      for (const [key, raw] of Object.entries(value)) {
        const loweredKey = key.toLowerCase();
        if (
          loweredKey.includes('email') ||
          loweredKey.includes('phone') ||
          loweredKey.includes('whatsapp')
        ) {
          continue;
        }
        output[key] = this.sanitizeJson(raw, depth + 1);
      }
      return output;
    }

    return value;
  }

  /**
   * Create an in-app notification with optional idempotency via dedupeKey.
   * If dedupeKey is provided and a duplicate exists, skip silently (log warning only).
   */
  async createInAppNotification(
    params: CreateNotificationParams,
  ): Promise<boolean> {
    const sanitizedTitle = this.sanitizeText(params.title);
    const sanitizedMessage = this.sanitizeText(params.message);
    const sanitizedMetadata =
      params.metadata !== undefined ? this.sanitizeJson(params.metadata) : undefined;

    if (sanitizedTitle !== params.title || sanitizedMessage !== params.message) {
      this.logger.warn(
        `PII redaction applied for notification type=${params.type} userId=${params.userId}`,
      );
    }

    try {
      await this.prisma.notifications.create({
        data: {
          userId: params.userId,
          title: sanitizedTitle,
          message: sanitizedMessage,
          type: params.type,
          link: params.link,
          metadata: sanitizedMetadata as Prisma.InputJsonValue,
          dedupeKey: params.dedupeKey,
          status: NotificationStatus.UNREAD,
        },
      });

      this.logMetric('notification.in_app.created', {
        type: params.type,
        hasDedupeKey: !!params.dedupeKey,
        hasLink: !!params.link,
      });
      return true;
    } catch (error: any) {
      // Handle unique constraint violation for dedupeKey
      if (error.code === 'P2002' && params.dedupeKey) {
        this.logger.warn(`Duplicate notification skipped: ${params.dedupeKey}`);
        this.logMetric('notification.in_app.duplicate_skipped', {
          type: params.type,
        });
        return false;
      }
      // For other errors, log and rethrow
      this.logger.error('Failed to create notification', error);
      this.logMetric('notification.in_app.failed', {
        type: params.type,
      });
      throw error;
    }
  }

  /**
   * Enqueue an email for async delivery via EmailOutbox.
   * NEVER sends email synchronously.
   */
  async enqueueEmail(params: SendEmailParams): Promise<void> {
    await this.prisma.email_outbox.create({
      data: {
        to: params.to,
        subject: this.sanitizeText(params.subject),
        templateId: params.templateId,
        payload: this.sanitizeJson(params.payload) as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`Email enqueued: ${params.templateId} to ${params.to}`);
    this.logMetric('notification.email.enqueued', {
      templateId: params.templateId,
    });
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
      this.prisma.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notifications.count({ where: { userId } }),
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
    const result = await this.prisma.notifications.updateMany({
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
    const result = await this.prisma.notifications.updateMany({
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
    return this.prisma.notifications.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  private async getLatestNotificationMeta(userId: string): Promise<{
    id: string;
    createdAt: Date;
  } | null> {
    return this.prisma.notifications.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
  }

  /**
   * Long-poll helper to detect newly created notifications without WebSockets/SSE.
   * Returns immediately if a notification exists with createdAt > `since`.
   */
  async waitForNewNotification(
    userId: string,
    since?: string,
    timeoutMs: number = 25_000,
  ): Promise<{
    changed: boolean;
    latestCreatedAt: string | null;
    notificationId: string | null;
  }> {
    const pollIntervalMs = 1000;

    const sinceDate = since ? new Date(since) : null;
    const effectiveSince =
      sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : new Date(0);

    const deadline = Date.now() + Math.max(0, timeoutMs);

    while (Date.now() < deadline) {
      const latest = await this.getLatestNotificationMeta(userId);

      if (latest && latest.createdAt.getTime() > effectiveSince.getTime()) {
        return {
          changed: true,
          latestCreatedAt: latest.createdAt.toISOString(),
          notificationId: latest.id,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    const latest = await this.getLatestNotificationMeta(userId);
    return {
      changed: false,
      latestCreatedAt: latest ? latest.createdAt.toISOString() : null,
      notificationId: null,
    };
  }

  // ========================================
  // Admin: Email Outbox Monitoring
  // ========================================

  async getEmailOutboxStats(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    oldestPendingAt: string | null;
    oldestFailedAt: string | null;
  }> {
    const [pending, processing, sent, failed, oldestPending, oldestFailed] =
      await Promise.all([
        this.prisma.email_outbox.count({ where: { status: 'PENDING' as any } }),
        this.prisma.email_outbox.count({
          where: { status: 'PROCESSING' as any },
        }),
        this.prisma.email_outbox.count({ where: { status: 'SENT' as any } }),
        this.prisma.email_outbox.count({ where: { status: 'FAILED' as any } }),
        this.prisma.email_outbox.findFirst({
          where: { status: 'PENDING' as any },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
        this.prisma.email_outbox.findFirst({
          where: { status: 'FAILED' as any },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      pending,
      processing,
      sent,
      failed,
      oldestPendingAt: oldestPending
        ? oldestPending.createdAt.toISOString()
        : null,
      oldestFailedAt: oldestFailed
        ? oldestFailed.createdAt.toISOString()
        : null,
    };
  }

  async getEmailOutbox(
    params: {
      status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = Math.max(1, params.page || 1);
    const take = Math.min(Math.max(1, params.limit || 20), 50);
    const skip = (page - 1) * take;

    const where = params.status ? { status: params.status as any } : {};

    const [items, total] = await Promise.all([
      this.prisma.email_outbox.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.email_outbox.count({ where }),
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

  async retryEmailOutbox(id: string): Promise<{ success: boolean }> {
    const result = await this.prisma.email_outbox.updateMany({
      where: { id, status: 'FAILED' as any },
      data: {
        status: 'PENDING' as any,
        nextRetryAt: null,
        errorMessage: null,
      },
    });

    return { success: result.count > 0 };
  }

  async getInAppNotificationStats(params?: {
    hours?: number;
  }): Promise<{
    windowHours: number;
    createdByType: { type: string; count: number }[];
    unreadCount: number;
    totalCount: number;
    latestCreatedAt: string | null;
  }> {
    const hours = Math.min(Math.max(params?.hours ?? 24, 1), 168); // 1h..7d
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [createdByType, unreadCount, totalCount, latest] =
      await Promise.all([
        this.prisma.notifications.groupBy({
          by: ['type'],
          where: { createdAt: { gte: since } },
          _count: { _all: true },
        }),
        this.prisma.notifications.count({
          where: { status: NotificationStatus.UNREAD as any },
        }),
        this.prisma.notifications.count(),
        this.prisma.notifications.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      windowHours: hours,
      createdByType: createdByType
        .map((row) => ({ type: String(row.type), count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      unreadCount,
      totalCount,
      latestCreatedAt: latest ? latest.createdAt.toISOString() : null,
    };
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

    const user = await this.prisma.users.findUnique({
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
    const user = await this.prisma.users.findUnique({
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
    const teacher = await this.prisma.users.findUnique({
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
