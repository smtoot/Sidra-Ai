import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PackageService {
    constructor(private prisma: PrismaService) { }

    // =====================================================
    // PACKAGE TIERS (Admin config)
    // =====================================================

    async getActiveTiers() {
        return this.prisma.packageTier.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
    }

    async getTierById(tierId: string) {
        const tier = await this.prisma.packageTier.findUnique({ where: { id: tierId } });
        if (!tier) throw new NotFoundException('Package tier not found');
        return tier;
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

        // Calculate prices (immutable snapshot)
        const originalPrice = new Decimal(teacherSubject.pricePerHour);
        const discountPercent = tier.discountPercent;
        const discountedPrice = originalPrice.mul(new Decimal(1).sub(discountPercent.div(100)));
        const totalPaid = discountedPrice.mul(tier.sessionCount);
        const perSessionRelease = discountedPrice; // Fixed at purchase

        // Get system settings for expiry
        const settings = await this.prisma.systemSettings.findFirst();
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
            // 1. Debit payer wallet
            await tx.wallet.update({
                where: { userId: payerId },
                data: { balance: { decrement: totalPaid } }
            });

            // 2. Create package
            const studentPackage = await tx.studentPackage.create({
                data: {
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

            // 3. Record transaction for idempotency
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
            const commissionAmount = new Decimal(releaseAmount).mul(commissionRate);
            const teacherAmount = new Decimal(releaseAmount).sub(commissionAmount);

            await tx.wallet.update({
                where: { userId: pkg.teacher.userId },
                data: { balance: { increment: teacherAmount } }
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

        const refundAmount = pkg.escrowRemaining;

        // Cancel any pending redemptions
        await this.prisma.$transaction(async (tx) => {
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

            // 4. Record transaction
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

    async getStudentPackages(studentId: string) {
        return this.prisma.studentPackage.findMany({
            where: { studentId },
            include: {
                teacher: { select: { displayName: true, profilePhotoUrl: true } },
                subject: { select: { nameAr: true, nameEn: true } }
            },
            orderBy: { purchasedAt: 'desc' }
        });
    }

    async getPackageById(packageId: string) {
        const pkg = await this.prisma.studentPackage.findUnique({
            where: { id: packageId },
            include: {
                teacher: { select: { displayName: true, profilePhotoUrl: true } },
                subject: { select: { nameAr: true, nameEn: true } },
                redemptions: {
                    include: {
                        booking: { select: { startTime: true, status: true } }
                    }
                }
            }
        });

        if (!pkg) {
            throw new NotFoundException('Package not found');
        }

        return pkg;
    }
}
