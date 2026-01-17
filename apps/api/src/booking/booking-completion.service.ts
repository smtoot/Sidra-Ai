import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { PackageService } from '../package/package.service';
import { DemoService } from '../package/demo.service';
import { normalizeMoney } from '../utils/money';
import { BookingErrorMessages } from './booking-error-messages';
import { BookingConstants } from './booking.constants';
import { BookingStatusValidatorService } from './booking-status-validator.service';
import { BookingPaymentService } from './booking-payment.service';
import { BookingSystemSettingsService } from './booking-system-settings.service';

@Injectable()
export class BookingCompletionService {
  private readonly logger = new Logger(BookingCompletionService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private packageService: PackageService,
    private demoService: DemoService,
    private bookingStatusValidator: BookingStatusValidatorService,
    private bookingPaymentService: BookingPaymentService,
    private bookingSystemSettingsService: BookingSystemSettingsService,
  ) {}

  private getSafeDisplayName(user: any, fallback: string) {
    if (!user) return fallback;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.displayName || fallback;
  }

  /**
   * Mark session as completed (SCHEDULED → COMPLETED)
   * Releases funds to teacher (minus commission)
   */
  async markCompleted(bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        users_bookings_bookedByUserIdTousers: true,
        teacher_profiles: { include: { users: true } },
      },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    if (booking.status !== 'SCHEDULED') {
      throw new BadRequestException(BookingErrorMessages.BOOKING_NOT_SCHEDULED);
    }
    this.bookingStatusValidator.validateTransition(booking.status, 'COMPLETED');

    await this.bookingPaymentService.releaseFundsOnCompletion(
      booking.users_bookings_bookedByUserIdTousers.id,
      booking.teacher_profiles.users.id,
      bookingId,
      Number(booking.price),
      Number(booking.commissionRate),
    );

    return this.prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });
  }

  async completeSession(teacherUserId: string, bookingId: string, dto?: any) {
    if (dto !== undefined && (dto === null || typeof dto !== 'object')) {
      throw new BadRequestException(BookingErrorMessages.INVALID_REQUEST_BODY);
    }

    if (dto?.topicsCovered && String(dto.topicsCovered).length > 2000) {
      throw new BadRequestException(
        'Topics covered must be less than 2000 characters',
      );
    }
    if (
      dto?.studentPerformanceNotes &&
      String(dto.studentPerformanceNotes).length > 2000
    ) {
      throw new BadRequestException(
        'Student performance notes must be less than 2000 characters',
      );
    }
    if (
      dto?.homeworkDescription &&
      String(dto.homeworkDescription).length > 2000
    ) {
      throw new BadRequestException(
        'Homework description must be less than 2000 characters',
      );
    }
    if (
      dto?.nextSessionRecommendations &&
      String(dto.nextSessionRecommendations).length > 2000
    ) {
      throw new BadRequestException(
        'Next session recommendations must be less than 2000 characters',
      );
    }
    if (dto?.additionalNotes && String(dto.additionalNotes).length > 2000) {
      throw new BadRequestException(
        'Additional notes must be less than 2000 characters',
      );
    }
    if (dto?.teacherSummary && String(dto.teacherSummary).length > 5000) {
      throw new BadRequestException(
        'Teacher summary must be less than 5000 characters',
      );
    }
    if (
      dto?.studentPerformanceRating !== undefined &&
      dto.studentPerformanceRating !== null
    ) {
      const rating = Number(dto.studentPerformanceRating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        throw new BadRequestException(
          'Performance rating must be between 1 and 5',
        );
      }
    }

    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        disputes: true,
      },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles || booking.teacherId !== teacher_profiles.id) {
      throw new BadRequestException('Not authorized to complete this session');
    }

    this.bookingStatusValidator.validateTransition(
      booking.status,
      'PENDING_CONFIRMATION',
    );

    const now = new Date();
    const sessionStartTime = new Date(booking.startTime);
    const sessionEndTime = new Date(booking.endTime);

    if (now < sessionStartTime) {
      const minutesUntilStart = Math.ceil(
        (sessionStartTime.getTime() - now.getTime()) / 60000,
      );
      throw new BadRequestException(
        `Cannot complete session before it starts. Session begins in ${minutesUntilStart} minutes.`,
      );
    }

    if (now < sessionEndTime) {
      const minutesEarly = Math.ceil(
        (sessionEndTime.getTime() - now.getTime()) / 60000,
      );
      this.logger.log(
        `Session ${bookingId} completed ${minutesEarly} minutes before scheduled end time`,
      );
    }

    const hoursSinceEnd =
      (now.getTime() - sessionEndTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEnd > BookingConstants.MAX_COMPLETION_GRACE_HOURS) {
      throw new BadRequestException(
        `Cannot complete session more than ${BookingConstants.MAX_COMPLETION_GRACE_HOURS} hours after end time`,
      );
    }

    const settings =
      await this.bookingSystemSettingsService.getSystemSettings();
    const disputeWindowClosesAt = new Date(
      now.getTime() + settings.disputeWindowHours * 60 * 60 * 1000,
    );

    let teacherSummary = dto?.teacherSummary;
    if (!teacherSummary && dto) {
      const parts: string[] = [];
      if (dto.topicsCovered) parts.push(`المواضيع: ${dto.topicsCovered}`);
      if (dto.studentPerformanceNotes)
        parts.push(`الأداء: ${dto.studentPerformanceNotes}`);
      if (dto.homeworkAssigned && dto.homeworkDescription)
        parts.push(`الواجب: ${dto.homeworkDescription}`);
      if (dto.nextSessionRecommendations)
        parts.push(`التوصيات: ${dto.nextSessionRecommendations}`);
      if (parts.length > 0) teacherSummary = parts.join(' | ');
    }

    const updatedBooking = await this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: 'PENDING_CONFIRMATION',
        disputeWindowOpensAt: now,
        disputeWindowClosesAt,
        teacherCompletedAt: now,
        autoReleaseAt: disputeWindowClosesAt,
        topicsCovered: dto?.topicsCovered,
        studentPerformanceRating: dto?.studentPerformanceRating,
        studentPerformanceNotes: dto?.studentPerformanceNotes,
        homeworkAssigned: dto?.homeworkAssigned,
        homeworkDescription: dto?.homeworkDescription,
        nextSessionRecommendations: dto?.nextSessionRecommendations,
        additionalNotes: dto?.additionalNotes,
        teacherSummary,
      },
    });

    await this.notificationService.notifySessionComplete({
      bookingId: booking.id,
      parentUserId: booking.bookedByUserId,
      teacherName: this.getSafeDisplayName(
        booking.teacher_profiles.users,
        'المعلم',
      ),
      disputeDeadline: disputeWindowClosesAt,
    });

    return updatedBooking;
  }

  /**
   * Parent/Student confirms session early (before auto-release)
   */
  async confirmSessionEarly(
    userId: string,
    bookingId: string,
    rating?: number,
    userRole: string = 'STUDENT',
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId },
          include: {
            users_bookings_bookedByUserIdTousers: true,
            teacher_profiles: { include: { users: true } },
            package_redemptions: true,
          },
        });

        if (!booking)
          throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

        if (userRole !== 'ADMIN' && booking.bookedByUserId !== userId) {
          throw new ForbiddenException(
            'Not authorized to confirm this session',
          );
        }

        if (booking.status === 'COMPLETED') {
          return {
            updatedBooking: booking,
            bookingContext: booking,
            alreadyCompleted: true,
          };
        }

        this.bookingStatusValidator.validateTransition(
          booking.status,
          'COMPLETED',
        );

        if (
          booking.disputeWindowClosesAt &&
          new Date() > booking.disputeWindowClosesAt
        ) {
          throw new BadRequestException(
            'Dispute window has expired - payment already auto-released',
          );
        }

        const now = new Date();

        const updatedBooking = await tx.bookings.update({
          where: {
            id: bookingId,
            status: 'PENDING_CONFIRMATION',
          },
          data: {
            status: 'COMPLETED',
            studentConfirmedAt: now,
            paymentReleasedAt: now,
          },
        });

        if (booking.package_redemptions) {
          const idempotencyKey = `RELEASE_${bookingId}`;
          await this.packageService.releaseSession(
            bookingId,
            idempotencyKey,
            tx,
          );
        } else {
          const price = normalizeMoney(booking.price);
          const commissionRate = Number(booking.commissionRate);

          await this.bookingPaymentService.releaseFundsOnCompletion(
            booking.bookedByUserId,
            booking.teacher_profiles.userId,
            booking.id,
            price,
            commissionRate,
            tx,
          );
        }

        return {
          updatedBooking,
          bookingContext: booking,
          alreadyCompleted: false,
        };
      },
      { isolationLevel: 'Serializable' },
    );

    if (result.alreadyCompleted) {
      return result.updatedBooking;
    }

    const { updatedBooking, bookingContext } = result;

    const isDemo = normalizeMoney(bookingContext.price) === 0;
    if (isDemo && bookingContext.bookedByUserId) {
      try {
        await this.demoService.markDemoCompleted(
          bookingContext.bookedByUserId,
          bookingContext.teacherId,
        );
        this.logger.log(
          `Demo marked complete for owner ${bookingContext.bookedByUserId}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to mark demo complete for booking ${bookingId}`,
          err,
        );
      }
    }

    const teacherEarnings = normalizeMoney(
      normalizeMoney(bookingContext.price) *
        (1 - Number(bookingContext.commissionRate)),
    );
    await this.notificationService.notifyTeacherPaymentReleased({
      bookingId: updatedBooking.id,
      teacherId: bookingContext.teacher_profiles.users.id,
      amount: teacherEarnings,
      releaseType: 'CONFIRMED',
    });

    return updatedBooking;
  }

  async raiseDispute(
    userId: string,
    bookingId: string,
    dto: { type: string; description: string; evidence?: string[] },
  ) {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException(BookingErrorMessages.INVALID_REQUEST_BODY);
    }
    if (!dto.type || typeof dto.type !== 'string') {
      throw new BadRequestException('Invalid dispute type');
    }
    if (!dto.description || typeof dto.description !== 'string') {
      throw new BadRequestException('Description is required');
    }

    const description = dto.description.trim();
    if (description.length === 0) {
      throw new BadRequestException('Description is required');
    }
    if (description.length > 5000) {
      throw new BadRequestException(
        'Description must be less than 5000 characters',
      );
    }

    const evidence =
      Array.isArray(dto.evidence) && dto.evidence.length > 0
        ? dto.evidence
            .filter((e) => typeof e === 'string')
            .map((e) => e.trim())
            .filter(Boolean)
        : [];
    if (evidence.length > 10) {
      throw new BadRequestException('Maximum 10 evidence items allowed');
    }

    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        users_bookings_bookedByUserIdTousers: true,
        disputes: true,
      },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

    if (booking.bookedByUserId !== userId) {
      throw new ForbiddenException(
        'Not authorized to raise dispute for this session',
      );
    }

    if (!['PENDING_CONFIRMATION', 'SCHEDULED'].includes(booking.status)) {
      throw new BadRequestException('Cannot dispute this session');
    }
    this.bookingStatusValidator.validateTransition(booking.status, 'DISPUTED');

    if (booking.disputes) {
      throw new BadRequestException(
        'A dispute already exists for this session',
      );
    }

    const validTypes = [
      'TEACHER_NO_SHOW',
      'SESSION_TOO_SHORT',
      'QUALITY_ISSUE',
      'TECHNICAL_ISSUE',
      'OTHER',
    ];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException('Invalid dispute type');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const dispute = await tx.disputes.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          raisedByUserId: userId,
          type: dto.type as any,
          description,
          evidence,
          status: 'PENDING',
        },
      });

      const updatedBooking = await tx.bookings.update({
        where: { id: bookingId },
        data: { status: 'DISPUTED' },
      });

      return { bookings: updatedBooking, dispute };
    });

    const adminUsers = await this.prisma.users.findMany({
      where: { role: 'ADMIN', isActive: true },
    });

    for (const admin of adminUsers) {
      await this.notificationService.notifyUser({
        userId: admin.id,
        title: 'نزاع جديد',
        message: `تم رفع نزاع جديد على حجز رقم ${bookingId.slice(0, 8)}...`,
        type: 'DISPUTE_RAISED',
      });
    }

    return result;
  }
}
