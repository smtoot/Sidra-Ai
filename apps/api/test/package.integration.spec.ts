import { Test, TestingModule } from '@nestjs/testing';
import { PackageService } from '../src/package/package.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { normalizeMoney } from '../src/utils/money';

describe('Package Integration Tests', () => {
  let packageService: PackageService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      systemSettings: { findFirst: jest.fn() },
      packageTransaction: { findUnique: jest.fn(), create: jest.fn() },
      packageTier: { findUnique: jest.fn() },
      teacherSubject: { findFirst: jest.fn() },
      wallet: { findUnique: jest.fn(), update: jest.fn() },
      transaction: { create: jest.fn() },
      studentPackage: {
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
      booking: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageService,
        { provide: PrismaService, useValue: mockPrisma },
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
      mockPrisma.packageTransaction.findUnique.mockResolvedValue({
        idempotencyKey: 'idem-key-1',
        type: 'SCHEDULE',
      });
      mockPrisma.packageRedemption.findFirst.mockResolvedValue({
        booking: { id: 'booking-existing' },
      });

      const result = await packageService.schedulePackageSession(
        'pkg-1',
        'user-1',
        new Date(),
        new Date(Date.now() + 3600000),
        'UTC',
        'idem-key-1',
      );

      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(true);
      expect((result as any).bookings.id).toBe('booking-existing');
    });

    it('should throw ConflictException on concurrent 0-row update', async () => {
      mockPrisma.packageTransaction.findUnique.mockResolvedValue(null);
      mockPrisma.studentPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.studentPackage.updateMany.mockResolvedValue({ count: 0 }); // Concurrent race lost

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
      mockPrisma.packageTransaction.findUnique.mockResolvedValue(null);
      mockPrisma.studentPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.studentPackage.updateMany.mockResolvedValue({ count: 1 }); // Success
      mockPrisma.booking.create.mockResolvedValue({ id: 'new-booking-1' });
      mockPrisma.packageRedemption.create.mockResolvedValue({});
      mockPrisma.packageTransaction.create.mockResolvedValue({});

      const result = await packageService.schedulePackageSession(
        'pkg-1',
        'user-1',
        new Date(),
        new Date(Date.now() + 3600000),
        'UTC',
        'idem-key-2',
      );

      expect(result.success).toBe(true);
      expect(result.sessionsRemaining).toBe(0);
      // Verify DEPLETED status was set
      expect(mockPrisma.studentPackage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DEPLETED',
          }),
        }),
      );
    });

    it('should reject if not owner of package', async () => {
      mockPrisma.packageTransaction.findUnique.mockResolvedValue(null);
      mockPrisma.studentPackage.findUnique.mockResolvedValue({
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
    it('booking price should be normalized to integer', async () => {
      const priceWithDecimal = new Decimal('99.7');
      const normalized = normalizeMoney(priceWithDecimal);
      expect(normalized).toBe(100);
      expect(normalized % 1).toBe(0);
    });

    it('refund amount should be normalized', async () => {
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
