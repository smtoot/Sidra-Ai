import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateBookingDto, UpdateBookingStatusDto } from '@sidra/shared';
import crypto from 'crypto';
import { BookingConstants } from './booking.constants';
import { BookingErrorMessages } from './booking-error-messages';
import { normalizeMoney } from '../utils/money';
import { isValidTimezone } from '../common/utils/timezone.util';
import { AvailabilitySlotService } from '../teacher/availability-slot.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReadableIdService } from '../common/readable-id/readable-id.service';
import { NotificationService } from '../notification/notification.service';
import { WalletService } from '../wallet/wallet.service';
import { DemoService } from '../package/demo.service';
import { PackageService } from '../package/package.service';
import { BookingStatusValidatorService } from './booking-status-validator.service';

@Injectable()
export class BookingCreationService {
  private readonly logger = new Logger(BookingCreationService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private packageService: PackageService,
    private demoService: DemoService,
    private readableIdService: ReadableIdService,
    private configService: ConfigService,
    private availabilitySlotService: AvailabilitySlotService,
    private bookingStatusValidator: BookingStatusValidatorService,
  ) {}

  private getSafeDisplayName(user: any, fallback: string) {
    if (!user) return fallback;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.displayName || fallback;
  }

  async createRequest(user: any, dto: CreateBookingDto) {
    let beneficiaryType: 'CHILD' | 'STUDENT';
    let childId: string | null = null;
    let studentUserId: string | null = null;

    if (user.role === 'PARENT') {
      if (!dto.childId) {
        throw new BadRequestException(
          'Child ID is required for Parent bookings',
        );
      }
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

    const timezone = dto.timezone || 'UTC';
    if (!isValidTimezone(timezone)) {
      throw new BadRequestException(
        'المنطقة الزمنية غير صحيحة. يجب أن تكون منطقة زمنية IANA صالحة (مثل: Asia/Riyadh, America/New_York)',
      );
    }

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

    if (teacher_subjects.teacher_profiles.isOnVacation) {
      const returnDate = teacher_subjects.teacher_profiles.vacationEndDate;
      const returnDateStr = returnDate
        ? ` حتى ${returnDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}`
        : '';
      throw new BadRequestException(
        `المعلم في إجازة حالياً${returnDateStr}. يرجى المحاولة لاحقاً.`,
      );
    }

    if (teacher_subjects.teacher_profiles.userId === user.userId) {
      throw new ForbiddenException('لا يمكنك حجز حصة مع نفسك');
    }

    if (new Date(dto.startTime) <= new Date()) {
      throw new BadRequestException('Cannot book sessions in the past');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dto.teacherId}))`;

      let sessionStartTime = new Date(dto.startTime);
      let sessionEndTime = new Date(dto.endTime);

      let slot: any;
      if ((dto as any).slotId) {
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

        sessionStartTime = slot.startTimeUtc;
        sessionEndTime = new Date(sessionStartTime.getTime() + 60 * 60 * 1000);
      } else {
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

      const durationHours =
        (sessionEndTime.getTime() - sessionStartTime.getTime()) /
        (1000 * 60 * 60);

      if (durationHours <= 0) {
        throw new BadRequestException(
          BookingErrorMessages.END_TIME_AFTER_START,
        );
      }

      if (durationHours > BookingConstants.MAX_SESSION_HOURS) {
        throw new BadRequestException(
          `Session duration cannot exceed ${BookingConstants.MAX_SESSION_HOURS} hours`,
        );
      }

      const pricePerHour = Number(teacher_subjects.pricePerHour);
      const rawPrice = pricePerHour * durationHours;

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
      if (!isValidDemo && calculatedPrice <= 0) {
        throw new BadRequestException('لا يمكن أن يكون سعر الحصة صفرًا');
      }

      const commissionRate = BookingConstants.DEFAULT_COMMISSION_RATE;
      const readableId = await this.readableIdService.generate('BOOKING');

      if (isValidDemo) {
        const demoOwnerId = user.userId;
        const demoOwnerType =
          beneficiaryType === 'CHILD' ? 'PARENT' : 'STUDENT';
        const beneficiaryId =
          beneficiaryType === 'CHILD' ? (childId ?? undefined) : undefined;

        const eligibility = await this.demoService.canBookDemo(
          demoOwnerId,
          dto.teacherId,
        );
        if (!eligibility.allowed) {
          throw new BadRequestException(
            `لا يمكن حجز حصة تجريبية: ${eligibility.details || eligibility.reason}`,
          );
        }

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
          timezone,
          price: calculatedPrice,
          commissionRate,
          bookingNotes: dto.bookingNotes || null,
          meetingLink: null,
          status: 'PENDING_TEACHER_APPROVAL',
          pendingTierId: dto.tierId || null,
          jitsiEnabled: this.configService.get('JITSI_ENABLED') === 'true',
        },
        include: {
          teacher_profiles: { include: { users: true } },
          users_bookings_bookedByUserIdTousers: true,
          children: true,
          users_bookings_studentUserIdTousers: true,
          subjects: true,
        },
      });

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

      await this.availabilitySlotService.deleteOverlappingSlots(
        tx,
        dto.teacherId,
        sessionStartTime,
        sessionEndTime,
      );

      return newBooking;
    });

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

    return booking;
  }

  async approveRequest(
    teacherUserId: string,
    bookingId: string,
    settings: { paymentWindowHours: number; minHoursBeforeSession: number },
  ) {
    return this.prisma
      .$transaction(async (tx) => {
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId },
          include: {
            teacher_profiles: { include: { users: true } },
            users_bookings_bookedByUserIdTousers: true,
            package_redemptions: true,
          },
        });

        if (!booking) {
          throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
        }
        if (booking.teacher_profiles.users.id !== teacherUserId) {
          throw new ForbiddenException(BookingErrorMessages.NOT_YOUR_BOOKING);
        }

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

        if (
          booking.status !== 'PENDING_TEACHER_APPROVAL' &&
          booking.status !== 'WAITING_FOR_PAYMENT'
        ) {
          throw new BadRequestException(
            'Booking is not pending approval or payment',
          );
        }

        const now = new Date();
        const paymentWindowDuration =
          settings.paymentWindowHours * 60 * 60 * 1000;
        const minBufferDuration =
          settings.minHoursBeforeSession * 60 * 60 * 1000;

        const windowDeadline = new Date(now.getTime() + paymentWindowDuration);
        const bufferDeadline = new Date(
          booking.startTime.getTime() - minBufferDuration,
        );

        const paymentDeadline =
          windowDeadline < bufferDeadline ? windowDeadline : bufferDeadline;

        const parentWallet = await this.walletService.getBalance(
          booking.bookedByUserId,
        );
        const price = normalizeMoney(booking.price);
        const balance = normalizeMoney(parentWallet.balance);

        if (balance < price) {
          if (paymentDeadline.getTime() <= now.getTime()) {
            const msUntilStart = booking.startTime.getTime() - now.getTime();
            const MIN_PAYMENT_WINDOW_MS = 15 * 60 * 1000;

            if (msUntilStart > 0) {
              const allowedWindow = Math.min(
                MIN_PAYMENT_WINDOW_MS,
                msUntilStart,
              );
              const newDeadline = new Date(now.getTime() + allowedWindow);

              this.bookingStatusValidator.validateTransition(
                booking.status,
                'WAITING_FOR_PAYMENT',
                { allowSameStatus: true },
              );
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
            }

            throw new BadRequestException(
              'رصيد ولي الأمر غير كافٍ والوقت متأخر جداً لانتظار الدفع. يجب شحن المحفظة فوراً.',
            );
          }

          this.bookingStatusValidator.validateTransition(
            booking.status,
            'WAITING_FOR_PAYMENT',
            { allowSameStatus: true },
          );
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

        if (booking.pendingTierId) {
          return {
            bookings: booking,
            paymentRequired: false,
            isPackage: true,
            pendingTierId: booking.pendingTierId,
            bookedByUserId: booking.bookedByUserId,
          };
        }

        if (booking.package_redemptions) {
          const pkg = await tx.student_packages.findUnique({
            where: { id: booking.package_redemptions.packageId },
            select: { status: true, sessionsUsed: true, sessionCount: true },
          });
          if (!pkg) {
            throw new BadRequestException('Package not found for redemption');
          }
          if (pkg.status !== 'ACTIVE' || pkg.sessionsUsed > pkg.sessionCount) {
            throw new BadRequestException('Package is depleted or inactive');
          }

          this.bookingStatusValidator.validateTransition(
            booking.status,
            'SCHEDULED',
          );
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

        await this.walletService.lockFundsForBooking(
          booking.bookedByUserId,
          bookingId,
          price,
          tx,
        );

        this.bookingStatusValidator.validateTransition(
          booking.status,
          'SCHEDULED',
        );
        const updatedBooking = await tx.bookings.update({
          where: {
            id: bookingId,
            status: { in: ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'] },
          },
          data: {
            status: 'SCHEDULED',
            paymentDeadline: null,
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

          const parentUserId = updatedBooking.bookedByUserId as string;
          const parentUser = await this.prisma.users.findUnique({
            where: { id: parentUserId },
            select: { email: true, firstName: true },
          });

          if (isPackage && pendingTierId && bookedByUserId) {
            try {
              const studentId = bookingFromTx.studentUserId || bookedByUserId;

              this.logger.log(
                `Package purchase: studentId=${studentId}, bookedByUserId=${bookedByUserId}`,
              );

              if (!studentId) {
                throw new BadRequestException(
                  'Cannot determine student for package purchase',
                );
              }

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

              await this.packageService.createRedemption(
                studentPackage.id,
                bookingFromTx.id,
              );

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
              throw new BadRequestException('فشل شراء الباقة');
            }
          }

          if (paymentRequired) {
            await this.notificationService.notifyUser({
              userId: updatedBooking.bookedByUserId,
              title: 'تم قبول طلب الحجز - يرجى الدفع',
              message: `وافق المعلم على طلبك. يرجى سداد المبلغ قبل ${updatedBooking.paymentDeadline ? new Date(updatedBooking.paymentDeadline).toLocaleTimeString('ar-EG') : 'الموعد المحدد'} لتأكيد الحجز.`,
              type: 'BOOKING_APPROVED',
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
            await this.notificationService.notifyUser({
              userId: updatedBooking.bookedByUserId,
              title: 'تم قبول طلب الحجز (باقة)',
              message: 'وافق المعلم على طلبك وتم تأكيد الحصة من رصيد الباقة.',
              type: 'BOOKING_APPROVED',
              link: '/parent/bookings',
              dedupeKey: `BOOKING_APPROVED_PKG:${result.bookings.id}:${updatedBooking.bookedByUserId}`,
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

          return updatedBooking;
        },
      );
  }

  async rejectRequest(
    teacherUserId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        package_redemptions: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }
    if (booking.teacher_profiles.users.id !== teacherUserId) {
      throw new ForbiddenException(BookingErrorMessages.NOT_YOUR_BOOKING);
    }
    if (booking.status !== 'PENDING_TEACHER_APPROVAL') {
      throw new BadRequestException(BookingErrorMessages.BOOKING_NOT_PENDING);
    }
    this.bookingStatusValidator.validateTransition(
      booking.status,
      'REJECTED_BY_TEACHER',
    );

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${booking.teacherId}))`;

      const res = await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: 'REJECTED_BY_TEACHER',
          cancelReason: dto.cancelReason,
        },
      });

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

      await this.availabilitySlotService.restoreSlot(
        tx,
        booking.teacherId,
        booking.startTime,
      );

      return res;
    });

    await this.notificationService.notifyUser({
      userId: booking.bookedByUserId,
      title: 'تم رفض طلب الحجز',
      message: dto.cancelReason || 'تم رفض طلب الحجز من قبل المعلم.',
      type: 'BOOKING_REJECTED',
      link: '/parent/bookings',
      dedupeKey: `BOOKING_REJECTED:${bookingId}:${booking.bookedByUserId}`,
      metadata: { bookingId },
    });

    return updatedBooking;
  }
}
