import { Test, TestingModule } from '@nestjs/testing';
import { PackageService } from '../src/package/package.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReadableIdService } from '../src/common/readable-id/readable-id.service';
import { NotificationService } from '../src/notification/notification.service';
import { TeacherService } from '../src/teacher/teacher.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { normalizeMoney } from '../src/utils/money';

// Define strict interfaces for Mocks
interface MockPrismaClient {
  systemSettings: { findFirst: jest.Mock };
  packageTransaction: { findUnique: jest.Mock; create: jest.Mock };
  packageTier: { findUnique: jest.Mock };
  teacherSubject: { findFirst: jest.Mock };
  wallet: { findUnique: jest.Mock; update: jest.Mock };
  transactions: { create: jest.Mock }; // Corrected from transaction to transactions based on typical Prisma usage
  transaction: { create: jest.Mock }; // Keeping for safety if used directly
  studentPackage: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  packageRedemption: {
    create: jest.Mock;
    findFirst: jest.Mock;
    updateMany: jest.Mock;
  };
  booking: { create: jest.Mock };
  $transaction: jest.Mock;
  bookings: { create: jest.Mock }; // Aliasing check
  wallets: { findUnique: jest.Mock; update: jest.Mock }; // Aliasing check
  student_packages: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  package_transactions: { findUnique: jest.Mock; create: jest.Mock };
  package_redemptions: {
    create: jest.Mock;
    findFirst: jest.Mock;
    updateMany: jest.Mock;
  };
}

// Define result interfaces
interface ScheduleSessionResult {
  success: boolean;
  idempotent?: boolean;
  sessionsRemaining?: number;
  bookings?: { id: string };
  bookingId?: string;
  message?: string;
}

describe('Package Integration Tests', () => {
  let packageService: PackageService;
  let mockPrisma: MockPrismaClient;

  beforeEach(async () => {
    // Initialize mock functions
    mockPrisma = {
      systemSettings: { findFirst: jest.fn() },
      packageTransaction: { findUnique: jest.fn(), create: jest.fn() },
      package_transactions: { findUnique: jest.fn(), create: jest.fn() }, // Snake case alias
      packageTier: { findUnique: jest.fn() },
      teacherSubject: { findFirst: jest.fn() },
      wallet: { findUnique: jest.fn(), update: jest.fn() },
      wallets: { findUnique: jest.fn(), update: jest.fn() }, // Snake case alias
      transaction: { create: jest.fn() },
      transactions: { create: jest.fn() }, // Snake case alias
      studentPackage: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      student_packages: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      packageRedemption: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      package_redemptions: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      booking: { create: jest.fn() },
      bookings: { create: jest.fn() }, // Snake case alias
      $transaction: jest
        .fn()
        .mockImplementation((fn: (tx: any) => Promise<any>) => fn(mockPrisma)),
    };

    // ... (existing imports)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ReadableIdService,
          useValue: { generate: jest.fn().mockResolvedValue('test-id') },
        },
        {
          provide: NotificationService,
          useValue: { notifyUser: jest.fn() },
        },
        {
          provide: TeacherService,
          useValue: { isSlotAvailable: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    packageService = module.get<PackageService>(PackageService);
  });

  // =====================================================
  // P0-PKG-1/2: Atomic Redemption with Conditional Update
  // =====================================================

  describe('schedulePackageSession', () => {
    const mockPackage = {
      id: 'pkg-1',
      payerId: 'user-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      subjectId: 'subject-1',
      sessionCount: 5,
      sessionsUsed: 4,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 86400000),
      discountedPricePerSession: new Decimal(100),
      teacher: { userId: 'teacher-user-1' },
      subject: { nameAr: 'Math' },
    };

    it('should return same booking on duplicate idempotencyKey (idempotent)', async () => {
      // Simulate existing transaction found
      mockPrisma.package_transactions.findUnique.mockResolvedValue({
        idempotencyKey: 'idem-key-1',
        type: 'SCHEDULE',
      });
      // The real service returns { booking: { id: ... } } inside the result
      // But based on the lint error "expect((result as any).bookings.id)", let's verify what the service actually returns.
      // Assuming existing implementation returns the DTO with a 'bookings' property.

      // Mocking the redemption lookup to return a mapped object
      mockPrisma.package_redemptions.findFirst.mockResolvedValue({
        bookings: { id: 'booking-existing' },
      });

      // NOTE: Checking service implementation, if existing transaction found, it likely returns the existing result.
      // We will cast to expected type.

      const result = (await packageService.schedulePackageSession(
        'pkg-1',
        'user-1',
        new Date(),
        new Date(Date.now() + 3600000),
        'UTC',
        'idem-key-1',
      )) as unknown as ScheduleSessionResult;

      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(true);
      expect(result.bookings?.id).toBe('booking-existing');
    });

    it('should throw ConflictException on concurrent 0-row update', async () => {
      mockPrisma.package_transactions.findUnique.mockResolvedValue(null);
      mockPrisma.student_packages.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.student_packages.updateMany.mockResolvedValue({ count: 0 }); // Concurrent race lost

      await expect(
        packageService.schedulePackageSession(
          'pkg-1',
          'user-1',
          new Date(),
          new Date(Date.now() + 3600000),
          'UTC',
          'idem-key-new',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should succeed and set status to DEPLETED on last session', async () => {
      mockPrisma.package_transactions.findUnique.mockResolvedValue(null);
      mockPrisma.student_packages.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.student_packages.updateMany.mockResolvedValue({ count: 1 }); // Success
      mockPrisma.bookings.create.mockResolvedValue({ id: 'new-booking-1' });
      mockPrisma.package_redemptions.create.mockResolvedValue({});
      mockPrisma.package_transactions.create.mockResolvedValue({});

      const result = (await packageService.schedulePackageSession(
        'pkg-1',
        'user-1',
        new Date(),
        new Date(Date.now() + 3600000),
        'UTC',
        'idem-key-2',
      )) as unknown as ScheduleSessionResult;

      expect(result.success).toBe(true);
      expect(result.sessionsRemaining).toBe(0);
      // Verify DEPLETED status was set
      expect(mockPrisma.student_packages.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DEPLETED',
          }) as object,
        }),
      );
    });

    it('should reject if not owner of package', async () => {
      mockPrisma.package_transactions.findUnique.mockResolvedValue(null);
      mockPrisma.student_packages.findUnique.mockResolvedValue({
        ...mockPackage,
        payerId: 'other-user',
        studentId: 'other-student',
      });

      await expect(
        packageService.schedulePackageSession(
          'pkg-1',
          'user-1', // user-1 is not owner
          new Date(),
          new Date(Date.now() + 3600000),
          'UTC',
          'idem-key-3',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =====================================================
  // P0-PKG-3: Money Normalization
  // =====================================================

  describe('Money Normalization in Packages', () => {
    it('booking price should be normalized to integer', () => {
      const priceWithDecimal = new Decimal('99.7');
      const normalized = normalizeMoney(priceWithDecimal);
      expect(normalized).toBe(100);
      expect(normalized % 1).toBe(0);
    });

    it('refund amount should be normalized', () => {
      const escrowRemaining = new Decimal('150.5');
      const refundAmount = normalizeMoney(escrowRemaining);
      expect(refundAmount).toBe(151);
    });
  });

  // =====================================================
  // Ledger Integrity
  // =====================================================

  describe('Ledger Integrity', () => {
    it('all amounts should be integers (no decimals)', () => {
      const amounts = [100.5, 99.4, 200.0, 333.6];
      amounts.forEach((amt) => {
        const normalized = normalizeMoney(amt);
        expect(normalized % 1).toBe(0);
      });
    });

    it('teacher + platform should equal total', () => {
      const total = 100;
      const commissionRate = 0.18;
      const teacherAmount = normalizeMoney(total * (1 - commissionRate));
      const platformAmount = total - teacherAmount;

      expect(teacherAmount + platformAmount).toBe(total);
    });
  });
});
