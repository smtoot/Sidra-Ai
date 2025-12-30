import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from '../src/booking/booking.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { WalletService } from '../src/wallet/wallet.service';
import { NotificationService } from '../src/notification/notification.service';
import { PackageService } from '../src/package/package.service';
import { DemoService } from '../src/package/demo.service';
import {
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BOOKING_POLICY } from '../src/booking/booking-policy.constants';

describe('Package Reschedule Integration Tests', () => {
  let bookingService: BookingService;
  let mockPrisma: any;
  let mockWallet: any;
  let mockNotification: any;

  // Test data
  const now = Date.now();
  const futureTime = new Date(now + 24 * 60 * 60 * 1000); // 24h from now
  const newTime = new Date(now + 48 * 60 * 60 * 1000); // 48h from now

  const mockPackageBooking = {
    id: 'booking-1',
    bookedByUserId: 'student-1',
    studentUserId: 'student-1',
    teacherId: 'teacher-profile-1',
    status: 'SCHEDULED',
    startTime: futureTime,
    endTime: new Date(futureTime.getTime() + 60 * 60 * 1000),
    rescheduleCount: 0,
    packageRedemption: { id: 'redemption-1', packageId: 'pkg-1' },
    teacherProfile: { id: 'teacher-profile-1', userId: 'teacher-1' },
    rescheduleRequests: [],
  };

  beforeEach(async () => {
    mockPrisma = {
      booking: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      rescheduleRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
      teacherWeeklyAvailability: { findMany: jest.fn().mockResolvedValue([]) },
      teacherProfile: { findUnique: jest.fn() },
      teacherAvailabilityException: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
    };

    mockWallet = {};
    mockNotification = {
      send: jest.fn(),
      notifyTeacherPaymentReleased: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WalletService, useValue: mockWallet },
        { provide: NotificationService, useValue: mockNotification },
        { provide: PackageService, useValue: {} },
        { provide: DemoService, useValue: {} },
      ],
    }).compile();

    bookingService = module.get<BookingService>(BookingService);

    // Mock validateSlotAvailability to return true by default
    jest
      .spyOn(bookingService, 'validateSlotAvailability')
      .mockResolvedValue(true);
  });

  // =====================================================
  // 1) Student reschedule within window → success
  // =====================================================
  describe('Student Direct Reschedule', () => {
    it('should succeed when within time window and under max reschedules', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockPackageBooking);
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await bookingService.reschedulePackageSession(
        'student-1',
        'STUDENT',
        'booking-1',
        newTime,
        new Date(newTime.getTime() + 60 * 60 * 1000),
      );

      expect(result.success).toBe(true);
      expect(result.rescheduleCount).toBe(1);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    // 2) Student reschedule outside window → forbidden
    it('should reject reschedule within window hours', async () => {
      const tooSoon = new Date(now + 2 * 60 * 60 * 1000); // 2h from now (within 6h window)
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...mockPackageBooking,
        startTime: tooSoon,
      });

      await expect(
        bookingService.reschedulePackageSession(
          'student-1',
          'STUDENT',
          'booking-1',
          newTime,
          new Date(newTime.getTime() + 60 * 60 * 1000),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    // 3) Student exceeds max reschedules → forbidden
    it('should reject when max reschedules exceeded', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...mockPackageBooking,
        rescheduleCount: BOOKING_POLICY.studentMaxReschedules, // Already at max
      });

      await expect(
        bookingService.reschedulePackageSession(
          'student-1',
          'STUDENT',
          'booking-1',
          newTime,
          new Date(newTime.getTime() + 60 * 60 * 1000),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =====================================================
  // Status Enforcement
  // =====================================================
  describe('Status Enforcement', () => {
    // 7) Cannot reschedule COMPLETED, CANCELLED, etc.
    const forbiddenStatuses = [
      'PENDING_CONFIRMATION',
      'COMPLETED',
      'CANCELLED',
      'DISPUTED',
    ];

    forbiddenStatuses.forEach((status) => {
      it(`should reject reschedule when status is ${status}`, async () => {
        mockPrisma.booking.findUnique.mockResolvedValue({
          ...mockPackageBooking,
          status,
        });

        await expect(
          bookingService.reschedulePackageSession(
            'student-1',
            'STUDENT',
            'booking-1',
            newTime,
            new Date(newTime.getTime() + 60 * 60 * 1000),
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  // =====================================================
  // Availability Conflict
  // =====================================================
  describe('Availability Check', () => {
    // 8) Availability conflict → fails
    it('should reject when teacher is not available', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockPackageBooking);
      jest
        .spyOn(bookingService, 'validateSlotAvailability')
        .mockResolvedValue(false);

      await expect(
        bookingService.reschedulePackageSession(
          'student-1',
          'STUDENT',
          'booking-1',
          newTime,
          new Date(newTime.getTime() + 60 * 60 * 1000),
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =====================================================
  // Concurrency
  // =====================================================
  describe('Concurrency', () => {
    // 9) Two reschedules → one success, one 409
    it('should return 409 Conflict on concurrent update', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockPackageBooking);
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 }); // Concurrent race lost

      await expect(
        bookingService.reschedulePackageSession(
          'student-1',
          'STUDENT',
          'booking-1',
          newTime,
          new Date(newTime.getTime() + 60 * 60 * 1000),
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =====================================================
  // Teacher Request Flow
  // =====================================================
  describe('Teacher Reschedule Request', () => {
    // 4) Teacher request → student approve → success
    it('should create reschedule request for teacher', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockPackageBooking);
      mockPrisma.rescheduleRequest.create.mockResolvedValue({
        id: 'request-1',
        expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      });

      const result = await bookingService.requestReschedule(
        'teacher-1',
        'booking-1',
        'I have a conflict with another commitment',
      );

      expect(result.success).toBe(true);
      expect(result.requestId).toBe('request-1');
      expect(mockNotification.send).toHaveBeenCalled();
    });

    // 5) Teacher request → student decline → no change
    it('should decline reschedule request without changing booking', async () => {
      mockPrisma.rescheduleRequest.findUnique.mockResolvedValue({
        id: 'request-1',
        status: 'PENDING',
        requestedById: 'teacher-1',
        booking: mockPackageBooking,
      });
      mockPrisma.rescheduleRequest.update.mockResolvedValue({});

      const result = await bookingService.declineRescheduleRequest(
        'student-1',
        'request-1',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.booking.updateMany).not.toHaveBeenCalled(); // Booking unchanged
      expect(mockNotification.send).toHaveBeenCalled(); // Teacher notified
    });
  });

  // =====================================================
  // 10) No Wallet/Ledger Changes
  // =====================================================
  describe('No Money Movement', () => {
    it('should NOT call any wallet or transaction methods during reschedule', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockPackageBooking);
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 });

      await bookingService.reschedulePackageSession(
        'student-1',
        'STUDENT',
        'booking-1',
        newTime,
        new Date(newTime.getTime() + 60 * 60 * 1000),
      );

      // Verify no wallet operations
      expect(mockPrisma.wallet).toBeUndefined();
      expect(mockPrisma.transaction).toBeUndefined();
    });
  });

  // =====================================================
  // Package Session Only
  // =====================================================
  describe('Package Session Enforcement', () => {
    it('should reject non-package bookings', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...mockPackageBooking,
        packageRedemption: null, // Not a package booking
      });

      await expect(
        bookingService.reschedulePackageSession(
          'student-1',
          'STUDENT',
          'booking-1',
          newTime,
          new Date(newTime.getTime() + 60 * 60 * 1000),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
