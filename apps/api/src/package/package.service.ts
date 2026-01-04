import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { normalizeMoney } from '../utils/money';
import { ReadableIdService } from '../common/readable-id/readable-id.service';
import { NotificationService } from '../notification/notification.service';
import { TeacherService } from '../teacher/teacher.service';
import { fromZonedTime } from 'date-fns-tz';
import {
  PurchaseSmartPackDto,
  CheckRecurringAvailabilityDto,
  RecurringAvailabilityResponse,
  CheckMultiSlotAvailabilityDto,
  MultiSlotAvailabilityResponse,
  ScheduledSession,
  PatternAvailability,
  RecurringPattern,
  Weekday,
  BookFloatingSessionDto,
  RescheduleSessionDto,
  CreatePackageTierDto,
  UpdatePackageTierDto,
  UpdateTeacherDemoSettingsDto,
  UpdateTeacherTierSettingDto,
} from '@sidra/shared';

@Injectable()
export class PackageService {
  private readonly logger = new Logger(PackageService.name);

  constructor(
    private prisma: PrismaService,
    private readableIdService: ReadableIdService,
    private notificationService: NotificationService,
    private teacherService: TeacherService,
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
          this.logger.error(
            'Failed to send package purchase notification:',
            error,
          );
        }

        return studentPackage;
      });
  }

  // =====================================================
  // SMART PACK: Purchase with Recurring Pattern
  // =====================================================

  async purchaseSmartPackage(data: PurchaseSmartPackDto) {
    // Ensure studentId is provided (controller sets this from JWT for students)
    if (!data.studentId) {
      throw new BadRequestException('Student ID is required');
    }
    const studentId = data.studentId; // Now guaranteed to be string

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

    // 6.5. Normalize recurring patterns (support both legacy and new format)
    let recurringPatterns: RecurringPattern[];
    if (data.recurringPatterns && data.recurringPatterns.length > 0) {
      // New multi-slot format
      recurringPatterns = data.recurringPatterns.map((p) => ({
        weekday: p.weekday,
        time: p.time,
      }));
    } else if (data.recurringWeekday && data.recurringTime) {
      // Legacy single-pattern format - convert to array
      recurringPatterns = [
        { weekday: data.recurringWeekday, time: data.recurringTime },
      ];
    } else {
      throw new BadRequestException('يجب تحديد مواعيد الحصص المتكررة');
    }

    // 7. Validate recurring availability using multi-slot checker
    const availabilityCheck = await this.checkMultiSlotAvailability({
      teacherId: data.teacherId,
      patterns: recurringPatterns,
      recurringSessionCount,
    });

    if (!availabilityCheck.available) {
      throw new BadRequestException(
        availabilityCheck.message ||
          `تعذر جدولة ${recurringSessionCount} حصة. يوجد تعارضات في المواعيد المحددة.`,
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

    // 9. Calculate expiry dates (using multi-slot response)
    const firstScheduledSession = availabilityCheck.firstSession
      ? new Date(availabilityCheck.firstSession)
      : null;
    const lastScheduledSession = availabilityCheck.lastSession
      ? new Date(availabilityCheck.lastSession)
      : null;
    const gracePeriodEnds = availabilityCheck.packageEndDate
      ? new Date(availabilityCheck.packageEndDate)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

    // 10. Verify payer has sufficient balance (auto-create wallet if needed)
    // payerId is the logged-in user (parent or student), studentId may be a child ID
    const walletUserId = data.payerId || studentId; // payerId for parents, studentId for students

    let payerWallet = await this.prisma.wallet.findUnique({
      where: { userId: walletUserId },
    });
    if (!payerWallet) {
      // Auto-create wallet with zero balance (same pattern as WalletService.getBalance)
      const walletReadableId = await this.readableIdService.generate('WALLET');
      payerWallet = await this.prisma.wallet.create({
        data: { userId: walletUserId, readableId: walletReadableId },
      });
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
          // Debit payer wallet
          await tx.wallet.update({
            where: { userId: walletUserId },
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
              payerId: studentId,
              studentId: studentId,
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
              // NEW: Store multi-slot patterns as JSON
              recurringPatterns: JSON.parse(JSON.stringify(recurringPatterns)),
              // DEPRECATED: Keep for backward compatibility (use first pattern)
              recurringWeekday: recurringPatterns[0]?.weekday,
              recurringTime: recurringPatterns[0]?.time,
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

          // Auto-schedule the recurring sessions using multi-slot scheduled sessions
          for (const scheduledSession of availabilityCheck.scheduledSessions) {
            const sessionDate = new Date(scheduledSession.date);
            const endTime = new Date(sessionDate.getTime() + 60 * 60 * 1000); // 1-hour sessions

            const booking = await tx.booking.create({
              data: {
                bookedByUserId: studentId,
                beneficiaryType: 'STUDENT',
                studentUserId: studentId,
                teacherId: data.teacherId,
                subjectId: data.subjectId,
                startTime: sessionDate,
                endTime,
                timezone: data.timezone || 'Africa/Khartoum', // Use provided timezone or default
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
            data: { sessionsUsed: availabilityCheck.scheduledSessions.length },
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
            userId: studentId,
            type: 'PAYMENT_SUCCESS',
            title: 'تم شراء الباقة الذكية بنجاح',
            message: `تم شراء باقة ذكية من ${tier.sessionCount} حصة (${recurringSessionCount} حصة مجدولة تلقائياً + ${floatingSessionCount} حصة مرنة) في مادة ${teacherSubject.subject.nameAr} بمبلغ ${totalPaid} SDG`,
            link: '/parent/packages',
            dedupeKey: `PACKAGE_PURCHASED:${studentPackage.id}:${studentId}`,
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
          this.logger.error(
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

      // Check 1: Teacher Availability (Schedule & Exceptions)
      const isTeacherAvailable = await this.teacherService.isSlotAvailable(
        data.teacherId,
        sessionDate,
      );

      if (!isTeacherAvailable) {
        conflicts.push(sessionDate);
        continue;
      }

      // Check 2: Booking Conflicts
      const conflict = await this.prisma.booking.findFirst({
        where: {
          teacherId: data.teacherId,
          status: 'SCHEDULED', // Legacy check: mainly for conflicting scheduled sessions
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
  // SMART PACK: Check Multi-Slot Availability (NEW)
  // =====================================================

  /**
   * Check availability for multiple recurring patterns
   * Distributes sessions chronologically across all patterns
   *
   * Example: 8 sessions with 2 patterns (Tue 5PM, Thu 4PM)
   * - Week 1: Tue (1), Thu (2)
   * - Week 2: Tue (3), Thu (4)
   * - Week 3: Tue (5), Thu (6)
   * - Week 4: Tue (7), Thu (8)
   */
  async checkMultiSlotAvailability(
    data: CheckMultiSlotAvailabilityDto,
  ): Promise<MultiSlotAvailabilityResponse> {
    const duration = data.duration || 60;

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

    const tier = await this.prisma.packageTier.findFirst({
      where: { isActive: true },
      orderBy: { sessionCount: 'asc' },
    });
    const gracePeriodDays = tier?.gracePeriodDays || 14;

    // Get Teacher Timezone
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { id: data.teacherId },
      select: { timezone: true },
    });
    const teacherTimezone = teacherProfile?.timezone || 'Africa/Khartoum';

    // Sort patterns by weekday to ensure chronological distribution
    const sortedPatterns = [...data.patterns].sort((a, b) => {
      const dayA = weekdayMap[a.weekday];
      const dayB = weekdayMap[b.weekday];
      if (dayA !== dayB) return dayA - dayB;
      // If same day, sort by time
      return a.time.localeCompare(b.time);
    });

    // Find the start date (next occurrence of the earliest weekday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add 48-hour minimum notice
    const minNoticeDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);

    // Find next occurrence of first pattern's weekday
    const firstPatternDay = weekdayMap[sortedPatterns[0].weekday];
    const startDate = new Date(minNoticeDate);
    while (startDate.getDay() !== firstPatternDay) {
      startDate.setDate(startDate.getDate() + 1);
    }

    // Generate scheduled sessions chronologically
    const scheduledSessions: ScheduledSession[] = [];
    const patternAvailability: Map<string, PatternAvailability> = new Map();

    // Initialize pattern availability tracking
    for (const pattern of data.patterns) {
      const key = `${pattern.weekday}-${pattern.time}`;
      patternAvailability.set(key, {
        weekday: pattern.weekday,
        time: pattern.time,
        availableWeeks: 0,
        conflicts: [],
      });
    }

    let sessionNumber = 1;
    const currentWeekStart = new Date(startDate);
    let weeksChecked = 0;
    const maxWeeks =
      Math.ceil(data.recurringSessionCount / data.patterns.length) + 2; // Buffer

    while (
      sessionNumber <= data.recurringSessionCount &&
      weeksChecked < maxWeeks
    ) {
      // For each week, iterate through all patterns in order
      for (const pattern of sortedPatterns) {
        if (sessionNumber > data.recurringSessionCount) break;

        const patternKey = `${pattern.weekday}-${pattern.time}`;
        const patternDayIndex = weekdayMap[pattern.weekday];

        // Calculate the date for this pattern in the current week
        const sessionDate = new Date(currentWeekStart);
        const daysToAdd = (patternDayIndex - currentWeekStart.getDay() + 7) % 7;
        sessionDate.setDate(sessionDate.getDate() + daysToAdd);

        // Set the time correctly using Teacher's Timezone
        // Create date string YYYY-MM-DD HH:mm:ss
        const year = sessionDate.getFullYear();
        const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const day = String(sessionDate.getDate()).padStart(2, '0');
        const dateTimeString = `${year}-${month}-${day} ${pattern.time}:00`;

        // Convert to UTC as if this time is in Teacher's Timezone
        const utcDate = fromZonedTime(dateTimeString, teacherTimezone);

        // Update sessionDate to this UTC timestamp
        sessionDate.setTime(utcDate.getTime());

        // Skip if this date is before minimum notice
        if (sessionDate < minNoticeDate) {
          continue;
        }

        const endTime = new Date(sessionDate.getTime() + duration * 60 * 1000);

        // Check 1: Teacher Availability (Schedule & Exceptions)
        // Note: isSlotAvailable checks daily/weekly pattern and exceptions
        const isTeacherAvailable = await this.teacherService.isSlotAvailable(
          data.teacherId,
          sessionDate,
        );

        if (!isTeacherAvailable) {
          const patternInfo = patternAvailability.get(patternKey)!;
          patternInfo.conflicts.push({
            date: sessionDate.toISOString(),
            reason: 'المعلم غير متاح (خارج أوقات العمل)',
          });
          continue;
        }

        // Check 2: Booking Conflicts
        const conflict = await this.prisma.booking.findFirst({
          where: {
            teacherId: data.teacherId,
            status: {
              in: [
                'SCHEDULED',
                'PENDING_TEACHER_APPROVAL',
                'WAITING_FOR_PAYMENT',
              ],
            },
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

        const patternInfo = patternAvailability.get(patternKey)!;

        if (conflict) {
          patternInfo.conflicts.push({
            date: sessionDate.toISOString(),
            reason: 'محجوز مسبقاً',
          });
        } else {
          patternInfo.availableWeeks++;
          scheduledSessions.push({
            date: sessionDate.toISOString(),
            weekday: pattern.weekday,
            time: pattern.time,
            sessionNumber: sessionNumber++,
          });
        }
      }

      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weeksChecked++;
    }

    // Calculate summary
    const totalConflicts = Array.from(patternAvailability.values()).reduce(
      (sum, p) => sum + p.conflicts.length,
      0,
    );
    const available = scheduledSessions.length >= data.recurringSessionCount;

    const firstSession =
      scheduledSessions.length > 0 ? scheduledSessions[0].date : null;
    const lastSession =
      scheduledSessions.length > 0
        ? scheduledSessions[scheduledSessions.length - 1].date
        : null;

    const packageEndDate = lastSession
      ? new Date(
          new Date(lastSession).getTime() +
            gracePeriodDays * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;

    const totalWeeksNeeded = Math.ceil(
      data.recurringSessionCount / data.patterns.length,
    );

    let message: string;
    if (available) {
      message = `يمكن جدولة ${data.recurringSessionCount} حصة خلال ${totalWeeksNeeded} أسابيع`;
    } else {
      message = `تعذر جدولة كل الحصص. متاح ${scheduledSessions.length} من ${data.recurringSessionCount}. يوجد ${totalConflicts} تعارض.`;
    }

    return {
      available,
      patterns: Array.from(patternAvailability.values()),
      scheduledSessions: scheduledSessions.slice(0, data.recurringSessionCount),
      totalWeeksNeeded,
      firstSession,
      lastSession,
      packageEndDate,
      message,
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

    // Verify floating sessions available (preliminary check - final check inside TX)
    if (pkg.floatingSessionsUsed >= pkg.floatingSessionCount!) {
      throw new BadRequestException('No floating sessions remaining');
    }

    // Parse date and time
    const sessionDate = new Date(data.date);
    const [hours, minutes] = data.time.split(':').map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const endTime = new Date(sessionDate);
    endTime.setHours(endTime.getHours() + 1);

    // Check 1: Teacher Availability (Schedule & Exceptions) - preliminary check
    const isTeacherAvailable = await this.teacherService.isSlotAvailable(
      pkg.teacherId,
      sessionDate,
    );

    if (!isTeacherAvailable) {
      throw new BadRequestException(
        'Teacher is not available at this time (Out of hours)',
      );
    }

    // Create booking in transaction with all critical checks INSIDE
    // SECURITY: All race-condition-prone checks are inside the SERIALIZABLE transaction
    return this.prisma.$transaction(
      async (tx) => {
        // P0 FIX: Re-check floating sessions inside transaction with conditional update
        const updateResult = await tx.studentPackage.updateMany({
          where: {
            id: packageId,
            status: 'ACTIVE',
            floatingSessionsUsed: { lt: pkg.floatingSessionCount! },
          },
          data: {
            floatingSessionsUsed: { increment: 1 },
            sessionsUsed: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictException(
            'No floating sessions remaining or package is no longer active',
          );
        }

        // P0 FIX: Check booking conflicts INSIDE the transaction
        const conflict = await tx.booking.findFirst({
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
          throw new ConflictException('Teacher is not available at this time');
        }

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

    // Check 1: Teacher Availability at new time (preliminary check)
    const isTeacherAvailable = await this.teacherService.isSlotAvailable(
      booking.teacherId,
      newDate,
    );

    if (!isTeacherAvailable) {
      throw new BadRequestException(
        'Teacher is not available at the new time (Out of hours)',
      );
    }

    // P0 FIX: Use SERIALIZABLE transaction with conditional update to prevent race conditions
    return this.prisma.$transaction(
      async (tx) => {
        // Check booking conflicts INSIDE the transaction
        const conflict = await tx.booking.findFirst({
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
          throw new ConflictException(
            'Teacher is not available at the new time',
          );
        }

        // Use conditional update to detect if booking was modified concurrently
        const updateResult = await tx.booking.updateMany({
          where: {
            id: bookingId,
            status: 'SCHEDULED',
            rescheduleCount: booking.rescheduleCount, // Optimistic lock
          },
          data: {
            startTime: newDate,
            endTime: newEndTime,
            rescheduleCount: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictException(
            'Booking was modified by another request. Please refresh and try again.',
          );
        }

        // Return the updated booking
        return tx.booking.findUnique({
          where: { id: bookingId },
        });
      },
      {
        isolationLevel: 'Serializable',
      },
    );
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

  async releaseSession(
    bookingId: string,
    idempotencyKey: string,
    externalTx?: any,
  ) {
    // Helper to execute logic within a transaction (provided or new)
    const execute = async (tx: any) => {
      // Idempotency check
      const existingTx = await tx.packageTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return; // Already processed
      }

      // Find redemption for this booking
      const redemption = await tx.packageRedemption.findUnique({
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
      const isLast = pkg.sessionsUsed >= pkg.sessionCount; // Logic fix: pkg.sessionsUsed is ALREADY incremented at reservation

      // Last session: release ALL remaining (avoids rounding drift)
      const releaseAmount = isLast
        ? pkg.escrowRemaining
        : pkg.perSessionReleaseAmount;

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
      const teacherTxId = await this.readableIdService.generate('TRANSACTION');
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
      // CRITICAL FIX: Do NOT increment sessionsUsed again (already done in createRedemption)
      await tx.studentPackage.update({
        where: { id: pkg.id },
        data: {
          // sessionsUsed: { increment: 1 }, // REMOVED: Double counting fix
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
    };

    if (externalTx) {
      return execute(externalTx);
    } else {
      return this.prisma.$transaction(execute, {
        isolationLevel: 'Serializable',
      });
    }
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

      // P0 FIX: Use SERIALIZABLE isolation to prevent double-refund on multi-instance deployments
      await this.prisma.$transaction(
        async (tx) => {
          // Re-verify package status inside transaction (double-check with idempotency)
          const currentPkg = await tx.studentPackage.findUnique({
            where: { id: pkg.id },
          });
          if (!currentPkg || currentPkg.status !== 'ACTIVE') {
            // Already processed by another instance
            return;
          }

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
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    }

    return { expiredCount: expiredPackages.length };
  }

  // =====================================================
  // HELPER: Create redemption when booking from package
  // =====================================================

  async createRedemption(packageId: string, bookingId: string) {
    // SECURITY: Use transaction to prevent double-spending race condition
    return await this.prisma.$transaction(async (tx) => {
      return this.createRedemptionInTransaction(packageId, bookingId, tx);
    });
  }

  /**
   * Create redemption within an existing transaction
   * Used when booking creation needs to be atomic with package redemption
   */
  async createRedemptionInTransaction(
    packageId: string,
    bookingId: string,
    tx: Prisma.TransactionClient,
  ) {
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

      this.logger.log(
        `Scheduled session from package ${packageId}, booking ${booking.id}`,
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
