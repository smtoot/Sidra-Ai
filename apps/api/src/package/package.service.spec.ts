import { Test, TestingModule } from '@nestjs/testing';
import { PackageService } from './package.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

// Mock data
const mockPackageTier = {
    id: 'tier-1',
    sessionCount: 5,
    discountPercent: new Decimal(10),
    isActive: true,
    displayOrder: 1
};

const mockTeacherSubject = {
    pricePerHour: new Decimal(100),
    teacherProfile: { commissionRate: 0.18 }
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
    teacher: { userId: 'teacher-user-1' }
};

describe('PackageService', () => {
    let service: PackageService;
    let prisma: PrismaService;

    const mockPrismaBase = {
        packageTier: {
            findMany: jest.fn(),
            findUnique: jest.fn()
        },
        teacherProfile: {
            findUnique: jest.fn()
        },
        teacherSubject: {
            findFirst: jest.fn()
        },
        studentPackage: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn()
        },
        packageRedemption: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn()
        },
        packageTransaction: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn()
        },
        wallet: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn()
        },
        systemSettings: {
            findFirst: jest.fn()
        },
        $transaction: jest.fn()
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
                { provide: PrismaService, useValue: mockPrismaBase }
            ]
        }).compile();

        service = module.get<PackageService>(PackageService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    // =========================================================
    // getActiveTiers
    // =========================================================
    describe('getActiveTiers', () => {
        it('should return only active tiers ordered by displayOrder', async () => {
            mockPrismaBase.packageTier.findMany.mockResolvedValue([mockPackageTier]);

            const result = await service.getActiveTiers();

            expect(result).toEqual([mockPackageTier]);
            expect(mockPrismaBase.packageTier.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' }
            });
        });
    });

    // =========================================================
    // purchasePackage
    // =========================================================
    describe('purchasePackage', () => {
        beforeEach(() => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue(null);
            mockPrismaBase.packageTier.findUnique.mockResolvedValue(mockPackageTier);
            mockPrismaBase.teacherSubject.findFirst.mockResolvedValue(mockTeacherSubject);
            mockPrismaBase.systemSettings.findFirst.mockResolvedValue({});
            mockPrismaBase.wallet.findUnique.mockResolvedValue({ balance: new Decimal(1000) });
            mockPrismaBase.wallet.update.mockResolvedValue({});
            mockPrismaBase.studentPackage.create.mockResolvedValue(mockStudentPackage);
            mockPrismaBase.packageTransaction.create.mockResolvedValue({ id: 'tx-1' });
        });

        it('should successfully purchase a package and debit wallet', async () => {
            const result = await service.purchasePackage(
                'payer-1', 'student-1', 'teacher-1', 'subject-1', 'tier-1', 'idempotency-key-1'
            );

            expect(result).toEqual(mockStudentPackage);
            expect(mockPrismaBase.wallet.update).toHaveBeenCalled();
            expect(mockPrismaBase.studentPackage.create).toHaveBeenCalled();
            expect(mockPrismaBase.packageTransaction.create).toHaveBeenCalled();
        });

        it('should return existing package for duplicate idempotency key', async () => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue({
                packageId: 'package-1'
            });
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue(mockStudentPackage);

            const result = await service.purchasePackage(
                'payer-1', 'student-1', 'teacher-1', 'subject-1', 'tier-1', 'idempotency-key-1'
            );

            expect(result).toEqual(mockStudentPackage);
            expect(mockPrismaBase.wallet.update).not.toHaveBeenCalled();
        });

        it('should throw if tier not found', async () => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue(null);
            mockPrismaBase.packageTier.findUnique.mockResolvedValue(null);

            await expect(
                service.purchasePackage('payer-1', 'student-1', 'teacher-1', 'subject-1', 'tier-1', 'key')
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw if teacher does not teach subject', async () => {
            mockPrismaBase.teacherSubject.findFirst.mockResolvedValue(null);

            await expect(
                service.purchasePackage('payer-1', 'student-1', 'teacher-1', 'subject-1', 'tier-1', 'key')
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw if insufficient balance', async () => {
            mockPrismaBase.wallet.findUnique.mockResolvedValue({ balance: new Decimal(10) });

            await expect(
                service.purchasePackage('payer-1', 'student-1', 'teacher-1', 'subject-1', 'tier-1', 'key')
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
            package: mockStudentPackage
        };

        beforeEach(() => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue(null);
            mockPrismaBase.packageRedemption.findUnique.mockResolvedValue(mockRedemption);
            mockPrismaBase.wallet.update.mockResolvedValue({});
            mockPrismaBase.studentPackage.update.mockResolvedValue({});
            mockPrismaBase.packageRedemption.update.mockResolvedValue({});
            mockPrismaBase.packageTransaction.create.mockResolvedValue({});
        });

        it('should release session and credit teacher wallet', async () => {
            await service.releaseSession('booking-1', 'release-key-1');

            expect(mockPrismaBase.wallet.update).toHaveBeenCalled();
            expect(mockPrismaBase.studentPackage.update).toHaveBeenCalled();
            expect(mockPrismaBase.packageRedemption.update).toHaveBeenCalled();
        });

        it('should skip if already released (idempotency)', async () => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue({ id: 'existing-tx' });

            await service.releaseSession('booking-1', 'release-key-1');

            expect(mockPrismaBase.packageRedemption.findUnique).not.toHaveBeenCalled();
        });

        it('should throw if redemption not found', async () => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue(null);
            mockPrismaBase.packageRedemption.findUnique.mockResolvedValue(null);

            await expect(service.releaseSession('booking-1', 'release-key-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw if redemption already released', async () => {
            mockPrismaBase.packageRedemption.findUnique.mockResolvedValue({
                ...mockRedemption,
                status: 'RELEASED'
            });

            await expect(service.releaseSession('booking-1', 'release-key-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should mark package as COMPLETED on last session', async () => {
            const lastSessionPackage = {
                ...mockStudentPackage,
                sessionsUsed: 4, // This is session 5 of 5
                escrowRemaining: new Decimal(90)
            };
            mockPrismaBase.packageRedemption.findUnique.mockResolvedValue({
                ...mockRedemption,
                package: lastSessionPackage
            });

            await service.releaseSession('booking-1', 'release-key-1');

            expect(mockPrismaBase.studentPackage.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'COMPLETED'
                    })
                })
            );
        });
    });

    // =========================================================
    // cancelPackage
    // =========================================================
    describe('cancelPackage', () => {
        beforeEach(() => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue(null);
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue(mockStudentPackage);
            mockPrismaBase.packageRedemption.updateMany.mockResolvedValue({});
            mockPrismaBase.wallet.update.mockResolvedValue({});
            mockPrismaBase.studentPackage.update.mockResolvedValue({});
            mockPrismaBase.packageTransaction.create.mockResolvedValue({});
        });

        it('should refund remaining escrow to payer', async () => {
            await service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1');

            expect(mockPrismaBase.wallet.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'payer-1' },
                    data: expect.objectContaining({
                        balance: expect.objectContaining({ increment: mockStudentPackage.escrowRemaining })
                    })
                })
            );
        });

        it('should skip if already cancelled (idempotency)', async () => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue({ type: 'REFUND' });

            await service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1');

            expect(mockPrismaBase.studentPackage.findUnique).not.toHaveBeenCalled();
        });

        it('should throw if package not found', async () => {
            mockPrismaBase.packageTransaction.findUnique.mockResolvedValue(null);
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue(null);

            await expect(service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw if package not active', async () => {
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue({
                ...mockStudentPackage,
                status: 'COMPLETED'
            });

            await expect(service.cancelPackage('package-1', 'STUDENT', 'cancel-key-1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    // =========================================================
    // createRedemption
    // =========================================================
    describe('createRedemption', () => {
        beforeEach(() => {
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue(mockStudentPackage);
            mockPrismaBase.packageRedemption.create.mockResolvedValue({
                id: 'redemption-1',
                status: 'RESERVED'
            });
        });

        it('should create a RESERVED redemption', async () => {
            const result = await service.createRedemption('package-1', 'booking-1');

            expect(result.status).toBe('RESERVED');
            expect(mockPrismaBase.packageRedemption.create).toHaveBeenCalledWith({
                data: {
                    packageId: 'package-1',
                    bookingId: 'booking-1',
                    status: 'RESERVED'
                }
            });
        });

        it('should throw if package not active', async () => {
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue({
                ...mockStudentPackage,
                status: 'EXPIRED'
            });

            await expect(service.createRedemption('package-1', 'booking-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw if no sessions remaining', async () => {
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue({
                ...mockStudentPackage,
                sessionsUsed: 5 // All 5 used
            });

            await expect(service.createRedemption('package-1', 'booking-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw if package expired', async () => {
            mockPrismaBase.studentPackage.findUnique.mockResolvedValue({
                ...mockStudentPackage,
                expiresAt: new Date('2020-01-01')
            });

            await expect(service.createRedemption('package-1', 'booking-1'))
                .rejects.toThrow(BadRequestException);
        });
    });
});
