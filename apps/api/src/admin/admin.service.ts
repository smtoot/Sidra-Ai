import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { BookingService } from '../booking/booking.service';
import { normalizeMoney } from '../utils/money';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ProcessTransactionDto, TransactionStatus } from '@sidra/shared';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => BookingService))
    private bookingService: BookingService,
  ) { }

  async getDashboardStats() {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalBookings,
      pendingBookings,
      pendingDisputes,
      totalRevenue, // This might be complex, let's just count completed bookings for now or sum transaction fees
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({ where: { role: 'TEACHER' } }),
      this.prisma.users.count({ where: { role: 'PARENT' } }), // Assuming Parent is Student for now
      this.prisma.bookings.count(),
      this.prisma.bookings.count({
        where: { status: 'PENDING_TEACHER_APPROVAL' },
      }),
      this.prisma.disputes.count({ where: { status: 'PENDING' } }),
      this.prisma.transactions.aggregate({
        where: { type: 'PAYMENT_RELEASE' }, // Assuming commission is taken here? Or usage of DEPOSIT?
        // For MVP, let's just show total Wallet Balances (system liability) or Total Deposits.
        // Let's use Total Deposits for "Volume".
        _sum: { amount: true },
      }),
    ]);

    // Recent Activity (Simple: Latest 5 users)
    const recentUsers = await this.prisma.users.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { teacher_profiles: true },
    });

    return {
      counts: {
        users: totalUsers,
        teachers: totalTeachers,
        students: totalStudents,
        bookings: totalBookings,
        pendingBookings: pendingBookings,
        pendingDisputes: pendingDisputes,
      },
      financials: {
        totalVolume: totalRevenue._sum.amount || 0,
      },
      recentUsers,
    };
  }

  /**
   * Get financial analytics for the admin dashboard
   * Returns revenue, platform fees, completed bookings, and growth metrics
   */
  async getFinancialAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period (last 30 days)
    const [
      currentCompletedBookings,
      currentRevenueResult,
      currentPlatformFeesResult,
    ] = await Promise.all([
      // Completed bookings in the last 30 days
      this.prisma.bookings.findMany({
        where: {
          status: 'COMPLETED',
          paymentReleasedAt: { gte: thirtyDaysAgo },
        },
        select: { price: true, commissionRate: true },
      }),
      // Total revenue from completed bookings (sum of prices)
      this.prisma.bookings.aggregate({
        where: {
          status: 'COMPLETED',
          paymentReleasedAt: { gte: thirtyDaysAgo },
        },
        _sum: { price: true },
      }),
      // Platform fees (commission) from payment releases
      this.prisma.transactions.aggregate({
        where: {
          type: 'PAYMENT_RELEASE',
          status: 'APPROVED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      }),
    ]);

    // Previous period (30-60 days ago) for growth comparison
    const [previousCompletedBookings, previousRevenueResult] =
      await Promise.all([
        this.prisma.bookings.count({
          where: {
            status: 'COMPLETED',
            paymentReleasedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          },
        }),
        this.prisma.bookings.aggregate({
          where: {
            status: 'COMPLETED',
            paymentReleasedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          },
          _sum: { price: true },
        }),
      ]);

    // Calculate totals - use normalizeMoney to prevent floating-point errors
    const totalRevenue = normalizeMoney(currentRevenueResult._sum.price || 0);
    const completedBookingsCount = currentCompletedBookings.length;

    // Calculate platform fees from the bookings (price * commissionRate)
    // CRITICAL FIX: Normalize each fee before accumulating to prevent floating-point drift
    let platformFees = 0;
    for (const booking of currentCompletedBookings) {
      const price = normalizeMoney(booking.price || 0);
      const rate = Number(booking.commissionRate || 0.15); // Default 15% if not set
      const fee = normalizeMoney(price * rate);
      platformFees += fee;
    }

    // Calculate averages
    const averageBookingValue =
      completedBookingsCount > 0
        ? Math.round(totalRevenue / completedBookingsCount)
        : 0;

    // Calculate growth percentages
    const previousRevenue = normalizeMoney(
      previousRevenueResult._sum.price || 0,
    );
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const bookingsGrowth =
      previousCompletedBookings > 0
        ? ((completedBookingsCount - previousCompletedBookings) /
          previousCompletedBookings) *
        100
        : completedBookingsCount > 0
          ? 100
          : 0;

    return {
      totalRevenue: Math.round(totalRevenue),
      platformFees: Math.round(platformFees),
      completedBookings: completedBookingsCount,
      averageBookingValue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal
      bookingsGrowth: Math.round(bookingsGrowth * 10) / 10,
    };
  }

  async getAllBookings(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return this.prisma.bookings.findMany({
      where,
      include: {
        teacher_profiles: {
          include: { users: { select: { email: true } } },
        },
        users_bookings_bookedByUserIdTousers: { select: { id: true, email: true } },
        users_bookings_studentUserIdTousers: { select: { id: true, email: true } },
        children: true,
        subjects: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getBookingById(id: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id },
      include: {
        teacher_profiles: {
          include: { users: true },
        },
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: true,
        children: true,
        subjects: true,
        package_redemptions: {
          include: {
            student_packages: {
              include: { package_tiers: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const result: any = booking;

    // Map package if exists
    if (booking.package_redemptions?.student_packages) {
      result.student_packages = booking.package_redemptions.student_packages;
    }

    return result;
  }

  async cancelBooking(bookingId: string, adminUserId: string, reason?: string) {
    return this.bookingService.cancelBooking(
      adminUserId,
      'ADMIN',
      bookingId,
      reason,
    );
  }

  async completeBooking(bookingId: string, adminUserId: string) {
    return this.bookingService.confirmSessionEarly(
      adminUserId,
      bookingId,
      undefined,
      'ADMIN',
    );
  }

  async rescheduleBooking(bookingId: string, newStartTime: Date) {
    return this.bookingService.adminReschedule(bookingId, newStartTime);
  }

  // =================== DISPUTE MANAGEMENT ===================

  /**
   * Get all disputes with optional status filter
   */
  async getDisputes(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return this.prisma.disputes.findMany({
      where,
      include: {
        bookings: {
          include: {
            teacher_profiles: {
              include: { users: { select: { id: true, email: true } } },
            },
            users_bookings_bookedByUserIdTousers: { select: { id: true, email: true } },
            subjects: true,
          },
        },
        users_disputes_raisedByUserIdTousers: { select: { id: true, email: true } },
        users_disputes_resolvedByAdminIdTousers: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single dispute with full details
   */
  async getDisputeById(disputeId: string) {
    const dispute = await this.prisma.disputes.findUnique({
      where: { id: disputeId },
      include: {
        bookings: {
          include: {
            teacher_profiles: {
              include: { users: { select: { id: true, email: true } } },
            },
            users_bookings_bookedByUserIdTousers: { select: { id: true, email: true } },
            users_bookings_studentUserIdTousers: { select: { id: true, email: true } },
            children: true,
            subjects: true,
          },
        },
        users_disputes_raisedByUserIdTousers: { select: { id: true, email: true } },
        users_disputes_resolvedByAdminIdTousers: { select: { id: true, email: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  /**
   * Resolve a dispute with specified outcome
   * @param resolutionType: 'DISMISSED' | 'TEACHER_WINS' | 'STUDENT_WINS' | 'SPLIT'
   */
  async resolveDispute(
    adminUserId: string,
    disputeId: string,
    resolutionType: 'DISMISSED' | 'TEACHER_WINS' | 'STUDENT_WINS' | 'SPLIT',
    resolutionNote: string,
    splitPercentage?: number,
  ) {
    try {
      // Fetch dispute with all needed relations for wallet operations
      const dispute = await this.prisma.disputes.findUnique({
        where: { id: disputeId },
        include: {
          bookings: {
            include: {
              teacher_profiles: { include: { users: true } },
              users_bookings_bookedByUserIdTousers: true,
            },
          },
        },
      });

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      // IDEMPOTENCY: Already resolved disputes cannot be resolved again
      // IDEMPOTENCY: Explicit allow-list for resolvable statuses
      const RESOLVABLE_STATUSES = ['PENDING', 'UNDER_REVIEW'];
      if (!RESOLVABLE_STATUSES.includes(dispute.status)) {
        throw new BadRequestException(
          `Dispute status '${dispute.status}' cannot be resolved. Expected one of: ${RESOLVABLE_STATUSES.join(', ')}`,
        );
      }

      const booking = dispute.bookings;
      // CRITICAL FIX: Use normalizeMoney for all financial calculations
      const lockedAmountGross = normalizeMoney(booking.price);
      const commissionRate = Number(booking.commissionRate);
      const parentUserId = booking.bookedByUserId;
      const teacherUserId = booking.teacher_profiles.userId;

      // Calculate amounts based on resolution type
      let disputeStatus: string;
      let bookingStatus: string;
      let studentRefundGross: number = 0;
      let teacherPayoutNet: number = 0;
      let platformCommission: number = 0;

      switch (resolutionType) {
        case 'DISMISSED':
        case 'TEACHER_WINS':
          // Teacher gets paid as normal completion
          disputeStatus =
            resolutionType === 'DISMISSED'
              ? 'DISMISSED'
              : 'RESOLVED_TEACHER_WINS';
          bookingStatus = 'COMPLETED';
          studentRefundGross = 0;
          platformCommission = normalizeMoney(
            lockedAmountGross * commissionRate,
          );
          teacherPayoutNet = lockedAmountGross - platformCommission;
          break;

        case 'STUDENT_WINS':
          // Full refund to student, no commission
          disputeStatus = 'RESOLVED_STUDENT_WINS';
          bookingStatus = 'REFUNDED';
          studentRefundGross = lockedAmountGross;
          teacherPayoutNet = 0;
          platformCommission = 0;
          break;

        case 'SPLIT':
          // Split the payment
          if (
            splitPercentage === undefined ||
            splitPercentage < 0 ||
            splitPercentage > 100
          ) {
            throw new BadRequestException(
              'Split percentage must be between 0 and 100',
            );
          }
          disputeStatus = 'RESOLVED_SPLIT';
          bookingStatus = 'PARTIALLY_REFUNDED';

          // Student gets GROSS refund of their portion - normalize to prevent floating-point errors
          studentRefundGross = normalizeMoney(
            lockedAmountGross * (splitPercentage / 100),
          );

          // Teacher's portion calculation
          const teacherGrossPortion = lockedAmountGross - studentRefundGross;
          platformCommission = normalizeMoney(
            teacherGrossPortion * commissionRate,
          );
          teacherPayoutNet = teacherGrossPortion - platformCommission;
          break;

        default:
          throw new BadRequestException('Invalid resolution type');
      }

      // INVARIANT CHECK (MANDATORY):
      // studentRefundGross + teacherPayoutNet + platformCommission MUST equal lockedAmountGross
      const totalDistributed =
        studentRefundGross + teacherPayoutNet + platformCommission;
      const tolerance = 0.01; // Allow 1 cent tolerance for floating point
      if (Math.abs(totalDistributed - lockedAmountGross) > tolerance) {
        const errorDetails = {
          disputeId,
          bookingId: booking.id,
          lockedAmountGross,
          studentRefundGross,
          teacherPayoutNet,
          platformCommission,
          totalDistributed,
          diff: totalDistributed - lockedAmountGross,
        };
        this.logger.error(
          'CRITICAL FINANCIAL INVARIANT VIOLATED:',
          JSON.stringify(errorDetails, null, 2),
        );

        throw new BadRequestException(
          `Financial invariant violated: ${studentRefundGross} + ${teacherPayoutNet} + ${platformCommission} = ${totalDistributed} != ${lockedAmountGross}`,
        );
      }

      // Get wallets before transaction
      const parentWallet = await this.prisma.wallets.findFirst({
        where: { userId: parentUserId },
      });
      const teacherWallet = await this.prisma.wallets.findFirst({
        where: { userId: teacherUserId },
      });

      if (!parentWallet) {
        throw new NotFoundException('Parent wallet not found');
      }
      if (!teacherWallet && teacherPayoutNet > 0) {
        throw new NotFoundException('Teacher wallet not found');
      }

      // Execute the resolution in an ATOMIC transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Update dispute status
        const updatedDispute = await tx.disputes.update({
          where: { id: disputeId },
          data: {
            status: disputeStatus as any,
            resolvedByAdminId: adminUserId,
            resolution: resolutionNote,
            teacherPayout: teacherPayoutNet,
            studentRefund: studentRefundGross,
            resolvedAt: new Date(),
          },
        });

        // 2. Update booking status
        await tx.bookings.update({
          where: { id: dispute.bookingId },
          data: {
            status: bookingStatus as any,
            paymentReleasedAt: new Date(),
          },
        });

        // 3. Release locked funds from parent's pendingBalance
        await tx.wallets.update({
          where: { id: parentWallet.id },
          data: {
            pendingBalance: { decrement: lockedAmountGross },
          },
        });

        // 4. Refund to student if applicable
        if (studentRefundGross > 0) {
          await tx.wallets.update({
            where: { id: parentWallet.id },
            data: {
              balance: { increment: studentRefundGross },
            },
          });

          await tx.transactions.create({
            data: {
              walletId: parentWallet.id,
              amount: studentRefundGross,
              type: 'REFUND',
              status: 'APPROVED',
              adminNote: `Dispute refund for booking ${booking.id} - ${resolutionType}`,
            } as any,
          });
        }

        // 5. Pay teacher if applicable
        if (teacherPayoutNet > 0 && teacherWallet) {
          await tx.wallets.update({
            where: { id: teacherWallet.id },
            data: {
              balance: { increment: teacherPayoutNet },
            },
          });

          await tx.transactions.create({
            data: {
              walletId: teacherWallet.id,
              amount: teacherPayoutNet,
              type: 'PAYMENT_RELEASE',
              status: 'APPROVED',
              adminNote: `Dispute resolution payment for booking ${booking.id} (${(commissionRate * 100).toFixed(0)}% commission)`,
            } as any,
          });
        }

        // 6. P1 FIX: Record escrow release from parent (positive amount + semantic type)
        await tx.transactions.create({
          data: {
            walletId: parentWallet.id,
            amount: lockedAmountGross, // P1 FIX: Use positive amount
            type: 'ESCROW_RELEASE', // P1 FIX: Semantic type instead of negative
            status: 'APPROVED',
            adminNote: `Dispute resolution - escrow released for booking ${booking.id}`,
          } as any,
        });

        return updatedDispute;
      });

      // NOTIFICATIONS
      let parentMessage = '';
      let teacherMessage = '';
      const bookingId = booking.id.slice(0, 8); // Short ID for message

      switch (resolutionType) {
        case 'TEACHER_WINS':
          parentMessage = `تم حل النزاع للحجز #${bookingId} لصالح المعلم. المبلغ المحجوز تم تحويله للمعلم.`;
          teacherMessage = `تم حل النزاع للحجز #${bookingId} لصالحك. تم إيداع المبلغ في محفظتك.`;
          break;
        case 'STUDENT_WINS':
          parentMessage = `تم حل النزاع للحجز #${bookingId} لصالحك. تم استرداد كامل المبلغ إلى محفظتك.`;
          teacherMessage = `تم حل النزاع للحجز #${bookingId} لصالح الطالب. تم استرداد المبلغ للطالب.`;
          break;
        case 'SPLIT':
          parentMessage = `تم حل النزاع للحجز #${bookingId} بتسوية جزئية. تم استرداد ${splitPercentage}% من المبلغ لمحفظتك.`;
          teacherMessage = `تم حل النزاع للحجز #${bookingId} بتسوية جزئية. تم إيداع الجزء المستحق في محفظتك.`;
          break;
        case 'DISMISSED':
          parentMessage = `تم رفض النزاع للحجز #${bookingId} لعدم كفاية الأدلة أو عدم توافقها مع السياسات.`;
          teacherMessage = `تم رفض النزاع المقدم ضدك للحجز #${bookingId}.`;
          break;
      }

      // Send notifications asynchronously
      await Promise.all([
        this.notificationService.notifyUser({
          userId: parentUserId,
          title: 'تحديث بخصوص النزاع',
          message: parentMessage,
          type: 'DISPUTE_UPDATE',
        }),
        this.notificationService.notifyUser({
          userId: teacherUserId,
          title: 'تحديث بخصوص النزاع',
          message: teacherMessage,
          type: 'DISPUTE_UPDATE',
        }),
      ]);

      return result;
    } catch (e: any) {
      this.logger.error('Resolve Dispute Error:', e);
      // Rethrow proper HTTP exceptions, wrap others
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException(`Internal Error: ${e.message}`);
    }
  }

  /**
   * Update dispute status to Under Review
   */
  async markDisputeUnderReview(disputeId: string) {
    const dispute = await this.prisma.disputes.findUnique({
      where: { id: disputeId },
      include: {
        bookings: {
          select: {
            readableId: true,
            bookedByUserId: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updatedDispute = await this.prisma.disputes.update({
      where: { id: disputeId },
      data: { status: 'UNDER_REVIEW' },
    });

    // 🟡 MEDIUM PRIORITY - Gap #11 Fix: Notify parent that dispute is under admin review
    try {
      await this.notificationService.notifyUser({
        userId: dispute.bookings.bookedByUserId,
        type: 'DISPUTE_UPDATE',
        title: 'النزاع قيد المراجعة',
        message: `يقوم فريق الإدارة بمراجعة النزاع المتعلق بالحصة ${dispute.bookings.readableId}. سيتم إعلامك بالقرار قريباً.`,
        link: `/parent/bookings/${dispute.bookingId}`,
        dedupeKey: `DISPUTE_UNDER_REVIEW:${disputeId}`,
        metadata: {
          disputeId,
          bookingId: dispute.bookingId,
        },
      });
    } catch (error) {
      // Log error but don't fail the status update
      this.logger.error(
        'Failed to send dispute under review notification:',
        error,
      );
    }

    return updatedDispute;
  }

  // =================== TEACHER APPLICATION MANAGEMENT ===================

  /**
   * Get all teacher applications with optional status filter
   */
  async getTeacherApplications(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.applicationStatus = status;
    }

    return this.prisma.teacher_profiles.findMany({
      where,
      include: {
        users: {
          select: { id: true, email: true, phoneNumber: true, createdAt: true },
        },
        documents: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Get a single teacher application with full details
   */
  async getTeacherApplication(profileId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: profileId },
      include: {
        users: {
          select: { id: true, email: true, phoneNumber: true, createdAt: true },
        },
        documents: true,
        teacher_subjects: { include: { subjects: true, curricula: true } },
        teacher_qualifications: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Teacher application not found');
    }

    return profile;
  }

  /**
   * Valid state transitions for application status
   */
  private validateTransition(
    currentStatus: string,
    newStatus: string,
  ): boolean {
    const transitions: Record<string, string[]> = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: [
        'APPROVED',
        'REJECTED',
        'CHANGES_REQUESTED',
        'INTERVIEW_REQUIRED',
      ],
      CHANGES_REQUESTED: ['SUBMITTED'],
      INTERVIEW_REQUIRED: ['INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED'],
      INTERVIEW_SCHEDULED: ['APPROVED', 'REJECTED'],
      APPROVED: [],
      REJECTED: [],
    };
    return transitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Approve a teacher application
   */
  async approveApplication(adminUserId: string, profileId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: profileId },
      include: { users: true },
    });

    if (!profile) throw new NotFoundException('Application not found');

    const allowedStatuses = [
      'SUBMITTED',
      'INTERVIEW_REQUIRED',
      'INTERVIEW_SCHEDULED',
    ];
    if (!allowedStatuses.includes(profile.applicationStatus)) {
      throw new BadRequestException(
        `لا يمكن قبول الطلب من الحالة الحالية: ${profile.applicationStatus}`,
      );
    }

    const result = await this.prisma.$transaction([
      this.prisma.teacher_profiles.update({
        where: { id: profileId },
        data: {
          applicationStatus: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          rejectionReason: null,
        },
      }),
      // Also update legacy isVerified flag for backward compatibility
      this.prisma.users.update({
        where: { id: profile.userId },
        data: { isVerified: true },
      }),
    ]);

    // 🔴 HIGH PRIORITY - Gap #5 Fix: Notify teacher of approval
    await this.notificationService.notifyUser({
      userId: profile.userId,
      type: 'ACCOUNT_UPDATE',
      title: 'مبروك! تم قبول طلبك',
      message:
        'تم قبول طلب الانضمام كمعلم في منصة سدرة. يمكنك الآن البدء في إضافة أوقات توفرك والمواد التي تدرسها.',
      link: '/teacher/availability',
      dedupeKey: `APPLICATION_APPROVED:${profileId}`,
      metadata: {
        profileId: profile.id,
        nextSteps: [
          'إضافة أوقات التوفر',
          'إضافة المواد الدراسية',
          'إكمال الملف الشخصي',
        ],
      },
    });

    return result;
  }

  /**
   * Reject a teacher application
   */
  async rejectApplication(
    adminUserId: string,
    profileId: string,
    reason: string,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('يجب تقديم سبب الرفض');
    }

    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: profileId },
    });

    if (!profile) throw new NotFoundException('Application not found');

    const allowedStatuses = [
      'SUBMITTED',
      'INTERVIEW_REQUIRED',
      'INTERVIEW_SCHEDULED',
    ];
    if (!allowedStatuses.includes(profile.applicationStatus)) {
      throw new BadRequestException(
        `لا يمكن رفض الطلب من الحالة الحالية: ${profile.applicationStatus}`,
      );
    }

    const result = await this.prisma.teacher_profiles.update({
      where: { id: profileId },
      data: {
        applicationStatus: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        rejectionReason: reason,
        rejectedAt: new Date(),
      },
    });

    // 🔴 HIGH PRIORITY - Gap #5 Fix: Notify teacher of rejection
    await this.notificationService.notifyUser({
      userId: profile.userId,
      type: 'ACCOUNT_UPDATE',
      title: 'تحديث بخصوص طلبك',
      message: `نأسف، لم نتمكن من قبول طلب الانضمام كمعلم في الوقت الحالي. السبب: ${reason}`,
      link: '/teacher/onboarding',
      dedupeKey: `APPLICATION_REJECTED:${profileId}`,
      metadata: {
        profileId: profile.id,
        reason: reason,
        canReapply: true,
      },
    });

    return result;
  }

  /**
   * Request changes from teacher
   */
  async requestChanges(adminUserId: string, profileId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('يجب تحديد التغييرات المطلوبة');
    }

    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: profileId },
    });

    if (!profile) throw new NotFoundException('Application not found');

    if (profile.applicationStatus !== 'SUBMITTED') {
      throw new BadRequestException('يمكن طلب التغييرات فقط للطلبات المقدمة');
    }

    const result = await this.prisma.teacher_profiles.update({
      where: { id: profileId },
      data: {
        applicationStatus: 'CHANGES_REQUESTED',
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        changeRequestReason: reason,
      },
    });

    // 🔴 HIGH PRIORITY - Gap #5 Fix: Notify teacher of requested changes
    await this.notificationService.notifyUser({
      userId: profile.userId,
      type: 'ACCOUNT_UPDATE',
      title: 'يرجى تحديث طلبك',
      message: `يرجى إجراء التعديلات التالية على طلب الانضمام: ${reason}`,
      link: '/teacher/onboarding',
      dedupeKey: `APPLICATION_CHANGES_REQUESTED:${profileId}`,
      metadata: {
        profileId: profile.id,
        changesRequested: reason,
      },
    });

    return result;
  }

  /**
   * Admin updates a teacher's profile directly
   * Used to help non-tech-savvy teachers with profile modifications
   * Only allowed fields are editable (not pricing or verified documents)
   */
  async updateTeacherProfile(
    adminUserId: string,
    profileId: string,
    dto: {
      displayName?: string;
      fullName?: string;
      bio?: string;
      introVideoUrl?: string;
      whatsappNumber?: string;
      city?: string;
      country?: string;
    },
  ) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: profileId },
      include: { users: { select: { id: true, email: true } } },
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    // Build update data with only provided fields
    const updateData: Record<string, string | null> = {};
    const changedFields: string[] = [];

    if (
      dto.displayName !== undefined &&
      dto.displayName !== profile.displayName
    ) {
      updateData.displayName = dto.displayName;
      changedFields.push('displayName');
    }
    if (dto.fullName !== undefined && dto.fullName !== profile.fullName) {
      updateData.fullName = dto.fullName;
      changedFields.push('fullName');
    }
    if (dto.bio !== undefined && dto.bio !== profile.bio) {
      updateData.bio = dto.bio;
      changedFields.push('bio');
    }
    if (
      dto.introVideoUrl !== undefined &&
      dto.introVideoUrl !== profile.introVideoUrl
    ) {
      updateData.introVideoUrl = dto.introVideoUrl;
      changedFields.push('introVideoUrl');
    }
    if (
      dto.whatsappNumber !== undefined &&
      dto.whatsappNumber !== profile.whatsappNumber
    ) {
      updateData.whatsappNumber = dto.whatsappNumber;
      changedFields.push('whatsappNumber');
    }
    if (dto.city !== undefined && dto.city !== profile.city) {
      updateData.city = dto.city;
      changedFields.push('city');
    }
    if (dto.country !== undefined && dto.country !== profile.country) {
      updateData.country = dto.country;
      changedFields.push('country');
    }

    // No changes detected
    if (Object.keys(updateData).length === 0) {
      return { profile, changesApplied: false, changedFields: [] };
    }

    // Apply updates in transaction with audit log
    const result = await this.prisma.$transaction(async (tx) => {
      // Update profile
      const updatedProfile = await tx.teacher_profiles.update({
        where: { id: profileId },
        data: updateData,
        include: {
          users: { select: { id: true, email: true, phoneNumber: true } },
        },
      });

      // Create audit log entry
      await tx.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: 'SETTINGS_UPDATE',
          actorId: adminUserId,
          targetId: profile.userId,
          payload: {
            type: 'ADMIN_PROFILE_EDIT',
            teacherProfileId: profileId,
            changedFields,
            changes: updateData,
          },
        },
      });

      return updatedProfile;
    });

    // Notify teacher of changes
    if (changedFields.length > 0) {
      const fieldLabels: Record<string, string> = {
        displayName: 'الاسم المعروض',
        fullName: 'الاسم الكامل',
        bio: 'النبذة التعريفية',
        introVideoUrl: 'رابط الفيديو التعريفي',
        whatsappNumber: 'رقم واتساب',
        city: 'المدينة',
        country: 'الدولة',
      };

      const changedFieldsArabic = changedFields
        .map((f) => fieldLabels[f] || f)
        .join('، ');

      await this.notificationService.notifyUser({
        userId: profile.userId,
        type: 'ACCOUNT_UPDATE',
        title: 'تم تحديث ملفك الشخصي',
        message: `تم تحديث الحقول التالية بواسطة فريق الدعم: ${changedFieldsArabic}`,
        link: '/teacher/profile',
        dedupeKey: `ADMIN_PROFILE_EDIT:${profileId}:${Date.now()}`,
      });
    }

    return {
      profile: result,
      changesApplied: true,
      changedFields,
    };
  }

  /**
   * Propose interview time slots to teacher (NEW WORKFLOW)
   * Admin proposes multiple time slots, teacher selects one
   */
  async proposeInterviewSlots(
    adminUserId: string,
    profileId: string,
    timeSlots: { dateTime: string; meetingLink?: string }[],
  ) {
    if (!timeSlots || timeSlots.length < 2) {
      throw new BadRequestException('يجب تقديم خيارين على الأقل للمعلم');
    }

    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: profileId },
      include: { users: true },
    });

    if (!profile) throw new NotFoundException('Application not found');

    // Delete any existing time slots for this teacher
    await this.prisma.interview_time_slots.deleteMany({
      where: { teacherProfileId: profileId },
    });

    // Create new time slots
    const createdSlots = await Promise.all(
      timeSlots.map((slot) =>
        this.prisma.interview_time_slots.create({
          data: {
            id: crypto.randomUUID(),
            teacherProfileId: profileId,
            proposedDateTime: new Date(slot.dateTime),
            meetingLink: slot.meetingLink || null,
          },
        }),
      ),
    );

    // Update application status to INTERVIEW_REQUIRED
    await this.prisma.teacher_profiles.update({
      where: { id: profileId },
      data: {
        applicationStatus: 'INTERVIEW_REQUIRED',
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
      },
    });

    // 🔴 HIGH PRIORITY - Gap #5 Fix: Notify teacher of interview slots
    const slotsText = createdSlots
      .map(
        (slot, index) =>
          `${index + 1}. ${new Date(slot.proposedDateTime).toLocaleString(
            'ar-EG',
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            },
          )}`,
      )
      .join('\n');

    await this.notificationService.notifyUser({
      userId: profile.userId,
      type: 'ACCOUNT_UPDATE',
      title: 'مقابلة مطلوبة - اختر موعداً',
      message: `يرجى اختيار أحد المواعيد التالية لإجراء المقابلة:\n${slotsText}`,
      link: '/teacher/onboarding',
      dedupeKey: `INTERVIEW_SLOTS_PROPOSED:${profileId}`,
      metadata: {
        profileId: profile.id,
        timeSlots: createdSlots.map((s) => s.proposedDateTime),
      },
    });

    return {
      message: 'تم إرسال خيارات المقابلة للمعلم',
      timeSlots: createdSlots,
    };
  }

  /**
   * Get interview time slots for a teacher application
   */
  async getInterviewTimeSlots(profileId: string) {
    return this.prisma.interview_time_slots.findMany({
      where: { teacherProfileId: profileId },
      orderBy: { proposedDateTime: 'asc' },
    });
  }

  // =================== PASSWORD RECOVERY (ADMIN-ASSISTED) ===================

  /**
   * Admin-assisted password recovery
   * PHONE-FIRST: Works without email, no SMS sent
   * Admin sets temporary password, user must change on next login
   */
  async resetUserPassword(
    adminUserId: string,
    userId: string,
    temporaryPassword?: string,
    forceChange: boolean = true,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phoneNumber: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate temporary password if not provided
    const tempPass = temporaryPassword || this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPass, 10);

    // Update user password and set requirePasswordChange flag
    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        requirePasswordChange: forceChange,
      },
      select: { id: true, email: true, phoneNumber: true },
    });

    // Log audit trail
    await this.prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: 'SETTINGS_UPDATE', // Using SETTINGS_UPDATE for password reset action
        actorId: adminUserId,
        targetId: userId,
      },
    });

    return {
      success: true,
      temporaryPassword: tempPass,
      message: `Password reset successful. ${forceChange ? 'User will be required to change password on next login.' : ''}`,
      users: updatedUser,
    };
  }

  // --- Phase 3: Teacher Payouts ---
  async processWithdrawal(
    transactionId: string,
    dto: ProcessTransactionDto & { proofDocumentId?: string },
  ) {
    // Fetch transaction with wallet context
    const transaction = await this.prisma.transactions.findUnique({
      where: { id: transactionId },
      include: { wallets: true },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.type !== 'WITHDRAWAL')
      throw new BadRequestException('Only withdrawals can be processed here');

    const { status: newStatus, adminNote, proofDocumentId } = dto;
    const currentStatus = transaction.status;

    // Strict State Machine & Validation
    // Cast to any to avoid build/cache mismatch with @sidra/shared enums
    const STATUS = TransactionStatus as any;

    if (newStatus === STATUS.PAID) {
      // Can transition from PENDING (Fast Track) or APPROVED (Settlement)
      if (![STATUS.PENDING, STATUS.APPROVED].includes(currentStatus as any)) {
        throw new BadRequestException(
          `Cannot mark as PAID from status ${currentStatus}`,
        );
      }
      if (!proofDocumentId)
        throw new BadRequestException(
          'Proof document is mandatory for payment',
        );
    } else if (newStatus === STATUS.APPROVED) {
      // Can only transition from PENDING
      if (currentStatus !== STATUS.PENDING) {
        throw new BadRequestException(
          `Cannot APPROVE from status ${currentStatus}`,
        );
      }
    } else if (newStatus === STATUS.REJECTED) {
      // Can transition from PENDING or APPROVED
      if (![STATUS.PENDING, STATUS.APPROVED].includes(currentStatus as any)) {
        throw new BadRequestException(
          `Cannot REJECT from status ${currentStatus}`,
        );
      }
      if (!adminNote)
        throw new BadRequestException(
          'Rejection reason (adminNote) is mandatory',
        );
    } else {
      throw new BadRequestException('Invalid status transition');
    }

    // Execute Atomic Ledger & State Update
    return this.prisma.$transaction(async (tx) => {
      let updatedTx;

      if (newStatus === STATUS.PAID) {
        // LEDGER: Burn Pending Balance (Reduce Liability)
        // Conditional Update: Verify pendingBalance >= amount
        const walletUpdate = await tx.wallets.updateMany({
          where: {
            id: transaction.walletId,
            pendingBalance: { gte: transaction.amount },
          },
          data: {
            pendingBalance: { decrement: transaction.amount },
          },
        });

        if (walletUpdate.count === 0) {
          throw new Error(
            'Ledger integrity error: Insufficient pending balance for payout',
          );
        }

        updatedTx = await tx.transactions.update({
          where: { id: transactionId },
          data: {
            status: STATUS.PAID,
            adminNote,
            proofDocumentId,
            paidAt: new Date(),
          } as any, // Cast for schema fields
        });

        // P1-1: Create ledger transaction for withdrawal completion
        await tx.transactions.create({
          data: {
            walletId: transaction.walletId,
            amount: transaction.amount,
            type: 'WITHDRAWAL_COMPLETED',
            status: 'APPROVED',
            adminNote: `Withdrawal ${transactionId} paid out - proof: ${proofDocumentId}`,
          } as any,
        });

        // Notify NotificationService (Teacher)
        // this.notificationService.notifyUser(..) // TODO: Add template
      } else if (newStatus === STATUS.REJECTED) {
        // LEDGER: Refund (Pending -> Balance)
        const walletUpdate = await tx.wallets.updateMany({
          where: {
            id: transaction.walletId,
            pendingBalance: { gte: transaction.amount },
          },
          data: {
            pendingBalance: { decrement: transaction.amount },
            balance: { increment: transaction.amount },
          },
        });

        if (walletUpdate.count === 0) {
          throw new Error(
            'Ledger integrity error: Insufficient pending balance for refund',
          );
        }

        updatedTx = await tx.transactions.update({
          where: { id: transactionId },
          data: {
            status: STATUS.REJECTED,
            adminNote,
          },
        });

        // P1-1: Create ledger transaction for withdrawal refund
        await tx.transactions.create({
          data: {
            walletId: transaction.walletId,
            amount: transaction.amount,
            type: 'WITHDRAWAL_REFUNDED',
            status: 'APPROVED',
            adminNote: `Withdrawal ${transactionId} rejected and refunded - reason: ${adminNote || 'N/A'}`,
          } as any,
        });

        // 🔴 HIGH PRIORITY - Gap #10 Fix: Notify teacher of withdrawal rejection
        await this.notificationService.notifyUser({
          userId: transaction.wallets.userId,
          title: 'تم رفض طلب السحب',
          message: `تم رفض طلب سحب مبلغ ${transaction.amount} SDG وإرجاع المبلغ إلى رصيدك. السبب: ${adminNote || 'لم يتم تحديد السبب'}`,
          type: 'PAYMENT_RELEASED',
          link: '/teacher/wallet',
          dedupeKey: `WITHDRAWAL_REJECTED:${transactionId}`,
          metadata: {
            transactionId,
            amount: transaction.amount,
            reason: adminNote,
          },
        });
      } else if (newStatus === STATUS.APPROVED) {
        // LEDGER: No Change (Funds stay locked)
        updatedTx = await tx.transactions.update({
          where: { id: transactionId },
          data: {
            status: STATUS.APPROVED,
            adminNote,
          },
        });
      }

      return updatedTx;
    });
  }

  /**
   * Generate a cryptographically secure random temporary password
   * P1-7 FIX: Uses crypto.randomBytes instead of Math.random for security
   */
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      // Use random byte to select from charset
      const randomIndex = randomBytes[i] % charset.length;
      password += charset.charAt(randomIndex);
    }

    return password;
  }

  // =================== PACKAGE TIER MANAGEMENT ===================

  async getAllPackageTiers() {
    return this.prisma.package_tiers.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createPackageTier(dto: {
    sessionCount: number;
    discountPercent: number;
    recurringRatio: number;
    floatingRatio: number;
    rescheduleLimit: number;
    durationWeeks: number;
    gracePeriodDays: number;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    isFeatured?: boolean;
    badge?: string;
    displayOrder?: number;
  }) {
    return this.prisma.package_tiers.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        sessionCount: dto.sessionCount,
        discountPercent: dto.discountPercent,
        recurringRatio: dto.recurringRatio,
        floatingRatio: dto.floatingRatio,
        rescheduleLimit: dto.rescheduleLimit,
        durationWeeks: dto.durationWeeks,
        gracePeriodDays: dto.gracePeriodDays,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        isFeatured: dto.isFeatured ?? false,
        badge: dto.badge,
        displayOrder: dto.displayOrder ?? 0,
        // isActive: true, // Default is true
      },
    });
  }

  async updatePackageTier(
    id: string,
    dto: {
      sessionCount?: number;
      discountPercent?: number;
      isActive?: boolean;
      displayOrder?: number;
    },
  ) {
    const tier = await this.prisma.package_tiers.findUnique({ where: { id } });
    if (!tier) {
      throw new NotFoundException('Package tier not found');
    }

    return this.prisma.package_tiers.update({
      where: { id },
      data: {
        ...(dto.sessionCount !== undefined && {
          sessionCount: dto.sessionCount,
        }),
        ...(dto.discountPercent !== undefined && {
          discountPercent: dto.discountPercent,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.displayOrder !== undefined && {
          displayOrder: dto.displayOrder,
        }),
      },
    });
  }

  async deletePackageTier(id: string) {
    const tier = await this.prisma.package_tiers.findUnique({ where: { id } });
    if (!tier) {
      throw new NotFoundException('Package tier not found');
    }

    // Soft delete by setting isActive to false instead of hard delete
    return this.prisma.package_tiers.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // =================== USER MANAGEMENT ===================

  async getAllUsers(role?: string, search?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
      ];
    }

    return this.prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        teacher_profiles: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        teacher_profiles: {
          include: {
            teacher_subjects: {
              include: {
                subjects: true,
                curricula: true,
                teacher_subject_grades: {
                  include: {
                    grade_levels: true,
                  },
                },
              },
            },
            teacher_qualifications: true,
            teacher_work_experiences: true,
            teacher_skills: true,
            documents: true,
            bank_info: true,
            teacher_demo_settings: true,
          },
        },
        student_profiles: {
          include: {
            curricula: true,
          },
        },
        parent_profiles: {
          include: {
            children: {
              include: {
                curricula: true,
              },
            },
          },
        },
        wallets: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async hardDeleteUser(adminId: string, userId: string) {
    // Find the user first
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Prevent deleting yourself
    if (userId === adminId) {
      throw new ConflictException('لا يمكنك حذف حسابك الخاص');
    }

    // Prevent deleting other admins
    if (user.role === 'ADMIN') {
      throw new ConflictException('لا يمكن حذف حساب مدير آخر');
    }

    // Check for active bookings
    const activeBookingsCount = await this.prisma.bookings.count({
      where: {
        OR: [{ bookedByUserId: userId }, { studentUserId: userId }],
        status: {
          in: [
            'PENDING_TEACHER_APPROVAL',
            'WAITING_FOR_PAYMENT',
            'SCHEDULED',
            'PAYMENT_REVIEW',
          ],
        },
      },
    });

    if (activeBookingsCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المستخدم لأن لديه ${activeBookingsCount} حجز نشط. قم بإلغاء الحجوزات أولاً.`,
      );
    }

    // Check wallet balance
    if (user.wallets && Number(user.wallets.balance) > 0) {
      throw new ConflictException(
        `لا يمكن حذف المستخدم لأن لديه رصيد في المحفظة (${user.wallets.balance} SDG). قم بتصفير الرصيد أولاً.`,
      );
    }

    // Check for pending disputes
    const pendingDisputesCount = await this.prisma.disputes.count({
      where: {
        raisedByUserId: userId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });

    if (pendingDisputesCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المستخدم لأن لديه ${pendingDisputesCount} نزاع معلق.`,
      );
    }

    // Delete in order (respecting foreign key constraints)
    await this.prisma.$transaction(async (tx) => {
      // Delete notifications
      await tx.notifications.deleteMany({ where: { userId } });

      // Delete saved teachers
      await tx.saved_teachers.deleteMany({
        where: { OR: [{ userId }, { teacherId: userId }] },
      });

      // Delete ratings given
      await tx.ratings.deleteMany({ where: { ratedByUserId: userId } });

      // Delete reschedule requests
      await tx.reschedule_requests.deleteMany({
        where: { OR: [{ requestedById: userId }, { respondedById: userId }] },
      });

      // Delete ticket messages first, then tickets
      await tx.ticket_messages.deleteMany({
        where: { support_tickets: { createdByUserId: userId } },
      });
      await tx.support_tickets.deleteMany({ where: { createdByUserId: userId } });

      // Update tickets where user was assignee (set to null)
      await tx.support_tickets.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });

      // Delete demo sessions
      await tx.demo_sessions.deleteMany({ where: { demoOwnerId: userId } });

      // Delete audit logs
      await tx.audit_logs.deleteMany({ where: { actorId: userId } });

      // Delete completed/cancelled bookings
      await tx.bookings.deleteMany({
        where: {
          OR: [{ bookedByUserId: userId }, { studentUserId: userId }],
          status: {
            in: [
              'COMPLETED',
              'CANCELLED_BY_PARENT',
              'CANCELLED_BY_TEACHER',
              'CANCELLED_BY_ADMIN',
              'REFUNDED',
              'EXPIRED',
            ],
          },
        },
      });

      // Delete wallet transactions
      if (user.wallets) {
        await tx.transactions.deleteMany({
          where: { walletId: user.wallets.id },
        });
        await tx.wallets.delete({ where: { id: user.wallets.id } });
      }

      // Handle profile-specific deletions based on role
      if (user.role === 'TEACHER') {
        // Delete teacher-specific data
        const teacher_profiles = await tx.teacher_profiles.findUnique({
          where: { userId },
        });
        if (teacher_profiles) {
          // Delete teacher subject grades
          await tx.teacher_subject_grades.deleteMany({
            where: { teacher_subjects: { teacherId: teacher_profiles.id } },
          });
          // Delete teacher subjects
          await tx.teacher_subjects.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete teacher teaching approach tags
          await tx.teacher_teaching_approach_tags.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete teacher qualifications
          await tx.teacher_qualifications.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete availability
          await tx.availability.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete availability exceptions
          await tx.availability_exceptions.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete teacher skills
          await tx.teacher_skills.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete work experience
          await tx.teacher_work_experiences.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete interview time slots
          await tx.interview_time_slots.deleteMany({
            where: { teacherProfileId: teacher_profiles.id },
          });
          // Delete ratings for this teacher
          await tx.ratings.deleteMany({
            where: { teacherId: teacher_profiles.id },
          });
          // Delete teacher profile
          await tx.teacher_profiles.delete({ where: { userId } });
        }
      } else if (user.role === 'STUDENT') {
        // Delete student packages
        await tx.student_packages.deleteMany({
          where: { OR: [{ payerId: userId }, { studentId: userId }] },
        });
        // Delete student profile
        await tx.student_profiles.deleteMany({ where: { userId } });
      } else if (user.role === 'PARENT') {
        // Delete children first
        const parentProfile = await tx.parent_profiles.findUnique({
          where: { userId },
        });
        if (parentProfile) {
          await tx.children.deleteMany({ where: { parentId: parentProfile.id } });
        }
        // Delete parent profile
        await tx.parent_profiles.deleteMany({ where: { userId } });
      }

      // Finally delete the user
      await tx.users.delete({ where: { id: userId } });
    });

    return { deleted: true, message: 'تم حذف المستخدم نهائياً' };
  }
}
