// Set env for encryption util before imports
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

import { Test, type TestingModule } from '@nestjs/testing';
import { BookingService } from '../src/booking/booking.service';
import { BookingCancellationService } from '../src/booking/booking-cancellation.service';
import { BookingCompletionService } from '../src/booking/booking-completion.service';
import { BookingCreationService } from '../src/booking/booking-creation.service';
import { BookingPaymentService } from '../src/booking/booking-payment.service';
import { BookingRescheduleService } from '../src/booking/booking-reschedule.service';
import { BookingStatusValidatorService } from '../src/booking/booking-status-validator.service';
import { BookingSystemSettingsService } from '../src/booking/booking-system-settings.service';
import { BookingQueryService } from '../src/booking/booking-query.service';
import { BookingUpdateService } from '../src/booking/booking-update.service';
import { BookingRatingService } from '../src/booking/booking-rating.service';
import { BookingMeetingService } from '../src/booking/booking-meeting.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { WalletService } from '../src/wallet/wallet.service';
import { NotificationService } from '../src/notification/notification.service';
import { PackageService } from '../src/package/package.service';
import { DemoService } from '../src/package/demo.service';
import { ReadableIdService } from '../src/common/readable-id/readable-id.service';
import { TeacherService } from '../src/teacher/teacher.service';
import { SystemSettingsService } from '../src/admin/system-settings.service';
import { ConfigService } from '@nestjs/config';
import { AvailabilitySlotService } from '../src/teacher/availability-slot.service';
import { BookingConstants } from '../src/booking/booking.constants';

describe('Booking flows (mocked e2e)', () => {
  let service: BookingService;

  const bookingsStore = new Map<string, any>();
  const rescheduleRequestsStore = new Map<string, any>();

  const prisma = {
    bookings: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    teacher_profiles: {
      findUnique: jest.fn(),
    },
    teacher_session_slots: {
      findUnique: jest.fn(),
    },
    reschedule_requests: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    disputes: {
      create: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
    },
    system_settings: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    package_redemptions: {
      updateMany: jest.fn(),
    },
    audit_logs: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $transaction: jest.fn(),
  };

  const walletService = {
    lockFundsForBooking: jest.fn(),
    releaseFundsOnCompletion: jest.fn(),
    settleCancellation: jest.fn(),
  };

  const notificationService = {
    notifyUser: jest.fn(),
    notifySessionComplete: jest.fn(),
    notifyTeacherPaymentReleased: jest.fn(),
  };

  const packageService = {
    purchasePackage: jest.fn(),
    createRedemption: jest.fn(),
    releaseSession: jest.fn(),
  };

  const demoService = {
    markDemoCompleted: jest.fn(),
    cancelDemoRecordInTransaction: jest.fn(),
  };

  const readableIdService = { generate: jest.fn() };
  const teacherService = {};

  const systemSettingsService = {
    getSettings: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const availabilitySlotService = {
    restoreSlot: jest.fn(),
    deleteOverlappingSlots: jest.fn(),
  };

  const bookingUpdateService = {
    updateTeacherNotes: jest.fn(),
    updateMeetingLink: jest.fn(),
  };
  const bookingRatingService = {
    rateBooking: jest.fn(),
  };
  const bookingMeetingService = {
    logMeetingEvent: jest.fn(),
    getMeetingEvents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    bookingsStore.clear();
    rescheduleRequestsStore.clear();

    prisma.bookings.findUnique.mockImplementation(async ({ where }: any) => {
      return bookingsStore.get(where.id) ?? null;
    });

    prisma.bookings.update.mockImplementation(async ({ where, data }: any) => {
      const booking = bookingsStore.get(where.id);
      if (!booking) throw new Error('Booking not found');
      if (where.status && booking.status !== where.status) {
        throw new Error('Conditional update failed');
      }
      const updated = { ...booking, ...data };
      bookingsStore.set(where.id, updated);
      return updated;
    });

    prisma.bookings.updateMany.mockImplementation(
      async ({ where, data }: any) => {
        const booking = bookingsStore.get(where.id);
        if (!booking) return { count: 0 };
        if (where.status && booking.status !== where.status)
          return { count: 0 };
        if (
          where.rescheduleCount !== undefined &&
          booking.rescheduleCount !== where.rescheduleCount
        ) {
          return { count: 0 };
        }
        const updated = { ...booking, ...data };
        bookingsStore.set(where.id, updated);
        return { count: 1 };
      },
    );

    prisma.bookings.findFirst.mockResolvedValue(null);

    prisma.reschedule_requests.create.mockImplementation(
      async ({ data }: any) => {
        const created = { ...data };
        rescheduleRequestsStore.set(created.id, created);
        return created;
      },
    );

    prisma.reschedule_requests.findUnique.mockImplementation(
      async ({ where }: any) => {
        const request = rescheduleRequestsStore.get(where.id);
        if (!request) return null;
        return {
          ...request,
          bookings: bookingsStore.get(request.bookingId),
        };
      },
    );

    prisma.reschedule_requests.update.mockImplementation(
      async ({ where, data }: any) => {
        const request = rescheduleRequestsStore.get(where.id);
        if (!request) throw new Error('Request not found');
        const updated = { ...request, ...data };
        rescheduleRequestsStore.set(where.id, updated);
        return updated;
      },
    );

    prisma.disputes.create.mockImplementation(async ({ data }: any) => ({
      ...data,
    }));
    prisma.users.findMany.mockResolvedValue([
      { id: 'admin-1', role: 'ADMIN', isActive: true },
    ]);

    prisma.system_settings.findUnique.mockResolvedValue({
      id: 'default',
      disputeWindowHours: BookingConstants.DISPUTE_WINDOW_HOURS,
      defaultCommissionRate: BookingConstants.DEFAULT_COMMISSION_RATE,
    });

    prisma.system_settings.create.mockImplementation(async ({ data }: any) => ({
      ...data,
    }));

    prisma.$transaction.mockImplementation(async (callback: any) => {
      const tx = prisma;
      return callback(tx);
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        BookingCancellationService,
        BookingCompletionService,
        BookingPaymentService,
        BookingRescheduleService,
        BookingStatusValidatorService,
        BookingSystemSettingsService,
        BookingQueryService,
        { provide: BookingUpdateService, useValue: bookingUpdateService },
        { provide: BookingRatingService, useValue: bookingRatingService },
        { provide: BookingMeetingService, useValue: bookingMeetingService },
        {
          provide: BookingCreationService,
          useValue: { createRequest: jest.fn() },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: walletService },
        { provide: NotificationService, useValue: notificationService },
        { provide: PackageService, useValue: packageService },
        { provide: DemoService, useValue: demoService },
        { provide: ReadableIdService, useValue: readableIdService },
        { provide: TeacherService, useValue: teacherService },
        { provide: SystemSettingsService, useValue: systemSettingsService },
        { provide: ConfigService, useValue: configService },
        { provide: AvailabilitySlotService, useValue: availabilitySlotService },
      ],
    }).compile();

    service = moduleRef.get(BookingService);
  });

  it('single-session lifecycle: pay → complete → confirm', async () => {
    const bookingId = 'booking-1';
    const parentId = 'parent-1';
    const teacherUserId = 'teacher-user-1';
    const teacherProfileId = 'teacher-profile-1';

    const startTime = new Date('2026-01-01T10:00:00.000Z');
    const endTime = new Date('2026-01-01T11:00:00.000Z');

    bookingsStore.set(bookingId, {
      id: bookingId,
      status: 'WAITING_FOR_PAYMENT',
      bookedByUserId: parentId,
      studentUserId: null,
      teacherId: teacherProfileId,
      subjectId: 'subject-1',
      startTime,
      endTime,
      price: 100,
      commissionRate: BookingConstants.DEFAULT_COMMISSION_RATE,
      users_bookings_bookedByUserIdTousers: {
        id: parentId,
        parent_profiles: { users: { id: parentId } },
      },
      teacher_profiles: { userId: teacherUserId, users: { id: teacherUserId } },
      children: null,
      disputes: null,
      package_redemptions: null,
    });

    prisma.teacher_profiles.findUnique.mockResolvedValue({
      id: teacherProfileId,
      userId: teacherUserId,
    });

    await service.payForBooking(parentId, bookingId);
    expect(walletService.lockFundsForBooking).toHaveBeenCalledWith(
      parentId,
      bookingId,
      100,
      expect.anything(),
    );
    expect(bookingsStore.get(bookingId).status).toBe('SCHEDULED');

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));

    await service.completeSession(teacherUserId, bookingId, {
      topicsCovered: 'Math',
    });
    expect(bookingsStore.get(bookingId).status).toBe('PENDING_CONFIRMATION');
    expect(notificationService.notifySessionComplete).toHaveBeenCalled();

    const result = await service.confirmSessionEarly(
      parentId,
      bookingId,
      5,
      'PARENT',
    );
    expect(result.status).toBe('COMPLETED');
    expect(walletService.releaseFundsOnCompletion).toHaveBeenCalledWith(
      parentId,
      teacherUserId,
      bookingId,
      100,
      BookingConstants.DEFAULT_COMMISSION_RATE,
      expect.anything(),
    );
    expect(notificationService.notifyTeacherPaymentReleased).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('package session confirm releases via PackageService (not WalletService)', async () => {
    const bookingId = 'booking-pkg-1';
    const studentId = 'student-1';
    const teacherUserId = 'teacher-user-1';
    const teacherProfileId = 'teacher-profile-1';

    bookingsStore.set(bookingId, {
      id: bookingId,
      status: 'PENDING_CONFIRMATION',
      bookedByUserId: studentId,
      studentUserId: studentId,
      teacherId: teacherProfileId,
      teacher_profiles: { userId: teacherUserId, users: { id: teacherUserId } },
      package_redemptions: { id: 'redemption-1', bookingId },
      disputeWindowClosesAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 50,
      commissionRate: BookingConstants.DEFAULT_COMMISSION_RATE,
    });

    await service.confirmSessionEarly(
      studentId,
      bookingId,
      undefined,
      'STUDENT',
    );

    expect(packageService.releaseSession).toHaveBeenCalledWith(
      bookingId,
      `RELEASE_${bookingId}`,
      expect.anything(),
    );
    expect(walletService.releaseFundsOnCompletion).not.toHaveBeenCalled();
  });

  it('parent can cancel before payment without wallet settlement', async () => {
    const bookingId = 'booking-cancel-1';
    const parentId = 'parent-1';
    const teacherUserId = 'teacher-user-1';
    const teacherProfileId = 'teacher-profile-1';

    bookingsStore.set(bookingId, {
      id: bookingId,
      status: 'WAITING_FOR_PAYMENT',
      bookedByUserId: parentId,
      teacherId: teacherProfileId,
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
      price: 100,
      createdAt: new Date(),
      teacher_profiles: {
        userId: teacherUserId,
        users: { id: teacherUserId },
        cancellationPolicy: 'moderate',
      },
    });

    const result = await service.cancelBooking(
      parentId,
      'PARENT',
      bookingId,
      'test',
    );
    expect(result.status).toBe('CANCELLED_BY_PARENT');
    expect(walletService.settleCancellation).not.toHaveBeenCalled();
    expect(availabilitySlotService.restoreSlot).toHaveBeenCalled();
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: teacherUserId,
        type: 'BOOKING_CANCELLED',
      }),
    );
  });

  it('teacher reschedule request can be declined by student', async () => {
    const bookingId = 'booking-reschedule-1';
    const requestId = 'req-1';
    const teacherUserId = 'teacher-user-1';
    const teacherProfileId = 'teacher-profile-1';
    const studentId = 'student-1';

    const startTime = new Date(Date.now() + 72 * 60 * 60 * 1000);

    bookingsStore.set(bookingId, {
      id: bookingId,
      status: 'SCHEDULED',
      bookedByUserId: studentId,
      studentUserId: studentId,
      teacherId: teacherProfileId,
      startTime,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
      package_redemptions: { id: 'red-1', bookingId },
      teacher_profiles: { userId: teacherUserId },
      reschedule_requests: [],
    });

    prisma.teacher_session_slots.findUnique.mockResolvedValue({
      id: 'slot-1',
      teacherId_startTimeUtc: {
        teacherId: teacherProfileId,
        startTimeUtc: startTime,
      },
    });

    const proposedStart = new Date(Date.now() + 96 * 60 * 60 * 1000);
    const requested = await service.requestReschedule(
      teacherUserId,
      bookingId,
      'Need to move',
      proposedStart,
      new Date(proposedStart.getTime() + 60 * 60 * 1000),
    );

    expect(requested.success).toBe(true);
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: studentId,
        type: 'RESCHEDULE_REQUEST',
      }),
    );

    // Force deterministic id to exercise decline path
    rescheduleRequestsStore.set(requestId, {
      id: requestId,
      bookingId,
      requestedById: teacherUserId,
      status: 'PENDING',
    });

    const declined = await service.declineRescheduleRequest(
      studentId,
      requestId,
    );
    expect(declined.success).toBe(true);
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: teacherUserId,
        type: 'RESCHEDULE_DECLINED',
      }),
    );
  });

  it('student can raise a dispute and booking becomes DISPUTED', async () => {
    const bookingId = 'booking-dispute-1';
    const studentId = 'student-1';

    bookingsStore.set(bookingId, {
      id: bookingId,
      status: 'PENDING_CONFIRMATION',
      bookedByUserId: studentId,
      users_bookings_bookedByUserIdTousers: { id: studentId },
      disputes: null,
    });

    await service.raiseDispute(studentId, bookingId, {
      type: 'QUALITY_ISSUE',
      description: 'Bad session',
      evidence: [],
    });

    expect(bookingsStore.get(bookingId).status).toBe('DISPUTED');
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DISPUTE_RAISED' }),
    );
  });
});
