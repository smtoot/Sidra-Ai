import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { normalizeMoney } from '../utils/money';
import { ReadableIdService } from '../common/readable-id/readable-id.service';

@Injectable()
export class PackageService {
    constructor(
        private prisma: PrismaService,
        private readableIdService: ReadableIdService
    ) { }

    // =====================================================
    // PACKAGE TIERS (Admin config)
    // =====================================================

    async getActiveTiers() {
        return this.prisma.packageTier.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
    }

    async getAllTiers() {
        return this.prisma.packageTier.findMany({
            orderBy: { displayOrder: 'asc' }
        });
    }

    async getTierById(tierId: string) {
        const tier = await this.prisma.packageTier.findUnique({ where: { id: tierId } });
        if (!tier) throw new NotFoundException('Package tier not found');
        return tier;
    }

    // =====================================================
    // ADMIN: Manage Tiers
    // =====================================================

    async createTier(data: { sessionCount: number; discountPercent: number; displayOrder: number }) {
        return this.prisma.packageTier.create({
            data: {
                sessionCount: data.sessionCount,
                discountPercent: new Decimal(data.discountPercent),
                isActive: true,
                displayOrder: data.displayOrder
            }
        });
    }

    async updateTier(id: string, data: { isActive?: boolean; displayOrder?: number; discountPercent?: number }) {
        return this.prisma.packageTier.update({
            where: { id },
            data: {
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
                ...(data.discountPercent !== undefined && { discountPercent: new Decimal(data.discountPercent) })
            }
        });
    }

    async deleteTier(id: string) {
        // Soft delete by deactivating
        return this.prisma.packageTier.update({
            where: { id },
            data: { isActive: false }
        });
    }

    async getAdminStats() {
        const demoEnabledCount = await this.prisma.teacherDemoSettings.count({
            where: { demoEnabled: true }
        });
        return { demoEnabledCount };
    }



    // =====================================================
    // PURCHASE PACKAGE (Transaction-wrapped + Idempotent)
    // =====================================================

    async purchasePackage(
        payerId: string,
        studentId: string,
        teacherId: string,
        subjectId: string,
        tierId: string,
        idempotencyKey: string
    ) {
        // 1. Check if packages are globally enabled
        const settings = await this.prisma.systemSettings.findFirst();
        if (settings && !settings.packagesEnabled) {
            throw new BadRequestException('Packages feature is currently disabled');
        }

        // 2. Fetch tier details
        // Idempotency check
        const existingTx = await this.prisma.packageTransaction.findUnique({
            where: { idempotencyKey }
        });
        if (existingTx) {
            // Return existing package
            return this.prisma.studentPackage.findUnique({ where: { id: existingTx.packageId } });
        }

        // Get tier and teacher subject pricing
        const tier = await this.getTierById(tierId);
        const teacherSubject = await this.prisma.teacherSubject.findFirst({
            where: { teacherId, subjectId }
        });
        if (!teacherSubject) {
            throw new BadRequestException('Teacher does not teach this subject');
        }

        // Calculate prices (immutable snapshot) with MONEY NORMALIZATION
        const originalPrice = normalizeMoney(teacherSubject.pricePerHour);
        const discountMultiplier = new Decimal(1).sub(tier.discountPercent.div(100)).toNumber();
        const discountedPrice = normalizeMoney(originalPrice * discountMultiplier);
        const totalPaid = normalizeMoney(discountedPrice * tier.sessionCount);
        const perSessionRelease = discountedPrice; // Already normalized

        // Get system settings for expiry (already fetched above)
        const expiryDays = 90; // Default 3 months, can be made configurable
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        // Verify payer has sufficient balance
        const payerWallet = await this.prisma.wallet.findUnique({ where: { userId: payerId } });
        if (!payerWallet) {
            throw new BadRequestException('Payer wallet not found');
        }
        if (payerWallet.balance.lessThan(totalPaid)) {
            throw new BadRequestException('Insufficient balance for package purchase');
        }

        // Execute purchase in DB transaction
        return this.prisma.$transaction(async (tx) => {
            // 1. Get payer wallet for transaction record
            const wallet = await tx.wallet.findUnique({ where: { userId: payerId } });
            if (!wallet) throw new BadRequestException('Payer wallet not found');

            // 2. Debit payer wallet
            await tx.wallet.update({
                where: { userId: payerId },
                data: { balance: { decrement: totalPaid } }
            });

            // P0-PKG-4 FIX: Create Wallet Transaction record for purchase debit
            const paymentTxId = await this.readableIdService.generate('TRANSACTION');
            await tx.transaction.create({
                data: {
                    readableId: paymentTxId,
                    walletId: wallet.id,
                    amount: totalPaid,
                    type: 'PACKAGE_PURCHASE',
                    status: 'APPROVED',
                    adminNote: `Package purchase for teacher ${teacherId}, subject ${subjectId}`
                }
            });

            // 3. Create package
            const packageReadableId = await this.readableIdService.generate('PACKAGE');
            const studentPackage = await tx.studentPackage.create({
                data: {
                    readableId: packageReadableId,
                    payerId,
                    studentId,
                    teacherId,
                    subjectId,
                    sessionCount: tier.sessionCount,
                    sessionsUsed: 0,
                    originalPricePerSession: originalPrice,
                    discountedPricePerSession: discountedPrice,
                    perSessionReleaseAmount: perSessionRelease,
                    totalPaid,
                    escrowRemaining: totalPaid,
                    status: 'ACTIVE',
                    expiresAt
                }
            });

            // 4. Record package transaction for idempotency
            await tx.packageTransaction.create({
                data: {
                    idempotencyKey,
                    type: 'PURCHASE',
                    packageId: studentPackage.id,
                    amount: totalPaid
                }
            });

            return studentPackage;
        });
    }

    // =====================================================
    // RELEASE SESSION (Transaction-wrapped + Idempotent)
    // Called only on booking COMPLETION
    // =====================================================

    async releaseSession(bookingId: string, idempotencyKey: string) {
        // Idempotency check
        const existingTx = await this.prisma.packageTransaction.findUnique({
            where: { idempotencyKey }
        });
        if (existingTx) {
            return; // Already processed
        }

        // Find redemption for this booking
        const redemption = await this.prisma.packageRedemption.findUnique({
            where: { bookingId },
            include: { package: { include: { teacher: true } } }
        });

        if (!redemption) {
            throw new NotFoundException('No package redemption found for this booking');
        }

        if (redemption.status !== 'RESERVED') {
            throw new BadRequestException(`Cannot release: redemption status is ${redemption.status}`);
        }

        const pkg = redemption.package;
        const isLast = pkg.sessionsUsed + 1 === pkg.sessionCount;

        // Last session: release ALL remaining (avoids rounding drift)
        const releaseAmount = isLast
            ? pkg.escrowRemaining
            : pkg.perSessionReleaseAmount;

        // Execute in transaction
        await this.prisma.$transaction(async (tx) => {
            // 1. Credit teacher wallet (minus commission - using default 18%)
            const commissionRate = 0.18;
            const normalizedReleaseAmount = normalizeMoney(releaseAmount); // MONEY NORMALIZATION
            const teacherAmount = normalizeMoney(normalizedReleaseAmount * (1 - commissionRate));

            // Get teacher wallet for Transaction record
            const teacherWallet = await tx.wallet.findUnique({
                where: { userId: pkg.teacher.userId }
            });
            if (!teacherWallet) {
                throw new BadRequestException('Teacher wallet not found');
            }

            await tx.wallet.update({
                where: { userId: pkg.teacher.userId },
                data: { balance: { increment: teacherAmount } }
            });

            // P1 FIX: Add wallet Transaction for teacher earnings (audit trail)
            const teacherTxId = await this.readableIdService.generate('TRANSACTION');
            await tx.transaction.create({
                data: {
                    readableId: teacherTxId,
                    walletId: teacherWallet.id,
                    amount: teacherAmount,
                    type: 'PACKAGE_RELEASE',
                    status: 'APPROVED',
                    adminNote: `Package session release for booking ${bookingId} (${(commissionRate * 100).toFixed(0)}% commission)`
                }
            });

            // 2. Update package
            await tx.studentPackage.update({
                where: { id: pkg.id },
                data: {
                    sessionsUsed: { increment: 1 },
                    escrowRemaining: { decrement: releaseAmount },
                    status: isLast ? 'COMPLETED' : 'ACTIVE'
                }
            });

            // 3. Update redemption status
            await tx.packageRedemption.update({
                where: { id: redemption.id },
                data: {
                    status: 'RELEASED',
                    releasedAt: new Date()
                }
            });

            // 4. Record transaction
            await tx.packageTransaction.create({
                data: {
                    idempotencyKey,
                    type: 'RELEASE',
                    packageId: pkg.id,
                    amount: releaseAmount
                }
            });
        });
    }

    // =====================================================
    // CANCEL PACKAGE (Refund escrowRemaining)
    // =====================================================

    async cancelPackage(packageId: string, cancelledBy: 'STUDENT' | 'TEACHER' | 'ADMIN', idempotencyKey: string) {
        // Idempotency check
        const existingTx = await this.prisma.packageTransaction.findUnique({
            where: { idempotencyKey }
        });
        if (existingTx) {
            return; // Already processed
        }

        const pkg = await this.prisma.studentPackage.findUnique({
            where: { id: packageId }
        });

        if (!pkg) {
            throw new NotFoundException('Package not found');
        }

        if (pkg.status !== 'ACTIVE') {
            throw new BadRequestException(`Cannot cancel: package status is ${pkg.status}`);
        }

        // P0-PKG-3 FIX: Apply normalizeMoney to refund amount
        const refundAmount = normalizeMoney(pkg.escrowRemaining);

        // Cancel any pending redemptions
        await this.prisma.$transaction(async (tx) => {
            // 0. Get wallet for transaction record
            const wallet = await tx.wallet.findUnique({ where: { userId: pkg.payerId } });
            if (!wallet) throw new BadRequestException('Payer wallet not found');

            // 1. Update pending redemptions to CANCELLED
            await tx.packageRedemption.updateMany({
                where: { packageId, status: 'RESERVED' },
                data: { status: 'CANCELLED' }
            });

            // 2. Refund to payer wallet
            await tx.wallet.update({
                where: { userId: pkg.payerId },
                data: { balance: { increment: refundAmount } }
            });

            // 3. Update package status
            await tx.studentPackage.update({
                where: { id: packageId },
                data: {
                    status: 'CANCELLED',
                    escrowRemaining: new Decimal(0)
                }
            });

            // 4. Create Wallet Transaction record for refund
            const refundTxId = await this.readableIdService.generate('TRANSACTION');
            await tx.transaction.create({
                data: {
                    readableId: refundTxId,
                    walletId: wallet.id,
                    amount: refundAmount,
                    type: 'REFUND',
                    status: 'APPROVED',
                    adminNote: `Package ${packageId} cancelled - refund`
                }
            });

            // 5. Record package transaction for idempotency
            await tx.packageTransaction.create({
                data: {
                    idempotencyKey,
                    type: 'REFUND',
                    packageId,
                    amount: refundAmount
                }
            });
        });
    }

    // =====================================================
    // EXPIRE PACKAGES (Cron-safe, Idempotent)
    // =====================================================

    async expirePackages() {
        const now = new Date();
        const expiredPackages = await this.prisma.studentPackage.findMany({
            where: {
                expiresAt: { lt: now },
                status: 'ACTIVE'
            }
        });

        for (const pkg of expiredPackages) {
            const idempotencyKey = `EXPIRE_${pkg.id}`;

            // Skip if already processed (idempotency)
            const existingTx = await this.prisma.packageTransaction.findUnique({
                where: { idempotencyKey }
            });
            if (existingTx) continue;

            await this.prisma.$transaction(async (tx) => {
                // 1. Refund remaining escrow to payer
                await tx.wallet.update({
                    where: { userId: pkg.payerId },
                    data: { balance: { increment: pkg.escrowRemaining } }
                });

                // 1.1 Create Refund Transaction
                const wallet = await tx.wallet.findUnique({ where: { userId: pkg.payerId } });
                if (wallet) {
                    const refundTxId = await this.readableIdService.generate('TRANSACTION');
                    await tx.transaction.create({
                        data: {
                            readableId: refundTxId,
                            walletId: wallet.id,
                            amount: pkg.escrowRemaining,
                            type: 'REFUND',
                            status: 'APPROVED',
                            adminNote: `Package ${pkg.id} expired - auto refund`
                        }
                    });
                }

                // 2. Cancel pending redemptions
                await tx.packageRedemption.updateMany({
                    where: { packageId: pkg.id, status: 'RESERVED' },
                    data: { status: 'CANCELLED' }
                });

                // 3. Mark package as expired
                await tx.studentPackage.update({
                    where: { id: pkg.id },
                    data: {
                        status: 'EXPIRED',
                        escrowRemaining: new Decimal(0)
                    }
                });

                // 4. Record transaction
                await tx.packageTransaction.create({
                    data: {
                        idempotencyKey,
                        type: 'EXPIRE',
                        packageId: pkg.id,
                        amount: pkg.escrowRemaining
                    }
                });
            });
        }

        return { expiredCount: expiredPackages.length };
    }

    // =====================================================
    // HELPER: Create redemption when booking from package
    // =====================================================

    async createRedemption(packageId: string, bookingId: string) {
        const pkg = await this.prisma.studentPackage.findUnique({
            where: { id: packageId }
        });

        if (!pkg) {
            throw new NotFoundException('Package not found');
        }

        if (pkg.status !== 'ACTIVE') {
            throw new BadRequestException(`Cannot use package: status is ${pkg.status}`);
        }

        if (pkg.sessionsUsed >= pkg.sessionCount) {
            throw new BadRequestException('All sessions in this package have been used');
        }

        // Check expiry
        if (new Date() > pkg.expiresAt) {
            throw new BadRequestException('Package has expired');
        }

        return this.prisma.packageRedemption.create({
            data: {
                packageId,
                bookingId,
                status: 'RESERVED'
            }
        });
    }

    // =====================================================
    // GET USER PACKAGES
    // =====================================================

    async getStudentPackages(userId: string) {
        return this.prisma.studentPackage.findMany({
            where: {
                OR: [
                    { studentId: userId },
                    { payerId: userId }
                ]
            },
            include: {
                teacher: { select: { displayName: true, profilePhotoUrl: true } },
                subject: { select: { nameAr: true, nameEn: true } },
                redemptions: {
                    include: {
                        booking: {
                            select: { status: true }
                        }
                    }
                }
            },
            orderBy: { purchasedAt: 'desc' }
        });
    }

    async getPackageById(packageId: string) {
        const pkg = await this.prisma.studentPackage.findUnique({
            where: { id: packageId },
            include: {
                payer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        parentProfile: {
                            select: {
                                id: true,
                                children: {
                                    select: { id: true, name: true, gradeLevel: true }
                                }
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePhotoUrl: true,
                        userId: true  // Include for navigation
                    }
                },
                subject: { select: { nameAr: true, nameEn: true } },
                redemptions: {
                    include: {
                        booking: {
                            select: {
                                startTime: true,
                                status: true,
                                childId: true,
                                child: {
                                    select: { id: true, name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!pkg) {
            throw new NotFoundException('Package not found');
        }

        return pkg;
    }

    async getTeacherPackages(teacherId: string) {
        return this.prisma.studentPackage.findMany({
            where: {
                teacherId
                // Show all packages, not just active
            },
            include: {
                payer: {
                    select: {
                        id: true,
                        email: true,
                        phoneNumber: true,
                        role: true,
                        parentProfile: {
                            select: {
                                id: true,
                                children: {
                                    select: { id: true, name: true, gradeLevel: true }
                                }
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        email: true,
                        phoneNumber: true,
                        studentProfile: { select: { gradeLevel: true } }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        nameAr: true,
                        nameEn: true
                    }
                },
                redemptions: {
                    include: {
                        booking: {
                            select: {
                                startTime: true,
                                status: true,
                                childId: true,
                                child: {
                                    select: { id: true, name: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { purchasedAt: 'desc' }
        });
    }

    // =====================================================
    // SCHEDULE SESSION FROM PACKAGE (HARDENED)
    // Atomic + Conditional Update + Idempotent
    // =====================================================

    async schedulePackageSession(
        packageId: string,
        userId: string,
        startTime: Date,
        endTime: Date,
        timezone: string,
        idempotencyKey: string
    ) {
        // Idempotency check: Return existing if already processed
        const existingTx = await this.prisma.packageTransaction.findUnique({
            where: { idempotencyKey }
        });
        if (existingTx && existingTx.type === 'SCHEDULE') {
            // Find and return the existing booking
            const existingRedemption = await this.prisma.packageRedemption.findFirst({
                where: { packageId },
                include: { booking: true },
                orderBy: { createdAt: 'desc' }
            });
            if (existingRedemption) {
                return {
                    success: true,
                    booking: existingRedemption.booking,
                    sessionsRemaining: 0, // Already processed
                    idempotent: true
                };
            }
        }

        // Execute everything in a single atomic transaction
        return this.prisma.$transaction(async (tx) => {
            // 1. Fetch package inside transaction (for consistent read)
            const pkg = await tx.studentPackage.findUnique({
                where: { id: packageId },
                include: { teacher: true, subject: true }
            });

            if (!pkg) {
                throw new BadRequestException('Package not found');
            }

            // 2. All validations inside transaction
            if (pkg.payerId !== userId && pkg.studentId !== userId) {
                throw new BadRequestException('You do not have access to this package');
            }

            if (pkg.status !== 'ACTIVE') {
                throw new BadRequestException(`Package is not active (status: ${pkg.status})`);
            }

            if (new Date() > pkg.expiresAt) {
                throw new BadRequestException('Package has expired');
            }

            const sessionsRemaining = pkg.sessionCount - pkg.sessionsUsed;
            if (sessionsRemaining <= 0) {
                throw new BadRequestException('No sessions remaining in this package');
            }

            // 3. CONDITIONAL UPDATE: Only succeeds if sessionsUsed hasn't changed
            // This prevents race conditions - if another request incremented first, this fails
            const isLastSession = sessionsRemaining === 1;
            const updateResult = await tx.studentPackage.updateMany({
                where: {
                    id: packageId,
                    sessionsUsed: pkg.sessionsUsed, // Conditional: must match current value
                    status: 'ACTIVE' // Must still be active
                },
                data: {
                    sessionsUsed: { increment: 1 },
                    status: isLastSession ? 'DEPLETED' : 'ACTIVE'
                }
            });

            // 4. If 0 rows updated, another concurrent request won - return 409 Conflict
            if (updateResult.count === 0) {
                throw new ConflictException('Session already reserved by concurrent request. Please retry.');
            }

            // 5. Create booking with SCHEDULED status (package already paid)
            const booking = await tx.booking.create({
                data: {
                    bookedByUserId: userId,
                    beneficiaryType: 'STUDENT',
                    studentUserId: pkg.studentId,
                    teacherId: pkg.teacherId,
                    subjectId: pkg.subjectId,
                    startTime,
                    endTime,
                    timezone,
                    price: normalizeMoney(pkg.discountedPricePerSession), // MONEY NORMALIZATION
                    commissionRate: 0.18,
                    status: 'SCHEDULED'
                }
            });

            // 6. Create redemption record
            await tx.packageRedemption.create({
                data: {
                    packageId,
                    bookingId: booking.id,
                    status: 'RESERVED'
                }
            });

            // 7. Record transaction for idempotency (DB-level unique constraint)
            await tx.packageTransaction.create({
                data: {
                    idempotencyKey,
                    type: 'SCHEDULE',
                    packageId,
                    amount: pkg.discountedPricePerSession
                }
            });

            console.log(`[PackageService] Scheduled session from package ${packageId}, booking ${booking.id}`);

            return {
                success: true,
                booking,
                sessionsRemaining: sessionsRemaining - 1,
                idempotent: false
            };
        });
    }
}

