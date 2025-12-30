import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { normalizeMoney } from '../utils/money';
import { ReadableIdService } from '../common/readable-id/readable-id.service';
import { NotificationService } from '../notification/notification.service';
import {
  PurchaseSmartPackDto,
  CheckRecurringAvailabilityDto,
  RecurringAvailabilityResponse,
  BookFloatingSessionDto,
  RescheduleSessionDto,
  CreatePackageTierDto,
  UpdatePackageTierDto,
  UpdateTeacherDemoSettingsDto,
  UpdateTeacherTierSettingDto,
} from '@sidra/shared';

@Injectable()
export class PackageService {
  constructor(
    private prisma: PrismaService,
    private readableIdService: ReadableIdService,
    private notificationService: NotificationService,
  ) {}

  // =====================================================
  // PACKAGE TIERS (Admin config)
  // =====================================================

  async getActiveTiers() {
    return this.prisma.packageTier.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAllTiers() {
    return this.prisma.packageTier.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getTierById(tierId: string) {
    const tier = await this.prisma.packageTier.findUnique({
      where: { id: tierId },
    });
    if (!tier) throw new NotFoundException('Package tier not found');
    return tier;
  }

  // =====================================================
  // ADMIN: Manage Tiers
  // =====================================================

  async createTier(data: CreatePackageTierDto) {
    // Validate ratios sum to 1.0
    if (Math.abs(data.recurringRatio + data.floatingRatio - 1.0) > 0.001) {
      throw new BadRequestException(
        'recurringRatio + floatingRatio must equal 1.0',
      );
    }

    return this.prisma.packageTier.create({
      data: {
        sessionCount: data.sessionCount,
        discountPercent: new Decimal(data.discountPercent),
        recurringRatio: new Decimal(data.recurringRatio),
        floatingRatio: new Decimal(data.floatingRatio),
        rescheduleLimit: data.rescheduleLimit,
        durationWeeks: data.durationWeeks,
        gracePeriodDays: data.gracePeriodDays,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionAr: data.descriptionAr,
        descriptionEn: data.descriptionEn,
        isFeatured: data.isFeatured ?? false,
        badge: data.badge,
        displayOrder: data.displayOrder ?? 999,
        isActive: true,
      },
    });
  }

  async updateTier(id: string, data: UpdatePackageTierDto) {
    // Validate ratios if provided
    if (data.recurringRatio !== undefined && data.floatingRatio !== undefined) {
      if (Math.abs(data.recurringRatio + data.floatingRatio - 1.0) > 0.001) {
        throw new BadRequestException(
          'recurringRatio + floatingRatio must equal 1.0',
        );
      }
    }

    return this.prisma.packageTier.update({
      where: { id },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
        ...(data.discountPercent !== undefined && {
          discountPercent: new Decimal(data.discountPercent),
        }),
        ...(data.recurringRatio !== undefined && {
          recurringRatio: new Decimal(data.recurringRatio),
        }),
        ...(data.floatingRatio !== undefined && {
          floatingRatio: new Decimal(data.floatingRatio),
        }),
        ...(data.rescheduleLimit !== undefined && {
          rescheduleLimit: data.rescheduleLimit,
        }),
        ...(data.durationWeeks !== undefined && {
          durationWeeks: data.durationWeeks,
        }),
        ...(data.gracePeriodDays !== undefined && {
          gracePeriodDays: data.gracePeriodDays,
        }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.descriptionAr !== undefined && {
          descriptionAr: data.descriptionAr,
        }),
        ...(data.descriptionEn !== undefined && {
          descriptionEn: data.descriptionEn,
        }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.badge !== undefined && { badge: data.badge }),
      },
    });
  }

  async deleteTier(id: string) {
    // Soft delete by deactivating
    return this.prisma.packageTier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAdminStats() {
    const demoEnabledCount = await this.prisma.teacherDemoSettings.count({
      where: { demoEnabled: true },
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
    idempotencyKey: string,
  ) {
    // 1. Check if packages are globally enabled
    const settings = await this.prisma.systemSettings.findFirst();
    if (settings && !settings.packagesEnabled) {
      throw new BadRequestException('Packages feature is currently disabled');
    }

    // 2. Fetch tier details
    // Idempotency check
    const existingTx = await this.prisma.packageTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTx) {
      // Return existing package
      return this.prisma.studentPackage.findUnique({
        where: { id: existingTx.packageId },
      });
    }

    // Get tier and teacher subject pricing
    const tier = await this.getTierById(tierId);
    const teacherSubject = await this.prisma.teacherSubject.findFirst({
      where: { teacherId, subjectId },
    });
    if (!teacherSubject) {
      throw new BadRequestException('Teacher does not teach this subject');
    }

    // Calculate prices (immutable snapshot) with MONEY NORMALIZATION
    const originalPrice = normalizeMoney(teacherSubject.pricePerHour);
    const discountMultiplier = new Decimal(1)
      .sub(tier.discountPercent.div(100))
      .toNumber();
    const discountedPrice = normalizeMoney(originalPrice * discountMultiplier);
    const totalPaid = normalizeMoney(discountedPrice * tier.sessionCount);
    const perSessionRelease = discountedPrice; // Already normalized

    // Get system settings for expiry (already fetched above)
    const expiryDays = 90; // Default 3 months, can be made configurable
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Verify payer has sufficient balance
    const payerWallet = await this.prisma.wallet.findUnique({
      where: { userId: payerId },
    });
    if (!payerWallet) {
      throw new BadRequestException('Payer wallet not found');
    }
    if (payerWallet.balance.lessThan(totalPaid)) {
      throw new BadRequestException(
        'Insufficient balance for package purchase',
      );
    }

    // Execute purchase in DB transaction
    return this.prisma
      .$transaction(
        async (tx) => {
          // 1. Get payer wallet for transaction record
          const wallet = await tx.wallet.findUnique({
            where: { userId: payerId },
          });
          if (!wallet) throw new BadRequestException('Payer wallet not found');

          // 2. Debit payer wallet
          await tx.wallet.update({
            where: { userId: payerId },
            data: { balance: { decrement: totalPaid } },
          });

          // P0-PKG-4 FIX: Create Wallet Transaction record for purchase debit
          const paymentTxId =
            await this.readableIdService.generate('TRANSACTION');
          await tx.transaction.create({
            data: {
              readableId: paymentTxId,
              walletId: wallet.id,
              amount: totalPaid,
              type: 'PACKAGE_PURCHASE',
              status: 'APPROVED',
              adminNote: `Package purchase for teacher ${teacherId}, subject ${subjectId}`,
            },
          });

          // 3. Create package
          const packageReadableId =
            await this.readableIdService.generate('PACKAGE');
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
              expiresAt,
            },
          });

          // 4. Record package transaction for idempotency
          await tx.packageTransaction.create({
            data: {
              idempotencyKey,
              type: 'PURCHASE',
              packageId: studentPackage.id,
              amount: totalPaid,
            },
          });

          return studentPackage;
        },
        {
          // SECURITY: Use SERIALIZABLE isolation for package purchase
          isolationLevel: 'Serializable',
        },
      )
      .then(async (studentPackage) => {
        // 🟡 MEDIUM PRIORITY - Gap #3 Fix: Notify parent of package purchase confirmation
        try {
          // Fetch teacher and subject details for notification
          const [teacher, subject] = await Promise.all([
            this.prisma.teacherProfile.findUnique({
              where: { id: teacherId },
              select: { user: { select: { phoneNumber: true, email: true } } },
            }),
            this.prisma.subject.findUnique({
              where: { id: subjectId },
              select: { nameAr: true },
            }),
          ]);

          const teacherName =
            teacher?.user?.phoneNumber || teacher?.user?.email || 'المعلم';
          const subjectName = subject?.nameAr || 'المادة';

          await this.notificationService.notifyUser({
            userId: payerId,
            type: 'PAYMENT_SUCCESS',
            title: 'تم شراء الباقة بنجاح',
            message: `تم شراء باقة من ${tier.sessionCount} حصة مع ${teacherName} في مادة ${subjectName} بمبلغ ${totalPaid} SDG`,
            link: '/parent/packages',
            dedupeKey: `PACKAGE_PURCHASED:${studentPackage.id}:${payerId}`,
            metadata: {
              packageId: studentPackage.id,
              sessionCount: tier.sessionCount,
              totalPaid,
              teacherId,
              subjectId,
            },
          });
        } catch (error) {
          // Log error but don't fail the purchase
          console.error('Failed to send package purchase notification:', error);
        }

        return studentPackage;
      });
  }

  // =====================================================
  // SMART PACK: Purchase with Recurring Pattern
  // =====================================================

  async purchaseSmartPackage(data: PurchaseSmartPackDto) {
    // 1. Check if packages are globally enabled
    const settings = await this.prisma.systemSettings.findFirst();
    if (settings && !settings.packagesEnabled) {
      throw new BadRequestException('Packages feature is currently disabled');
    }

    // 2. Check if teacher has packages enabled
    const teacherSettings = await this.prisma.teacherDemoSettings.findUnique({
      where: { teacherId: data.teacherId },
    });
    if (!teacherSettings?.packagesEnabled) {
      throw new BadRequestException('This teacher does not offer Smart Packs');
    }

    // 3. Check if teacher has this specific tier enabled
    const tierSetting = await this.prisma.teacherPackageTierSetting.findUnique({
      where: {
        teacherId_tierId: {
          teacherId: data.teacherId,
          tierId: data.tierId,
        },
      },
    });
    // If no record exists, default to enabled. If record exists, check isEnabled
    if (tierSetting && !tierSetting.isEnabled) {
      throw new BadRequestException(
        'This package tier is not available from this teacher',
      );
    }

    // 4. Idempotency check
    const existingTx = await this.prisma.packageTransaction.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existingTx) {
      return this.prisma.studentPackage.findUnique({
        where: { id: existingTx.packageId },
        include: {
          teacher: { select: { displayName: true, profilePhotoUrl: true } },
          subject: { select: { nameAr: true, nameEn: true } },
        },
      });
    }

    // 5. Get tier and teacher subject pricing
    const tier = await this.getTierById(data.tierId);
    if (!tier.isActive) {
      throw new BadRequestException(
        'This package tier is not currently available',
      );
    }

    const teacherSubject = await this.prisma.teacherSubject.findFirst({
      where: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
      },
      include: { subject: true },
    });
    if (!teacherSubject) {
      throw new BadRequestException('Teacher does not teach this subject');
    }

    // 6. Calculate session counts based on tier ratios
    const recurringSessionCount = Math.round(
      tier.sessionCount * tier.recurringRatio.toNumber(),
    );
    const floatingSessionCount = tier.sessionCount - recurringSessionCount;

    // 7. Validate recurring availability
    const availabilityCheck = await this.checkRecurringAvailability({
      teacherId: data.teacherId,
      weekday: data.recurringWeekday,
      time: data.recurringTime,
      sessionCount: recurringSessionCount,
    });

    if (!availabilityCheck.available) {
      throw new BadRequestException(
        `Teacher is not available for ${recurringSessionCount} consecutive ${data.recurringWeekday}s at ${data.recurringTime}. Conflicts: ${availabilityCheck.conflicts.length}`,
      );
    }

    // 8. Calculate prices (immutable snapshot)
    const originalPrice = normalizeMoney(teacherSubject.pricePerHour);
    const discountMultiplier = new Decimal(1)
      .sub(tier.discountPercent.div(100))
      .toNumber();
    const discountedPrice = normalizeMoney(originalPrice * discountMultiplier);
    const totalPaid = normalizeMoney(discountedPrice * tier.sessionCount);
    const perSessionRelease = discountedPrice;

    // 9. Calculate expiry dates
    const firstScheduledSession = availabilityCheck.firstSession;
    const lastScheduledSession = availabilityCheck.lastSession;
    const gracePeriodEnds = new Date(lastScheduledSession!);
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + tier.gracePeriodDays);

    // 10. Verify payer has sufficient balance
    const payerWallet = await this.prisma.wallet.findUnique({
      where: { userId: data.studentId },
    });
    if (!payerWallet) {
      throw new BadRequestException('Student wallet not found');
    }
    if (payerWallet.balance.lessThan(totalPaid)) {
      throw new BadRequestException(
        'Insufficient balance for Smart Pack purchase',
      );
    }

    // 11. Execute purchase in DB transaction
    return this.prisma
      .$transaction(
        async (tx) => {
          // Debit student wallet
          await tx.wallet.update({
            where: { userId: data.studentId },
            data: { balance: { decrement: totalPaid } },
          });

          // Create wallet transaction record
          const paymentTxId =
            await this.readableIdService.generate('TRANSACTION');
          await tx.transaction.create({
            data: {
              readableId: paymentTxId,
              walletId: payerWallet.id,
              amount: totalPaid,
              type: 'PACKAGE_PURCHASE',
              status: 'APPROVED',
              adminNote: `Smart Pack purchase - ${tier.sessionCount} sessions`,
            },
          });

          // Create Smart Pack package
          const packageReadableId =
            await this.readableIdService.generate('PACKAGE');
          const studentPackage = await tx.studentPackage.create({
            data: {
              readableId: packageReadableId,
              payerId: data.studentId,
              studentId: data.studentId,
              teacherId: data.teacherId,
              subjectId: data.subjectId,
              tierId: data.tierId,
              sessionCount: tier.sessionCount,
              sessionsUsed: 0,
              originalPricePerSession: originalPrice,
              discountedPricePerSession: discountedPrice,
              perSessionReleaseAmount: perSessionRelease,
              totalPaid,
              escrowRemaining: totalPaid,
              status: 'ACTIVE',
              isSmartPack: true,
              recurringWeekday: data.recurringWeekday,
              recurringTime: data.recurringTime,
              recurringSessionCount,
              floatingSessionCount,
              floatingSessionsUsed: 0,
              rescheduleLimit: tier.rescheduleLimit,
              firstScheduledSession,
              lastScheduledSession,
              gracePeriodEnds,
              expiresAt: gracePeriodEnds, // Expires after grace period
            },
            include: {
              teacher: { select: { displayName: true, profilePhotoUrl: true } },
              subject: { select: { nameAr: true, nameEn: true } },
            },
          });

          // Record package transaction for idempotency
          await tx.packageTransaction.create({
            data: {
              idempotencyKey: data.idempotencyKey,
              type: 'PURCHASE',
              packageId: studentPackage.id,
              amount: totalPaid,
            },
          });

          // Auto-schedule the recurring sessions
          for (let i = 0; i < recurringSessionCount; i++) {
            const sessionDate = new Date(availabilityCheck.suggestedDates[i]);
            const [hours, minutes] = data.recurringTime.split(':').map(Number);
            sessionDate.setHours(hours, minutes, 0, 0);

            const endTime = new Date(sessionDate);
            endTime.setHours(endTime.getHours() + 1); // Assuming 1-hour sessions

            const booking = await tx.booking.create({
              data: {
                bookedByUserId: data.studentId,
                beneficiaryType: 'STUDENT',
                studentUserId: data.studentId,
                teacherId: data.teacherId,
                subjectId: data.subjectId,
                startTime: sessionDate,
                endTime,
                timezone: 'Asia/Riyadh', // Default timezone
                price: discountedPrice,
                commissionRate: 0.18,
                status: 'SCHEDULED',
                packageSessionType: 'AUTO_SCHEDULED',
                maxReschedules: tier.rescheduleLimit,
                rescheduleCount: 0,
                originalScheduledAt: sessionDate,
              },
            });

            // Create redemption record
            await tx.packageRedemption.create({
              data: {
                packageId: studentPackage.id,
                bookingId: booking.id,
                status: 'RESERVED',
              },
            });
          }

          // Update package sessionsUsed to reflect auto-scheduled sessions
          await tx.studentPackage.update({
            where: { id: studentPackage.id },
            data: { sessionsUsed: recurringSessionCount },
          });

          return studentPackage;
        },
        {
          isolationLevel: 'Serializable',
        },
      )
      .then(async (studentPackage) => {
        // 🟡 MEDIUM PRIORITY - Gap #3 Fix: Notify parent of Smart Pack purchase confirmation
        try {
          await this.notificationService.notifyUser({
            userId: data.studentId,
            type: 'PAYMENT_SUCCESS',
            title: 'تم شراء الباقة الذكية بنجاح',
            message: `تم شراء باقة ذكية من ${tier.sessionCount} حصة (${recurringSessionCount} حصة مجدولة تلقائياً + ${floatingSessionCount} حصة مرنة) في مادة ${teacherSubject.subject.nameAr} بمبلغ ${totalPaid} SDG`,
            link: '/parent/packages',
            dedupeKey: `PACKAGE_PURCHASED:${studentPackage.id}:${data.studentId}`,
            metadata: {
              packageId: studentPackage.id,
              sessionCount: tier.sessionCount,
              recurringSessionCount,
              floatingSessionCount,
              totalPaid,
              teacherId: data.teacherId,
              subjectId: data.subjectId,
            },
          });
        } catch (error) {
          // Log error but don't fail the purchase
          console.error(
            'Failed to send Smart Pack purchase notification:',
            error,
          );
        }

        return studentPackage;
      });
  }

  // =====================================================
  // SMART PACK: Check Recurring Availability
  // =====================================================

  async checkRecurringAvailability(
    data: CheckRecurringAvailabilityDto,
  ): Promise<RecurringAvailabilityResponse> {
    // Get tier to calculate duration
    const tier = await this.prisma.packageTier.findFirst({
      where: {
        sessionCount: { gte: data.sessionCount },
        isActive: true,
      },
      orderBy: { sessionCount: 'asc' },
    });

    if (!tier) {
      throw new BadRequestException('No suitable package tier found');
    }

    // Map weekday string to day index (0 = Sunday)
    const weekdayMap: Record<string, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const targetDayIndex = weekdayMap[data.weekday];
    if (targetDayIndex === undefined) {
      throw new BadRequestException('Invalid weekday');
    }

    // Generate N consecutive weeks of the target weekday
    const suggestedDates: Date[] = [];
    const conflicts: Date[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Find the next occurrence of the target weekday
    const daysUntilTarget = (targetDayIndex - startDate.getDay() + 7) % 7;
    const nextOccurrence = new Date(startDate);
    nextOccurrence.setDate(
      nextOccurrence.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget),
    );

    for (let i = 0; i < data.sessionCount; i++) {
      const sessionDate = new Date(nextOccurrence);
      sessionDate.setDate(sessionDate.getDate() + i * 7); // Add weeks

      const [hours, minutes] = data.time.split(':').map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);

      const endTime = new Date(sessionDate);
      endTime.setHours(endTime.getHours() + 1);

      // Check for conflicts
      const conflict = await this.prisma.booking.findFirst({
        where: {
          teacherId: data.teacherId,
          status: 'SCHEDULED',
          OR: [
            {
              AND: [
                { startTime: { lte: sessionDate } },
                { endTime: { gt: sessionDate } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      });

      if (conflict) {
        conflicts.push(sessionDate);
      } else {
        suggestedDates.push(sessionDate);
      }
    }

    const available = conflicts.length === 0;
    const firstSession = suggestedDates[0];
    const lastSession = suggestedDates[suggestedDates.length - 1];
    const packageEndDate = lastSession
      ? new Date(
          lastSession.getTime() + tier.gracePeriodDays * 24 * 60 * 60 * 1000,
        )
      : undefined;

    return {
      available,
      conflicts,
      suggestedDates,
      firstSession,
      lastSession,
      packageEndDate,
    };
  }

  // =====================================================
  // SMART PACK: Book Floating Session
  // =====================================================

  async bookFloatingSession(
    packageId: string,
    userId: string,
    data: BookFloatingSessionDto,
  ) {
    const pkg = await this.prisma.studentPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Verify ownership
    if (pkg.payerId !== userId && pkg.studentId !== userId) {
      throw new BadRequestException('You do not have access to this package');
    }

    // Verify package is active
    if (pkg.status !== 'ACTIVE') {
      throw new BadRequestException(`Package is ${pkg.status}`);
    }

    // Verify not expired (including grace period)
    if (new Date() > pkg.gracePeriodEnds!) {
      throw new BadRequestException('Package has expired');
    }

    // Verify floating sessions available
    if (pkg.floatingSessionsUsed >= pkg.floatingSessionCount!) {
      throw new BadRequestException('No floating sessions remaining');
    }

    // Parse date and time
    const sessionDate = new Date(data.date);
    const [hours, minutes] = data.time.split(':').map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const endTime = new Date(sessionDate);
    endTime.setHours(endTime.getHours() + 1);

    // Check teacher availability
    const conflict = await this.prisma.booking.findFirst({
      where: {
        teacherId: pkg.teacherId,
        status: 'SCHEDULED',
        OR: [
          {
            AND: [
              { startTime: { lte: sessionDate } },
              { endTime: { gt: sessionDate } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestException('Teacher is not available at this time');
    }

    // Create booking in transaction
    return this.prisma.$transaction(
      async (tx) => {
        // Create booking
        const booking = await tx.booking.create({
          data: {
            bookedByUserId: userId,
            beneficiaryType: 'STUDENT',
            studentUserId: pkg.studentId,
            teacherId: pkg.teacherId,
            subjectId: pkg.subjectId,
            startTime: sessionDate,
            endTime,
            timezone: 'Asia/Riyadh',
            price: pkg.discountedPricePerSession,
            commissionRate: 0.18,
            status: 'SCHEDULED',
            packageSessionType: 'FLOATING',
            maxReschedules: pkg.rescheduleLimit,
            rescheduleCount: 0,
            originalScheduledAt: sessionDate,
          },
        });

        // Create redemption
        await tx.packageRedemption.create({
          data: {
            packageId,
            bookingId: booking.id,
            status: 'RESERVED',
          },
        });

        // Increment floating sessions used and total sessions used
        await tx.studentPackage.update({
          where: { id: packageId },
          data: {
            floatingSessionsUsed: { increment: 1 },
            sessionsUsed: { increment: 1 },
          },
        });

        return booking;
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  // =====================================================
  // SMART PACK: Reschedule Session
  // =====================================================

  async reschedulePackageSession(
    bookingId: string,
    userId: string,
    data: RescheduleSessionDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        packageRedemption: {
          include: { package: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify this is a package booking
    if (!booking.packageRedemption) {
      throw new BadRequestException('This is not a package booking');
    }

    const pkg = booking.packageRedemption.package;

    // Verify ownership
    if (pkg.payerId !== userId && pkg.studentId !== userId) {
      throw new BadRequestException('You do not have access to this booking');
    }

    // Verify reschedule limit
    if (booking.rescheduleCount >= booking.maxReschedules) {
      throw new BadRequestException(
        `Reschedule limit reached (${booking.maxReschedules} reschedules allowed)`,
      );
    }

    // Verify booking is scheduled
    if (booking.status !== 'SCHEDULED') {
      throw new BadRequestException(
        `Cannot reschedule: booking is ${booking.status}`,
      );
    }

    // Parse new date and time
    const newDate = new Date(data.newDate);
    const [hours, minutes] = data.newTime.split(':').map(Number);
    newDate.setHours(hours, minutes, 0, 0);

    const newEndTime = new Date(newDate);
    newEndTime.setHours(newEndTime.getHours() + 1);

    // Check teacher availability at new time
    const conflict = await this.prisma.booking.findFirst({
      where: {
        teacherId: booking.teacherId,
        id: { not: bookingId }, // Exclude current booking
        status: 'SCHEDULED',
        OR: [
          {
            AND: [
              { startTime: { lte: newDate } },
              { endTime: { gt: newDate } },
            ],
          },
          {
            AND: [
              { startTime: { lt: newEndTime } },
              { endTime: { gte: newEndTime } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestException('Teacher is not available at the new time');
    }

    // Update booking
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        startTime: newDate,
        endTime: newEndTime,
        rescheduleCount: { increment: 1 },
      },
    });
  }

  // =====================================================
  // TEACHER: Manage Package Settings
  // =====================================================

  async updateTeacherDemoSettings(
    teacherId: string,
    data: UpdateTeacherDemoSettingsDto,
  ) {
    return this.prisma.teacherDemoSettings.upsert({
      where: { teacherId },
      update: {
        ...(data.demoEnabled !== undefined && {
          demoEnabled: data.demoEnabled,
        }),
        ...(data.packagesEnabled !== undefined && {
          packagesEnabled: data.packagesEnabled,
        }),
      },
      create: {
        teacherId,
        demoEnabled: data.demoEnabled ?? false,
        packagesEnabled: data.packagesEnabled ?? false,
      },
    });
  }

  async updateTeacherTierSetting(
    teacherId: string,
    tierId: string,
    data: UpdateTeacherTierSettingDto,
  ) {
    // Verify tier exists
    await this.getTierById(tierId);

    return this.prisma.teacherPackageTierSetting.upsert({
      where: {
        teacherId_tierId: { teacherId, tierId },
      },
      update: {
        isEnabled: data.isEnabled,
      },
      create: {
        teacherId,
        tierId,
        isEnabled: data.isEnabled,
      },
    });
  }

  async getTeacherTierSettings(teacherId: string) {
    const allTiers = await this.getActiveTiers();
    const teacherSettings =
      await this.prisma.teacherPackageTierSetting.findMany({
        where: { teacherId },
        include: { tier: true },
      });

    // Map settings to tiers (default enabled if no record)
    return allTiers.map((tier) => {
      const setting = teacherSettings.find((s) => s.tierId === tier.id);
      return {
        tier,
        isEnabled: setting?.isEnabled ?? true, // Default to enabled
      };
    });
  }

  // =====================================================
  // SMART PACK: Expiry with Floating Refund
  // =====================================================

  async expireSmartPacks() {
    const now = new Date();
    const expiredPackages = await this.prisma.studentPackage.findMany({
      where: {
        gracePeriodEnds: { lt: now },
        status: 'ACTIVE',
        isSmartPack: true,
      },
    });

    let refundedCount = 0;

    for (const pkg of expiredPackages) {
      const idempotencyKey = `EXPIRE_SMART_${pkg.id}`;

      // Skip if already processed
      const existingTx = await this.prisma.packageTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) continue;

      await this.prisma.$transaction(async (tx) => {
        // Calculate refund for unused floating sessions
        const unusedFloating =
          pkg.floatingSessionCount! - pkg.floatingSessionsUsed;
        const refundAmount = normalizeMoney(
          pkg.discountedPricePerSession.toNumber() * unusedFloating,
        );

        if (refundAmount > 0) {
          // Refund to payer
          await tx.wallet.update({
            where: { userId: pkg.payerId },
            data: { balance: { increment: refundAmount } },
          });

          // Create refund transaction
          const wallet = await tx.wallet.findUnique({
            where: { userId: pkg.payerId },
          });
          if (wallet) {
            const refundTxId =
              await this.readableIdService.generate('TRANSACTION');
            await tx.transaction.create({
              data: {
                readableId: refundTxId,
                walletId: wallet.id,
                amount: refundAmount,
                type: 'REFUND',
                status: 'APPROVED',
                adminNote: `Smart Pack expired - ${unusedFloating} unused floating sessions refunded`,
              },
            });
          }
        }

        // Cancel pending redemptions
        await tx.packageRedemption.updateMany({
          where: { packageId: pkg.id, status: 'RESERVED' },
          data: { status: 'CANCELLED' },
        });

        // Mark package as expired
        await tx.studentPackage.update({
          where: { id: pkg.id },
          data: {
            status: 'EXPIRED',
            escrowRemaining: new Decimal(0),
          },
        });

        // Record transaction
        await tx.packageTransaction.create({
          data: {
            idempotencyKey,
            type: 'EXPIRE',
            packageId: pkg.id,
            amount: refundAmount,
          },
        });

        refundedCount++;
      });
    }

    return { expiredCount: expiredPackages.length, refundedCount };
  }

  // =====================================================
  // RELEASE SESSION (Transaction-wrapped + Idempotent)
  // Called only on booking COMPLETION
  // =====================================================

  async releaseSession(bookingId: string, idempotencyKey: string) {
    // Idempotency check
    const existingTx = await this.prisma.packageTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTx) {
      return; // Already processed
    }

    // Find redemption for this booking
    const redemption = await this.prisma.packageRedemption.findUnique({
      where: { bookingId },
      include: { package: { include: { teacher: true } } },
    });

    if (!redemption) {
      throw new NotFoundException(
        'No package redemption found for this booking',
      );
    }

    if (redemption.status !== 'RESERVED') {
      throw new BadRequestException(
        `Cannot release: redemption status is ${redemption.status}`,
      );
    }

    const pkg = redemption.package;
    const isLast = pkg.sessionsUsed + 1 === pkg.sessionCount;

    // Last session: release ALL remaining (avoids rounding drift)
    const releaseAmount = isLast
      ? pkg.escrowRemaining
      : pkg.perSessionReleaseAmount;

    // Execute in transaction
    await this.prisma.$transaction(
      async (tx) => {
        // 1. Credit teacher wallet (minus commission - using default 18%)
        const commissionRate = 0.18;
        const normalizedReleaseAmount = normalizeMoney(releaseAmount); // MONEY NORMALIZATION
        const teacherAmount = normalizeMoney(
          normalizedReleaseAmount * (1 - commissionRate),
        );

        // Get teacher wallet for Transaction record
        const teacherWallet = await tx.wallet.findUnique({
          where: { userId: pkg.teacher.userId },
        });
        if (!teacherWallet) {
          throw new BadRequestException('Teacher wallet not found');
        }

        await tx.wallet.update({
          where: { userId: pkg.teacher.userId },
          data: { balance: { increment: teacherAmount } },
        });

        // P1 FIX: Add wallet Transaction for teacher earnings (audit trail)
        const teacherTxId =
          await this.readableIdService.generate('TRANSACTION');
        await tx.transaction.create({
          data: {
            readableId: teacherTxId,
            walletId: teacherWallet.id,
            amount: teacherAmount,
            type: 'PACKAGE_RELEASE',
            status: 'APPROVED',
            adminNote: `Package session release for booking ${bookingId} (${(commissionRate * 100).toFixed(0)}% commission)`,
          },
        });

        // 2. Update package
        await tx.studentPackage.update({
          where: { id: pkg.id },
          data: {
            sessionsUsed: { increment: 1 },
            escrowRemaining: { decrement: releaseAmount },
            status: isLast ? 'COMPLETED' : 'ACTIVE',
          },
        });

        // 3. Update redemption status
        await tx.packageRedemption.update({
          where: { id: redemption.id },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
          },
        });

        // 4. Record transaction
        await tx.packageTransaction.create({
          data: {
            idempotencyKey,
            type: 'RELEASE',
            packageId: pkg.id,
            amount: releaseAmount,
          },
        });
      },
      {
        // SECURITY: Use SERIALIZABLE isolation for session payment release
        isolationLevel: 'Serializable',
      },
    );
  }

  // =====================================================
  // CANCEL PACKAGE (Refund escrowRemaining)
  // =====================================================

  async cancelPackage(
    packageId: string,
    cancelledBy: 'STUDENT' | 'TEACHER' | 'ADMIN',
    idempotencyKey: string,
  ) {
    // Idempotency check
    const existingTx = await this.prisma.packageTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTx) {
      return; // Already processed
    }

    const pkg = await this.prisma.studentPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    if (pkg.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot cancel: package status is ${pkg.status}`,
      );
    }

    // P0-PKG-3 FIX: Apply normalizeMoney to refund amount
    const refundAmount = normalizeMoney(pkg.escrowRemaining);

    // Cancel any pending redemptions
    await this.prisma.$transaction(
      async (tx) => {
        // 0. Get wallet for transaction record
        const wallet = await tx.wallet.findUnique({
          where: { userId: pkg.payerId },
        });
        if (!wallet) throw new BadRequestException('Payer wallet not found');

        // 1. Update pending redemptions to CANCELLED
        await tx.packageRedemption.updateMany({
          where: { packageId, status: 'RESERVED' },
          data: { status: 'CANCELLED' },
        });

        // 2. Refund to payer wallet
        await tx.wallet.update({
          where: { userId: pkg.payerId },
          data: { balance: { increment: refundAmount } },
        });

        // 3. Update package status
        await tx.studentPackage.update({
          where: { id: packageId },
          data: {
            status: 'CANCELLED',
            escrowRemaining: new Decimal(0),
          },
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
            adminNote: `Package ${packageId} cancelled - refund`,
          },
        });

        // 5. Record package transaction for idempotency
        await tx.packageTransaction.create({
          data: {
            idempotencyKey,
            type: 'REFUND',
            packageId,
            amount: refundAmount,
          },
        });
      },
      {
        // SECURITY: Use SERIALIZABLE isolation for package cancellation refund
        isolationLevel: 'Serializable',
      },
    );
  }

  // =====================================================
  // EXPIRE PACKAGES (Cron-safe, Idempotent)
  // =====================================================

  async expirePackages() {
    const now = new Date();
    const expiredPackages = await this.prisma.studentPackage.findMany({
      where: {
        expiresAt: { lt: now },
        status: 'ACTIVE',
      },
    });

    for (const pkg of expiredPackages) {
      const idempotencyKey = `EXPIRE_${pkg.id}`;

      // Skip if already processed (idempotency)
      const existingTx = await this.prisma.packageTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) continue;

      await this.prisma.$transaction(async (tx) => {
        // 1. Refund remaining escrow to payer
        await tx.wallet.update({
          where: { userId: pkg.payerId },
          data: { balance: { increment: pkg.escrowRemaining } },
        });

        // 1.1 Create Refund Transaction
        const wallet = await tx.wallet.findUnique({
          where: { userId: pkg.payerId },
        });
        if (wallet) {
          const refundTxId =
            await this.readableIdService.generate('TRANSACTION');
          await tx.transaction.create({
            data: {
              readableId: refundTxId,
              walletId: wallet.id,
              amount: pkg.escrowRemaining,
              type: 'REFUND',
              status: 'APPROVED',
              adminNote: `Package ${pkg.id} expired - auto refund`,
            },
          });
        }

        // 2. Cancel pending redemptions
        await tx.packageRedemption.updateMany({
          where: { packageId: pkg.id, status: 'RESERVED' },
          data: { status: 'CANCELLED' },
        });

        // 3. Mark package as expired
        await tx.studentPackage.update({
          where: { id: pkg.id },
          data: {
            status: 'EXPIRED',
            escrowRemaining: new Decimal(0),
          },
        });

        // 4. Record transaction
        await tx.packageTransaction.create({
          data: {
            idempotencyKey,
            type: 'EXPIRE',
            packageId: pkg.id,
            amount: pkg.escrowRemaining,
          },
        });
      });
    }

    return { expiredCount: expiredPackages.length };
  }

  // =====================================================
  // HELPER: Create redemption when booking from package
  // =====================================================

  async createRedemption(packageId: string, bookingId: string) {
    // SECURITY: Use transaction to prevent double-spending race condition
    return await this.prisma.$transaction(async (tx) => {
      const pkg = await tx.studentPackage.findUnique({
        where: { id: packageId },
      });

      if (!pkg) {
        throw new NotFoundException('Package not found');
      }

      if (pkg.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Cannot use package: status is ${pkg.status}`,
        );
      }

      if (pkg.sessionsUsed >= pkg.sessionCount) {
        throw new BadRequestException(
          'All sessions in this package have been used',
        );
      }

      // Check expiry
      if (new Date() > pkg.expiresAt) {
        throw new BadRequestException('Package has expired');
      }

      // SECURITY: Atomic increment with conditional update to prevent race conditions
      const updateResult = await tx.studentPackage.updateMany({
        where: {
          id: packageId,
          sessionsUsed: { lt: pkg.sessionCount }, // Only update if sessions available
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        data: {
          sessionsUsed: { increment: 1 },
        },
      });

      // If no rows updated, package became unavailable (race condition detected)
      if (updateResult.count === 0) {
        throw new BadRequestException(
          'Package session no longer available (concurrent booking detected)',
        );
      }

      // Create redemption record
      return tx.packageRedemption.create({
        data: {
          packageId,
          bookingId,
          status: 'RESERVED',
        },
      });
    });
  }

  // =====================================================
  // GET USER PACKAGES
  // =====================================================

  /**
   * Admin: Get all student packages with optional status filter
   */
  async getAllStudentPackages(status?: string) {
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const packages = await this.prisma.studentPackage.findMany({
      where,
      include: {
        payer: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        teacher: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        packageTier: {
          select: {
            sessionCount: true,
            discountPercent: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    // Add calculated fields
    return packages.map((pkg) => ({
      ...pkg,
      remainingSessions: pkg.sessionCount - pkg.sessionsUsed,
      totalSessions: pkg.sessionCount,
      usedSessions: pkg.sessionsUsed,
      totalPrice: pkg.totalPaid.toString(),
      discountPercent: pkg.packageTier?.discountPercent?.toNumber() || 0,
      startDate: pkg.purchasedAt.toISOString(),
      expiryDate: pkg.expiresAt.toISOString(),
    }));
  }

  async getStudentPackages(userId: string) {
    return this.prisma.studentPackage.findMany({
      where: {
        OR: [{ studentId: userId }, { payerId: userId }],
      },
      include: {
        teacher: { select: { displayName: true, profilePhotoUrl: true } },
        subject: { select: { nameAr: true, nameEn: true } },
        redemptions: {
          include: {
            booking: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
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
            phoneNumber: true,
            firstName: true,
            lastName: true,
            role: true,
            parentProfile: {
              select: {
                id: true,
                children: {
                  select: { id: true, name: true, gradeLevel: true },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        teacher: {
          select: {
            id: true,
            displayName: true,
            profilePhotoUrl: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        subject: { select: { id: true, nameAr: true, nameEn: true } },
        packageTier: {
          select: {
            id: true,
            sessionCount: true,
            discountPercent: true,
            durationWeeks: true,
            rescheduleLimit: true,
            nameAr: true,
            nameEn: true,
            descriptionAr: true,
          },
        },
        redemptions: {
          include: {
            booking: {
              select: {
                id: true,
                readableId: true,
                startTime: true,
                endTime: true,
                price: true,
                status: true,
                childId: true,
                child: {
                  select: { id: true, name: true },
                },
                subject: {
                  select: { nameAr: true },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Calculate derived fields
    const remainingSessions = pkg.sessionCount - pkg.sessionsUsed;

    // Get bookings from redemptions
    const bookings = pkg.redemptions
      .map((r) => r.booking)
      .filter((b) => b !== null)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );

    return {
      ...pkg,
      remainingSessions,
      totalSessions: pkg.sessionCount,
      usedSessions: pkg.sessionsUsed,
      totalPrice: pkg.totalPaid.toString(),
      discountPercent: pkg.packageTier?.discountPercent?.toNumber() || 0,
      startDate: pkg.purchasedAt.toISOString(),
      expiryDate: pkg.expiresAt.toISOString(),
      bookings,
    };
  }

  async getTeacherPackages(teacherId: string) {
    return this.prisma.studentPackage.findMany({
      where: {
        teacherId,
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
                  select: { id: true, name: true, gradeLevel: true },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            studentProfile: { select: { gradeLevel: true } },
          },
        },
        subject: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        redemptions: {
          include: {
            booking: {
              select: {
                startTime: true,
                status: true,
                childId: true,
                child: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
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
    idempotencyKey: string,
  ) {
    // Idempotency check: Return existing if already processed
    const existingTx = await this.prisma.packageTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTx && existingTx.type === 'SCHEDULE') {
      // Find and return the existing booking
      const existingRedemption = await this.prisma.packageRedemption.findFirst({
        where: { packageId },
        include: { booking: true },
        orderBy: { createdAt: 'desc' },
      });
      if (existingRedemption) {
        return {
          success: true,
          booking: existingRedemption.booking,
          sessionsRemaining: 0, // Already processed
          idempotent: true,
        };
      }
    }

    // Execute everything in a single atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch package inside transaction (for consistent read)
      const pkg = await tx.studentPackage.findUnique({
        where: { id: packageId },
        include: { teacher: true, subject: true },
      });

      if (!pkg) {
        throw new BadRequestException('Package not found');
      }

      // 2. All validations inside transaction
      if (pkg.payerId !== userId && pkg.studentId !== userId) {
        throw new BadRequestException('You do not have access to this package');
      }

      if (pkg.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Package is not active (status: ${pkg.status})`,
        );
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
          status: 'ACTIVE', // Must still be active
        },
        data: {
          sessionsUsed: { increment: 1 },
          status: isLastSession ? 'DEPLETED' : 'ACTIVE',
        },
      });

      // 4. If 0 rows updated, another concurrent request won - return 409 Conflict
      if (updateResult.count === 0) {
        throw new ConflictException(
          'Session already reserved by concurrent request. Please retry.',
        );
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
          status: 'SCHEDULED',
        },
      });

      // 6. Create redemption record
      await tx.packageRedemption.create({
        data: {
          packageId,
          bookingId: booking.id,
          status: 'RESERVED',
        },
      });

      // 7. Record transaction for idempotency (DB-level unique constraint)
      await tx.packageTransaction.create({
        data: {
          idempotencyKey,
          type: 'SCHEDULE',
          packageId,
          amount: pkg.discountedPricePerSession,
        },
      });

      console.log(
        `[PackageService] Scheduled session from package ${packageId}, booking ${booking.id}`,
      );

      return {
        success: true,
        booking,
        sessionsRemaining: sessionsRemaining - 1,
        idempotent: false,
      };
    });
  }
}
