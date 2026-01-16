import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { PackageService } from '../package/package.service';
import { DemoService } from '../package/demo.service';
import { ReadableIdService } from '../common/readable-id/readable-id.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  CreateRatingDto,
} from '@sidra/shared';
import { formatInTimezone } from '../common/utils/timezone.util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { normalizeMoney } from '../utils/money';
import {
  BOOKING_POLICY,
  isValidStatusTransition,
  getAllowedTransitions,
} from './booking-policy.constants';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { TeacherService } from '../teacher/teacher.service';
import { SystemSettingsService } from '../admin/system-settings.service';
import { AvailabilitySlotService } from '../teacher/availability-slot.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private packageService: PackageService,
    private demoService: DemoService,
    private readableIdService: ReadableIdService,
    private teacherService: TeacherService,
    private system_settingsService: SystemSettingsService,
    private configService: ConfigService,
    private availabilitySlotService: AvailabilitySlotService,
  ) {}

  private redactUserPII(user: any) {
    if (!user) return user;
    const { email, phoneNumber, ...rest } = user;
    return rest;
  }

  private getSafeDisplayName(user: any, fallback: string) {
    if (!user) return fallback;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.displayName || fallback;
  }

  // Create a booking request (Parent or Student)
  async createRequest(user: any, dto: CreateBookingDto) {
    // user is the logged-in User entity (from @User decorator)

    // fields for creation
    let beneficiaryType: 'CHILD' | 'STUDENT';
    let childId: string | null = null;
    let studentUserId: string | null = null;

    if (user.role === 'PARENT') {
      if (!dto.childId) {
        throw new BadRequestException(
          'Child ID is required for Parent bookings',
        );
      }
      // Verify child belongs to parent
      // We need to find the child and check its parent.userId
      // Or simpler: find Child where id=childId AND parent.userId = user.id
      const childNode = await this.prisma.children.findFirst({
        where: {
          id: dto.childId,
          parent_profiles: { userId: user.userId },
        },
      });

      if (!childNode) {
        throw new ForbiddenException(
          'Child not found or does not belong to you',
        );
      }
      beneficiaryType = 'CHILD';
      childId = dto.childId;
    } else if (user.role === 'STUDENT') {
      if (dto.childId) {
        throw new BadRequestException('Students cannot book for a child');
      }
      beneficiaryType = 'STUDENT';
      studentUserId = user.userId;
    } else {
      throw new ForbiddenException(
        'Only Parents or Students can book sessions',
      );
    }

    // Verify teacher and subject exist
    const teacher_subjects = await this.prisma.teacher_subjects.findFirst({
      where: {
        teacherId: dto.teacherId,
        subjectId: dto.subjectId,
      },
      include: { teacher_profiles: true },
    });

    if (!teacher_subjects) {
      throw new NotFoundException('Teacher does not teach this subject');
    }

    // VACATION MODE CHECK: Prevent bookings while teacher is on vacation
    if (teacher_subjects.teacher_profiles.isOnVacation) {
      const returnDate = teacher_subjects.teacher_profiles.vacationEndDate;
      const returnDateStr = returnDate
        ? ` حتى ${returnDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}`
        : '';
      throw new BadRequestException(
        `المعلم في إجازة حالياً${returnDateStr}. يرجى المحاولة لاحقاً.`,
      );
    }

    // Prevent self-booking
    if (teacher_subjects.teacher_profiles.userId === user.userId) {
      throw new ForbiddenException('لا يمكنك حجز حصة مع نفسك');
    }

    // SECURITY: Prevent booking sessions in the past
    if (new Date(dto.startTime) <= new Date()) {
      throw new BadRequestException('Cannot book sessions in the past');
    }

    // =====================================================
    // SECURITY & CONCURRENCY: Phase 3 Slot-based Logic
    // =====================================================
    const booking = await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock (per teacher)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dto.teacherId}))`;

      // 2. Slot Validation
      let sessionStartTime = new Date(dto.startTime);
      let sessionEndTime = new Date(dto.endTime);

      let slot: any;
      if ((dto as any).slotId) {
        // Strict locking for the target slot
        const slots = await tx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "teacher_session_slots" WHERE "id" = $1 FOR UPDATE NOWAIT`,
          (dto as any).slotId,
        );
        slot = slots[0];

        if (!slot) {
          throw new BadRequestException(
            'لقد تم حجز هذا الموعد للتو. يرجى اختيار وقت آخر.',
          );
        }
        if (slot.teacherId !== dto.teacherId) {
          throw new BadRequestException('Slot does not belong to this teacher');
        }

        // Use slot's startTime to be 100% sure we are on the materialized grid
        sessionStartTime = slot.startTimeUtc;
        sessionEndTime = new Date(sessionStartTime.getTime() + 60 * 60 * 1000);
      } else {
        // Fallback for flows that don't pass slotId yet: Strict Direct Slot Lookup
        const slots = await tx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "teacher_session_slots" 
           WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
           FOR UPDATE NOWAIT`,
          dto.teacherId,
          sessionStartTime,
        );
        slot = slots[0];

        if (!slot) {
          throw new BadRequestException(
            'هذا الموعد غير متاح. يرجى اختيار وقت آخر.',
          );
        }
      }

      // 3. Conflict Check (Source of Truth)
      const bookingConflict = await tx.bookings.findFirst({
        where: {
          teacherId: dto.teacherId,
          startTime: { lt: sessionEndTime },
          endTime: { gt: sessionStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (bookingConflict) {
        throw new BadRequestException(
          'هذا الموعد غير متاح. يرجى اختيار وقت آخر.',
        );
      }

      // **P0-1 FIX: Price Manipulation**
      // Ignore dto.price completely. Calculate based on TeacherSubject price and duration.
      const durationHours =
        (sessionEndTime.getTime() - sessionStartTime.getTime()) /
        (1000 * 60 * 60);

      // Ensure duration is positive
      if (durationHours <= 0) {
        throw new BadRequestException('End time must be after start time');
      }

      // SECURITY: Enforce maximum session duration to prevent abuse
      const MAX_SESSION_HOURS = 8;
      if (durationHours > MAX_SESSION_HOURS) {
        throw new BadRequestException(
          `Session duration cannot exceed ${MAX_SESSION_HOURS} hours`,
        );
      }

      // Calculate price: pricePerHour * duration
      // Assuming pricePerHour is Decimal in Prism but JS number here?
      // teacher_subjects.pricePerHour is likely Decimal/string from Prisma.
      // Let's use Number() for simplicity in this logic, but ideally Decimal.js.
      const pricePerHour = Number(teacher_subjects.pricePerHour);
      const rawPrice = pricePerHour * durationHours;

      // DEMO LOGIC: Demo sessions are free (Price = 0)
      // SECURITY FIX: Validate isDemo flag server-side against teacher settings
      let isValidDemo = false;
      if (dto.isDemo) {
        const demoEnabled = await this.demoService.isTeacherDemoEnabled(
          dto.teacherId,
        );
        if (!demoEnabled) {
          throw new BadRequestException(
            'هذا المعلم لا يقدم حصص تجريبية حالياً',
          );
        }
        isValidDemo = true;
      }
      const calculatedPrice = isValidDemo ? 0 : normalizeMoney(rawPrice);

      // Snapshot commission rate (from system settings or default)
      // Hardcoded default for now or fetch settings. Using 0.18 as per schema default.
      const commissionRate = 0.18;

      // Generate human-readable booking ID
      const readableId = await this.readableIdService.generate('BOOKING');

      // CHANGED: Per-session meeting links
      // Meeting links are now set per-session by the teacher, not copied from global profile
      // Teacher will be prompted to add meeting link before each session

      // =====================================================
      // SECURITY FIX: Atomic transaction for booking + demo/package
      // Prevents race conditions and ensures consistent cleanup
      // =====================================================
      // 4. For demo bookings, verify eligibility AND create record atomically
      if (isValidDemo) {
        // Determine demoOwner: The person booking (parent or standalone student)
        const demoOwnerId = user.userId;
        const demoOwnerType =
          beneficiaryType === 'CHILD' ? 'PARENT' : 'STUDENT';
        const beneficiaryId =
          beneficiaryType === 'CHILD' ? (childId ?? undefined) : undefined;

        // Check eligibility within transaction (atomic with record creation)
        const eligibility = await this.demoService.canBookDemo(
          demoOwnerId,
          dto.teacherId,
        );
        if (!eligibility.allowed) {
          throw new BadRequestException(
            `لا يمكن حجز حصة تجريبية: ${eligibility.details || eligibility.reason}`,
          );
        }

        // Create demo record atomically within transaction
        await tx.demo_sessions.create({
          data: {
            id: crypto.randomUUID(),
            demoOwnerId,
            demoOwnerType,
            teacherId: dto.teacherId,
            beneficiaryId,
            status: 'SCHEDULED',
            rescheduleCount: 0,
          },
        });
        this.logger.log(
          `Demo session record created atomically for owner ${demoOwnerId} with teacher ${dto.teacherId}`,
        );
      }

      // 2. Create booking
      const newBooking = await tx.bookings.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          readableId,
          teacherId: dto.teacherId,
          bookedByUserId: user.userId,
          beneficiaryType,
          childId,
          studentUserId,

          subjectId: dto.subjectId,
          startTime: sessionStartTime,
          endTime: sessionEndTime,
          timezone: dto.timezone || 'UTC', // Store user's timezone
          price: calculatedPrice, // P0-1: Server-calculated, normalized to integer (0 for demo)
          commissionRate: commissionRate,
          bookingNotes: dto.bookingNotes || null, // Notes from parent/student
          meetingLink: null, // CHANGED: No longer copy from teacher profile - must be set per session
          status: 'PENDING_TEACHER_APPROVAL',
          pendingTierId: dto.tierId || null, // For deferred package purchases
          jitsiEnabled: this.configService.get('JITSI_ENABLED') === 'true', // Auto-enable if feature is on
        },
        include: {
          teacher_profiles: { include: { users: true } },
          users_bookings_bookedByUserIdTousers: true,
          children: true,
          users_bookings_studentUserIdTousers: true,
          subjects: true,
        },
      });

      // 3. Package redemption (if applicable)
      if (dto.packageId) {
        await this.packageService.createRedemptionInTransaction(
          dto.packageId,
          newBooking.id,
          tx,
        );
        this.logger.log(
          `Package redemption created for booking ${newBooking.id} using package ${dto.packageId}`,
        );
      }

      // 4. Consume Slot (Delete all overlapping slots)
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        dto.teacherId,
        sessionStartTime,
        sessionEndTime,
      );

      return newBooking;
    });

    // Notify teacher about new booking request (outside transaction)
    this.logger.debug(
      `Notifying teacher ${booking.teacher_profiles.users.email} about new booking request`,
    );
    const requesterName = this.getSafeDisplayName(
      booking.users_bookings_bookedByUserIdTousers,
      'مستخدم',
    );
    await this.notificationService.notifyUser({
      userId: booking.teacher_profiles.users.id,
      title: 'طلب حجز جديد',
      message: `لديك طلب حجز جديد من ${requesterName}`,
      type: 'BOOKING_REQUEST',
      link: '/teacher/requests',
      dedupeKey: `BOOKING_REQUEST:${booking.id}:${booking.teacher_profiles.users.id}`,
      metadata: { bookingId: booking.id },
      email: booking.teacher_profiles.users.email
        ? {
            to: booking.teacher_profiles.users.email,
            subject: 'طلب حجز جديد | New Booking Request',
            templateId: 'booking-request',
            payload: {
              recipientName:
                booking.teacher_profiles.users.firstName || 'المعلم',
              title: 'طلب حجز جديد',
              message: `لديك طلب حجز جديد من ${requesterName} لموعد ${new Date(booking.startTime).toLocaleDateString('ar-EG')} الساعة ${new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}.`,
              sessionDate: new Date(booking.startTime).toLocaleDateString(
                'ar-EG',
              ),
              sessionTime: new Date(booking.startTime).toLocaleTimeString(
                'ar-EG',
                { hour: '2-digit', minute: '2-digit' },
              ),
              link: `${process.env.FRONTEND_URL}/teacher/requests`,
              actionLabel: 'عرض الطلبات',
            },
          }
        : undefined,
    });

    return this.transformBooking(booking);
  }

  /**
   * Teacher approves a booking
   * CRITICAL FIX: Now atomically locks funds in escrow (PAYMENT_LOCK)
   * Transitions: PENDING_TEACHER_APPROVAL → SCHEDULED (skipping WAITING_FOR_PAYMENT for MVP)
   */
  async approveRequest(teacherUserId: string, bookingId: string) {
    // Get system settings for payment window configuration
    const settings = await this.getSystemSettings();

    // Use atomic transaction to ensure consistency
    return this.prisma
      .$transaction(async (tx) => {
        // 1. Fetch and validate booking
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId },
          include: {
            teacher_profiles: { include: { users: true } },
            users_bookings_bookedByUserIdTousers: true,
            package_redemptions: true, // Include redemption info
          },
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.teacher_profiles.users.id !== teacherUserId) {
          throw new ForbiddenException('Not your booking');
        }

        // CHANGE: Per-session meeting links are now used
        // Teachers will be prompted to add meeting link when managing sessions
        // No longer requiring global encryptedMeetingLink on teacher profile

        // Idempotency: if already SCHEDULED or beyond, return current state
        if (
          booking.status === 'SCHEDULED' ||
          booking.status === 'COMPLETED' ||
          booking.status === 'PENDING_CONFIRMATION'
        ) {
          return {
            bookings: booking,
            paymentRequired: false,
            isPackage: false,
          };
        }

        // Allow re-approval if it was WAITING_FOR_PAYMENT (e.g. parent asks teacher to try again manually?)
        // Primarily for PENDING_TEACHER_APPROVAL
        if (
          booking.status !== 'PENDING_TEACHER_APPROVAL' &&
          booking.status !== 'WAITING_FOR_PAYMENT'
        ) {
          throw new BadRequestException(
            'Booking is not pending approval or payment',
          );
        }

        // Calculate Payment Deadline
        // Logic: The deadline is the EARLIER of:
        // 1. Approval time + Payment Window (e.g., 24h)
        // 2. Session Start Time - Minimum Buffer (e.g., 2h)
        const now = new Date();
        const paymentWindowDuration =
          settings.paymentWindowHours * 60 * 60 * 1000;
        const minBufferDuration =
          settings.minHoursBeforeSession * 60 * 60 * 1000;

        const windowDeadline = new Date(now.getTime() + paymentWindowDuration);
        const bufferDeadline = new Date(
          booking.startTime.getTime() - minBufferDuration,
        );

        // Use the earlier of the two deadlines
        // If bufferDeadline is in the past, it means we are already too close to the session.
        const paymentDeadline =
          windowDeadline < bufferDeadline ? windowDeadline : bufferDeadline;

        // Check parent's wallet balance - use normalizeMoney for consistent comparison
        const parentWallet = await this.walletService.getBalance(
          booking.bookedByUserId,
        );
        const price = normalizeMoney(booking.price);
        const balance = normalizeMoney(parentWallet.balance);

        if (balance < price) {
          // --- Insufficient Balance Flow ---

          // If deadline is already passed (or too close to session), we checks if we can allow a short "immediate" window
          if (paymentDeadline.getTime() <= now.getTime()) {
            // FIX: If session hasn't started yet, give a 15-minute (or until start) window instead of hard failure
            const msUntilStart = booking.startTime.getTime() - now.getTime();
            const MIN_PAYMENT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

            if (msUntilStart > 0) {
              // Allow a short window: min(15 min, time until start)
              const allowedWindow = Math.min(
                MIN_PAYMENT_WINDOW_MS,
                msUntilStart,
              );
              // Update paymentDeadline to be "now + window"
              // We must re-assign the const variable, but it's const. We need to handle this.
              // Logic fix: Re-calculate paymentDeadline or create a new variable.
              // Since we are inside the block, we can just use the new date for the update.
              const newDeadline = new Date(now.getTime() + allowedWindow);

              // Proceed with this new deadline
              const updatedBooking = await tx.bookings.update({
                where: { id: bookingId },
                data: {
                  status: 'WAITING_FOR_PAYMENT',
                  paymentDeadline: newDeadline,
                },
              });

              return {
                bookings: updatedBooking,
                paymentRequired: true,
                isPackage: false,
              };
            } else {
              throw new BadRequestException(
                'رصيد ولي الأمر غير كافٍ والوقت متأخر جداً لانتظار الدفع. يجب شحن المحفظة فوراً.',
              );
            }
          }

          // Transition to WAITING_FOR_PAYMENT
          const updatedBooking = await tx.bookings.update({
            where: { id: bookingId },
            data: {
              status: 'WAITING_FOR_PAYMENT',
              paymentDeadline: paymentDeadline,
            },
          });

          return {
            bookings: updatedBooking,
            paymentRequired: true,
            isPackage: false,
          };
        }

        // --- Sufficient Balance Flow (Lock Funds or Purchase Package) ---

        // Check if this is a package booking
        if (booking.pendingTierId) {
          // For package bookings, purchase the package (outside transaction for package service)
          // We'll do this after the transaction completes
          return {
            bookings: booking,
            paymentRequired: false,
            isPackage: true,
            pendingTierId: booking.pendingTierId,
            bookedByUserId: booking.bookedByUserId,
          };
        }

        // Check if this is a pre-paid package redemption
        if (booking.package_redemptions) {
          // Funds already handled in package purchase. Just update status.
          const updatedBooking = await tx.bookings.update({
            where: { id: bookingId },
            data: {
              status: 'SCHEDULED',
              paymentDeadline: null,
            },
          });

          return {
            bookings: updatedBooking,
            paymentRequired: false,
            isPackage: false,
            isRedemption: true,
          };
        }

        // For single sessions, lock funds in escrow
        // P0-2 FIX: Atomic wallet lock and booking update
        await this.walletService.lockFundsForBooking(
          booking.bookedByUserId,
          bookingId,
          price,
          tx, // Pass transaction client!
        );

        // Update booking status to SCHEDULED
        // P0-2 FIX: Conditional Update
        // While we are inside a transaction that started with findUnique on this ID,
        // strict conditional update is still good practice.
        const updatedBooking = await tx.bookings.update({
          where: {
            id: bookingId,
            status: { in: ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'] }, // Allow transition from these states
          },
          data: {
            status: 'SCHEDULED',
            paymentDeadline: null, // Clear deadline if exists
          },
        });

        return {
          bookings: updatedBooking,
          paymentRequired: false,
          isPackage: false,
        };
      })
      .then(
        async (result: {
          bookings: any;
          paymentRequired: boolean;
          isPackage?: boolean;
          isRedemption?: boolean;
          pendingTierId?: string;
          bookedByUserId?: string;
        }) => {
          const {
            bookings: bookingFromTx,
            paymentRequired,
            isPackage,
            isRedemption,
            pendingTierId,
            bookedByUserId,
          } = result;

          let updatedBooking = bookingFromTx;

          // Fetch parent for email notifications

          const parentUserId = updatedBooking.bookedByUserId as string;
          const parentUser = await this.prisma.users.findUnique({
            where: { id: parentUserId },
            select: { email: true, firstName: true },
          });

          // Handle package purchase outside of transaction
          if (isPackage && pendingTierId && bookedByUserId) {
            try {
              // For student bookings: use studentUserId
              // For parent bookings with children: childId is NOT a User, so use bookedByUserId (parent)
              // The package will be owned by the parent who can then redeem sessions for their child

              const studentId = bookingFromTx.studentUserId || bookedByUserId;

              this.logger.log(
                `Package purchase: studentId=${studentId}, bookedByUserId=${bookedByUserId}`,
              );

              if (!studentId) {
                throw new BadRequestException(
                  'Cannot determine student for package purchase',
                );
              }

              // Purchase the package

              const studentPackage = await this.packageService.purchasePackage(
                bookedByUserId,
                studentId,

                bookingFromTx.teacherId,

                bookingFromTx.subjectId,
                pendingTierId,

                `pkgpurchase:${bookingFromTx.id}:${Date.now()}`,
              );

              if (!studentPackage) {
                throw new BadRequestException('Package purchase returned null');
              }

              // Create redemption
              await this.packageService.createRedemption(
                studentPackage.id,
                bookingFromTx.id,
              );

              // Update booking to clear pendingTierId and set status

              updatedBooking = await this.prisma.bookings.update({
                where: { id: bookingFromTx.id },
                data: {
                  pendingTierId: null,
                  status: 'SCHEDULED',
                  paymentDeadline: null,
                },
              });

              this.logger.log(
                `Package ${studentPackage.id} purchased for booking ${bookingFromTx.id}`,
              );
            } catch (error: any) {
              this.logger.error(
                `Package purchase failed in approveRequest: ${error.message}`,
                error.stack,
              );
              // Don't expose internal error details to client
              throw new BadRequestException('فشل شراء الباقة');
            }
          }

          if (paymentRequired) {
            // Notify parent_profiles: Payment Required
            await this.notificationService.notifyUser({
              userId: updatedBooking.bookedByUserId,
              title: 'تم قبول طلب الحجز - يرجى الدفع',
              message: `وافق المعلم على طلبك. يرجى سداد المبلغ قبل ${updatedBooking.paymentDeadline ? new Date(updatedBooking.paymentDeadline).toLocaleTimeString('ar-EG') : 'الموعد المحدد'} لتأكيد الحجز.`,
              type: 'BOOKING_APPROVED', // Or a new type like PAYMENT_REQUIRED
              link: '/parent/bookings',

              dedupeKey: `PAYMENT_REQUIRED:${updatedBooking.id}`,

              metadata: { bookingId: updatedBooking.id },
              email: parentUser?.email
                ? {
                    to: parentUser.email,
                    subject:
                      'تم قبول طلب الحجز - يرجى الدفع | Payment Required',
                    templateId: 'booking_approved',
                    payload: {
                      recipientName: parentUser.firstName || 'ولي الأمر',
                      title: 'تم قبول طلب الحجز',
                      message: `وافق المعلم على طلبك لموعد ${new Date(updatedBooking.startTime).toLocaleDateString('ar-EG')} الساعة ${new Date(updatedBooking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}. يرجى سداد المبلغ قبل ${updatedBooking.paymentDeadline ? new Date(updatedBooking.paymentDeadline).toLocaleTimeString('ar-EG') : 'الموعد المحدد'} لتأكيد الحجز.`,
                      sessionDate: new Date(
                        updatedBooking.startTime,
                      ).toLocaleDateString('ar-EG'),
                      sessionTime: new Date(
                        updatedBooking.startTime,
                      ).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      link: `${process.env.FRONTEND_URL}/parent/bookings`,
                      actionLabel: 'ادفع الآن',
                    },
                  }
                : undefined,
            });
          } else if (isRedemption) {
            // Notify parent_profiles: Confirmed via Package (No new charge)
            await this.notificationService.notifyUser({
              userId: updatedBooking.bookedByUserId,
              title: 'تم قبول طلب الحجز (باقة)',
              message: 'وافق المعلم على طلبك وتم تأكيد الحصة من رصيد الباقة.',
              type: 'BOOKING_APPROVED',
              link: '/parent/bookings',

              dedupeKey: `BOOKING_APPROVED_PKG:${result.bookings.id}:${updatedBooking.bookedByUserId}`, // Use result.bookings.id in case bookingId is ambiguous

              metadata: { bookingId: updatedBooking.id },
              email: parentUser?.email
                ? {
                    to: parentUser.email,
                    subject: 'تم تأكيد الحجز (باقة) | Booking Confirmed',
                    templateId: 'booking_approved',
                    payload: {
                      recipientName: parentUser.firstName || 'ولي الأمر',
                      title: 'تم تأكيد الحجز',
                      message: `وافق المعلم على طلبك لموعد ${new Date(updatedBooking.startTime).toLocaleDateString('ar-EG')} الساعة ${new Date(updatedBooking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} وتم تأكيد الحصة من رصيد الباقة.`,
                      sessionDate: new Date(
                        updatedBooking.startTime,
                      ).toLocaleDateString('ar-EG'),
                      sessionTime: new Date(
                        updatedBooking.startTime,
                      ).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      link: `${process.env.FRONTEND_URL}/parent/bookings`,
                      actionLabel: 'عرض الحجوزات',
                    },
                  }
                : undefined,
            });
          } else {
            // Notify parent_profiles: Confirmed & Paid
            await this.notificationService.notifyUser({
              userId: updatedBooking.bookedByUserId,
              title: 'تم قبول طلب الحجز وتأكيده',
              message:
                'تم قبول طلب الحجز وخصم المبلغ من المحفظة. الحصة مجدولة الآن.',
              type: 'BOOKING_APPROVED',
              link: '/parent/bookings',

              dedupeKey: `BOOKING_APPROVED:${result.bookings.id}:${updatedBooking.bookedByUserId}`,

              metadata: { bookingId: updatedBooking.id },
              email: parentUser?.email
                ? {
                    to: parentUser.email,
                    subject: 'تم تأكيد الحجز | Booking Confirmed',
                    templateId: 'booking_approved',
                    payload: {
                      recipientName: parentUser.firstName || 'ولي الأمر',
                      title: 'تم تأكيد الحجز',
                      message: `وافق المعلم على طلبك لموعد ${new Date(updatedBooking.startTime).toLocaleDateString('ar-EG')} الساعة ${new Date(updatedBooking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}. تم خصم المبلغ من رصيدك.`,
                      sessionDate: new Date(
                        updatedBooking.startTime,
                      ).toLocaleDateString('ar-EG'),
                      sessionTime: new Date(
                        updatedBooking.startTime,
                      ).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      link: `${process.env.FRONTEND_URL}/parent/bookings`,
                      actionLabel: 'عرض الحجوزات',
                    },
                  }
                : undefined,
            });
          }

          return this.transformBooking(updatedBooking);
        },
      );
  }

  // Teacher rejects a booking
  async rejectRequest(
    teacherUserId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        package_redemptions: true, // Include redemption to handle package refunds
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.teacher_profiles.users.id !== teacherUserId) {
      throw new ForbiddenException('Not your booking');
    }
    if (booking.status !== 'PENDING_TEACHER_APPROVAL') {
      throw new BadRequestException('Booking is not pending');
    }

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${booking.teacherId}))`;

      // 2. Update Booking
      const res = await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: 'REJECTED_BY_TEACHER',
          cancelReason: dto.cancelReason,
        },
      });

      // 3. Package Return
      if (booking.package_redemptions) {
        await tx.package_redemptions.update({
          where: { id: booking.package_redemptions.id },
          data: { status: 'CANCELLED' },
        });
        await tx.student_packages.update({
          where: { id: booking.package_redemptions.packageId },
          data: { sessionsUsed: { decrement: 1 } },
        });
      }

      // 4. Slot Restoration
      await this.availabilitySlotService.restoreSlot(
        tx,
        booking.teacherId,
        booking.startTime,
      );

      return res;
    });

    // Notify parent about booking rejection
    await this.notificationService.notifyUser({
      userId: booking.bookedByUserId,
      title: 'تم رفض طلب الحجز',
      message: dto.cancelReason || 'تم رفض طلب الحجز من قبل المعلم.',
      type: 'BOOKING_REJECTED',
      link: '/parent/bookings',
      dedupeKey: `BOOKING_REJECTED:${bookingId}:${booking.bookedByUserId}`,
      metadata: { bookingId },
    });

    return this.transformBooking(updatedBooking);
  }

  // Get teacher's incoming requests
  async getTeacherRequests(teacherUserId: string) {
    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles)
      throw new NotFoundException('Teacher profile not found');

    const bookings = await this.prisma.bookings.findMany({
      where: {
        teacherId: teacher_profiles.id,
        status: 'PENDING_TEACHER_APPROVAL',
      },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: {
          include: { student_profiles: { include: { curricula: true } } },
        },
        subjects: true,
        children: { include: { curricula: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return bookings.map((b) => this.transformBooking(b));
  }

  // Get teacher's all sessions (for My Sessions page)
  async getTeacherSessions(teacherUserId: string) {
    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles)
      throw new NotFoundException('Teacher profile not found');

    const bookings = await this.prisma.bookings.findMany({
      where: { teacherId: teacher_profiles.id },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: {
          include: { student_profiles: { include: { curricula: true } } },
        },
        subjects: true,
        children: { include: { curricula: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    return bookings.map((b) => this.transformBooking(b));
  }

  // Get ALL teacher bookings (for requests page - shows all statuses) (PAGINATED)
  async getAllTeacherBookings(
    teacherUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles)
      throw new NotFoundException('Teacher profile not found');

    // Cap limit to prevent abuse
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    // Get total count for pagination meta
    const total = await this.prisma.bookings.count({
      where: { teacherId: teacher_profiles.id },
    });

    const bookings = await this.prisma.bookings.findMany({
      where: { teacherId: teacher_profiles.id },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: {
          include: { student_profiles: { include: { curricula: true } } },
        },
        subjects: true,
        children: { include: { curricula: true } },
      },
      orderBy: { createdAt: 'desc' }, // Newest requests first
      skip,
      take: safeLimit,
    });

    // Enrich with tier session count for package bookings
    const pendingTierIds = [
      ...new Set(
        bookings.map((b) => b.pendingTierId).filter((id): id is string => !!id),
      ),
    ];

    const tiers =
      pendingTierIds.length > 0
        ? await this.prisma.package_tiers.findMany({
            where: { id: { in: pendingTierIds } },
          })
        : [];

    const tierMap = new Map(tiers.map((t) => [t.id, t.sessionCount]));

    const enrichedBookings = bookings.map((booking) => {
      const enriched = {
        ...booking,
        pendingTierSessionCount: booking.pendingTierId
          ? tierMap.get(booking.pendingTierId) || null
          : null,
        isDemo: Number(booking.price) === 0,
      };
      return this.transformBooking(enriched);
    });

    return {
      data: enrichedBookings,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
  // Get parent's bookings (PAGINATED)
  async getParentBookings(
    parentUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const parentProfile = await this.prisma.parent_profiles.findUnique({
      where: { userId: parentUserId },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    // Cap limit to prevent abuse
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    // Get total count for pagination meta
    const total = await this.prisma.bookings.count({
      where: { bookedByUserId: parentUserId },
    });

    const bookings = await this.prisma.bookings.findMany({
      where: { bookedByUserId: parentUserId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: true,
        subjects: true,
        children: true,
        ratings: true, // Include rating to show if booking has been rated
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    });

    // Enrich with tier session count for package bookings
    const pendingTierIds = [
      ...new Set(
        bookings.map((b) => b.pendingTierId).filter((id): id is string => !!id),
      ),
    ];

    const tiers =
      pendingTierIds.length > 0
        ? await this.prisma.package_tiers.findMany({
            where: { id: { in: pendingTierIds } },
          })
        : [];

    const tierMap = new Map(tiers.map((t) => [t.id, t.sessionCount]));

    const enrichedBookings = bookings.map((booking) => {
      const enriched = {
        ...booking,
        pendingTierSessionCount: booking.pendingTierId
          ? tierMap.get(booking.pendingTierId) || null
          : null,
      };
      return this.transformBooking(enriched);
    });

    return {
      data: enrichedBookings,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Get student's bookings
  async getStudentBookings(studentUserId: string) {
    const student_profiles = await this.prisma.student_profiles.findUnique({
      where: { userId: studentUserId },
    });

    if (!student_profiles)
      throw new NotFoundException('Student profile not found');

    const bookings = await this.prisma.bookings.findMany({
      where: { bookedByUserId: studentUserId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        subjects: true,
        ratings: true, // Include rating to show if booking has been rated
      },
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((b) => this.transformBooking(b));
  }

  // Get single booking by ID (for session detail page)
  async getBookingById(userId: string, userRole: string, bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        users_bookings_studentUserIdTousers: true,
        subjects: true,
        children: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Authorization: Only allow access to own bookings
    if (userRole === 'TEACHER') {
      const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
        where: { userId },
      });
      if (!teacher_profiles || booking.teacherId !== teacher_profiles.id) {
        throw new ForbiddenException('Not authorized to view this booking');
      }
    } else if (userRole === 'PARENT' || userRole === 'STUDENT') {
      if (booking.bookedByUserId !== userId) {
        throw new ForbiddenException('Not authorized to view this booking');
      }
    } else if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to view bookings');
    }

    return this.transformBooking(booking);
  }

  // Teacher updates their private notes (prep notes and summary)
  async updateTeacherNotes(
    teacherUserId: string,
    bookingId: string,
    dto: { teacherPrepNotes?: string; teacherSummary?: string },
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Verify teacher owns this booking
    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles || booking.teacherId !== teacher_profiles.id) {
      throw new ForbiddenException(
        'Not authorized to update notes for this session',
      );
    }

    const updated = await this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        teacherPrepNotes: dto.teacherPrepNotes,
        teacherSummary: dto.teacherSummary,
      },
    });
    return this.transformBooking(updated);
  }

  // Teacher updates meeting link for a specific session
  async updateMeetingLink(
    teacherUserId: string,
    bookingId: string,
    dto: { meetingLink: string },
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Verify teacher owns this booking
    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles || booking.teacherId !== teacher_profiles.id) {
      throw new ForbiddenException(
        'Not authorized to update meeting link for this session',
      );
    }

    // Validate meeting link URL
    if (dto.meetingLink) {
      try {
        const url = new URL(dto.meetingLink);
        const validDomains = [
          'meet.google.com',
          'zoom.us',
          'teams.microsoft.com',
          'teams.live.com',
        ];
        const isValid = validDomains.some((domain) =>
          url.hostname.includes(domain),
        );

        if (!isValid) {
          throw new BadRequestException(
            'Meeting link must be from Google Meet, Zoom, or Microsoft Teams',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException('Invalid meeting link URL format');
      }
    }

    const updated = await this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        meetingLink: dto.meetingLink || null,
      },
    });
    return this.transformBooking(updated);
  }

  // Cron job: Expire old pending requests (24 hours)
  // Run every hour
  @Cron(CronExpression.EVERY_HOUR)
  async expireOldRequests() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.prisma.bookings.updateMany({
      where: {
        status: 'PENDING_TEACHER_APPROVAL',
        createdAt: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });

    // Also run expiration for unpaid bookings
    await this.expireUnpaidBookings();

    return { expired: result.count };
  }

  private transformBooking(booking: any) {
    if (!booking) return null;

    // Transform relations to match frontend expected structure (camelCase)
    const transformed = {
      ...booking,
      teacherProfile: booking.teacher_profiles
        ? {
            ...booking.teacher_profiles,
            user: this.redactUserPII(booking.teacher_profiles.users),
          }
        : undefined,
      bookedByUser: this.redactUserPII(
        booking.users_bookings_bookedByUserIdTousers,
      ),
      studentUser: booking.users_bookings_studentUserIdTousers
        ? {
            ...this.redactUserPII(booking.users_bookings_studentUserIdTousers),
            studentProfile: booking.users_bookings_studentUserIdTousers
              .student_profiles
              ? {
                  ...booking.users_bookings_studentUserIdTousers
                    .student_profiles,
                  curriculum:
                    booking.users_bookings_studentUserIdTousers.student_profiles
                      .curricula,
                }
              : undefined,
          }
        : undefined,
      child: booking.children
        ? {
            ...booking.children,
            curriculum: booking.children.curricula,
          }
        : undefined,
      subject: booking.subjects,
      jitsiEnabled: !!booking.jitsiEnabled, // Force boolean
    };
    // DEBUG LOGGING
    if (booking.readableId === 'BK-2601-0002') {
      console.log(
        `[DEBUG] Transformed Booking BK-2601-0002: jitsiEnabled=${transformed.jitsiEnabled}, DB_Value=${booking.jitsiEnabled}`,
      );
    }
    return transformed;
  }

  /**
   * Cron Job: Expire bookings waiting for payment where deadline has passed
   */
  async expireUnpaidBookings() {
    const now = new Date();

    // Find bookings that missed their payment deadline
    const unpaidBookings = await this.prisma.bookings.findMany({
      where: {
        status: 'WAITING_FOR_PAYMENT',
        paymentDeadline: { lt: now },
      },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
      },
    });

    if (unpaidBookings.length === 0) return;

    const logger = new Logger('BookingCleanup');
    logger.log(`Found ${unpaidBookings.length} unpaid bookings to expire`);

    for (const booking of unpaidBookings) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Update status to EXPIRED
          await tx.bookings.update({
            where: { id: booking.id },
            data: { status: 'EXPIRED' },
          });
        });

        // Notify Parent (You missed the payment deadline)
        await this.notificationService.notifyUser({
          userId: booking.bookedByUserId,
          title: 'انتهاء مهلة الدفع',
          message: `نأسف، تم إلغاء حجزك مع ${this.getSafeDisplayName(booking.teacher_profiles.users, 'المعلم')} لعدم سداد المبلغ في الوقت المحدد.`,
          type: 'SYSTEM_ALERT',
          link: '/parent/bookings',
          dedupeKey: `PAYMENT_EXPIRED:${booking.id}`,
        });

        // Notify Teacher (Slot is free again)
        await this.notificationService.notifyUser({
          userId: booking.teacher_profiles.users.id,
          title: 'إلغاء حجز لعدم الدفع',
          message: `تم إلغاء الحجز المعلق من ${this.getSafeDisplayName(booking.users_bookings_bookedByUserIdTousers, 'ولي الأمر')} لعدم سداد المبلغ. الموعد متاح مرة أخرى.`,
          type: 'SYSTEM_ALERT',
          link: '/teacher/sessions',
          dedupeKey: `PAYMENT_EXPIRED:${booking.id}`,
        });
      } catch (error) {
        logger.error(`Failed to expire booking ${booking.id}`, error);
      }
    }
  }

  // --- Phase 2C: Payment Integration ---

  /**
   * Parent pays for approved booking (WAITING_FOR_PAYMENT → SCHEDULED)
   * Handles both single sessions and package purchases
   */
  async payForBooking(parentUserId: string, bookingId: string) {
    // Fetch booking to decide path
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        teacher_profiles: { include: { users: true } },
        children: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.users_bookings_bookedByUserIdTousers.id !== parentUserId)
      throw new ForbiddenException('Not your booking');
    if (booking.status === 'SCHEDULED') return booking; // Idempotent
    if (booking.status !== 'WAITING_FOR_PAYMENT')
      throw new BadRequestException('Booking is not awaiting payment');

    let updatedBooking;

    // PATH A: Package Purchase
    if (booking.pendingTierId) {
      this.logger.log(`Processing package purchase for booking ${bookingId}`);
      const studentId = booking.studentUserId || parentUserId;
      if (!studentId) throw new BadRequestException('Cannot determine student');

      try {
        const studentPackage = await this.packageService.purchasePackage(
          parentUserId,
          studentId,
          booking.teacherId,
          booking.subjectId,
          booking.pendingTierId,
          `pkgpurchase:${bookingId}`,
        );
        if (!studentPackage)
          throw new BadRequestException('Package purchase failed');

        await this.packageService.createRedemption(
          studentPackage.id,
          bookingId,
        );

        updatedBooking = await this.prisma.bookings.update({
          where: { id: bookingId },
          data: { pendingTierId: null, status: 'SCHEDULED' },
        });
      } catch (e: any) {
        this.logger.error('Package purchase failed', e);
        throw new BadRequestException(e.message || 'Failed package purchase');
      }
    }
    // PATH B: Single Session (Atomic)
    else {
      updatedBooking = await this.prisma.$transaction(
        async (tx) => {
          await this.walletService.lockFundsForBooking(
            parentUserId,
            bookingId,
            Number(booking.price),
            tx,
          );
          return tx.bookings.update({
            where: { id: bookingId, status: 'WAITING_FOR_PAYMENT' },
            data: { status: 'SCHEDULED' },
          });
        },
        {
          // SECURITY: Use SERIALIZABLE isolation for payment locking
          isolationLevel: 'Serializable',
        },
      );
    }

    // Notifications
    const successTitle = 'تم الدفع بنجاح';
    const msg = booking.pendingTierId ? 'تم شراء الباقة.' : 'تم تأكيد الدفع.';

    await this.notificationService.notifyUser({
      userId: parentUserId,
      title: successTitle,
      message: msg,
      type: 'PAYMENT_SUCCESS',
      link: '/parent/bookings',
      dedupeKey: `PAYMENT_SUCCESS:${bookingId}:${parentUserId}`,
      metadata: { bookingId },
    });

    await this.notificationService.notifyUser({
      userId: booking.teacher_profiles.users.id,
      title: 'حجز جديد مؤكد',
      message: `تم تأكيد حجز جديد.`,
      type: 'PAYMENT_SUCCESS',
      link: '/teacher/sessions',
      dedupeKey: `PAYMENT_SUCCESS:${bookingId}:${booking.teacher_profiles.users.id}`,
      metadata: { bookingId },
    });

    return this.transformBooking(updatedBooking);
  }

  /**
   * Mark session as completed (SCHEDULED → COMPLETED)
   * Releases funds to teacher (minus commission)
   * NOTE: In MVP, this is called by Admin. In Phase 3, this would be automated.
   */
  async markCompleted(bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        users_bookings_bookedByUserIdTousers: true,
        teacher_profiles: { include: { users: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'SCHEDULED') {
      throw new BadRequestException('Booking is not scheduled');
    }

    // Release funds to teacher atomically
    await this.walletService.releaseFundsOnCompletion(
      booking.users_bookings_bookedByUserIdTousers.id,
      booking.teacher_profiles.users.id,
      bookingId,
      Number(booking.price),
      Number(booking.commissionRate),
    );

    // Update booking status
    const updated = await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });
    return this.transformBooking(updated);
  }

  async completeSession(teacherUserId: string, bookingId: string, dto?: any) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        disputes: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Check ownership
    const teacher_profiles = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher_profiles || booking.teacherId !== teacher_profiles.id) {
      throw new BadRequestException('Not authorized to complete this session');
    }

    // P1 FIX: State machine validation for status transition
    const targetStatus = 'PENDING_CONFIRMATION';
    if (!isValidStatusTransition(booking.status, targetStatus)) {
      const allowed = getAllowedTransitions(booking.status);
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    // Session timing validation
    const now = new Date();
    const sessionStartTime = new Date(booking.startTime);
    const sessionEndTime = new Date(booking.endTime);

    // SECURITY: Prevent completion before session even starts
    // But allow completion DURING the session (teacher can end early)
    if (now < sessionStartTime) {
      const minutesUntilStart = Math.ceil(
        (sessionStartTime.getTime() - now.getTime()) / 60000,
      );
      throw new BadRequestException(
        `Cannot complete session before it starts. Session begins in ${minutesUntilStart} minutes.`,
      );
    }

    // Log if ending early (for analytics, not blocking)
    if (now < sessionEndTime) {
      const minutesEarly = Math.ceil(
        (sessionEndTime.getTime() - now.getTime()) / 60000,
      );
      this.logger.log(
        `Session ${bookingId} completed ${minutesEarly} minutes before scheduled end time`,
      );
    }

    // Get system settings for dispute window
    const settings = await this.getSystemSettings();
    const disputeWindowClosesAt = new Date(
      now.getTime() + settings.disputeWindowHours * 60 * 60 * 1000,
    );

    // Auto-generate teacherSummary from structured fields if provided
    let teacherSummary = dto?.teacherSummary;
    if (!teacherSummary && dto) {
      const parts = [];
      if (dto.topicsCovered) parts.push(`المواضيع: ${dto.topicsCovered}`);
      if (dto.studentPerformanceNotes)
        parts.push(`الأداء: ${dto.studentPerformanceNotes}`);
      if (dto.homeworkAssigned && dto.homeworkDescription)
        parts.push(`الواجب: ${dto.homeworkDescription}`);
      if (dto.nextSessionRecommendations)
        parts.push(`التوصيات: ${dto.nextSessionRecommendations}`);
      if (parts.length > 0) teacherSummary = parts.join(' | ');
    }

    // Update to PENDING_CONFIRMATION with dispute window tracking + session details
    const updatedBooking = await this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: 'PENDING_CONFIRMATION',
        // NEW: Dispute window tracking
        disputeWindowOpensAt: now,
        disputeWindowClosesAt: disputeWindowClosesAt,
        // LEGACY: Keep for backward compatibility
        teacherCompletedAt: now,
        autoReleaseAt: disputeWindowClosesAt,
        // Session completion details (all optional)
        // sessionProofUrl: dto?.sessionProofUrl, // REMOVED: Field no longer exists in schema
        topicsCovered: dto?.topicsCovered,
        studentPerformanceRating: dto?.studentPerformanceRating,
        studentPerformanceNotes: dto?.studentPerformanceNotes,
        homeworkAssigned: dto?.homeworkAssigned,
        homeworkDescription: dto?.homeworkDescription,
        nextSessionRecommendations: dto?.nextSessionRecommendations,
        additionalNotes: dto?.additionalNotes,
        teacherSummary: teacherSummary,
      },
    });

    // Trigger notification cascade (T+0h)
    await this.notificationService.notifySessionComplete({
      bookingId: booking.id,
      parentUserId: booking.bookedByUserId,
      teacherName: this.getSafeDisplayName(
        booking.teacher_profiles.users,
        'المعلم',
      ),
      disputeDeadline: disputeWindowClosesAt,
    });

    return this.transformBooking(updatedBooking);
  }

  /**
   * Parent/Student confirms session early (before auto-release)
   * P1-1 FIX: Atomic transaction with conditional update for race safety
   */
  async confirmSessionEarly(
    userId: string,
    bookingId: string,
    rating?: number,
    userRole: string = 'STUDENT',
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // 1. Fetch booking inside transaction
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId },
          include: {
            users_bookings_bookedByUserIdTousers: true,
            teacher_profiles: { include: { users: true } },
            package_redemptions: true,
          },
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Auth check
        if (userRole !== 'ADMIN' && booking.bookedByUserId !== userId) {
          throw new ForbiddenException(
            'Not authorized to confirm this session',
          );
        }

        // Idempotency: Already COMPLETED
        if (booking.status === 'COMPLETED') {
          return {
            updatedBooking: booking,
            bookingContext: booking,
            alreadyCompleted: true,
          };
        }

        // P1 FIX: State machine validation for status transition
        const targetStatus = 'COMPLETED';
        if (!isValidStatusTransition(booking.status, targetStatus)) {
          const allowed = getAllowedTransitions(booking.status);
          throw new BadRequestException(
            `Cannot transition from ${booking.status} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
          );
        }

        // Dispute window check
        if (
          booking.disputeWindowClosesAt &&
          new Date() > booking.disputeWindowClosesAt
        ) {
          throw new BadRequestException(
            'Dispute window has expired - payment already auto-released',
          );
        }

        const now = new Date();

        // 2. Strict Conditional Update (P1-1 FIX)
        // This ensures only one process can transition the status
        const updatedBooking = await tx.bookings.update({
          where: {
            id: bookingId,
            status: 'PENDING_CONFIRMATION', // Conditional!
          },
          data: {
            status: 'COMPLETED',
            studentConfirmedAt: now,
            paymentReleasedAt: now,
          },
        });

        // 3. Release Funds (Atomically inside TX)
        // FIX P1: Separate logic for Package vs Single Session.
        // Packages hold funds in escrow in StudentPackage entity, not Wallet.
        // Single sessions hold funds in locked Wallet balance.

        if (booking.package_redemptions) {
          // --- Package Release ---
          // Atomic call to PackageService with this transaction client
          const idempotencyKey = `RELEASE_${bookingId}`;
          await this.packageService.releaseSession(
            bookingId,
            idempotencyKey,
            tx,
          );
        } else {
          // --- Single Session Release ---
          // Release from locked wallet funds
          const price = normalizeMoney(booking.price);
          const commissionRate = Number(booking.commissionRate);

          await this.walletService.releaseFundsOnCompletion(
            booking.bookedByUserId,
            booking.teacher_profiles.userId,
            booking.id,
            price,
            commissionRate,
            tx, // Pass transaction client
          );
        }

        return {
          updatedBooking,
          bookingContext: booking,
          alreadyCompleted: false,
        };
      },
      {
        // SECURITY: Use SERIALIZABLE isolation for payment release
        isolationLevel: 'Serializable',
      },
    );

    // Skip side effects if already completed (idempotency)
    if (result.alreadyCompleted) {
      return this.transformBooking(result.updatedBooking);
    }

    // 4. Post-Transaction: Best-effort side effects
    const { updatedBooking, bookingContext } = result;

    // Package Release call REMOVED (Moved inside atomic transaction above)

    // Demo Complete
    // SECURITY FIX: Use bookedByUserId (the payer) not studentUserId
    // This correctly handles parent bookings for children
    const isDemo = normalizeMoney(bookingContext.price) === 0;
    if (isDemo && bookingContext.bookedByUserId) {
      try {
        await this.demoService.markDemoCompleted(
          bookingContext.bookedByUserId, // The demo owner is who booked/paid
          bookingContext.teacherId,
        );
        this.logger.log(
          `Demo marked complete for owner ${bookingContext.bookedByUserId}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to mark demo complete for booking ${bookingId}`,
          err,
        );
      }
    }

    // Notify teacher - use normalizeMoney for consistent calculation
    const teacherEarnings = normalizeMoney(
      normalizeMoney(bookingContext.price) *
        (1 - Number(bookingContext.commissionRate)),
    );
    await this.notificationService.notifyTeacherPaymentReleased({
      bookingId: updatedBooking.id,
      teacherId: bookingContext.teacher_profiles.users.id,
      amount: teacherEarnings,
      releaseType: 'CONFIRMED',
    });

    return this.transformBooking(updatedBooking);
  }

  /**
   * Submit a rating for a completed booking
   * Uses transaction to atomically:
   * 1. Create the rating
   * 2. Update teacher's averageRating and totalReviews
   */
  async rateBooking(userId: string, bookingId: string, dto: CreateRatingDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get booking with existing rating and teacher profile
      const booking = await tx.bookings.findUnique({
        where: { id: bookingId },
        include: {
          ratings: true,
          teacher_profiles: true,
        },
      });

      // Validate booking exists
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Validate booking is COMPLETED
      if (booking.status !== 'COMPLETED') {
        throw new BadRequestException('يمكنك التقييم فقط بعد اكتمال الجلسة');
      }

      // Validate user owns this booking
      if (booking.bookedByUserId !== userId) {
        throw new ForbiddenException('لا يمكنك تقييم حجز لا يخصك');
      }

      // Validate no existing rating
      if (booking.ratings) {
        throw new ConflictException('لقد قمت بتقييم هذه الجلسة مسبقاً');
      }

      // 2. Create the rating
      const rating = await tx.ratings.create({
        data: {
          id: crypto.randomUUID(),
          bookingId: bookingId,
          teacherId: booking.teacherId,
          ratedByUserId: userId,
          score: dto.score,
          comment: dto.comment || null,
        },
      });

      // 3. Update teacher's aggregates using running average formula
      const currentAvg = booking.teacher_profiles.averageRating;
      const currentCount = booking.teacher_profiles.totalReviews;
      const newCount = currentCount + 1;
      // Running average: newAvg = ((oldAvg * oldCount) + newScore) / newCount
      const newAverage = (currentAvg * currentCount + dto.score) / newCount;
      // Round to 2 decimal places
      const roundedAverage = Math.round(newAverage * 100) / 100;

      await tx.teacher_profiles.update({
        where: { id: booking.teacherId },
        data: {
          averageRating: roundedAverage,
          totalReviews: newCount,
        },
      });

      return rating;
    });
  }

  // Student/Parent raises a dispute
  async raiseDispute(
    userId: string,
    bookingId: string,
    dto: { type: string; description: string; evidence?: string[] },
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        users_bookings_bookedByUserIdTousers: true,
        disputes: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Only the person who booked can raise dispute
    if (booking.bookedByUserId !== userId) {
      throw new ForbiddenException(
        'Not authorized to raise dispute for this session',
      );
    }

    // Can only dispute PENDING_CONFIRMATION or SCHEDULED sessions
    if (!['PENDING_CONFIRMATION', 'SCHEDULED'].includes(booking.status)) {
      throw new BadRequestException('Cannot dispute this session');
    }

    // Check if dispute already exists
    if (booking.disputes) {
      throw new BadRequestException(
        'A dispute already exists for this session',
      );
    }

    // Validate dispute type
    const validTypes = [
      'TEACHER_NO_SHOW',
      'SESSION_TOO_SHORT',
      'QUALITY_ISSUE',
      'TECHNICAL_ISSUE',
      'OTHER',
    ];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException('Invalid dispute type');
    }

    // Create dispute and update booking status in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const dispute = await tx.disputes.create({
        data: {
          id: crypto.randomUUID(),
          bookingId: bookingId,
          raisedByUserId: userId,
          type: dto.type as any,
          description: dto.description,
          evidence: dto.evidence || [],
          status: 'PENDING',
        },
      });

      const updatedBooking = await tx.bookings.update({
        where: { id: bookingId },
        data: { status: 'DISPUTED' },
      });

      return { bookings: updatedBooking, dispute };
    });

    // Notify all admin users about the new dispute
    const adminUsers = await this.prisma.users.findMany({
      where: { role: 'ADMIN', isActive: true },
    });

    for (const admin of adminUsers) {
      await this.notificationService.notifyUser({
        userId: admin.id,
        title: 'نزاع جديد',
        message: `تم رفع نزاع جديد على حجز رقم ${bookingId.slice(0, 8)}...`,
        type: 'DISPUTE_RAISED',
      });
    }

    return result;
  }

  // Helper: Get system settings (with defaults)
  async getSystemSettings() {
    let settings = await this.prisma.system_settings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await this.prisma.system_settings.create({
        data: {
          id: 'default',
          confirmationWindowHours: 48,
          autoReleaseEnabled: true,
          reminderHoursBeforeRelease: 6,
          defaultCommissionRate: 0.18,
          updatedAt: new Date(),
        },
      });
    }

    return settings;
  }

  // Helper: Release payment to teacher wallet
  private async releasePaymentToTeacher(booking: any) {
    const price = normalizeMoney(booking.price);
    const commissionRate = Number(booking.commissionRate);

    // Use the existing wallet method for proper escrow release
    await this.walletService.releaseFundsOnCompletion(
      booking.bookedByUserId, // Parent/Student who paid
      booking.teacher_profiles.userId, // Teacher receiving payment
      booking.id, // Booking ID
      price, // Total amount
      commissionRate, // Commission rate
    );
  }

  // --- Phase 2C: Payment Integration ---
  // (Existing payment methods are above)

  // --- Phase 3: Booking Validation ---
  // Availability validation is now slot-based (via teacher_session_slots)

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // =========================
  // CANCELLATION FLOW
  // =========================

  /**
   * Get cancellation estimate (read-only, for UI preview)
   */
  async getCancellationEstimate(
    userId: string,
    userRole: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user can cancel this booking
    const canCancel = this.canUserCancel(booking, userId, userRole);
    if (!canCancel.allowed) {
      return {
        canCancel: false,
        reason: canCancel.reason,
        refundPercent: 0,
        refundAmount: 0,
        teacherCompAmount: 0,
      };
    }

    // If no payment yet (PENDING_TEACHER_APPROVAL or WAITING_FOR_PAYMENT), no funds involved
    if (
      ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'].includes(
        booking.status,
      )
    ) {
      return {
        canCancel: true,
        refundPercent: 100,
        refundAmount: 0,
        teacherCompAmount: 0,
        policy: null,
        hoursRemaining: null,
        message: 'لم يتم الدفع بعد - الإلغاء مجاني',
      };
    }

    // SCHEDULED booking - calculate based on policy
    const policy = booking.teacher_profiles.cancellationPolicy;
    const paidAmount = Number(booking.price);
    const refund = this.calculateRefund(booking, policy, userRole);

    const hoursRemaining = Math.max(
      0,
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60),
    );

    return {
      canCancel: true,
      refundPercent: refund.percent,
      refundAmount: refund.amount,
      teacherCompAmount: paidAmount - refund.amount,
      policy,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      message: refund.message,
    };
  }

  /**
   * Cancel booking (unified endpoint - role determines logic)
   */
  async cancelBooking(
    userId: string,
    userRole: string,
    bookingId: string,
    reason?: string,
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // 1. Get booking with lock-like behavior (inside transaction)
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId },
          include: { teacher_profiles: { include: { users: true } } },
        });

        if (!booking) {
          throw new NotFoundException('Booking not found');
        }

        // 2. Idempotency: If already cancelled, return existing state (skip notification)
        if (booking.status.startsWith('CANCELLED')) {
          return {
            updatedBooking: booking,
            recipientId: null,
            cancelledByRole: null,
          };
        }

        // 3. Validate cancellation eligibility
        const canCancel = this.canUserCancel(booking, userId, userRole);
        if (!canCancel.allowed) {
          throw new BadRequestException(canCancel.reason);
        }

        // 4. Determine cancelled status and calculate refund
        let cancelledBy: string;
        let newStatus: string;
        let refundPercent = 100;
        let refundAmount = 0;
        let teacherCompAmount = 0;

        if (userRole === 'TEACHER') {
          cancelledBy = 'TEACHER';
          newStatus = 'CANCELLED_BY_TEACHER'; // Correct status for teacher cancellation
          refundPercent = 100; // Teacher cancel = full refund to parent
        } else if (userRole === 'ADMIN') {
          cancelledBy = 'ADMIN';
          newStatus = 'CANCELLED_BY_ADMIN';
          refundPercent = 100; // Admin can override (MVP: full refund)
        } else {
          cancelledBy = 'PARENT';
          newStatus = 'CANCELLED_BY_PARENT';

          // Only calculate policy-based refund for SCHEDULED bookings
          if (booking.status === 'SCHEDULED') {
            const policy = booking.teacher_profiles.cancellationPolicy;
            // Fetch global cancellation policies
            const system_settings =
              await this.system_settingsService.getSettings();
            const config = system_settings.cancellationPolicies;

            const refund = this.calculateRefund(
              booking,
              policy,
              userRole,
              config,
            );
            refundPercent = refund.percent;
          }
        }

        // 5. Handle wallet settlement (only if payment was made)
        const paidAmount = Number(booking.price);
        if (booking.status === 'SCHEDULED' && paidAmount > 0) {
          refundAmount = (paidAmount * refundPercent) / 100;

          // Calculate Platform Fee on Retained Amount
          // Retained = Paid - Refund.
          // Teacher gets (Retained * (1 - Commission))
          // Platform gets (Retained * Commission)
          const retainedAmount = paidAmount - refundAmount;
          let platformRevenue = 0;

          if (retainedAmount > 0) {
            const system_settings =
              await this.system_settingsService.getSettings(); // Re-fetch to be safe or reuse
            const commissionRate =
              system_settings.defaultCommissionRate || 0.18;
            platformRevenue = retainedAmount * commissionRate;
            teacherCompAmount = retainedAmount - platformRevenue;
          } else {
            teacherCompAmount = 0;
          }

          // Settle via wallet (atomic with booking update)
          await this.walletService.settleCancellation(
            booking.bookedByUserId,
            booking.teacher_profiles.users.id,
            bookingId,
            paidAmount,
            refundAmount,
            teacherCompAmount,
            platformRevenue,
            tx, // Pass transaction client for atomicity
          );
        }

        // 6. Update booking with cancellation audit trail
        // P0-2 SECURITY FIX: Increment jitsiTokenVersion to invalidate any existing JWT tokens
        // This ensures cancelled bookings cannot be accessed via previously issued tokens
        const currentTokenVersion = (booking as any).jitsiTokenVersion || 1;

        const updatedBooking = await tx.bookings.update({
          where: { id: bookingId },
          data: {
            status: newStatus as any,
            cancelReason: reason || 'ملغى بواسطة المستخدم',
            cancelledAt: new Date(),
            cancelledBy,
            refundPercent,
            refundAmount,
            teacherCompAmount,
            cancellationPolicySnapshot:
              booking.status === 'SCHEDULED'
                ? booking.teacher_profiles.cancellationPolicy
                : null,
            // P0-2 SECURITY FIX: Invalidate Jitsi tokens by incrementing version
            jitsiTokenVersion: currentTokenVersion + 1,
          },
        });

        // Slot Restoration
        await this.availabilitySlotService.restoreSlot(
          tx,
          booking.teacherId,
          booking.startTime,
        );

        // =====================================================
        // PACKAGE INTEGRATION: Cancel redemption if exists
        // =====================================================
        // Update PackageRedemption status to CANCELLED (no funds released)
        await tx.package_redemptions.updateMany({
          where: {
            bookingId,
            status: 'RESERVED', // Only cancel if not already released
          },
          data: { status: 'CANCELLED' },
        });

        // =====================================================
        // DEMO INTEGRATION: Cancel demo record if this was a demo booking
        // SECURITY FIX: Deletes demo record to allow user to retry
        // =====================================================
        const isDemo = normalizeMoney(booking.price) === 0;
        if (isDemo && booking.bookedByUserId && booking.teacherId) {
          try {
            await this.demoService.cancelDemoRecordInTransaction(
              booking.bookedByUserId,
              booking.teacherId,
              tx,
            );
            this.logger.log(`Demo record cancelled for booking ${bookingId}`);
          } catch (err) {
            // Log but don't fail the cancellation - demo cleanup is best effort
            this.logger.warn(
              `Failed to cancel demo record for booking ${bookingId}: ${err}`,
            );
          }
        }

        // Return booking with extra context for notification
        return {
          updatedBooking,
          recipientId:
            userRole === 'TEACHER'
              ? booking.bookedByUserId // Notify parent if teacher cancelled
              : booking.teacher_profiles.users.id, // Notify teacher if parent cancelled
          cancelledByRole: userRole,
        };
      },
      {
        // SECURITY: Use SERIALIZABLE isolation for cancellation settlement
        isolationLevel: 'Serializable',
      },
    );

    // Notify the other party about cancellation (after transaction commits)
    // Skip if idempotent return (recipientId is null) or admin cancellation
    if (
      result.recipientId &&
      result.cancelledByRole &&
      result.cancelledByRole !== 'ADMIN'
    ) {
      const recipientLink =
        result.cancelledByRole === 'TEACHER'
          ? '/parent/bookings'
          : '/teacher/sessions';

      await this.notificationService.notifyUser({
        userId: result.recipientId,
        title: 'تم إلغاء الحجز',
        message: reason || 'تم إلغاء الحجز.',
        type: 'BOOKING_CANCELLED',
        link: recipientLink,
        dedupeKey: `BOOKING_CANCELLED:${bookingId}:${result.recipientId}`,
        metadata: { bookingId },
      });
    }

    return result.updatedBooking;
  }

  /**
   * Check if a user can cancel a booking
   */
  private canUserCancel(
    booking: any,
    userId: string,
    userRole: string,
  ): { allowed: boolean; reason?: string } {
    // Status check - common for all roles
    const cancellableStatuses = [
      'PENDING_TEACHER_APPROVAL',
      'WAITING_FOR_PAYMENT',
      'SCHEDULED',
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      return {
        allowed: false,
        reason: 'لا يمكن إلغاء هذا الحجز في حالته الحالية',
      };
    }

    // Can't cancel once session has started
    if (
      booking.status === 'SCHEDULED' &&
      new Date(booking.startTime) <= new Date()
    ) {
      return { allowed: false, reason: 'لا يمكن الإلغاء بعد بدء الجلسة' };
    }

    if (userRole === 'ADMIN') {
      return { allowed: true };
    }

    if (userRole === 'TEACHER') {
      // Teacher can only cancel their own bookings
      if (booking.teacher_profiles.userId !== userId) {
        return { allowed: false, reason: 'هذا الحجز ليس لديك' };
      }
      return { allowed: true };
    }

    // Parent/Student can only cancel their own bookings
    if (booking.bookedByUserId !== userId) {
      return { allowed: false, reason: 'هذا الحجز ليس لديك' };
    }

    return { allowed: true };
  }

  /**
   * Calculate refund based on policy and time remaining
   */
  private calculateRefund(
    booking: any,
    policy: string,
    userRole: string,
    config?: any,
  ): { percent: number; amount: number; message: string } {
    const paidAmount = Number(booking.price);

    // Default Configuration (Binary Cutoff)
    const defaults = {
      flexible: { cutoffHours: 12 },
      moderate: { cutoffHours: 24 },
      strict: { cutoffHours: 48 },
    };

    const flexibleConfig = config?.flexible || defaults.flexible;
    const moderateConfig = config?.moderate || defaults.moderate;
    const strictConfig = config?.strict || defaults.strict;

    // Teacher cancellation = always 100% refund
    if (userRole === 'TEACHER') {
      return {
        percent: 100,
        amount: paidAmount,
        message: 'إلغاء المعلم - استرداد كامل',
      };
    }

    // Grace period: booking created < 1 hour ago = 100% refund
    const createdAt = new Date(booking.createdAt);
    const hoursSinceCreation =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 1) {
      return {
        percent: 100,
        amount: paidAmount,
        message: 'ضمن فترة السماح - استرداد كامل',
      };
    }

    // Calculate hours until session
    const startTime = new Date(booking.startTime);
    const hoursUntilSession =
      (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    let percent: number;
    let message: string;
    let cutoff: number;

    switch (policy) {
      case 'FLEXIBLE':
        cutoff = flexibleConfig.cutoffHours || 12;
        break;
      case 'MODERATE':
        cutoff = moderateConfig.cutoffHours || 24;
        break;
      case 'STRICT':
        cutoff = strictConfig.cutoffHours || 48;
        break;
      default:
        cutoff = 24;
    }

    if (hoursUntilSession > cutoff) {
      percent = 100;
      message = `قبل ${cutoff} ساعة - استرداد كامل`;
    } else {
      percent = 0;
      message = `بعد تجاوز مهلة الإلغاء (${cutoff} ساعة) - لا استرداد`;
    }

    return { percent, amount: (paidAmount * percent) / 100, message };
  }
  // P1-2 FIX: Auto-Complete Safety Net Cron
  // Runs every hour to catch "forgotten" scheduled sessions
  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteScheduledSessions() {
    const GRACE_PERIOD_HOURS = 2; // Teacher has 2 hours after end time to complete manually
    const cutoffTime = new Date(
      Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000,
    );

    const stuckBookings = await this.prisma.bookings.findMany({
      where: {
        status: 'SCHEDULED',
        endTime: { lt: cutoffTime },
      },
      take: 100, // Batch size
    });

    for (const booking of stuckBookings) {
      try {
        // Auto-complete: Move to PENDING_CONFIRMATION to start dispute window
        await this.prisma.bookings.update({
          where: { id: booking.id, status: 'SCHEDULED' },
          data: {
            status: 'PENDING_CONFIRMATION',
            disputeWindowOpensAt: new Date(),
            disputeWindowClosesAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h from NOW (auto-action time)
          },
        });
        this.logger.log(`Auto-completed stuck booking ${booking.id}`);
        // TODO: Notify teacher they forgot?
      } catch (e) {
        this.logger.error(`Failed to auto-complete booking ${booking.id}`, e);
      }
    }
  }

  // =====================================================
  // PACKAGE SESSION RESCHEDULE (Reschedule-Only Model)
  // =====================================================

  /**
   * Student/Parent directly reschedules a package session.
   * Enforces: status=SCHEDULED, time window, max reschedules, availability.
   */
  async reschedulePackageSession(
    userId: string,
    userRole: string,
    bookingId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) {
    // Validate new times are in the future
    if (newStartTime < new Date()) {
      throw new BadRequestException('New start time must be in the future');
    }

    // 1. Fetch booking with package redemption
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        package_redemptions: true,
        teacher_profiles: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. Must be a package session
    if (!booking.package_redemptions) {
      throw new BadRequestException(
        'Only package sessions can use this endpoint',
      );
    }

    // 3. Authorization: Only bookedByUser or studentUser can reschedule
    if (booking.bookedByUserId !== userId && booking.studentUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to reschedule this session',
      );
    }

    // 4. Status enforcement: ONLY SCHEDULED allowed
    if (booking.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot reschedule: status is ${booking.status}. Only SCHEDULED sessions can be rescheduled.`,
      );
    }

    // 5. Time window check
    const hoursUntilSession =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSession < BOOKING_POLICY.studentRescheduleWindowHours) {
      throw new ForbiddenException(
        `Cannot reschedule within ${BOOKING_POLICY.studentRescheduleWindowHours} hours of session start`,
      );
    }

    // 6. Max reschedules check
    if (booking.rescheduleCount >= BOOKING_POLICY.studentMaxReschedules) {
      throw new ForbiddenException(
        `Maximum ${BOOKING_POLICY.studentMaxReschedules} reschedules allowed per session`,
      );
    }

    // 7. Atomic Availability & Conflict Check
    const teacherId = booking.teacherId;
    const oldStartTime = booking.startTime;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${teacherId}))`;

      // 1b. Lock Booking Row
      const bookings = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "rescheduleCount", "startTime", "endTime" FROM "bookings" WHERE "id" = $1 FOR UPDATE`,
        bookingId,
      );
      if (bookings.length === 0)
        throw new NotFoundException('Booking disappeared');

      // 2. Lock & Check Slot exists for NEW time
      const slots = await tx.$queryRawUnsafe<any[]>(
        `SELECT id FROM "teacher_session_slots" 
         WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
         FOR UPDATE NOWAIT`,
        teacherId,
        newStartTime,
      );

      if (slots.length === 0) {
        throw new ConflictException('الموعد المطلوب غير متاح حالياً.');
      }

      // 3. Check Booking Conflict for NEW time
      const conflict = await tx.bookings.findFirst({
        where: {
          teacherId,
          id: { not: bookingId },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (conflict) {
        throw new ConflictException('يوجد تضارب مع حصة أخرى في نفس الموعد.');
      }

      // 4. Update Booking (Conditional)
      const updateResult = await tx.bookings.updateMany({
        where: {
          id: bookingId,
          status: 'SCHEDULED',
          rescheduleCount: booking.rescheduleCount,
        },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          rescheduleCount: { increment: 1 },
          lastRescheduledAt: new Date(),
          rescheduledByRole: userRole,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('فشل تغيير الموعد بسبب تحديث متزامن.');
      }

      // 5. Restore ORIGINAL Slot
      await this.availabilitySlotService.restoreSlot(
        tx,
        teacherId,
        oldStartTime,
      );

      // 6. Consume NEW Slot
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        teacherId,
        newStartTime,
        newEndTime,
      );

      // 7. Audit log
      await tx.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actorId: userId,
          action: 'RESCHEDULE' as any,
          targetId: bookingId,
          payload: {
            oldStartTime,
            newStartTime,
            newEndTime,
            actorRole: userRole,
            reason: 'Direct student/parent reschedule',
          },
        },
      });

      return {
        success: true,
        bookingId,
        oldStartTime,
        newStartTime,
        rescheduleCount: booking.rescheduleCount + 1,
      };
    });

    // 9. Notify teacher (Outside transaction)
    const formattedNewTime = formatInTimezone(
      newStartTime,
      booking.timezone || 'UTC',
      'EEEE، d MMMM yyyy - h:mm a',
    );
    const formattedOldTime = formatInTimezone(
      oldStartTime,
      booking.timezone || 'UTC',
      'EEEE، d MMMM yyyy - h:mm a',
    );

    await this.notificationService.notifyUser({
      userId: booking.teacherId,
      type: 'BOOKING_APPROVED', // Reuse existing type
      title: 'تم تغيير موعد حصة',
      message: `قام الطالب بتغيير موعد الحصة من ${formattedOldTime} إلى ${formattedNewTime}`,
      link: '/teacher/sessions',
      dedupeKey: `STUDENT_RESCHEDULED:${bookingId}:${booking.teacherId}`,
      metadata: {
        bookingId,
        oldStartTime,
        newStartTime,
        rescheduledBy: userRole,
      },
    });

    return result;
  }

  /**
   * Teacher submits a reschedule request (requires student approval).
   */
  async requestReschedule(
    teacherUserId: string,
    bookingId: string,
    reason: string,
    proposedStartTime?: Date,
    proposedEndTime?: Date,
  ) {
    // Validate reason provided
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'Reason is required for reschedule request',
      );
    }

    // 1. Fetch booking
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        package_redemptions: true,
        teacher_profiles: true,
        reschedule_requests: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. Must be a package session
    if (!booking.package_redemptions) {
      throw new BadRequestException(
        'Only package sessions can use this endpoint',
      );
    }

    // 3. Teacher authorization
    if (booking.teacher_profiles.userId !== teacherUserId) {
      throw new ForbiddenException('You are not the teacher for this session');
    }

    // 4. Status enforcement
    if (booking.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot request reschedule: status is ${booking.status}`,
      );
    }

    // 5. Time window check
    const hoursUntilSession =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (
      hoursUntilSession < BOOKING_POLICY.teacherRescheduleRequestWindowHours
    ) {
      throw new ForbiddenException(
        `Cannot request reschedule within ${BOOKING_POLICY.teacherRescheduleRequestWindowHours} hours of session start`,
      );
    }

    // 6. Max requests PER BOOKING check
    const pendingOrApprovedCount = booking.reschedule_requests.filter(
      (r) => r.status === 'PENDING' || r.status === 'APPROVED',
    ).length;
    if (pendingOrApprovedCount >= BOOKING_POLICY.teacherMaxRescheduleRequests) {
      throw new ForbiddenException(
        `Maximum ${BOOKING_POLICY.teacherMaxRescheduleRequests} reschedule requests per booking`,
      );
    }

    // 7. Atomic Availability Check & Request Creation
    const expiresAt = new Date(
      Date.now() + BOOKING_POLICY.studentResponseTimeoutHours * 60 * 60 * 1000,
    );

    const request = await this.prisma.$transaction(async (tx) => {
      if (proposedStartTime) {
        const eTime =
          proposedEndTime ||
          new Date(proposedStartTime.getTime() + 60 * 60 * 1000);

        // A. Advisory Lock
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${booking.teacherId}))`;

        // B. Check Slot
        const slot = await tx.teacher_session_slots.findUnique({
          where: {
            teacherId_startTimeUtc: {
              teacherId: booking.teacherId,
              startTimeUtc: proposedStartTime,
            },
          },
        });
        if (!slot) {
          throw new ConflictException(
            'الموعد المقترح غير متاح في جدول المعلم.',
          );
        }

        // C. Check Booking Conflicts
        const conflict = await tx.bookings.findFirst({
          where: {
            teacherId: booking.teacherId,
            id: { not: bookingId },
            startTime: { lt: eTime },
            endTime: { gt: proposedStartTime },
            status: {
              in: [
                'SCHEDULED',
                'PENDING_TEACHER_APPROVAL',
                'WAITING_FOR_PAYMENT',
                'PENDING_CONFIRMATION',
                'PAYMENT_REVIEW',
              ] as any,
            },
          },
        });
        if (conflict) {
          throw new ConflictException('الموعد المقترح متضارب مع حصة أخرى.');
        }
      }

      // 8. Create reschedule request
      return await tx.reschedule_requests.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          requestedById: teacherUserId,
          proposedStartTime,
          proposedEndTime,
          reason,
          status: 'PENDING',
          expiresAt,
        },
      });
    });

    // 8. Notify student/parent
    await this.notificationService.notifyUser({
      userId: booking.bookedByUserId,
      type: 'RESCHEDULE_REQUEST' as any,
      title: 'طلب تغيير موعد الجلسة',
      message: `طلب المعلم تغيير موعد الجلسة. السبب: ${reason}`,
    });

    this.logger.log(
      `📝 RESCHEDULE_REQUEST | bookingId=${bookingId} | teacher=${teacherUserId}`,
    );

    return {
      success: true,
      requestId: request.id,
      expiresAt,
    };
  }

  /**
   * Student/Parent approves a reschedule request.
   * Lazy expiration: Check if expired before processing.
   */
  async approveRescheduleRequest(
    userId: string,
    userRole: string,
    requestId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) {
    // 1. Fetch request with booking
    const request = await this.prisma.reschedule_requests.findUnique({
      where: { id: requestId },
      include: {
        bookings: {
          include: { package_redemptions: true, teacher_profiles: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Reschedule request not found');
    }

    // 2. Authorization: Only bookedByUser can approve
    if (
      request.bookings.bookedByUserId !== userId &&
      request.bookings.studentUserId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to approve this request',
      );
    }

    // 3. Lazy expiration check: If expired, mark as EXPIRED and reject
    if (new Date() > request.expiresAt && request.status === 'PENDING') {
      await this.prisma.reschedule_requests.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      throw new ForbiddenException('This reschedule request has expired');
    }

    // 4. Idempotency: If already approved, return success
    if (request.status === 'APPROVED') {
      return {
        success: true,
        message: 'Request already approved',
        idempotent: true,
      };
    }

    // 5. Must be PENDING
    if (request.status !== 'PENDING') {
      throw new ForbiddenException(
        `Cannot approve: request status is ${request.status}`,
      );
    }

    // 6. Booking must be SCHEDULED
    if (request.bookings.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot reschedule: booking status is ${request.bookings.status}`,
      );
    }

    // 7. Atomic Reschedule Execution
    const oldStartTime = request.bookings.startTime;
    const teacherId = request.bookings.teacherId;

    await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock (per teacher)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${teacherId}))`;

      // 1b. Lock Booking Row
      const bookings = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "rescheduleCount" FROM "bookings" WHERE "id" = $1 FOR UPDATE`,
        request.bookingId,
      );
      if (bookings.length === 0)
        throw new NotFoundException('Booking disappeared');

      // 1c. Lock & Check Slot exists for NEW time
      const slots = await tx.$queryRawUnsafe<any[]>(
        `SELECT id FROM "teacher_session_slots" 
         WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
         FOR UPDATE NOWAIT`,
        teacherId,
        newStartTime,
      );

      if (slots.length === 0) {
        throw new ConflictException(
          'الموعد الجديد غير متاح حالياً. يرجى اختيار وقت آخر.',
        );
      }

      // 2. Conflict Check (Source of Truth) for NEW time
      const conflict = await tx.bookings.findFirst({
        where: {
          teacherId,
          id: { not: request.bookingId },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (conflict) {
        throw new ConflictException(
          'الموعد الجديد غير متاح حالياً. يرجى اختيار وقت آخر.',
        );
      }

      // 3. Update Booking (Merged into main transaction)
      // Update booking (conditional)
      const updateResult = await tx.bookings.updateMany({
        where: {
          id: request.bookingId,
          status: 'SCHEDULED',
          rescheduleCount: request.bookings.rescheduleCount,
        },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          rescheduleCount: { increment: 1 },
          lastRescheduledAt: new Date(),
          rescheduledByRole: 'TEACHER', // Via approval
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Reschedule failed due to concurrent update',
        );
      }

      // Update request
      await tx.reschedule_requests.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          respondedAt: new Date(),
          respondedById: userId,
        },
      });

      // 5. Audit log
      await tx.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actorId: userId,
          action: 'RESCHEDULE' as any,
          targetId: request.bookingId,
          payload: {
            oldStartTime,
            newStartTime,
            newEndTime,
            actorRole: userRole,
            reason: request.reason,
            requestId,
          },
        },
      });

      // 6. Restore ORIGINAL Slot
      await this.availabilitySlotService.restoreSlot(
        tx,
        teacherId,
        oldStartTime,
      );

      // 7. Consume NEW Slot
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        teacherId,
        newStartTime,
        newEndTime,
      );
    });

    this.logger.log(
      `✅ RESCHEDULE_APPROVED | requestId=${requestId} | bookingId=${request.bookingId}`,
    );

    // 🔴 HIGH PRIORITY - Gap #1 Fix: Notify teacher that student approved reschedule
    const formattedNewTime = formatInTimezone(
      newStartTime,
      request.bookings.timezone || 'UTC',
      'EEEE، d MMMM yyyy - h:mm a',
    );

    await this.notificationService.notifyUser({
      userId: request.requestedById, // Teacher who requested reschedule
      type: 'BOOKING_APPROVED', // Reuse existing type
      title: 'تم الموافقة على طلب تغيير الموعد',
      message: `وافق الطالب على طلب تغيير موعد الحصة إلى ${formattedNewTime}`,
      link: '/teacher/sessions',
      dedupeKey: `RESCHEDULE_APPROVED:${request.bookingId}:${request.requestedById}`,
      metadata: {
        bookingId: request.bookingId,
        newStartTime,
        newEndTime,
      },
    });

    return {
      success: true,
      bookingId: request.bookingId,
      newStartTime,
      rescheduleCount: request.bookings.rescheduleCount + 1,
    };
  }

  /**
   * Student/Parent declines a reschedule request.
   * Booking remains unchanged. Teacher must attend original time.
   */
  async declineRescheduleRequest(
    userId: string,
    requestId: string,
    reason?: string,
  ) {
    // 1. Fetch request
    const request = await this.prisma.reschedule_requests.findUnique({
      where: { id: requestId },
      include: { bookings: true },
    });

    if (!request) {
      throw new NotFoundException('Reschedule request not found');
    }

    // 2. Authorization
    if (
      request.bookings.bookedByUserId !== userId &&
      request.bookings.studentUserId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to decline this request',
      );
    }

    // 3. Idempotency: If already declined/expired, return success
    if (request.status === 'DECLINED' || request.status === 'EXPIRED') {
      return {
        success: true,
        message: 'Request already declined',
        idempotent: true,
      };
    }

    // 4. Must be PENDING
    if (request.status !== 'PENDING') {
      throw new ForbiddenException(
        `Cannot decline: request status is ${request.status}`,
      );
    }

    // 5. Update request
    await this.prisma.reschedule_requests.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        respondedById: userId,
      },
    });

    // 6. Notify teacher
    await this.notificationService.notifyUser({
      userId: request.requestedById,
      type: 'RESCHEDULE_DECLINED' as any,
      title: 'تم رفض طلب تغيير الموعد',
      message: 'تم رفض طلب تغيير موعد الجلسة. يرجى الحضور في الموعد الأصلي.',
    });

    this.logger.log(`❌ RESCHEDULE_DECLINED | requestId=${requestId}`);

    return { success: true, bookingId: request.bookingId };
  }

  /**
   * Cron Job: Send reminders for scheduled sessions without meeting links
   * Runs every 10 minutes to check for sessions starting in 30 minutes
   */
  @Cron('*/10 * * * *') // Every 10 minutes
  async sendMeetingLinkReminders() {
    const logger = new Logger('MeetingLinkReminder');

    // Calculate time window: 20-40 minutes from now
    // (30 minutes target with 10-minute buffer for cron timing)
    const now = new Date();
    const in20Minutes = new Date(now.getTime() + 20 * 60 * 1000);
    const in40Minutes = new Date(now.getTime() + 40 * 60 * 1000);

    // Find scheduled sessions without meeting link that start in 20-40 minutes
    // and haven't been reminded yet
    const sessionsNeedingReminder = await this.prisma.bookings.findMany({
      where: {
        status: 'SCHEDULED',
        meetingLink: null, // No meeting link set
        meetingLinkReminderSentAt: null, // Haven't sent reminder yet
        startTime: {
          gte: in20Minutes,
          lte: in40Minutes,
        },
      },
      include: {
        teacher_profiles: {
          include: { users: true },
        },
        children: true,
        users_bookings_studentUserIdTousers: true,
        subjects: true,
      },
    });

    if (sessionsNeedingReminder.length === 0) {
      logger.debug('No sessions needing meeting link reminders');
      return { remindersSent: 0 };
    }

    logger.log(
      `Found ${sessionsNeedingReminder.length} sessions needing meeting link reminders`,
    );

    let remindersSent = 0;

    for (const booking of sessionsNeedingReminder) {
      try {
        const teacherUserId = booking.teacher_profiles.userId;
        const studentName = booking.children?.name
          ? booking.children.name
          : this.getSafeDisplayName(
              booking.users_bookings_studentUserIdTousers,
              'الطالب',
            );
        const subjectName = booking.subjects?.nameAr || 'الدرس';
        const minutesUntilStart = Math.round(
          (booking.startTime.getTime() - now.getTime()) / (60 * 1000),
        );

        // Send notification to teacher
        await this.notificationService.notifyUser({
          userId: teacherUserId,
          type: 'MEETING_LINK_REMINDER' as any,
          title: '⚠️ رابط الاجتماع مفقود',
          message: `لديك حصة مع ${studentName} (${subjectName}) تبدأ بعد ${minutesUntilStart} دقيقة ولكن لم تقم بإضافة رابط الاجتماع بعد. يرجى إضافة الرابط الآن.`,
          metadata: {
            bookingId: booking.id,
            action: 'ADD_MEETING_LINK',
          },
        });

        // Mark reminder as sent
        await this.prisma.bookings.update({
          where: { id: booking.id },
          data: { meetingLinkReminderSentAt: new Date() },
        });

        logger.log(
          `Sent meeting link reminder for booking ${booking.id} to teacher ${teacherUserId}`,
        );
        remindersSent++;
      } catch (error) {
        logger.error(
          `Failed to send meeting link reminder for booking ${booking.id}:`,
          error,
        );
      }
    }

    logger.log(`Successfully sent ${remindersSent} meeting link reminders`);
    return { remindersSent };
  }
  /**
   * Admin-forced reschedule.
   * Checks availability but bypasses policy windows.
   */
  async adminReschedule(bookingId: string, newStartTime: Date) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        users_bookings_studentUserIdTousers: true,
        children: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    // 3. Execute in Transaction with Advisory Lock
    const oldStartTime = booking.startTime;
    const teacherId = booking.teacherId;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Advisory Lock (per teacher)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${teacherId}))`;

      // 1b. Lock Booking Row
      const bookings = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "rescheduleCount" FROM "bookings" WHERE "id" = $1 FOR UPDATE`,
        bookingId,
      );
      if (bookings.length === 0)
        throw new NotFoundException('Booking disappeared');

      // 1c. Lock & Check Slot exists for NEW time
      const slots = await tx.$queryRawUnsafe<any[]>(
        `SELECT id FROM "teacher_session_slots" 
         WHERE "teacherId" = $1 AND "startTimeUtc" = $2::timestamp 
         FOR UPDATE NOWAIT`,
        teacherId,
        newStartTime,
      );

      if (slots.length === 0) {
        throw new BadRequestException('الموعد الجديد غير متاح في جدول المعلم.');
      }

      // 2. Conflict Check (Source of Truth)
      const conflict = await tx.bookings.findFirst({
        where: {
          teacherId,
          id: { not: bookingId },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
              'PENDING_CONFIRMATION',
              'PAYMENT_REVIEW',
            ] as any,
          },
        },
      });

      if (conflict) {
        throw new BadRequestException(
          'الموعد الجديد غير متاح بسبب تضارب مع حصة أخرى.',
        );
      }

      // 3. Update Booking
      const res = await tx.bookings.update({
        where: { id: bookingId },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          lastRescheduledAt: new Date(),
          rescheduledByRole: 'ADMIN',
          rescheduleCount: { increment: 1 },
          status: 'SCHEDULED', // Force to SCHEDULED
        },
      });

      // 4. Restore ORIGINAL Slot
      await this.availabilitySlotService.restoreSlot(
        tx,
        teacherId,
        oldStartTime,
      );

      // 5. Consume NEW Slot
      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        teacherId,
        newStartTime,
        newEndTime,
      );

      return res;
    });

    // 4. Notifications
    const dateStr = formatInTimezone(
      newStartTime,
      booking.teacher_profiles.timezone,
      'yyyy-MM-dd HH:mm',
    );

    // Notify Teacher
    await this.notificationService.notifyUser({
      userId: booking.teacher_profiles.userId,
      title: 'تم تغيير موعد الحصة بواسطة الإدارة',
      message: `تم تغيير موعد الحصة مع ${booking.users_bookings_studentUserIdTousers?.firstName || booking.children?.name || 'الطالب'} إلى ${dateStr}`,
      type: 'BOOKING_RESCHEDULED',
    });

    // Notify Student/Parent
    await this.notificationService.notifyUser({
      userId: booking.bookedByUserId,
      title: 'تم تغيير موعد الحصة بواسطة الإدارة',
      message: `تم تغيير موعد الحصة مع المعلم ${booking.teacher_profiles.displayName} إلى ${dateStr}`,
      type: 'BOOKING_RESCHEDULED',
    });

    return updated;
  }

  // =====================================================
  // MEETING EVENTS (P1-1)
  // =====================================================

  /**
   * Log a meeting event (join, leave, start, end)
   */
  async logMeetingEvent(
    userId: string,
    bookingId: string,
    eventType:
      | 'PARTICIPANT_JOINED'
      | 'PARTICIPANT_LEFT'
      | 'MEETING_STARTED'
      | 'MEETING_ENDED',
    metadata?: Record<string, any>,
  ) {
    // Verify user has access to this booking
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user is authorized (teacher, booker, or student)
    const isTeacher = booking.teacher_profiles?.userId === userId;
    const isBooker = booking.bookedByUserId === userId;
    const isStudent = booking.studentUserId === userId;

    if (!isTeacher && !isBooker && !isStudent) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    // Determine user role
    let userRole: string;
    if (isTeacher) {
      userRole = 'teacher';
    } else if (isStudent) {
      userRole = 'student';
    } else {
      userRole = 'parent';
    }

    // Create the meeting event
    const event = await this.prisma.meeting_events.create({
      data: {
        bookingId,
        userId,
        eventType,
        userRole,
        metadata: metadata || {},
      },
    });

    this.logger.log(
      `Meeting event logged: ${eventType} by ${userRole} (${userId}) for booking ${bookingId}`,
    );

    return event;
  }

  /**
   * Get meeting events for a booking (for admin viewing)
   */
  async getMeetingEvents(bookingId: string) {
    const events = await this.prisma.meeting_events.findMany({
      where: { bookingId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return events.map((event) => ({
      id: event.id,
      bookingId: event.bookingId,
      userId: event.userId,
      userName: this.getSafeDisplayName(event.users, 'مستخدم'),
      userRole: event.userRole,
      eventType: event.eventType,
      metadata: event.metadata,
      createdAt: event.createdAt,
    }));
  }
}
