// Set env for encryption util before imports
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingService } from '../booking.service';
import { BookingCancellationService } from '../booking-cancellation.service';
import { BookingCompletionService } from '../booking-completion.service';
import { BookingCreationService } from '../booking-creation.service';
import { BookingPaymentService } from '../booking-payment.service';
import { BookingRescheduleService } from '../booking-reschedule.service';
import { BookingStatusValidatorService } from '../booking-status-validator.service';
import { BookingSystemSettingsService } from '../booking-system-settings.service';
import { BookingQueryService } from '../booking-query.service';
import { BookingUpdateService } from '../booking-update.service';
import { BookingRatingService } from '../booking-rating.service';
import { BookingMeetingService } from '../booking-meeting.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../../wallet/wallet.service';
import { NotificationService } from '../../notification/notification.service';
import { PackageService } from '../../package/package.service';
import { DemoService } from '../../package/demo.service';
import { ReadableIdService } from '../../common/readable-id/readable-id.service';
import { TeacherService } from '../../teacher/teacher.service';
import { SystemSettingsService } from '../../admin/system-settings.service';
import { ConfigService } from '@nestjs/config';
import { AvailabilitySlotService } from '../../teacher/availability-slot.service';
import { BookingConstants } from '../booking.constants';

describe('BookingService (critical paths)', () => {
  let service: BookingService;

  const mockBookingCreationService = {
    createRequest: jest.fn(),
  };

  const mockBookingPaymentService = {
    payForBooking: jest.fn(),
    releaseFundsOnCompletion: jest.fn(),
    settleCancellation: jest.fn(),
  };

  const mockPrismaBase = {
    bookings: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    teacher_profiles: {
      findUnique: jest.fn(),
    },
    system_settings: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    disputes: {
      create: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
    },
    teacher_subjects: {
      findFirst: jest.fn(),
    },
    children: {
      findFirst: jest.fn(),
    },
    package_redemptions: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockWalletService = {
    settleCancellation: jest.fn(),
  };

  const mockNotificationService = {
    notifyUser: jest.fn(),
    notifySessionComplete: jest.fn(),
    notifyTeacherPaymentReleased: jest.fn(),
  };

  const mockPackageService = {
    releaseSession: jest.fn(),
  };
  const mockDemoService = {
    cancelDemoRecordInTransaction: jest.fn(),
    markDemoCompleted: jest.fn(),
  };
  const mockReadableIdService = { generate: jest.fn() };
  const mockTeacherService = {};
  const mockSystemSettingsService = {
    getSettings: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn(),
  };
  const mockAvailabilitySlotService = {
    restoreSlot: jest.fn(),
    deleteOverlappingSlots: jest.fn(),
  };

  const mockBookingUpdateService = {
    updateTeacherNotes: jest.fn(),
    updateMeetingLink: jest.fn(),
  };
  const mockBookingRatingService = {
    rateBooking: jest.fn(),
  };
  const mockBookingMeetingService = {
    logMeetingEvent: jest.fn(),
    getMeetingEvents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaBase.$transaction.mockImplementation(async (callback: any) =>
      callback(mockPrismaBase),
    );

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        BookingCancellationService,
        BookingCompletionService,
        BookingStatusValidatorService,
        BookingSystemSettingsService,
        { provide: BookingQueryService, useValue: {} },
        { provide: BookingUpdateService, useValue: mockBookingUpdateService },
        { provide: BookingRatingService, useValue: mockBookingRatingService },
        { provide: BookingMeetingService, useValue: mockBookingMeetingService },
        {
          provide: BookingCreationService,
          useValue: mockBookingCreationService,
        },
        { provide: BookingPaymentService, useValue: mockBookingPaymentService },
        { provide: BookingRescheduleService, useValue: {} },
        { provide: PrismaService, useValue: mockPrismaBase },
        { provide: WalletService, useValue: mockWalletService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PackageService, useValue: mockPackageService },
        { provide: DemoService, useValue: mockDemoService },
        { provide: ReadableIdService, useValue: mockReadableIdService },
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: AvailabilitySlotService,
          useValue: mockAvailabilitySlotService,
        },
      ],
    }).compile();

    service = moduleRef.get(BookingService);
  });

  describe('completeSession', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('rejects completion beyond max grace period', async () => {
      const now = new Date();
      const endTime = new Date(
        now.getTime() -
          (BookingConstants.MAX_COMPLETION_GRACE_HOURS + 1) * 60 * 60 * 1000,
      );
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

      mockPrismaBase.bookings.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: 'SCHEDULED',
        teacherId: 'teacher-profile-1',
        bookedByUserId: 'student-1',
        startTime,
        endTime,
        price: 100,
        teacher_profiles: { users: { id: 'teacher-user-1' } },
        users_bookings_bookedByUserIdTousers: { id: 'student-1' },
        disputes: [],
      });
      mockPrismaBase.teacher_profiles.findUnique.mockResolvedValue({
        id: 'teacher-profile-1',
      });

      await expect(
        service.completeSession('teacher-user-1', 'booking-1', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('cancelBooking', () => {
    it('throws ConflictException when booking status changes concurrently', async () => {
      const tx = {
        bookings: {
          findUnique: jest.fn(),
          updateMany: jest.fn(),
        },
      };

      const booking = {
        id: 'booking-1',
        status: 'WAITING_FOR_PAYMENT',
        teacherId: 'teacher-profile-1',
        bookedByUserId: 'parent-1',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
        price: 100,
        createdAt: new Date(),
        teacher_profiles: {
          userId: 'teacher-user-1',
          users: { id: 'teacher-user-1' },
          cancellationPolicy: 'moderate',
        },
      };

      tx.bookings.findUnique.mockResolvedValue(booking);
      tx.bookings.updateMany.mockResolvedValue({ count: 0 });

      mockPrismaBase.$transaction.mockImplementation(async (callback: any) =>
        callback(tx),
      );

      await expect(
        service.cancelBooking('parent-1', 'PARENT', 'booking-1', 'test'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});

describe('BookingCreationService (critical paths)', () => {
  let creationService: BookingCreationService;

  const mockPrismaBase = {
    teacher_subjects: {
      findFirst: jest.fn(),
    },
    children: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BookingCreationService,
        { provide: PrismaService, useValue: mockPrismaBase },
        { provide: WalletService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: PackageService, useValue: {} },
        { provide: DemoService, useValue: {} },
        { provide: ReadableIdService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AvailabilitySlotService, useValue: {} },
        {
          provide: BookingStatusValidatorService,
          useValue: { validateTransition: jest.fn() },
        },
      ],
    }).compile();

    creationService = moduleRef.get(BookingCreationService);
  });

  it('rejects invalid timezone before DB access', async () => {
    const user = { userId: 'student-1', role: 'STUDENT' };
    const dto: any = {
      teacherId: 'teacher-1',
      subjectId: 'subject-1',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      timezone: 'Invalid/Timezone',
    };

    await expect(
      creationService.createRequest(user, dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrismaBase.teacher_subjects.findFirst).not.toHaveBeenCalled();
    expect(mockPrismaBase.children.findFirst).not.toHaveBeenCalled();
  });
});
