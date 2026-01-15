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
import { TeacherProfileMapper } from '../teacher/teacher-profile.mapper';
import { Prisma } from '@prisma/client';

// =================== ANALYTICS FILTER INTERFACES ===================

interface StudentAnalyticsFilters {
  curriculumId?: string;
  gradeLevel?: string;
  schoolName?: string;
  city?: string;
  country?: string;
  hasBookings?: boolean;
  hasPackages?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

interface TeacherAnalyticsFilters {
  subjectId?: string;
  curriculumId?: string;
  gradeLevelId?: string;
  applicationStatus?: string;
  city?: string;
  country?: string;
  minRating?: number;
  minExperience?: number;
  hasBookings?: boolean;
  isOnVacation?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

interface BookingAnalyticsFilters {
  subjectId?: string;
  curriculumId?: string;
  teacherId?: string;
  status?: string;
  beneficiaryType?: string;
  minPrice?: number;
  maxPrice?: number;
  hasRating?: boolean;
  hasHomework?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  groupBy?:
    | 'subject'
    | 'curriculum'
    | 'teacher'
    | 'status'
    | 'day'
    | 'week'
    | 'month';
}

interface ParentAnalyticsFilters {
  city?: string;
  country?: string;
  minChildren?: number;
  hasBookings?: boolean;
  hasPackages?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => BookingService))
    private bookingService: BookingService,
  ) {}

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

    const bookings = await this.prisma.bookings.findMany({
      where,
      include: {
        teacher_profiles: {
          include: { users: { select: { email: true } } },
        },
        users_bookings_bookedByUserIdTousers: {
          select: { id: true, email: true },
        },
        users_bookings_studentUserIdTousers: {
          select: { id: true, email: true },
        },
        children: true,
        subjects: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return bookings.map((b) => this.transformBooking(b));
  }

  private transformBooking(booking: any) {
    if (!booking) return null;

    // Transform relations to match frontend expected structure (camelCase)
    // Coincides with BookingService.transformBooking logic
    return {
      ...booking,
      teacherProfile: booking.teacher_profiles
        ? {
            ...booking.teacher_profiles,
            user: booking.teacher_profiles.users,
          }
        : undefined,
      bookedByUser: booking.users_bookings_bookedByUserIdTousers,
      studentUser: booking.users_bookings_studentUserIdTousers,
      child: booking.children,
      subject: booking.subjects,
    };
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

    const transformed = this.transformBooking(booking);

    // Map package if exists (keep this custom logic on top of transformed object)
    if (booking.package_redemptions?.student_packages) {
      // @ts-ignore
      transformed.student_packages =
        booking.package_redemptions.student_packages;
    }

    return transformed;
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
    const where: Prisma.disputesWhereInput = {};
    if (status && status !== 'ALL') {
      where.status = status as any;
    }

    return this.prisma.disputes.findMany({
      where,
      include: {
        bookings: {
          include: {
            teacher_profiles: {
              include: { users: { select: { id: true, email: true } } },
            },
            users_bookings_bookedByUserIdTousers: {
              select: { id: true, email: true },
            },
            subjects: true,
          },
        },
        users_disputes_raisedByUserIdTousers: {
          select: { id: true, email: true },
        },
        users_disputes_resolvedByAdminIdTousers: {
          select: { id: true, email: true },
        },
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
            users_bookings_bookedByUserIdTousers: {
              select: { id: true, email: true },
            },
            users_bookings_studentUserIdTousers: {
              select: { id: true, email: true },
            },
            children: true,
            subjects: true,
          },
        },
        users_disputes_raisedByUserIdTousers: {
          select: { id: true, email: true },
        },
        users_disputes_resolvedByAdminIdTousers: {
          select: { id: true, email: true },
        },
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

    const applications = await this.prisma.teacher_profiles.findMany({
      where,
      include: {
        users: {
          select: { id: true, email: true, phoneNumber: true, createdAt: true },
        },
        documents: true,
        // Also include subjects for the list view if needed (optional but good for preview)
        teacher_subjects: { include: { subjects: true, curricula: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return applications.map((app) => {
      const mapped = TeacherProfileMapper.mapProfile(app);
      return {
        ...mapped,
        user: app.users,
      };
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

    const mappedProfile = TeacherProfileMapper.mapProfile(profile);

    return {
      ...mappedProfile,
      user: profile.users,
    };
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

  /**
   * Admin wallet balance adjustment
   * Used for error correction, refunds, or manual credits
   * Creates audit trail and transaction record
   */
  async adjustWalletBalance(
    adminUserId: string,
    userId: string,
    amount: number,
    reason: string,
    type: 'CREDIT' | 'DEBIT',
  ) {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException(
        'Reason must be at least 10 characters for audit trail',
      );
    }

    // Get or create wallet
    let wallet = await this.prisma.wallets.findFirst({
      where: { userId },
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await this.prisma.wallets.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          balance: 0,
          pendingBalance: 0,
          currency: 'SDG',
          updatedAt: new Date(),
        },
      });
    }

    const normalizedAmount = normalizeMoney(amount);
    const balanceChange =
      type === 'CREDIT' ? normalizedAmount : -normalizedAmount;

    // Check for negative balance on debit
    if (type === 'DEBIT' && wallet.balance.toNumber() < normalizedAmount) {
      throw new BadRequestException(
        `Insufficient balance. Current: ${wallet.balance}, Requested debit: ${normalizedAmount}`,
      );
    }

    // Perform adjustment in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallets.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: balanceChange },
        },
      });

      // Create transaction record
      const transaction = await tx.transactions.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          amount: normalizedAmount,
          type: type === 'CREDIT' ? 'DEPOSIT' : 'WITHDRAWAL', // Mapping to closest valid enum types
          status: 'APPROVED',
          adminNote: `[Admin Adjustment] ${reason}`,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: 'SETTINGS_UPDATE', // Using SETTINGS_UPDATE as generic admin action until schema update
          actorId: adminUserId,
          targetId: userId,
          payload: {
            type,
            amount: normalizedAmount,
            reason,
            previousBalance: wallet.balance,
            newBalance: updatedWallet.balance,
            transactionId: transaction.id,
          },
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    this.logger.log(
      `💰 ADMIN_ADJUSTMENT | adminId=${adminUserId} | userId=${userId} | type=${type} | amount=${normalizedAmount} | reason=${reason}`,
    );

    return {
      success: true,
      wallet: {
        id: result.wallet.id,
        balance: result.wallet.balance,
        pendingBalance: result.wallet.pendingBalance,
      },
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        type: result.transaction.type,
      },
      message: `Successfully ${type === 'CREDIT' ? 'credited' : 'debited'} ${normalizedAmount} SDG`,
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

  // =================== ADVANCED ANALYTICS ===================

  /**
   * Get comprehensive student analytics with advanced filtering
   */
  async getStudentAnalytics(filters: StudentAnalyticsFilters) {
    const where: Prisma.student_profilesWhereInput = {};

    // Apply curriculum filter
    if (filters.curriculumId) {
      where.curriculumId = filters.curriculumId;
    }

    // Apply grade level filter
    if (filters.gradeLevel) {
      where.gradeLevel = { contains: filters.gradeLevel, mode: 'insensitive' };
    }

    // Apply school name filter
    if (filters.schoolName) {
      where.schoolName = { contains: filters.schoolName, mode: 'insensitive' };
    }

    // Apply city filter
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    // Apply country filter
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.users = {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      };
    }

    // Get all student profiles with counts
    const students = await this.prisma.student_profiles.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isActive: true,
            createdAt: true,
          },
        },
        curricula: {
          select: { id: true, nameAr: true, nameEn: true },
        },
      },
    });

    // Get booking and package counts for each student
    const studentIds = students.map((s) => s.userId);

    const [bookingCounts, packageCounts] = await Promise.all([
      this.prisma.bookings.groupBy({
        by: ['studentUserId'],
        where: { studentUserId: { in: studentIds } },
        _count: { id: true },
      }),
      this.prisma.student_packages.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds } },
        _count: { id: true },
      }),
    ]);

    // Create maps for quick lookup
    const bookingMap = new Map(
      bookingCounts.map((b) => [b.studentUserId, b._count.id]),
    );
    const packageMap = new Map(
      packageCounts.map((p) => [p.studentId, p._count.id]),
    );

    // Filter by hasBookings/hasPackages if needed
    let filteredStudents = students.map((s) => ({
      ...s,
      bookingsCount: bookingMap.get(s.userId) || 0,
      packagesCount: packageMap.get(s.userId) || 0,
    }));

    if (filters.hasBookings === true) {
      filteredStudents = filteredStudents.filter((s) => s.bookingsCount > 0);
    } else if (filters.hasBookings === false) {
      filteredStudents = filteredStudents.filter((s) => s.bookingsCount === 0);
    }

    if (filters.hasPackages === true) {
      filteredStudents = filteredStudents.filter((s) => s.packagesCount > 0);
    } else if (filters.hasPackages === false) {
      filteredStudents = filteredStudents.filter((s) => s.packagesCount === 0);
    }

    // Calculate aggregations
    const curriculumBreakdown = this.groupBy(
      filteredStudents,
      (s) => s.curricula?.nameAr || 'غير محدد',
    );
    const gradeLevelBreakdown = this.groupBy(
      filteredStudents,
      (s) => s.gradeLevel || 'غير محدد',
    );
    const cityBreakdown = this.groupBy(
      filteredStudents,
      (s) => s.city || 'غير محدد',
    );
    const countryBreakdown = this.groupBy(
      filteredStudents,
      (s) => s.country || 'غير محدد',
    );

    return {
      summary: {
        totalStudents: filteredStudents.length,
        activeStudents: filteredStudents.filter((s) => s.users.isActive).length,
        withBookings: filteredStudents.filter((s) => s.bookingsCount > 0)
          .length,
        withPackages: filteredStudents.filter((s) => s.packagesCount > 0)
          .length,
        totalBookings: filteredStudents.reduce(
          (sum, s) => sum + s.bookingsCount,
          0,
        ),
        totalPackages: filteredStudents.reduce(
          (sum, s) => sum + s.packagesCount,
          0,
        ),
      },
      breakdown: {
        byCurriculum: Object.entries(curriculumBreakdown).map(
          ([name, items]) => ({
            name,
            count: items.length,
            percentage: (
              (items.length / filteredStudents.length) *
              100
            ).toFixed(1),
          }),
        ),
        byGradeLevel: Object.entries(gradeLevelBreakdown).map(
          ([name, items]) => ({
            name,
            count: items.length,
            percentage: (
              (items.length / filteredStudents.length) *
              100
            ).toFixed(1),
          }),
        ),
        byCity: Object.entries(cityBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / filteredStudents.length) * 100).toFixed(
            1,
          ),
        })),
        byCountry: Object.entries(countryBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / filteredStudents.length) * 100).toFixed(
            1,
          ),
        })),
      },
      students: filteredStudents.slice(0, 100), // Return first 100 for the list
    };
  }

  /**
   * Get comprehensive teacher analytics with advanced filtering
   */
  async getTeacherAnalytics(filters: TeacherAnalyticsFilters) {
    const where: Prisma.teacher_profilesWhereInput = {};

    // Apply application status filter
    if (filters.applicationStatus) {
      where.applicationStatus = filters.applicationStatus as any;
    }

    // Apply city filter
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    // Apply country filter
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    // Apply rating filter
    if (filters.minRating !== undefined) {
      where.averageRating = { gte: filters.minRating };
    }

    // Apply experience filter
    if (filters.minExperience !== undefined) {
      where.yearsOfExperience = { gte: filters.minExperience };
    }

    // Apply vacation filter
    if (filters.isOnVacation !== undefined) {
      where.isOnVacation = filters.isOnVacation;
    }

    // Apply subject/curriculum/grade filters through teacher_subjects
    if (filters.subjectId || filters.curriculumId || filters.gradeLevelId) {
      where.teacher_subjects = {
        some: {
          ...(filters.subjectId && { subjectId: filters.subjectId }),
          ...(filters.curriculumId && { curriculumId: filters.curriculumId }),
          ...(filters.gradeLevelId && {
            teacher_subject_grades: {
              some: { gradeLevelId: filters.gradeLevelId },
            },
          }),
        },
      };
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.users = {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      };
    }

    // Get all teacher profiles with related data
    const teachers = await this.prisma.teacher_profiles.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isActive: true,
            createdAt: true,
          },
        },
        teacher_subjects: {
          include: {
            subjects: { select: { id: true, nameAr: true, nameEn: true } },
            curricula: { select: { id: true, nameAr: true, nameEn: true } },
            teacher_subject_grades: {
              include: {
                grade_levels: {
                  select: { id: true, nameAr: true, nameEn: true },
                },
              },
            },
          },
        },
      },
    });

    // Get booking counts for each teacher
    const teacherIds = teachers.map((t) => t.id);
    const bookingCounts = await this.prisma.bookings.groupBy({
      by: ['teacherId'],
      where: { teacherId: { in: teacherIds } },
      _count: { id: true },
    });

    const bookingMap = new Map(
      bookingCounts.map((b) => [b.teacherId, b._count.id]),
    );

    // Enhance teacher data with booking counts
    let enrichedTeachers = teachers.map((t) => ({
      ...t,
      bookingsCount: bookingMap.get(t.id) || 0,
    }));

    // Filter by hasBookings if needed
    if (filters.hasBookings === true) {
      enrichedTeachers = enrichedTeachers.filter((t) => t.bookingsCount > 0);
    } else if (filters.hasBookings === false) {
      enrichedTeachers = enrichedTeachers.filter((t) => t.bookingsCount === 0);
    }

    // Calculate aggregations
    const statusBreakdown = this.groupBy(
      enrichedTeachers,
      (t) => t.applicationStatus,
    );
    const cityBreakdown = this.groupBy(
      enrichedTeachers,
      (t) => t.city || 'غير محدد',
    );
    const countryBreakdown = this.groupBy(
      enrichedTeachers,
      (t) => t.country || 'غير محدد',
    );

    // Subject breakdown
    const subjectCounts: Record<string, number> = {};
    const curriculumCounts: Record<string, number> = {};

    enrichedTeachers.forEach((t) => {
      t.teacher_subjects.forEach((ts) => {
        const subjectName = ts.subjects.nameAr;
        const curriculumName = ts.curricula.nameAr;
        subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
        curriculumCounts[curriculumName] =
          (curriculumCounts[curriculumName] || 0) + 1;
      });
    });

    return {
      summary: {
        totalTeachers: enrichedTeachers.length,
        approvedTeachers: enrichedTeachers.filter(
          (t) => t.applicationStatus === 'APPROVED',
        ).length,
        pendingTeachers: enrichedTeachers.filter(
          (t) => t.applicationStatus === 'SUBMITTED',
        ).length,
        withBookings: enrichedTeachers.filter((t) => t.bookingsCount > 0)
          .length,
        onVacation: enrichedTeachers.filter((t) => t.isOnVacation).length,
        totalBookings: enrichedTeachers.reduce(
          (sum, t) => sum + t.bookingsCount,
          0,
        ),
        averageRating:
          enrichedTeachers.length > 0
            ? (
                enrichedTeachers.reduce((sum, t) => sum + t.averageRating, 0) /
                enrichedTeachers.length
              ).toFixed(2)
            : '0',
        averageExperience:
          enrichedTeachers.filter((t) => t.yearsOfExperience).length > 0
            ? (
                enrichedTeachers
                  .filter((t) => t.yearsOfExperience)
                  .reduce((sum, t) => sum + (t.yearsOfExperience || 0), 0) /
                enrichedTeachers.filter((t) => t.yearsOfExperience).length
              ).toFixed(1)
            : '0',
      },
      breakdown: {
        byStatus: Object.entries(statusBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / enrichedTeachers.length) * 100).toFixed(
            1,
          ),
        })),
        bySubject: Object.entries(subjectCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({
            name,
            count,
          })),
        byCurriculum: Object.entries(curriculumCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({
            name,
            count,
          })),
        byCity: Object.entries(cityBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / enrichedTeachers.length) * 100).toFixed(
            1,
          ),
        })),
        byCountry: Object.entries(countryBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / enrichedTeachers.length) * 100).toFixed(
            1,
          ),
        })),
      },
      teachers: enrichedTeachers.slice(0, 100), // Return first 100 for the list
    };
  }

  /**
   * Get comprehensive booking analytics with advanced filtering
   */
  async getBookingAnalytics(filters: BookingAnalyticsFilters) {
    const where: Prisma.bookingsWhereInput = {};

    // Apply subject filter
    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    // Apply teacher filter
    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    // Apply status filter
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as any;
    }

    // Apply beneficiary type filter
    if (filters.beneficiaryType) {
      where.beneficiaryType = filters.beneficiaryType as any;
    }

    // Apply price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      };
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.startTime = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    // Apply rating filter
    if (filters.hasRating !== undefined) {
      if (filters.hasRating) {
        where.ratings = { isNot: null };
      } else {
        where.ratings = { is: null };
      }
    }

    // Apply homework filter
    if (filters.hasHomework !== undefined) {
      where.homeworkAssigned = filters.hasHomework;
    }

    // Apply curriculum filter through teacher_subjects
    if (filters.curriculumId) {
      where.teacher_profiles = {
        teacher_subjects: {
          some: { curriculumId: filters.curriculumId },
        },
      };
    }

    // Get bookings with related data
    const bookings = await this.prisma.bookings.findMany({
      where,
      include: {
        subjects: { select: { id: true, nameAr: true, nameEn: true } },
        teacher_profiles: {
          select: {
            id: true,
            displayName: true,
            fullName: true,
            teacher_subjects: {
              include: {
                curricula: { select: { id: true, nameAr: true, nameEn: true } },
              },
            },
          },
        },
        users_bookings_studentUserIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        ratings: { select: { score: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 1000, // Limit for performance
    });

    // Calculate summary statistics
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
    const totalRevenue = completedBookings.reduce(
      (sum, b) => sum + Number(b.price),
      0,
    );
    const averagePrice =
      bookings.length > 0
        ? bookings.reduce((sum, b) => sum + Number(b.price), 0) /
          bookings.length
        : 0;

    // Group by subject
    const subjectBreakdown = this.groupBy(bookings, (b) => b.subjects.nameAr);

    // Group by status
    const statusBreakdown = this.groupBy(bookings, (b) => b.status);

    // Group by teacher
    const teacherBreakdown = this.groupBy(
      bookings,
      (b) =>
        b.teacher_profiles.displayName ||
        b.teacher_profiles.fullName ||
        'غير معروف',
    );

    // Time-based grouping
    let timeSeriesData: { label: string; count: number; revenue: number }[] =
      [];
    if (
      filters.groupBy === 'day' ||
      filters.groupBy === 'week' ||
      filters.groupBy === 'month'
    ) {
      const groupedByTime = this.groupBookingsByTime(bookings, filters.groupBy);
      timeSeriesData = Object.entries(groupedByTime).map(([label, items]) => ({
        label,
        count: items.length,
        revenue: items.reduce((sum, b) => sum + Number(b.price), 0),
      }));
    }

    return {
      summary: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: bookings.filter((b) =>
          b.status.includes('CANCELLED'),
        ).length,
        pendingBookings: bookings.filter(
          (b) =>
            b.status === 'PENDING_TEACHER_APPROVAL' ||
            b.status === 'WAITING_FOR_PAYMENT',
        ).length,
        disputedBookings: bookings.filter((b) => b.status === 'DISPUTED')
          .length,
        totalRevenue: Math.round(totalRevenue),
        averagePrice: Math.round(averagePrice),
        withRating: bookings.filter((b) => b.ratings).length,
        withHomework: bookings.filter((b) => b.homeworkAssigned).length,
        averageRating:
          bookings.filter((b) => b.ratings).length > 0
            ? (
                bookings
                  .filter((b) => b.ratings)
                  .reduce((sum, b) => sum + (b.ratings?.score || 0), 0) /
                bookings.filter((b) => b.ratings).length
              ).toFixed(2)
            : '0',
      },
      breakdown: {
        bySubject: Object.entries(subjectBreakdown)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([name, items]) => ({
            name,
            count: items.length,
            revenue: items.reduce((sum, b) => sum + Number(b.price), 0),
            percentage: ((items.length / bookings.length) * 100).toFixed(1),
          })),
        byStatus: Object.entries(statusBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / bookings.length) * 100).toFixed(1),
        })),
        byTeacher: Object.entries(teacherBreakdown)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 20)
          .map(([name, items]) => ({
            name,
            count: items.length,
            revenue: items.reduce((sum, b) => sum + Number(b.price), 0),
          })),
        timeSeries: timeSeriesData,
      },
      bookings: bookings.slice(0, 100), // Return first 100 for the list
    };
  }

  /**
   * Get comprehensive parent analytics with advanced filtering
   */
  async getParentAnalytics(filters: ParentAnalyticsFilters) {
    const where: Prisma.parent_profilesWhereInput = {};

    // Apply city filter
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    // Apply country filter
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.users = {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      };
    }

    // Get all parent profiles with children
    const parents = await this.prisma.parent_profiles.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isActive: true,
            createdAt: true,
          },
        },
        children: {
          include: {
            curricula: { select: { id: true, nameAr: true, nameEn: true } },
          },
        },
      },
    });

    // Get booking and package counts for each parent
    const parentUserIds = parents.map((p) => p.userId);

    const [bookingCounts, packageCounts] = await Promise.all([
      this.prisma.bookings.groupBy({
        by: ['bookedByUserId'],
        where: { bookedByUserId: { in: parentUserIds } },
        _count: { id: true },
      }),
      this.prisma.student_packages.groupBy({
        by: ['payerId'],
        where: { payerId: { in: parentUserIds } },
        _count: { id: true },
      }),
    ]);

    const bookingMap = new Map(
      bookingCounts.map((b) => [b.bookedByUserId, b._count.id]),
    );
    const packageMap = new Map(
      packageCounts.map((p) => [p.payerId, p._count.id]),
    );

    // Enhance parent data
    let enrichedParents = parents.map((p) => ({
      ...p,
      childrenCount: p.children.length,
      bookingsCount: bookingMap.get(p.userId) || 0,
      packagesCount: packageMap.get(p.userId) || 0,
    }));

    // Apply filters
    if (filters.minChildren !== undefined) {
      enrichedParents = enrichedParents.filter(
        (p) => p.childrenCount >= (filters.minChildren || 0),
      );
    }

    if (filters.hasBookings === true) {
      enrichedParents = enrichedParents.filter((p) => p.bookingsCount > 0);
    } else if (filters.hasBookings === false) {
      enrichedParents = enrichedParents.filter((p) => p.bookingsCount === 0);
    }

    if (filters.hasPackages === true) {
      enrichedParents = enrichedParents.filter((p) => p.packagesCount > 0);
    } else if (filters.hasPackages === false) {
      enrichedParents = enrichedParents.filter((p) => p.packagesCount === 0);
    }

    // Calculate aggregations
    const cityBreakdown = this.groupBy(
      enrichedParents,
      (p) => p.city || 'غير محدد',
    );
    const countryBreakdown = this.groupBy(
      enrichedParents,
      (p) => p.country || 'غير محدد',
    );
    const childrenCountBreakdown = this.groupBy(enrichedParents, (p) =>
      p.childrenCount.toString(),
    );

    // Children curriculum breakdown
    const curriculumCounts: Record<string, number> = {};
    enrichedParents.forEach((p) => {
      p.children.forEach((c) => {
        const curriculumName = c.curricula?.nameAr || 'غير محدد';
        curriculumCounts[curriculumName] =
          (curriculumCounts[curriculumName] || 0) + 1;
      });
    });

    return {
      summary: {
        totalParents: enrichedParents.length,
        activeParents: enrichedParents.filter((p) => p.users.isActive).length,
        withBookings: enrichedParents.filter((p) => p.bookingsCount > 0).length,
        withPackages: enrichedParents.filter((p) => p.packagesCount > 0).length,
        totalChildren: enrichedParents.reduce(
          (sum, p) => sum + p.childrenCount,
          0,
        ),
        totalBookings: enrichedParents.reduce(
          (sum, p) => sum + p.bookingsCount,
          0,
        ),
        totalPackages: enrichedParents.reduce(
          (sum, p) => sum + p.packagesCount,
          0,
        ),
        averageChildrenPerParent:
          enrichedParents.length > 0
            ? (
                enrichedParents.reduce((sum, p) => sum + p.childrenCount, 0) /
                enrichedParents.length
              ).toFixed(2)
            : '0',
      },
      breakdown: {
        byCity: Object.entries(cityBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / enrichedParents.length) * 100).toFixed(
            1,
          ),
        })),
        byCountry: Object.entries(countryBreakdown).map(([name, items]) => ({
          name,
          count: items.length,
          percentage: ((items.length / enrichedParents.length) * 100).toFixed(
            1,
          ),
        })),
        byChildrenCount: Object.entries(childrenCountBreakdown)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([count, items]) => ({
            count: parseInt(count),
            parents: items.length,
          })),
        byChildrenCurriculum: Object.entries(curriculumCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({
            name,
            count,
          })),
      },
      parents: enrichedParents.slice(0, 100), // Return first 100 for the list
    };
  }

  /**
   * Get filter options for analytics UI
   */
  async getAnalyticsFilterOptions() {
    const [curricula, subjects, grades, cities, countries] = await Promise.all([
      this.prisma.curricula.findMany({
        where: { isActive: true },
        select: { id: true, nameAr: true, nameEn: true },
        orderBy: { nameAr: 'asc' },
      }),
      this.prisma.subjects.findMany({
        where: { isActive: true },
        select: { id: true, nameAr: true, nameEn: true },
        orderBy: { nameAr: 'asc' },
      }),
      this.prisma.grade_levels.findMany({
        where: { isActive: true },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          educational_stages: {
            select: {
              nameAr: true,
              curricula: { select: { nameAr: true } },
            },
          },
        },
        orderBy: { sequence: 'asc' },
      }),
      this.prisma.student_profiles.findMany({
        where: { city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      this.prisma.student_profiles.findMany({
        where: { country: { not: null } },
        select: { country: true },
        distinct: ['country'],
      }),
    ]);

    // Get unique teacher cities and countries too
    const [teacherCities, teacherCountries] = await Promise.all([
      this.prisma.teacher_profiles.findMany({
        where: { city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      this.prisma.teacher_profiles.findMany({
        where: { country: { not: null } },
        select: { country: true },
        distinct: ['country'],
      }),
    ]);

    // Merge and dedupe cities and countries
    const allCities = [
      ...new Set([
        ...cities.map((c) => c.city).filter(Boolean),
        ...teacherCities.map((c) => c.city).filter(Boolean),
      ]),
    ].sort();

    const allCountries = [
      ...new Set([
        ...countries.map((c) => c.country).filter(Boolean),
        ...teacherCountries.map((c) => c.country).filter(Boolean),
      ]),
    ].sort();

    return {
      curricula,
      subjects,
      grades: grades.map((g) => ({
        ...g,
        fullName: `${g.educational_stages.curricula.nameAr} - ${g.educational_stages.nameAr} - ${g.nameAr}`,
      })),
      cities: allCities,
      countries: allCountries,
      applicationStatuses: [
        { value: 'DRAFT', label: 'مسودة' },
        { value: 'SUBMITTED', label: 'مقدم' },
        { value: 'CHANGES_REQUESTED', label: 'تحتاج تعديل' },
        { value: 'INTERVIEW_REQUIRED', label: 'تحتاج مقابلة' },
        { value: 'INTERVIEW_SCHEDULED', label: 'مقابلة محددة' },
        { value: 'APPROVED', label: 'معتمد' },
        { value: 'REJECTED', label: 'مرفوض' },
      ],
      bookingStatuses: [
        { value: 'PENDING_TEACHER_APPROVAL', label: 'بانتظار موافقة المعلم' },
        { value: 'WAITING_FOR_PAYMENT', label: 'بانتظار الدفع' },
        { value: 'PAYMENT_REVIEW', label: 'قيد مراجعة الدفع' },
        { value: 'SCHEDULED', label: 'مجدول' },
        { value: 'COMPLETED', label: 'مكتمل' },
        { value: 'CANCELLED_BY_PARENT', label: 'ملغي من ولي الأمر' },
        { value: 'CANCELLED_BY_TEACHER', label: 'ملغي من المعلم' },
        { value: 'CANCELLED_BY_ADMIN', label: 'ملغي من الإدارة' },
        { value: 'DISPUTED', label: 'متنازع عليه' },
        { value: 'REFUNDED', label: 'مسترد' },
      ],
    };
  }

  /**
   * Export analytics data as CSV or JSON
   */
  async exportAnalytics(
    type: 'students' | 'teachers' | 'bookings' | 'parents',
    format: 'csv' | 'json',
    filters: Record<string, string>,
  ) {
    let data: any;

    switch (type) {
      case 'students':
        data = await this.getStudentAnalytics({
          curriculumId: filters.curriculumId,
          gradeLevel: filters.gradeLevel,
          schoolName: filters.schoolName,
          city: filters.city,
          country: filters.country,
          hasBookings:
            filters.hasBookings === 'true'
              ? true
              : filters.hasBookings === 'false'
                ? false
                : undefined,
          hasPackages:
            filters.hasPackages === 'true'
              ? true
              : filters.hasPackages === 'false'
                ? false
                : undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        });
        break;
      case 'teachers':
        data = await this.getTeacherAnalytics({
          subjectId: filters.subjectId,
          curriculumId: filters.curriculumId,
          gradeLevelId: filters.gradeLevelId,
          applicationStatus: filters.applicationStatus,
          city: filters.city,
          country: filters.country,
          minRating: filters.minRating
            ? parseFloat(filters.minRating)
            : undefined,
          minExperience: filters.minExperience
            ? parseInt(filters.minExperience)
            : undefined,
          hasBookings:
            filters.hasBookings === 'true'
              ? true
              : filters.hasBookings === 'false'
                ? false
                : undefined,
          isOnVacation:
            filters.isOnVacation === 'true'
              ? true
              : filters.isOnVacation === 'false'
                ? false
                : undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        });
        break;
      case 'bookings':
        data = await this.getBookingAnalytics({
          subjectId: filters.subjectId,
          curriculumId: filters.curriculumId,
          teacherId: filters.teacherId,
          status: filters.status,
          beneficiaryType: filters.beneficiaryType,
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          hasRating:
            filters.hasRating === 'true'
              ? true
              : filters.hasRating === 'false'
                ? false
                : undefined,
          hasHomework:
            filters.hasHomework === 'true'
              ? true
              : filters.hasHomework === 'false'
                ? false
                : undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        });
        break;
      case 'parents':
        data = await this.getParentAnalytics({
          city: filters.city,
          country: filters.country,
          minChildren: filters.minChildren
            ? parseInt(filters.minChildren)
            : undefined,
          hasBookings:
            filters.hasBookings === 'true'
              ? true
              : filters.hasBookings === 'false'
                ? false
                : undefined,
          hasPackages:
            filters.hasPackages === 'true'
              ? true
              : filters.hasPackages === 'false'
                ? false
                : undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        });
        break;
    }

    if (format === 'json') {
      return data;
    }

    // Convert to CSV
    const items = data[type] || [];
    if (items.length === 0) {
      return { csv: '', filename: `${type}-export.csv` };
    }

    const headers = this.getExportHeaders(type);
    const rows = items.map((item: any) => this.formatExportRow(type, item));

    const csv =
      headers.join(',') +
      '\n' +
      rows.map((r: string[]) => r.join(',')).join('\n');

    return {
      csv,
      filename: `${type}-export-${new Date().toISOString().split('T')[0]}.csv`,
      summary: data.summary,
    };
  }

  /**
   * Helper: Group array by key function
   */
  private groupBy<T>(
    array: T[],
    keyFn: (item: T) => string,
  ): Record<string, T[]> {
    return array.reduce(
      (result, item) => {
        const key = keyFn(item);
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(item);
        return result;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * Helper: Group bookings by time period
   */
  private groupBookingsByTime(
    bookings: any[],
    period: 'day' | 'week' | 'month',
  ): Record<string, any[]> {
    return bookings.reduce(
      (result, booking) => {
        const date = new Date(booking.startTime);
        let key: string;

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(booking);
        return result;
      },
      {} as Record<string, any[]>,
    );
  }

  /**
   * Helper: Get export headers based on type
   */
  private getExportHeaders(type: string): string[] {
    switch (type) {
      case 'students':
        return [
          'الاسم',
          'البريد الإلكتروني',
          'الهاتف',
          'المنهج',
          'الصف',
          'المدرسة',
          'المدينة',
          'الدولة',
          'عدد الحجوزات',
          'عدد الباقات',
          'تاريخ التسجيل',
        ];
      case 'teachers':
        return [
          'الاسم',
          'البريد الإلكتروني',
          'الهاتف',
          'الحالة',
          'المدينة',
          'الدولة',
          'التقييم',
          'سنوات الخبرة',
          'عدد الحجوزات',
          'تاريخ التسجيل',
        ];
      case 'bookings':
        return [
          'رقم الحجز',
          'المعلم',
          'الطالب',
          'المادة',
          'التاريخ',
          'السعر',
          'الحالة',
          'التقييم',
        ];
      case 'parents':
        return [
          'الاسم',
          'البريد الإلكتروني',
          'الهاتف',
          'المدينة',
          'الدولة',
          'عدد الأطفال',
          'عدد الحجوزات',
          'عدد الباقات',
          'تاريخ التسجيل',
        ];
      default:
        return [];
    }
  }

  /**
   * Helper: Format export row based on type
   */
  private formatExportRow(type: string, item: any): string[] {
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '';
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    switch (type) {
      case 'students':
        return [
          escapeCSV(
            `${item.users?.firstName || ''} ${item.users?.lastName || ''}`,
          ),
          escapeCSV(item.users?.email),
          escapeCSV(item.users?.phoneNumber),
          escapeCSV(item.curricula?.nameAr),
          escapeCSV(item.gradeLevel),
          escapeCSV(item.schoolName),
          escapeCSV(item.city),
          escapeCSV(item.country),
          escapeCSV(item.bookingsCount),
          escapeCSV(item.packagesCount),
          escapeCSV(
            new Date(item.users?.createdAt).toLocaleDateString('ar-SA'),
          ),
        ];
      case 'teachers':
        return [
          escapeCSV(item.displayName || item.fullName),
          escapeCSV(item.users?.email),
          escapeCSV(item.whatsappNumber || item.users?.phoneNumber),
          escapeCSV(item.applicationStatus),
          escapeCSV(item.city),
          escapeCSV(item.country),
          escapeCSV(item.averageRating),
          escapeCSV(item.yearsOfExperience),
          escapeCSV(item.bookingsCount),
          escapeCSV(
            new Date(item.users?.createdAt).toLocaleDateString('ar-SA'),
          ),
        ];
      case 'bookings':
        return [
          escapeCSV(item.readableId || item.id.slice(0, 8)),
          escapeCSV(
            item.teacher_profiles?.displayName ||
              item.teacher_profiles?.fullName,
          ),
          escapeCSV(
            `${item.users_bookings_studentUserIdTousers?.firstName || ''} ${item.users_bookings_studentUserIdTousers?.lastName || ''}`,
          ),
          escapeCSV(item.subjects?.nameAr),
          escapeCSV(new Date(item.startTime).toLocaleDateString('ar-SA')),
          escapeCSV(item.price),
          escapeCSV(item.status),
          escapeCSV(item.ratings?.score || '-'),
        ];
      case 'parents':
        return [
          escapeCSV(
            `${item.users?.firstName || ''} ${item.users?.lastName || ''}`,
          ),
          escapeCSV(item.users?.email),
          escapeCSV(item.users?.phoneNumber),
          escapeCSV(item.city),
          escapeCSV(item.country),
          escapeCSV(item.childrenCount),
          escapeCSV(item.bookingsCount),
          escapeCSV(item.packagesCount),
          escapeCSV(
            new Date(item.users?.createdAt).toLocaleDateString('ar-SA'),
          ),
        ];
      default:
        return [];
    }
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
      await tx.support_tickets.deleteMany({
        where: { createdByUserId: userId },
      });

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
          await tx.children.deleteMany({
            where: { parentId: parentProfile.id },
          });
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
