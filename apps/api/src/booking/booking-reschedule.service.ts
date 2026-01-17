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
import { AvailabilitySlotService } from '../teacher/availability-slot.service';
import { formatInTimezone } from '../common/utils/timezone.util';
import { BOOKING_POLICY } from './booking-policy.constants';
import { BookingErrorMessages } from './booking-error-messages';

@Injectable()
export class BookingRescheduleService {
  private readonly logger = new Logger(BookingRescheduleService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private availabilitySlotService: AvailabilitySlotService,
  ) {}

  /**
   * Student/Parent directly reschedules a package session.
   * Enforces: status=SCHEDULED, time window, max reschedules, availability.
   */
  async reschedulePackageSession(
    userId: string,
    userRole: string,
    bookingId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) {
    if (
      !(newStartTime instanceof Date) ||
      Number.isNaN(newStartTime.getTime())
    ) {
      throw new BadRequestException('Invalid new start time');
    }
    if (!(newEndTime instanceof Date) || Number.isNaN(newEndTime.getTime())) {
      throw new BadRequestException('Invalid new end time');
    }
    if (newEndTime <= newStartTime) {
      throw new BadRequestException(BookingErrorMessages.END_TIME_AFTER_START);
    }

    // Validate new times are in the future
    if (newStartTime < new Date()) {
      throw new BadRequestException('New start time must be in the future');
    }

    // 1. Fetch booking with package redemption
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        package_redemptions: true,
        teacher_profiles: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }

    // 2. Must be a package session
    if (!booking.package_redemptions) {
      throw new BadRequestException(
        'Only package sessions can use this endpoint',
      );
    }

    // 3. Authorization: Only bookedByUser or studentUser can reschedule
    if (booking.bookedByUserId !== userId && booking.studentUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to reschedule this session',
      );
    }

    // 4. Status enforcement: ONLY SCHEDULED allowed
    if (booking.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot reschedule: status is ${booking.status}. Only SCHEDULED sessions can be rescheduled.`,
      );
    }

    // 5. Time window check
    const hoursUntilSession =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSession < BOOKING_POLICY.studentRescheduleWindowHours) {
      throw new ForbiddenException(
        `Cannot reschedule within ${BOOKING_POLICY.studentRescheduleWindowHours} hours of session start`,
      );
    }

    // Guard: don't allow rescheduling too far in the future
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (newStartTime > maxFutureDate) {
      throw new BadRequestException(
        'Cannot reschedule more than 1 year in advance',
      );
    }

    // 6. Max reschedules check
    if (booking.rescheduleCount >= BOOKING_POLICY.studentMaxReschedules) {
      throw new ForbiddenException(
        `Maximum ${BOOKING_POLICY.studentMaxReschedules} reschedules allowed per session`,
      );
    }

    // Guard: duration should match original booking duration (± 1 minute)
    const originalDurationMs =
      new Date(booking.endTime).getTime() -
      new Date(booking.startTime).getTime();
    const newDurationMs = newEndTime.getTime() - newStartTime.getTime();
    const toleranceMs = 60_000;
    if (
      originalDurationMs > 0 &&
      Math.abs(originalDurationMs - newDurationMs) > toleranceMs
    ) {
      throw new BadRequestException(
        'Rescheduled session must have the same duration',
      );
    }

    // 7. Atomic Availability & Conflict Check
    const teacherId = booking.teacherId;
    const oldStartTime = booking.startTime;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${teacherId}))`;

      // 1b. Lock Booking Row
      const bookings = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "rescheduleCount", "startTime", "endTime" FROM "bookings" WHERE "id" = $1 FOR UPDATE`,
        bookingId,
      );
      if (bookings.length === 0)
        throw new NotFoundException('Booking disappeared');

      // 2. Lock & Check Slot exists for NEW time
      const slots = await tx.$queryRawUnsafe<any[]>(
        `SELECT id FROM "teacher_session_slots" 
         WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
         FOR UPDATE NOWAIT`,
        teacherId,
        newStartTime,
      );

      if (slots.length === 0) {
        throw new ConflictException('الموعد المطلوب غير متاح حالياً.');
      }

      // 3. Check Booking Conflict for NEW time
      const conflict = await tx.bookings.findFirst({
        where: {
          teacherId,
          id: { not: bookingId },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (conflict) {
        throw new ConflictException('يوجد تضارب مع حصة أخرى في نفس الموعد.');
      }

      // 4. Update Booking (Conditional)
      const updateResult = await tx.bookings.updateMany({
        where: {
          id: bookingId,
          status: 'SCHEDULED',
          rescheduleCount: booking.rescheduleCount,
        },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          rescheduleCount: { increment: 1 },
          lastRescheduledAt: new Date(),
          rescheduledByRole: userRole,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('فشل تغيير الموعد بسبب تحديث متزامن.');
      }

      // 5. Restore ORIGINAL Slot
      await this.availabilitySlotService.restoreSlot(
        tx,
        teacherId,
        oldStartTime,
      );

      // 6. Consume NEW Slot
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        teacherId,
        newStartTime,
        newEndTime,
      );

      // 7. Audit log
      await tx.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actorId: userId,
          action: 'RESCHEDULE' as any,
          targetId: bookingId,
          payload: {
            oldStartTime,
            newStartTime,
            newEndTime,
            actorRole: userRole,
            reason: 'Direct student/parent reschedule',
          },
        },
      });

      return {
        success: true,
        bookingId,
        oldStartTime,
        newStartTime,
        rescheduleCount: booking.rescheduleCount + 1,
      };
    });

    // 9. Notify teacher (Outside transaction)
    const formattedNewTime = formatInTimezone(
      newStartTime,
      booking.timezone || 'UTC',
      'EEEE، d MMMM yyyy - h:mm a',
    );
    const formattedOldTime = formatInTimezone(
      oldStartTime,
      booking.timezone || 'UTC',
      'EEEE، d MMMM yyyy - h:mm a',
    );

    await this.notificationService.notifyUser({
      userId: booking.teacherId,
      type: 'BOOKING_APPROVED', // Reuse existing type
      title: 'تم تغيير موعد حصة',
      message: `قام الطالب بتغيير موعد الحصة من ${formattedOldTime} إلى ${formattedNewTime}`,
      link: '/teacher/sessions',
      dedupeKey: `STUDENT_RESCHEDULED:${bookingId}:${booking.teacherId}`,
      metadata: {
        bookingId,
        oldStartTime,
        newStartTime,
        rescheduledBy: userRole,
      },
    });

    return result;
  }

  /**
   * Teacher submits a reschedule request (requires student approval).
   */
  async requestReschedule(
    teacherUserId: string,
    bookingId: string,
    reason: string,
    proposedStartTime?: Date,
    proposedEndTime?: Date,
  ) {
    // Validate reason provided
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'Reason is required for reschedule request',
      );
    }

    // 1. Fetch booking
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        package_redemptions: true,
        teacher_profiles: true,
        reschedule_requests: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }

    // 2. Must be a package session
    if (!booking.package_redemptions) {
      throw new BadRequestException(
        'Only package sessions can use this endpoint',
      );
    }

    // 3. Teacher authorization
    if (booking.teacher_profiles.userId !== teacherUserId) {
      throw new ForbiddenException('You are not the teacher for this session');
    }

    // 4. Status enforcement
    if (booking.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot request reschedule: status is ${booking.status}`,
      );
    }

    // 5. Time window check
    const hoursUntilSession =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (
      hoursUntilSession < BOOKING_POLICY.teacherRescheduleRequestWindowHours
    ) {
      throw new ForbiddenException(
        `Cannot request reschedule within ${BOOKING_POLICY.teacherRescheduleRequestWindowHours} hours of session start`,
      );
    }

    // 6. Max requests PER BOOKING check
    const pendingOrApprovedCount = booking.reschedule_requests.filter(
      (r) => r.status === 'PENDING' || r.status === 'APPROVED',
    ).length;
    if (pendingOrApprovedCount >= BOOKING_POLICY.teacherMaxRescheduleRequests) {
      throw new ForbiddenException(
        `Maximum ${BOOKING_POLICY.teacherMaxRescheduleRequests} reschedule requests per booking`,
      );
    }

    // 7. Atomic Availability Check & Request Creation
    const expiresAt = new Date(
      Date.now() + BOOKING_POLICY.studentResponseTimeoutHours * 60 * 60 * 1000,
    );

    const request = await this.prisma.$transaction(async (tx) => {
      if (proposedStartTime) {
        const eTime =
          proposedEndTime ||
          new Date(proposedStartTime.getTime() + 60 * 60 * 1000);

        // A. Advisory Lock
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${booking.teacherId}))`;

        // B. Check Slot
        const slot = await tx.teacher_session_slots.findUnique({
          where: {
            teacherId_startTimeUtc: {
              teacherId: booking.teacherId,
              startTimeUtc: proposedStartTime,
            },
          },
        });
        if (!slot) {
          throw new ConflictException(
            'الموعد المقترح غير متاح في جدول المعلم.',
          );
        }

        // C. Check Booking Conflicts
        const conflict = await tx.bookings.findFirst({
          where: {
            teacherId: booking.teacherId,
            id: { not: bookingId },
            startTime: { lt: eTime },
            endTime: { gt: proposedStartTime },
            status: {
              in: [
                'SCHEDULED',
                'PENDING_TEACHER_APPROVAL',
                'WAITING_FOR_PAYMENT',
                'PENDING_CONFIRMATION',
                'PAYMENT_REVIEW',
              ] as any,
            },
          },
        });
        if (conflict) {
          throw new ConflictException('الموعد المقترح متضارب مع حصة أخرى.');
        }
      }

      // 8. Create reschedule request
      return await tx.reschedule_requests.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          requestedById: teacherUserId,
          proposedStartTime,
          proposedEndTime,
          reason,
          status: 'PENDING',
          expiresAt,
        },
      });
    });

    // 8. Notify student/parent
    await this.notificationService.notifyUser({
      userId: booking.bookedByUserId,
      type: 'RESCHEDULE_REQUEST' as any,
      title: 'طلب تغيير موعد الجلسة',
      message: `طلب المعلم تغيير موعد الجلسة. السبب: ${reason}`,
    });

    this.logger.log(
      `📝 RESCHEDULE_REQUEST | bookingId=${bookingId} | teacher=${teacherUserId}`,
    );

    return {
      success: true,
      requestId: request.id,
      expiresAt,
    };
  }

  /**
   * Student/Parent approves a reschedule request.
   * Lazy expiration: Check if expired before processing.
   */
  async approveRescheduleRequest(
    userId: string,
    userRole: string,
    requestId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) {
    // 1. Fetch request with booking
    const request = await this.prisma.reschedule_requests.findUnique({
      where: { id: requestId },
      include: {
        bookings: {
          include: { package_redemptions: true, teacher_profiles: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Reschedule request not found');
    }

    // 2. Authorization: Only bookedByUser can approve
    if (
      request.bookings.bookedByUserId !== userId &&
      request.bookings.studentUserId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to approve this request',
      );
    }

    // 3. Lazy expiration check: If expired, mark as EXPIRED and reject
    if (new Date() > request.expiresAt && request.status === 'PENDING') {
      await this.prisma.reschedule_requests.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      throw new ForbiddenException('This reschedule request has expired');
    }

    // 4. Idempotency: If already approved, return success
    if (request.status === 'APPROVED') {
      return {
        success: true,
        message: 'Request already approved',
        idempotent: true,
      };
    }

    // 5. Must be PENDING
    if (request.status !== 'PENDING') {
      throw new ForbiddenException(
        `Cannot approve: request status is ${request.status}`,
      );
    }

    // 6. Booking must be SCHEDULED
    if (request.bookings.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot reschedule: booking status is ${request.bookings.status}`,
      );
    }

    // 7. Atomic Reschedule Execution
    const oldStartTime = request.bookings.startTime;
    const teacherId = request.bookings.teacherId;

    await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock (per teacher)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${teacherId}))`;

      // 1b. Lock Booking Row
      const bookings = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "rescheduleCount" FROM "bookings" WHERE "id" = $1 FOR UPDATE`,
        request.bookingId,
      );
      if (bookings.length === 0)
        throw new NotFoundException('Booking disappeared');

      // 1c. Lock & Check Slot exists for NEW time
      const slots = await tx.$queryRawUnsafe<any[]>(
        `SELECT id FROM "teacher_session_slots" 
         WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
         FOR UPDATE NOWAIT`,
        teacherId,
        newStartTime,
      );

      if (slots.length === 0) {
        throw new ConflictException(
          'الموعد الجديد غير متاح حالياً. يرجى اختيار وقت آخر.',
        );
      }

      // 2. Conflict Check (Source of Truth) for NEW time
      const conflict = await tx.bookings.findFirst({
        where: {
          teacherId,
          id: { not: request.bookingId },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (conflict) {
        throw new ConflictException(
          'الموعد الجديد غير متاح حالياً. يرجى اختيار وقت آخر.',
        );
      }

      // 3. Update Booking (Merged into main transaction)
      // Update booking (conditional)
      const updateResult = await tx.bookings.updateMany({
        where: {
          id: request.bookingId,
          status: 'SCHEDULED',
          rescheduleCount: request.bookings.rescheduleCount,
        },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          rescheduleCount: { increment: 1 },
          lastRescheduledAt: new Date(),
          rescheduledByRole: 'TEACHER', // Via approval
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Reschedule failed due to concurrent update',
        );
      }

      // Update request
      await tx.reschedule_requests.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          respondedAt: new Date(),
          respondedById: userId,
        },
      });

      // 5. Audit log
      await tx.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actorId: userId,
          action: 'RESCHEDULE' as any,
          targetId: request.bookingId,
          payload: {
            oldStartTime,
            newStartTime,
            newEndTime,
            actorRole: userRole,
            reason: request.reason,
            requestId,
          },
        },
      });

      // 6. Restore ORIGINAL Slot
      await this.availabilitySlotService.restoreSlot(
        tx,
        teacherId,
        oldStartTime,
      );

      // 7. Consume NEW Slot
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        teacherId,
        newStartTime,
        newEndTime,
      );
    });

    this.logger.log(
      `✅ RESCHEDULE_APPROVED | requestId=${requestId} | bookingId=${request.bookingId}`,
    );

    // 🔴 HIGH PRIORITY - Gap #1 Fix: Notify teacher that student approved reschedule
    const formattedNewTime = formatInTimezone(
      newStartTime,
      request.bookings.timezone || 'UTC',
      'EEEE، d MMMM yyyy - h:mm a',
    );

    await this.notificationService.notifyUser({
      userId: request.requestedById, // Teacher who requested reschedule
      type: 'BOOKING_APPROVED', // Reuse existing type
      title: 'تم الموافقة على طلب تغيير الموعد',
      message: `وافق الطالب على طلب تغيير موعد الحصة إلى ${formattedNewTime}`,
      link: '/teacher/sessions',
      dedupeKey: `RESCHEDULE_APPROVED:${request.bookingId}:${request.requestedById}`,
      metadata: {
        bookingId: request.bookingId,
        newStartTime,
        newEndTime,
      },
    });

    return {
      success: true,
      bookingId: request.bookingId,
      newStartTime,
      rescheduleCount: request.bookings.rescheduleCount + 1,
    };
  }

  /**
   * Student/Parent declines a reschedule request.
   * Booking remains unchanged. Teacher must attend original time.
   */
  async declineRescheduleRequest(
    userId: string,
    requestId: string,
    reason?: string,
  ) {
    // 1. Fetch request
    const request = await this.prisma.reschedule_requests.findUnique({
      where: { id: requestId },
      include: { bookings: true },
    });

    if (!request) {
      throw new NotFoundException('Reschedule request not found');
    }

    // 2. Authorization
    if (
      request.bookings.bookedByUserId !== userId &&
      request.bookings.studentUserId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to decline this request',
      );
    }

    // 3. Idempotency: If already declined/expired, return success
    if (request.status === 'DECLINED' || request.status === 'EXPIRED') {
      return {
        success: true,
        message: 'Request already declined',
        idempotent: true,
      };
    }

    // 4. Must be PENDING
    if (request.status !== 'PENDING') {
      throw new ForbiddenException(
        `Cannot decline: request status is ${request.status}`,
      );
    }

    // 5. Update request
    await this.prisma.reschedule_requests.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        respondedById: userId,
      },
    });

    // 6. Notify teacher
    await this.notificationService.notifyUser({
      userId: request.requestedById,
      type: 'RESCHEDULE_DECLINED' as any,
      title: 'تم رفض طلب تغيير الموعد',
      message: 'تم رفض طلب تغيير موعد الجلسة. يرجى الحضور في الموعد الأصلي.',
    });

    this.logger.log(`❌ RESCHEDULE_DECLINED | requestId=${requestId}`);

    return { success: true, bookingId: request.bookingId };
  }

  /**
   * Admin-forced reschedule.
   * Checks availability but bypasses policy windows.
   */
  async adminReschedule(bookingId: string, newStartTime: Date) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        users_bookings_studentUserIdTousers: true,
        children: true,
      },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

    const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    // 3. Execute in Transaction with Advisory Lock
    const oldStartTime = booking.startTime;
    const teacherId = booking.teacherId;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock (per teacher)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${teacherId}))`;

      // 1b. Lock Booking Row
      const bookings = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "rescheduleCount" FROM "bookings" WHERE "id" = $1 FOR UPDATE`,
        bookingId,
      );
      if (bookings.length === 0)
        throw new NotFoundException('Booking disappeared');

      // 1c. Lock & Check Slot exists for NEW time
      const slots = await tx.$queryRawUnsafe<any[]>(
        `SELECT id FROM "teacher_session_slots" 
         WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
         FOR UPDATE NOWAIT`,
        teacherId,
        newStartTime,
      );

      if (slots.length === 0) {
        throw new BadRequestException('الموعد الجديد غير متاح في جدول المعلم.');
      }

      // 2. Conflict Check (Source of Truth)
      const conflict = await tx.bookings.findFirst({
        where: {
          teacherId,
          id: { not: bookingId },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (conflict) {
        throw new BadRequestException(
          'الموعد الجديد غير متاح بسبب تضارب مع حصة أخرى.',
        );
      }

      // 3. Update Booking
      const res = await tx.bookings.update({
        where: { id: bookingId },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          lastRescheduledAt: new Date(),
          rescheduledByRole: 'ADMIN',
          rescheduleCount: { increment: 1 },
          status: 'SCHEDULED', // Force to SCHEDULED
        },
      });

      // 4. Restore ORIGINAL Slot
      await this.availabilitySlotService.restoreSlot(
        tx,
        teacherId,
        oldStartTime,
      );

      // 5. Consume NEW Slot
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        teacherId,
        newStartTime,
        newEndTime,
      );

      return res;
    });

    // 4. Notifications
    const dateStr = formatInTimezone(
      newStartTime,
      booking.teacher_profiles.timezone,
      'yyyy-MM-dd HH:mm',
    );

    // Notify Teacher
    await this.notificationService.notifyUser({
      userId: booking.teacher_profiles.userId,
      title: 'تم تغيير موعد الحصة بواسطة الإدارة',
      message: `تم تغيير موعد الحصة مع ${booking.users_bookings_studentUserIdTousers?.firstName || booking.children?.name || 'الطالب'} إلى ${dateStr}`,
      type: 'BOOKING_RESCHEDULED',
    });

    // Notify Student/Parent
    await this.notificationService.notifyUser({
      userId: booking.bookedByUserId,
      title: 'تم تغيير موعد الحصة بواسطة الإدارة',
      message: `تم تغيير موعد الحصة مع المعلم ${booking.teacher_profiles.displayName} إلى ${dateStr}`,
      type: 'BOOKING_RESCHEDULED',
    });

    return updated;
  }
}
