// Set env for encryption util before imports
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

import { Test, TestingModule } from '@nestjs/testing';
import { PackageService } from './package.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReadableIdService } from '../common/readable-id/readable-id.service';
import { NotificationService } from '../notification/notification.service';
import { TeacherService } from '../teacher/teacher.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

// Mock data
const mockPackageTier = {
  id: 'tier-1',
  sessionCount: 5,
  discountPercent: new Decimal(10),
  isActive: true,
  displayOrder: 1,
};

const mockTeacherSubject = {
  pricePerHour: new Decimal(100),
  teacher_profiles: { commissionRate: 0.18 },
};

const mockStudentPackage = {
  id: 'package-1',
  payerId: 'payer-1',
  studentId: 'student-1',
  teacherId: 'teacher-1',
  subjectId: 'subject-1',
  tierId: 'tier-1',
  sessionCount: 5,
  sessionsUsed: 0,
  originalPricePerSession: new Decimal(100),
  discountedPricePerSession: new Decimal(90),
  perSessionReleaseAmount: new Decimal(90),
  totalPaid: new Decimal(450),
  escrowRemaining: new Decimal(450),
  status: 'ACTIVE',
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  purchasedAt: new Date(),
  teacher: { userId: 'teacher-user-1' },
};

// Mock services
const mockReadableIdService = {
  generate: jest.fn().mockReturnValue('PKG-2412-0001'),
};

const mockNotificationService = {
  notifyUser: jest.fn().mockResolvedValue(undefined),
};

const mockTeacherService = {
  isSlotAvailable: jest.fn().mockResolvedValue(true),
};

describe('PackageService', () => {
  let service: PackageService;
  let prisma: PrismaService;

  const mockPrismaBase = {
    package_tiers: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    teacher_profiles: {
      findUnique: jest.fn(),
    },
    teacher_subjects: {
      findFirst: jest.fn(),
    },
    student_packages: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    package_redemptions: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    package_transactions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    subjects: {
      findUnique: jest.fn(),
    },
    wallets: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transactions: {
      // P1 FIX: Add wallet Transaction mock
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    system_settings: {
      findFirst: jest.fn(),
    },
    teacher_demo_settings: {
      findUnique: jest.fn(),
    },
    teacher_package_tier_settings: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default $transaction behavior: execute callback with prisma mock
    mockPrismaBase.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrismaBase);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageService,
        { provide: PrismaService, useValue: mockPrismaBase },
        { provide: ReadableIdService, useValue: mockReadableIdService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: TeacherService, useValue: mockTeacherService },
      ],
    }).compile();

    service = module.get<PackageService>(PackageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // =========================================================
  // getActiveTiers
  // =========================================================
  describe('getActiveTiers', () => {
    it('should return only active tiers ordered by displayOrder', async () => {
      mockPrismaBase.package_tiers.findMany.mockResolvedValue([mockPackageTier]);

      const result = await service.getActiveTiers();

      expect(result).toEqual([mockPackageTier]);
      expect(mockPrismaBase.package_tiers.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  // =========================================================
  // purchasePackage
  // =========================================================
  describe('purchasePackage', () => {
    beforeEach(() => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue(null);
      mockPrismaBase.package_tiers.findUnique.mockResolvedValue(mockPackageTier);
      mockPrismaBase.teacher_subjects.findFirst.mockResolvedValue(
        mockTeacherSubject,
      );
      mockPrismaBase.system_settings.findFirst.mockResolvedValue({
        packagesEnabled: true,
      });
      mockPrismaBase.wallets.findUnique.mockResolvedValue({
        balance: new Decimal(1000),
      });
      mockPrismaBase.wallets.update.mockResolvedValue({});
      mockPrismaBase.student_packages.create.mockResolvedValue(
        mockStudentPackage,
      );
      mockPrismaBase.package_transactions.create.mockResolvedValue({
        id: 'tx-1',
      });
      mockPrismaBase.transactions.create.mockResolvedValue({
        id: 'wallet-tx-1',
      });
    });

    it('should successfully purchase a package and debit wallet', async () => {
      const result = await service.purchasePackage(
        'payer-1',
        'student-1',
        'teacher-1',
        'subject-1',
        'tier-1',
        'idempotency-key-1',
      );

      expect(result).toEqual(mockStudentPackage);
      expect(mockPrismaBase.wallets.update).toHaveBeenCalled();
      expect(mockPrismaBase.student_packages.create).toHaveBeenCalled();
      expect(mockPrismaBase.package_transactions.create).toHaveBeenCalled();
    });

    it('should return existing package for duplicate idempotency key', async () => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue({
        packageId: 'package-1',
      });
      mockPrismaBase.student_packages.findUnique.mockResolvedValue(
        mockStudentPackage,
      );

      const result = await service.purchasePackage(
        'payer-1',
        'student-1',
        'teacher-1',
        'subject-1',
        'tier-1',
        'idempotency-key-1',
      );

      expect(result).toEqual(mockStudentPackage);
      expect(mockPrismaBase.wallets.update).not.toHaveBeenCalled();
    });

    it('should throw if tier not found', async () => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue(null);
      mockPrismaBase.package_tiers.findUnique.mockResolvedValue(null);

      await expect(
        service.purchasePackage(
          'payer-1',
          'student-1',
          'teacher-1',
          'subject-1',
          'tier-1',
          'key',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if teacher does not teach subject', async () => {
      mockPrismaBase.teacher_subjects.findFirst.mockResolvedValue(null);

      await expect(
        service.purchasePackage(
          'payer-1',
          'student-1',
          'teacher-1',
          'subject-1',
          'tier-1',
          'key',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if insufficient balance', async () => {
      mockPrismaBase.wallets.findUnique.mockResolvedValue({
        balance: new Decimal(10),
      });

      await expect(
        service.purchasePackage(
          'payer-1',
          'student-1',
          'teacher-1',
          'subject-1',
          'tier-1',
          'key',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================
  // releaseSession
  // =========================================================
  describe('releaseSession', () => {
    const mockRedemption = {
      id: 'redemption-1',
      packageId: 'package-1',
      bookingId: 'booking-1',
      status: 'RESERVED',
      package: mockStudentPackage,
    };

    beforeEach(() => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue(null);
      mockPrismaBase.package_redemptions.findUnique.mockResolvedValue(
        mockRedemption,
      );
      mockPrismaBase.wallets.update.mockResolvedValue({});
      mockPrismaBase.student_packages.update.mockResolvedValue({});
      mockPrismaBase.package_redemptions.update.mockResolvedValue({});
      mockPrismaBase.package_transactions.create.mockResolvedValue({});
    });

    it('should release session and credit teacher wallet', async () => {
      await service.releaseSession('booking-1', 'release-key-1');

      expect(mockPrismaBase.wallets.update).toHaveBeenCalled();
      expect(mockPrismaBase.student_packages.update).toHaveBeenCalled();
      expect(mockPrismaBase.package_redemptions.update).toHaveBeenCalled();
    });

    it('should skip if already released (idempotency)', async () => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue({
        id: 'existing-tx',
      });

      await service.releaseSession('booking-1', 'release-key-1');

      expect(
        mockPrismaBase.package_redemptions.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw if redemption not found', async () => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue(null);
      mockPrismaBase.package_redemptions.findUnique.mockResolvedValue(null);

      await expect(
        service.releaseSession('booking-1', 'release-key-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if redemption already released', async () => {
      mockPrismaBase.package_redemptions.findUnique.mockResolvedValue({
        ...mockRedemption,
        status: 'RELEASED',
      });

      await expect(
        service.releaseSession('booking-1', 'release-key-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark package as COMPLETED on last session', async () => {
      const lastSessionPackage = {
        ...mockStudentPackage,
        sessionsUsed: 5, // This is session 5 of 5
        escrowRemaining: new Decimal(90),
      };
      mockPrismaBase.package_redemptions.findUnique.mockResolvedValue({
        ...mockRedemption,
        package: lastSessionPackage,
      });

      await service.releaseSession('booking-1', 'release-key-1');

      expect(mockPrismaBase.student_packages.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
          }),
        }),
      );
    });
  });

  // =========================================================
  // cancelPackage
  // =========================================================
  describe('cancelPackage', () => {
    beforeEach(() => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue(null);
      mockPrismaBase.student_packages.findUnique.mockResolvedValue(
        mockStudentPackage,
      );
      mockPrismaBase.package_redemptions.updateMany.mockResolvedValue({});
      mockPrismaBase.wallets.update.mockResolvedValue({});
      mockPrismaBase.student_packages.update.mockResolvedValue({});
      mockPrismaBase.package_transactions.create.mockResolvedValue({});
    });

    it('should refund remaining escrow to payer', async () => {
      await service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1');

      expect(mockPrismaBase.wallets.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'payer-1' },
          data: expect.objectContaining({
            balance: expect.objectContaining({ increment: 450 }), // P1: normalizeMoney returns int
          }),
        }),
      );
    });

    it('should skip if already cancelled (idempotency)', async () => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue({
        type: 'REFUND',
      });

      await service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1');

      expect(mockPrismaBase.student_packages.findUnique).not.toHaveBeenCalled();
    });

    it('should throw if package not found', async () => {
      mockPrismaBase.package_transactions.findUnique.mockResolvedValue(null);
      mockPrismaBase.student_packages.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if package not active', async () => {
      mockPrismaBase.student_packages.findUnique.mockResolvedValue({
        ...mockStudentPackage,
        status: 'COMPLETED',
      });

      await expect(
        service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================
  // createRedemption
  // =========================================================
  describe('createRedemption', () => {
    beforeEach(() => {
      mockPrismaBase.student_packages.findUnique.mockResolvedValue(
        mockStudentPackage,
      );
      mockPrismaBase.package_redemptions.create.mockResolvedValue({
        id: 'redemption-1',
        status: 'RESERVED',
      });
      mockPrismaBase.student_packages.updateMany.mockResolvedValue({ count: 1 });
    });

    it('should create a RESERVED redemption', async () => {
      const result = await service.createRedemption('package-1', 'booking-1');

      expect(result.status).toBe('RESERVED');
      expect(mockPrismaBase.package_redemptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            packageId: 'package-1',
            bookingId: 'booking-1',
            status: 'RESERVED',
          }),
        }),
      );
    });

    it('should throw if package not active', async () => {
      mockPrismaBase.student_packages.findUnique.mockResolvedValue({
        ...mockStudentPackage,
        status: 'EXPIRED',
      });

      await expect(
        service.createRedemption('package-1', 'booking-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if no sessions remaining', async () => {
      mockPrismaBase.student_packages.findUnique.mockResolvedValue({
        ...mockStudentPackage,
        sessionsUsed: 5, // All 5 used
      });

      await expect(
        service.createRedemption('package-1', 'booking-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if package expired', async () => {
      mockPrismaBase.student_packages.findUnique.mockResolvedValue({
        ...mockStudentPackage,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(
        service.createRedemption('package-1', 'booking-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
