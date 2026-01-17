import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BookingErrorMessages } from './booking-error-messages';
import { BookingStatusValidatorService } from './booking-status-validator.service';
import { SystemSettingsService } from '../admin/system-settings.service';
import { BookingConstants } from './booking.constants';
import { AvailabilitySlotService } from '../teacher/availability-slot.service';
import { BookingPaymentService } from './booking-payment.service';
import { DemoService } from '../package/demo.service';
import { normalizeMoney } from '../utils/money';

@Injectable()
export class BookingCancellationService {
  private readonly logger = new Logger(BookingCancellationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private systemSettingsService: SystemSettingsService,
    private bookingStatusValidator: BookingStatusValidatorService,
    private availabilitySlotService: AvailabilitySlotService,
    private bookingPaymentService: BookingPaymentService,
    private demoService: DemoService,
  ) {}

  async getCancellationEstimate(
    userId: string,
    userRole: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }

    const canCancel = this.canUserCancel(booking, userId, userRole);
    if (!canCancel.allowed) {
      return {
        canCancel: false,
        reason: canCancel.reason,
        refundPercent: 0,
        refundAmount: 0,
        teacherCompAmount: 0,
      };
    }

    if (
      ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'].includes(
        booking.status,
      )
    ) {
      return {
        canCancel: true,
        refundPercent: 100,
        refundAmount: 0,
        teacherCompAmount: 0,
        policy: null,
        hoursRemaining: null,
        message: 'لم يتم الدفع بعد - الإلغاء مجاني',
      };
    }

    const policy = booking.teacher_profiles.cancellationPolicy;
    const paidAmount = Number(booking.price);
    const refund = this.calculateRefund(booking, policy, userRole);

    const hoursRemaining = Math.max(
      0,
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60),
    );

    return {
      canCancel: true,
      refundPercent: refund.percent,
      refundAmount: refund.amount,
      teacherCompAmount: paidAmount - refund.amount,
      policy,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      message: refund.message,
    };
  }

  async cancelBooking(
    userId: string,
    userRole: string,
    bookingId: string,
    reason?: string,
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId },
          include: { teacher_profiles: { include: { users: true } } },
        });

        if (!booking) {
          throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
        }

        if (booking.status.startsWith('CANCELLED')) {
          return {
            updatedBooking: booking,
            recipientId: null,
            cancelledByRole: null,
          };
        }

        const canCancel = this.canUserCancel(booking, userId, userRole);
        if (!canCancel.allowed) {
          throw new BadRequestException(canCancel.reason);
        }

        let cancelledBy: string;
        let newStatus: string;
        let refundPercent = 100;
        let refundAmount = 0;
        let teacherCompAmount = 0;
        let platformRevenue = 0;

        if (userRole === 'TEACHER') {
          cancelledBy = 'TEACHER';
          newStatus = 'CANCELLED_BY_TEACHER';
          refundPercent = 100;
        } else if (userRole === 'ADMIN') {
          cancelledBy = 'ADMIN';
          newStatus = 'CANCELLED_BY_ADMIN';
          refundPercent = 100;
        } else {
          cancelledBy = 'PARENT';
          newStatus = 'CANCELLED_BY_PARENT';

          if (booking.status === 'SCHEDULED') {
            const policy = booking.teacher_profiles.cancellationPolicy;
            const systemSettings =
              await this.systemSettingsService.getSettings();
            const config = systemSettings.cancellationPolicies;
            const refund = this.calculateRefund(
              booking,
              policy,
              userRole,
              config,
            );
            refundPercent = refund.percent;
          }
        }

        this.bookingStatusValidator.validateTransition(
          booking.status,
          newStatus,
        );

        const paidAmount = Number(booking.price);
        if (booking.status === 'SCHEDULED' && paidAmount > 0) {
          refundAmount = (paidAmount * refundPercent) / 100;

          const retainedAmount = paidAmount - refundAmount;
          if (retainedAmount > 0) {
            const systemSettings =
              await this.systemSettingsService.getSettings();
            const commissionRate =
              systemSettings.defaultCommissionRate ||
              BookingConstants.DEFAULT_COMMISSION_RATE;
            platformRevenue = retainedAmount * commissionRate;
            teacherCompAmount = retainedAmount - platformRevenue;
          } else {
            teacherCompAmount = 0;
          }

          await this.bookingPaymentService.settleCancellation(
            booking.bookedByUserId,
            booking.teacher_profiles.users.id,
            bookingId,
            paidAmount,
            refundAmount,
            teacherCompAmount,
            platformRevenue,
            tx,
          );
        }

        const currentTokenVersion = (booking as any).jitsiTokenVersion || 1;

        const updateResult = await tx.bookings.updateMany({
          where: { id: bookingId, status: booking.status },
          data: {
            status: newStatus as any,
            cancelReason: reason || 'ملغى بواسطة المستخدم',
            cancelledAt: new Date(),
            cancelledBy,
            refundPercent,
            refundAmount,
            teacherCompAmount,
            cancellationPolicySnapshot:
              booking.status === 'SCHEDULED'
                ? booking.teacher_profiles.cancellationPolicy
                : null,
            jitsiTokenVersion: currentTokenVersion + 1,
          },
        });
        if (updateResult.count === 0) {
          throw new ConflictException(
            'Booking status changed by another operation',
          );
        }

        const updatedBooking = await tx.bookings.findUnique({
          where: { id: bookingId },
        });
        if (!updatedBooking) {
          throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
        }

        await this.availabilitySlotService.restoreSlot(
          tx,
          booking.teacherId,
          booking.startTime,
        );

        await tx.package_redemptions.updateMany({
          where: {
            bookingId,
            status: 'RESERVED',
          },
          data: { status: 'CANCELLED' },
        });

        const isDemo = normalizeMoney(booking.price) === 0;
        if (isDemo && booking.bookedByUserId && booking.teacherId) {
          try {
            await this.demoService.cancelDemoRecordInTransaction(
              booking.bookedByUserId,
              booking.teacherId,
              tx,
            );
            this.logger.log(`Demo record cancelled for booking ${bookingId}`);
          } catch (err) {
            this.logger.warn(
              `Failed to cancel demo record for booking ${bookingId}: ${err}`,
            );
          }
        }

        return {
          updatedBooking,
          recipientId:
            userRole === 'TEACHER'
              ? booking.bookedByUserId
              : booking.teacher_profiles.users.id,
          cancelledByRole: userRole,
        };
      },
      { isolationLevel: 'Serializable' },
    );

    if (
      result.recipientId &&
      result.cancelledByRole &&
      result.cancelledByRole !== 'ADMIN'
    ) {
      const recipientLink =
        result.cancelledByRole === 'TEACHER'
          ? '/parent/bookings'
          : '/teacher/sessions';

      await this.notificationService.notifyUser({
        userId: result.recipientId,
        title: 'تم إلغاء الحجز',
        message: reason || 'تم إلغاء الحجز.',
        type: 'BOOKING_CANCELLED',
        link: recipientLink,
        dedupeKey: `BOOKING_CANCELLED:${bookingId}:${result.recipientId}`,
        metadata: { bookingId },
      });
    }

    return result.updatedBooking;
  }

  private canUserCancel(
    booking: any,
    userId: string,
    userRole: string,
  ): { allowed: boolean; reason?: string } {
    const cancellableStatuses = [
      'PENDING_TEACHER_APPROVAL',
      'WAITING_FOR_PAYMENT',
      'SCHEDULED',
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      return {
        allowed: false,
        reason: 'لا يمكن إلغاء هذا الحجز في حالته الحالية',
      };
    }

    if (
      booking.status === 'SCHEDULED' &&
      new Date(booking.startTime) <= new Date()
    ) {
      return { allowed: false, reason: 'لا يمكن الإلغاء بعد بدء الجلسة' };
    }

    if (userRole === 'ADMIN') {
      return { allowed: true };
    }

    if (userRole === 'TEACHER') {
      if (booking.teacher_profiles.userId !== userId) {
        return { allowed: false, reason: 'هذا الحجز ليس لديك' };
      }
      return { allowed: true };
    }

    if (booking.bookedByUserId !== userId) {
      return { allowed: false, reason: 'هذا الحجز ليس لديك' };
    }

    return { allowed: true };
  }

  private calculateRefund(
    booking: any,
    policy: string,
    userRole: string,
    config?: any,
  ): { percent: number; amount: number; message: string } {
    const paidAmount = Number(booking.price);

    const defaults = {
      flexible: { cutoffHours: 12 },
      moderate: { cutoffHours: 24 },
      strict: { cutoffHours: 48 },
    };

    const flexibleConfig = config?.flexible || defaults.flexible;
    const moderateConfig = config?.moderate || defaults.moderate;
    const strictConfig = config?.strict || defaults.strict;

    if (userRole === 'TEACHER') {
      return {
        percent: 100,
        amount: paidAmount,
        message: 'إلغاء المعلم - استرداد كامل',
      };
    }

    const createdAt = new Date(booking.createdAt);
    const hoursSinceCreation =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 1) {
      return {
        percent: 100,
        amount: paidAmount,
        message: 'ضمن فترة السماح - استرداد كامل',
      };
    }

    const startTime = new Date(booking.startTime);
    const hoursUntilSession =
      (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    let cutoff: number;
    switch (policy) {
      case 'FLEXIBLE':
        cutoff = flexibleConfig.cutoffHours || 12;
        break;
      case 'MODERATE':
        cutoff = moderateConfig.cutoffHours || 24;
        break;
      case 'STRICT':
        cutoff = strictConfig.cutoffHours || 48;
        break;
      default:
        cutoff = 24;
    }

    if (hoursUntilSession > cutoff) {
      return {
        percent: 100,
        amount: paidAmount,
        message: `قبل ${cutoff} ساعة - استرداد كامل`,
      };
    }

    return {
      percent: 0,
      amount: 0,
      message: `بعد تجاوز مهلة الإلغاء (${cutoff} ساعة) - لا استرداد`,
    };
  }
}
