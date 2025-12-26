
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ProcessTransactionDto, TransactionStatus } from '@sidra/shared';


@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private notificationService: NotificationService
    ) { }

    async getDashboardStats() {
        const [
            totalUsers,
            totalTeachers,
            totalStudents,
            totalBookings,
            pendingBookings,
            pendingDisputes,
            totalRevenue // This might be complex, let's just count completed bookings for now or sum transaction fees
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'TEACHER' } }),
            this.prisma.user.count({ where: { role: 'PARENT' } }), // Assuming Parent is Student for now
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { status: 'PENDING_TEACHER_APPROVAL' } }),
            this.prisma.dispute.count({ where: { status: 'PENDING' } }),
            this.prisma.transaction.aggregate({
                where: { type: 'PAYMENT_RELEASE' }, // Assuming commission is taken here? Or usage of DEPOSIT?
                // For MVP, let's just show total Wallet Balances (system liability) or Total Deposits.
                // Let's use Total Deposits for "Volume".
                _sum: { amount: true }
            })
        ]);

        // Recent Activity (Simple: Latest 5 users)
        const recentUsers = await this.prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { teacherProfile: true }
        });

        return {
            counts: {
                users: totalUsers,
                teachers: totalTeachers,
                students: totalStudents,
                bookings: totalBookings,
                pendingBookings: pendingBookings,
                pendingDisputes: pendingDisputes
            },
            financials: {
                totalVolume: totalRevenue._sum.amount || 0
            },
            recentUsers
        };
    }

    async getAllBookings(status?: string) {
        const where: any = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        return this.prisma.booking.findMany({
            where,
            include: {
                teacherProfile: {
                    include: { user: { select: { email: true } } }
                },
                bookedByUser: { select: { id: true, email: true } },
                studentUser: { select: { id: true, email: true } },
                child: true,
                subject: true
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    async cancelBooking(bookingId: string, reason?: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'CANCELLED_BY_ADMIN',
                cancelReason: reason || 'ملغى بواسطة الإدارة'
            }
        });
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

        return this.prisma.dispute.findMany({
            where,
            include: {
                booking: {
                    include: {
                        teacherProfile: { include: { user: { select: { id: true, email: true } } } },
                        bookedByUser: { select: { id: true, email: true } },
                        subject: true
                    }
                },
                raisedByUser: { select: { id: true, email: true } },
                resolvedByAdmin: { select: { id: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a single dispute with full details
     */
    async getDisputeById(disputeId: string) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                booking: {
                    include: {
                        teacherProfile: { include: { user: { select: { id: true, email: true } } } },
                        bookedByUser: { select: { id: true, email: true } },
                        studentUser: { select: { id: true, email: true } },
                        child: true,
                        subject: true
                    }
                },
                raisedByUser: { select: { id: true, email: true } },
                resolvedByAdmin: { select: { id: true, email: true } }
            }
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
        splitPercentage?: number
    ) {
        try {
            // Fetch dispute with all needed relations for wallet operations
            const dispute = await this.prisma.dispute.findUnique({
                where: { id: disputeId },
                include: {
                    booking: {
                        include: {
                            teacherProfile: { include: { user: true } },
                            bookedByUser: true
                        }
                    }
                }
            });

            if (!dispute) {
                throw new NotFoundException('Dispute not found');
            }

            // IDEMPOTENCY: Already resolved disputes cannot be resolved again
            // IDEMPOTENCY: Explicit allow-list for resolvable statuses
            const RESOLVABLE_STATUSES = ['PENDING', 'UNDER_REVIEW'];
            if (!RESOLVABLE_STATUSES.includes(dispute.status)) {
                throw new BadRequestException(`Dispute status '${dispute.status}' cannot be resolved. Expected one of: ${RESOLVABLE_STATUSES.join(', ')}`);
            }

            const booking = dispute.booking;
            const lockedAmountGross = Number(booking.price);
            const commissionRate = Number(booking.commissionRate);
            const parentUserId = booking.bookedByUserId;
            const teacherUserId = booking.teacherProfile.userId;

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
                    disputeStatus = resolutionType === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED_TEACHER_WINS';
                    bookingStatus = 'COMPLETED';
                    studentRefundGross = 0;
                    platformCommission = lockedAmountGross * commissionRate;
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
                    if (splitPercentage === undefined || splitPercentage < 0 || splitPercentage > 100) {
                        throw new BadRequestException('Split percentage must be between 0 and 100');
                    }
                    disputeStatus = 'RESOLVED_SPLIT';
                    bookingStatus = 'PARTIALLY_REFUNDED';

                    // Student gets GROSS refund of their portion
                    studentRefundGross = lockedAmountGross * (splitPercentage / 100);

                    // Teacher's portion calculation
                    const teacherGrossPortion = lockedAmountGross - studentRefundGross;
                    platformCommission = teacherGrossPortion * commissionRate;
                    teacherPayoutNet = teacherGrossPortion - platformCommission;
                    break;

                default:
                    throw new BadRequestException('Invalid resolution type');
            }

            // INVARIANT CHECK (MANDATORY):
            // studentRefundGross + teacherPayoutNet + platformCommission MUST equal lockedAmountGross
            const totalDistributed = studentRefundGross + teacherPayoutNet + platformCommission;
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
                    diff: totalDistributed - lockedAmountGross
                };
                console.error('CRITICAL FINANCIAL INVARIANT VIOLATED:', JSON.stringify(errorDetails, null, 2));

                throw new BadRequestException(
                    `Financial invariant violated: ${studentRefundGross} + ${teacherPayoutNet} + ${platformCommission} = ${totalDistributed} != ${lockedAmountGross}`
                );
            }

            // Get wallets before transaction
            const parentWallet = await this.prisma.wallet.findFirst({
                where: { userId: parentUserId }
            });
            const teacherWallet = await this.prisma.wallet.findFirst({
                where: { userId: teacherUserId }
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
                const updatedDispute = await tx.dispute.update({
                    where: { id: disputeId },
                    data: {
                        status: disputeStatus as any,
                        resolvedByAdminId: adminUserId,
                        resolution: resolutionNote,
                        teacherPayout: teacherPayoutNet,
                        studentRefund: studentRefundGross,
                        resolvedAt: new Date()
                    }
                });

                // 2. Update booking status
                await tx.booking.update({
                    where: { id: dispute.bookingId },
                    data: {
                        status: bookingStatus as any,
                        paymentReleasedAt: new Date()
                    }
                });

                // 3. Release locked funds from parent's pendingBalance
                await tx.wallet.update({
                    where: { id: parentWallet.id },
                    data: {
                        pendingBalance: { decrement: lockedAmountGross }
                    }
                });

                // 4. Refund to student if applicable
                if (studentRefundGross > 0) {
                    await tx.wallet.update({
                        where: { id: parentWallet.id },
                        data: {
                            balance: { increment: studentRefundGross }
                        }
                    });

                    await tx.transaction.create({
                        data: {
                            walletId: parentWallet.id,
                            amount: studentRefundGross,
                            type: 'REFUND',
                            status: 'APPROVED',
                            adminNote: `Dispute refund for booking ${booking.id} - ${resolutionType}`
                        }
                    });
                }

                // 5. Pay teacher if applicable
                if (teacherPayoutNet > 0 && teacherWallet) {
                    await tx.wallet.update({
                        where: { id: teacherWallet.id },
                        data: {
                            balance: { increment: teacherPayoutNet }
                        }
                    });

                    await tx.transaction.create({
                        data: {
                            walletId: teacherWallet.id,
                            amount: teacherPayoutNet,
                            type: 'PAYMENT_RELEASE',
                            status: 'APPROVED',
                            adminNote: `Dispute resolution payment for booking ${booking.id} (${(commissionRate * 100).toFixed(0)}% commission)`
                        }
                    });
                }

                // 6. P1 FIX: Record escrow release from parent (positive amount + semantic type)
                await tx.transaction.create({
                    data: {
                        walletId: parentWallet.id,
                        amount: lockedAmountGross, // P1 FIX: Use positive amount
                        type: 'ESCROW_RELEASE', // P1 FIX: Semantic type instead of negative
                        status: 'APPROVED',
                        adminNote: `Dispute resolution - escrow released for booking ${booking.id}`
                    }
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
                    type: 'DISPUTE_UPDATE'
                }),
                this.notificationService.notifyUser({
                    userId: teacherUserId,
                    title: 'تحديث بخصوص النزاع',
                    message: teacherMessage,
                    type: 'DISPUTE_UPDATE'
                })
            ]);

            return result;
        } catch (e: any) {
            console.error('Resolve Dispute Error:', e);
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
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId }
        });

        if (!dispute) {
            throw new NotFoundException('Dispute not found');
        }

        return this.prisma.dispute.update({
            where: { id: disputeId },
            data: { status: 'UNDER_REVIEW' }
        });
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

        return this.prisma.teacherProfile.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, phoneNumber: true, createdAt: true } },
                documents: true,
            },
            orderBy: { submittedAt: 'desc' }
        });
    }

    /**
     * Get a single teacher application with full details
     */
    async getTeacherApplication(profileId: string) {
        const profile = await this.prisma.teacherProfile.findUnique({
            where: { id: profileId },
            include: {
                user: { select: { id: true, email: true, phoneNumber: true, createdAt: true } },
                documents: true,
                subjects: { include: { subject: true, curriculum: true } }
            }
        });

        if (!profile) {
            throw new NotFoundException('Teacher application not found');
        }

        return profile;
    }

    /**
     * Valid state transitions for application status
     */
    private validateTransition(currentStatus: string, newStatus: string): boolean {
        const transitions: Record<string, string[]> = {
            'DRAFT': ['SUBMITTED'],
            'SUBMITTED': ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'INTERVIEW_REQUIRED'],
            'CHANGES_REQUESTED': ['SUBMITTED'],
            'INTERVIEW_REQUIRED': ['INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED'],
            'INTERVIEW_SCHEDULED': ['APPROVED', 'REJECTED'],
            'APPROVED': [],
            'REJECTED': []
        };
        return transitions[currentStatus]?.includes(newStatus) ?? false;
    }

    /**
     * Approve a teacher application
     */
    async approveApplication(adminUserId: string, profileId: string) {
        const profile = await this.prisma.teacherProfile.findUnique({
            where: { id: profileId },
            include: { user: true }
        });

        if (!profile) throw new NotFoundException('Application not found');

        const allowedStatuses = ['SUBMITTED', 'INTERVIEW_REQUIRED', 'INTERVIEW_SCHEDULED'];
        if (!allowedStatuses.includes(profile.applicationStatus)) {
            throw new BadRequestException(
                `لا يمكن قبول الطلب من الحالة الحالية: ${profile.applicationStatus}`
            );
        }

        return this.prisma.$transaction([
            this.prisma.teacherProfile.update({
                where: { id: profileId },
                data: {
                    applicationStatus: 'APPROVED',
                    reviewedAt: new Date(),
                    reviewedBy: adminUserId,
                    rejectionReason: null,
                }
            }),
            // Also update legacy isVerified flag for backward compatibility
            this.prisma.user.update({
                where: { id: profile.userId },
                data: { isVerified: true }
            })
        ]);
    }

    /**
     * Reject a teacher application
     */
    async rejectApplication(adminUserId: string, profileId: string, reason: string) {
        if (!reason || reason.trim().length === 0) {
            throw new BadRequestException('يجب تقديم سبب الرفض');
        }

        const profile = await this.prisma.teacherProfile.findUnique({
            where: { id: profileId }
        });

        if (!profile) throw new NotFoundException('Application not found');

        const allowedStatuses = ['SUBMITTED', 'INTERVIEW_REQUIRED', 'INTERVIEW_SCHEDULED'];
        if (!allowedStatuses.includes(profile.applicationStatus)) {
            throw new BadRequestException(
                `لا يمكن رفض الطلب من الحالة الحالية: ${profile.applicationStatus}`
            );
        }

        return this.prisma.teacherProfile.update({
            where: { id: profileId },
            data: {
                applicationStatus: 'REJECTED',
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
                rejectionReason: reason,
                rejectedAt: new Date(),
            }
        });
    }

    /**
     * Request changes from teacher
     */
    async requestChanges(adminUserId: string, profileId: string, reason: string) {
        if (!reason || reason.trim().length === 0) {
            throw new BadRequestException('يجب تحديد التغييرات المطلوبة');
        }

        const profile = await this.prisma.teacherProfile.findUnique({
            where: { id: profileId }
        });

        if (!profile) throw new NotFoundException('Application not found');

        if (profile.applicationStatus !== 'SUBMITTED') {
            throw new BadRequestException('يمكن طلب التغييرات فقط للطلبات المقدمة');
        }

        return this.prisma.teacherProfile.update({
            where: { id: profileId },
            data: {
                applicationStatus: 'CHANGES_REQUESTED',
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
                changeRequestReason: reason,
            }
        });
    }

    /**
     * Request interview with teacher
     */
    async requestInterview(adminUserId: string, profileId: string) {
        const profile = await this.prisma.teacherProfile.findUnique({
            where: { id: profileId }
        });

        if (!profile) throw new NotFoundException('Application not found');

        if (profile.applicationStatus !== 'SUBMITTED') {
            throw new BadRequestException('يمكن طلب المقابلة فقط للطلبات المقدمة');
        }

        return this.prisma.teacherProfile.update({
            where: { id: profileId },
            data: {
                applicationStatus: 'INTERVIEW_REQUIRED',
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
            }
        });
    }

    /**
     * Schedule interview with teacher
     */
    async scheduleInterview(adminUserId: string, profileId: string, datetime: string, link: string) {
        if (!datetime) {
            throw new BadRequestException('يجب تحديد موعد المقابلة');
        }
        if (!link) {
            throw new BadRequestException('يجب تحديد رابط المقابلة');
        }

        const profile = await this.prisma.teacherProfile.findUnique({
            where: { id: profileId }
        });

        if (!profile) throw new NotFoundException('Application not found');

        if (profile.applicationStatus !== 'INTERVIEW_REQUIRED') {
            throw new BadRequestException('يمكن جدولة المقابلة فقط للطلبات التي تتطلب مقابلة');
        }

        return this.prisma.teacherProfile.update({
            where: { id: profileId },
            data: {
                applicationStatus: 'INTERVIEW_SCHEDULED',
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
                interviewScheduledAt: new Date(datetime),
                interviewLink: link,
            }
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
        forceChange: boolean = true
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, phoneNumber: true, role: true }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Generate temporary password if not provided
        const tempPass = temporaryPassword || this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(tempPass, 10);

        // Update user password and set requirePasswordChange flag
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                requirePasswordChange: forceChange,
            },
            select: { id: true, email: true, phoneNumber: true }
        });

        // Log audit trail
        await this.prisma.auditLog.create({
            data: {
                action: 'SETTINGS_UPDATE', // Using SETTINGS_UPDATE for password reset action
                actorId: adminUserId,
                targetId: userId,
            }
        });

        return {
            success: true,
            temporaryPassword: tempPass,
            message: `Password reset successful. ${forceChange ? 'User will be required to change password on next login.' : ''}`,
            user: updatedUser
        };
    }

    // --- Phase 3: Teacher Payouts ---
    async processWithdrawal(transactionId: string, dto: ProcessTransactionDto & { proofDocumentId?: string }) {
        // Fetch transaction with wallet context
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { wallet: true }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.type !== 'WITHDRAWAL') throw new BadRequestException('Only withdrawals can be processed here');

        const { status: newStatus, adminNote, proofDocumentId } = dto;
        const currentStatus = transaction.status;

        // Strict State Machine & Validation
        // Cast to any to avoid build/cache mismatch with @sidra/shared enums
        const STATUS = TransactionStatus as any;

        if (newStatus === STATUS.PAID) {
            // Can transition from PENDING (Fast Track) or APPROVED (Settlement)
            if (![STATUS.PENDING, STATUS.APPROVED].includes(currentStatus as any)) {
                throw new BadRequestException(`Cannot mark as PAID from status ${currentStatus}`);
            }
            if (!proofDocumentId) throw new BadRequestException('Proof document is mandatory for payment');
        }
        else if (newStatus === STATUS.APPROVED) {
            // Can only transition from PENDING
            if (currentStatus !== STATUS.PENDING) {
                throw new BadRequestException(`Cannot APPROVE from status ${currentStatus}`);
            }
        }
        else if (newStatus === STATUS.REJECTED) {
            // Can transition from PENDING or APPROVED
            if (![STATUS.PENDING, STATUS.APPROVED].includes(currentStatus as any)) {
                throw new BadRequestException(`Cannot REJECT from status ${currentStatus}`);
            }
            if (!adminNote) throw new BadRequestException('Rejection reason (adminNote) is mandatory');
        } else {
            throw new BadRequestException('Invalid status transition');
        }

        // Execute Atomic Ledger & State Update
        return this.prisma.$transaction(async (tx) => {
            let updatedTx;

            if (newStatus === STATUS.PAID) {
                // LEDGER: Burn Pending Balance (Reduce Liability)
                // Conditional Update: Verify pendingBalance >= amount
                const walletUpdate = await tx.wallet.updateMany({
                    where: {
                        id: transaction.walletId,
                        pendingBalance: { gte: transaction.amount }
                    },
                    data: {
                        pendingBalance: { decrement: transaction.amount }
                    }
                });

                if (walletUpdate.count === 0) {
                    throw new Error('Ledger integrity error: Insufficient pending balance for payout');
                }

                updatedTx = await tx.transaction.update({
                    where: { id: transactionId },
                    data: {
                        status: STATUS.PAID,
                        adminNote,
                        proofDocumentId,
                        paidAt: new Date()
                    } as any // Cast for schema fields
                });

                // P1-1: Create ledger transaction for withdrawal completion
                await tx.transaction.create({
                    data: {
                        walletId: transaction.walletId,
                        amount: transaction.amount,
                        type: 'WITHDRAWAL_COMPLETED',
                        status: 'APPROVED',
                        adminNote: `Withdrawal ${transactionId} paid out - proof: ${proofDocumentId}`
                    } as any
                });

                // Notify NotificationService (Teacher)
                // this.notificationService.notifyUser(...) // TODO: Add template
            }
            else if (newStatus === STATUS.REJECTED) {
                // LEDGER: Refund (Pending -> Balance)
                const walletUpdate = await tx.wallet.updateMany({
                    where: {
                        id: transaction.walletId,
                        pendingBalance: { gte: transaction.amount }
                    },
                    data: {
                        pendingBalance: { decrement: transaction.amount },
                        balance: { increment: transaction.amount }
                    }
                });

                if (walletUpdate.count === 0) {
                    throw new Error('Ledger integrity error: Insufficient pending balance for refund');
                }

                updatedTx = await tx.transaction.update({
                    where: { id: transactionId },
                    data: {
                        status: STATUS.REJECTED,
                        adminNote
                    }
                });

                // P1-1: Create ledger transaction for withdrawal refund
                await tx.transaction.create({
                    data: {
                        walletId: transaction.walletId,
                        amount: transaction.amount,
                        type: 'WITHDRAWAL_REFUNDED',
                        status: 'APPROVED',
                        adminNote: `Withdrawal ${transactionId} rejected and refunded - reason: ${adminNote || 'N/A'}`
                    } as any
                });
            }
            else if (newStatus === STATUS.APPROVED) {
                // LEDGER: No Change (Funds stay locked)
                updatedTx = await tx.transaction.update({
                    where: { id: transactionId },
                    data: {
                        status: STATUS.APPROVED,
                        adminNote
                    }
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
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
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
        return this.prisma.packageTier.findMany({
            orderBy: { displayOrder: 'asc' }
        });
    }

    async createPackageTier(dto: { sessionCount: number; discountPercent: number; displayOrder?: number }) {
        return this.prisma.packageTier.create({
            data: {
                sessionCount: dto.sessionCount,
                discountPercent: dto.discountPercent,
                displayOrder: dto.displayOrder ?? 0,
                isActive: true
            }
        });
    }

    async updatePackageTier(id: string, dto: { sessionCount?: number; discountPercent?: number; isActive?: boolean; displayOrder?: number }) {
        const tier = await this.prisma.packageTier.findUnique({ where: { id } });
        if (!tier) {
            throw new NotFoundException('Package tier not found');
        }

        return this.prisma.packageTier.update({
            where: { id },
            data: {
                ...(dto.sessionCount !== undefined && { sessionCount: dto.sessionCount }),
                ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder })
            }
        });
    }

    async deletePackageTier(id: string) {
        const tier = await this.prisma.packageTier.findUnique({ where: { id } });
        if (!tier) {
            throw new NotFoundException('Package tier not found');
        }

        // Soft delete by setting isActive to false instead of hard delete
        return this.prisma.packageTier.update({
            where: { id },
            data: { isActive: false }
        });
    }
}

