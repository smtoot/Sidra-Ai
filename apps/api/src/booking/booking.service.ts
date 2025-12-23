import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { PackageService } from '../package/package.service';
import { DemoService } from '../package/demo.service';
import { CreateBookingDto, UpdateBookingStatusDto, CreateRatingDto } from '@sidra/shared';
import { formatInTimezone } from '../common/utils/timezone.util';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private notificationService: NotificationService,
        private packageService: PackageService,
        private demoService: DemoService
    ) { }

    // Create a booking request (Parent or Student)
    async createRequest(user: any, dto: CreateBookingDto) {
        // user is the logged-in User entity (from @User decorator)

        // fields for creation
        let beneficiaryType: 'CHILD' | 'STUDENT';
        let childId: string | null = null;
        let studentUserId: string | null = null;

        if (user.role === 'PARENT') {
            if (!dto.childId) {
                throw new BadRequestException('Child ID is required for Parent bookings');
            }
            // Verify child belongs to parent
            // We need to find the child and check its parent.userId
            // Or simpler: find Child where id=childId AND parent.userId = user.id
            const childNode = await this.prisma.child.findFirst({
                where: {
                    id: dto.childId,
                    parent: { userId: user.userId }
                }
            });

            if (!childNode) {
                throw new ForbiddenException('Child not found or does not belong to you');
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
            throw new ForbiddenException('Only Parents or Students can book sessions');
        }

        // Verify teacher and subject exist
        const teacherSubject = await this.prisma.teacherSubject.findFirst({
            where: {
                teacherId: dto.teacherId,
                subjectId: dto.subjectId
            },
            include: { teacherProfile: true }
        });

        if (!teacherSubject) {
            throw new NotFoundException('Teacher does not teach this subject');
        }

        // Prevent self-booking
        if (teacherSubject.teacherProfile.userId === user.userId) {
            throw new ForbiddenException('لا يمكنك حجز حصة مع نفسك');
        }

        // **VALIDATION**: Check if the slot is actually available
        const isAvailable = await this.validateSlotAvailability(
            dto.teacherId,
            new Date(dto.startTime)
        );

        if (!isAvailable) {
            throw new BadRequestException('هذا الموعد غير متاح. يرجى اختيار وقت آخر.');
        }

        // Create booking
        const booking = await this.prisma.booking.create({
            data: {
                teacherId: dto.teacherId,
                bookedByUserId: user.userId,
                beneficiaryType,
                childId,
                studentUserId,

                subjectId: dto.subjectId,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                timezone: dto.timezone || 'UTC',  // Store user's timezone
                price: dto.price,
                bookingNotes: dto.bookingNotes || null,  // Notes from parent/student
                meetingLink: teacherSubject.teacherProfile.encryptedMeetingLink,
                status: 'PENDING_TEACHER_APPROVAL'
            },
            include: {
                teacherProfile: { include: { user: true } },
                bookedByUser: true,
                child: true,
                studentUser: true,
                subject: true
            }
        });

        // =====================================================
        // PACKAGE INTEGRATION: Create redemption if packageId provided
        // =====================================================
        if (dto.packageId) {
            try {
                await this.packageService.createRedemption(dto.packageId, booking.id);
                this.logger.log(`Package redemption created for booking ${booking.id} using package ${dto.packageId}`);
            } catch (err: any) {
                // If redemption fails, we should cancel the booking
                this.logger.error(`Failed to create package redemption: ${err.message}`, err);
                // Clean up the booking
                await this.prisma.booking.delete({ where: { id: booking.id } });
                throw new BadRequestException(`Package redemption failed: ${err.message}`);
            }
        }

        // =====================================================
        // DEMO INTEGRATION: Create demo record if isDemo
        // =====================================================
        if (dto.isDemo && studentUserId) {
            try {
                await this.demoService.createDemoRecord(studentUserId, dto.teacherId);
                this.logger.log(`Demo session record created for student ${studentUserId} with teacher ${dto.teacherId}`);
            } catch (err: any) {
                // If demo record fails, we should cancel the booking
                this.logger.error(`Failed to create demo record: ${err.message}`, err);
                // Clean up the booking
                await this.prisma.booking.delete({ where: { id: booking.id } });
                throw new BadRequestException(`Demo booking failed: ${err.message}`);
            }
        }

        // Notify teacher about new booking request
        await this.notificationService.notifyUser({
            userId: booking.teacherProfile.user.id,
            title: 'طلب حجز جديد',
            message: `لديك طلب حجز جديد من ${booking.bookedByUser?.email || 'مستخدم'}`,
            type: 'BOOKING_REQUEST',
            link: '/teacher/requests',
            dedupeKey: `BOOKING_REQUEST:${booking.id}:${booking.teacherProfile.user.id}`,
            metadata: { bookingId: booking.id }
        });

        return booking;
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
        return this.prisma.$transaction(async (tx) => {
            // 1. Fetch and validate booking
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    teacherProfile: { include: { user: true } },
                    bookedByUser: true
                }
            });

            if (!booking) throw new NotFoundException('Booking not found');
            if (booking.teacherProfile.user.id !== teacherUserId) {
                throw new ForbiddenException('Not your booking');
            }

            // Idempotency: if already SCHEDULED or beyond, return current state
            if (booking.status === 'SCHEDULED' || booking.status === 'COMPLETED' || booking.status === 'PENDING_CONFIRMATION') {
                return booking;
            }

            // Allow re-approval if it was WAITING_FOR_PAYMENT (e.g. parent asks teacher to try again manually?) 
            // Primarily for PENDING_TEACHER_APPROVAL
            if (booking.status !== 'PENDING_TEACHER_APPROVAL' && booking.status !== 'WAITING_FOR_PAYMENT') {
                throw new BadRequestException('Booking is not pending approval or payment');
            }

            // Calculate Payment Deadline
            // Logic: The deadline is the EARLIER of:
            // 1. Approval time + Payment Window (e.g., 24h)
            // 2. Session Start Time - Minimum Buffer (e.g., 2h)
            const now = new Date();
            const paymentWindowDuration = settings.paymentWindowHours * 60 * 60 * 1000;
            const minBufferDuration = settings.minHoursBeforeSession * 60 * 60 * 1000;

            const windowDeadline = new Date(now.getTime() + paymentWindowDuration);
            const bufferDeadline = new Date(booking.startTime.getTime() - minBufferDuration);

            // Use the earlier of the two deadlines
            // If bufferDeadline is in the past, it means we are already too close to the session.
            const paymentDeadline = windowDeadline < bufferDeadline ? windowDeadline : bufferDeadline;

            // Check parent's wallet balance
            const parentWallet = await this.walletService.getBalance(booking.bookedByUserId);
            const price = Number(booking.price);
            const balance = Number(parentWallet.balance);

            if (balance < price) {
                // --- Insufficient Balance Flow ---

                // If deadline is already passed (or too close to session), we cannot allow "Pay Later"
                if (paymentDeadline.getTime() <= now.getTime()) {
                    throw new BadRequestException('رصيد ولي الأمر غير كافٍ والوقت متأخر جداً لانتظار الدفع. يجب شحن المحفظة فوراً.');
                }

                // Transition to WAITING_FOR_PAYMENT
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: 'WAITING_FOR_PAYMENT',
                        paymentDeadline: paymentDeadline
                    }
                });

                return { booking: updatedBooking, paymentRequired: true };
            }

            // --- Sufficient Balance Flow (Lock Funds) ---

            // Lock funds in escrow (validates balance internally too, but we checked above)
            await this.walletService.lockFundsForBooking(
                booking.bookedByUserId,
                bookingId,
                price
            );

            // Update booking status to SCHEDULED
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'SCHEDULED',
                    paymentDeadline: null // Clear deadline if exists
                }
            });

            return { booking: updatedBooking, paymentRequired: false };
        }).then(async (result: { booking: any; paymentRequired: boolean }) => {
            const { booking: updatedBooking, paymentRequired } = result;

            if (paymentRequired) {
                // Notify parent: Payment Required
                await this.notificationService.notifyUser({
                    userId: updatedBooking.bookedByUserId,
                    title: 'تم قبول طلب الحجز - يرجى الدفع',
                    message: `وافق المعلم على طلبك. يرجى سداد المبلغ قبل ${updatedBooking.paymentDeadline ? new Date(updatedBooking.paymentDeadline).toLocaleTimeString('ar-EG') : 'الموعد المحدد'} لتأكيد الحجز.`,
                    type: 'BOOKING_APPROVED', // Or a new type like PAYMENT_REQUIRED
                    link: '/parent/bookings',
                    dedupeKey: `PAYMENT_REQUIRED:${updatedBooking.id}`,
                    metadata: { bookingId: updatedBooking.id }
                });
            } else {
                // Notify parent: Confirmed & Paid
                await this.notificationService.notifyUser({
                    userId: updatedBooking.bookedByUserId,
                    title: 'تم قبول طلب الحجز وتأكيده',
                    message: 'تم قبول طلب الحجز وخصم المبلغ من المحفظة. الحصة مجدولة الآن.',
                    type: 'BOOKING_APPROVED',
                    link: '/parent/bookings',
                    dedupeKey: `BOOKING_APPROVED:${bookingId}:${updatedBooking.bookedByUserId}`,
                    metadata: { bookingId: updatedBooking.id }
                });
            }

            return updatedBooking;
        });
    }

    // Teacher rejects a booking
    async rejectRequest(teacherUserId: string, bookingId: string, dto: UpdateBookingStatusDto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { teacherProfile: { include: { user: true } } }
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.teacherProfile.user.id !== teacherUserId) {
            throw new ForbiddenException('Not your booking');
        }
        if (booking.status !== 'PENDING_TEACHER_APPROVAL') {
            throw new BadRequestException('Booking is not pending');
        }

        const updatedBooking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'REJECTED_BY_TEACHER',
                cancelReason: dto.cancelReason
            }
        });

        // Notify parent about booking rejection
        await this.notificationService.notifyUser({
            userId: booking.bookedByUserId,
            title: 'تم رفض طلب الحجز',
            message: dto.cancelReason || 'تم رفض طلب الحجز من قبل المعلم.',
            type: 'BOOKING_REJECTED',
            link: '/parent/bookings',
            dedupeKey: `BOOKING_REJECTED:${bookingId}:${booking.bookedByUserId}`,
            metadata: { bookingId }
        });

        return updatedBooking;
    }

    // Get teacher's incoming requests
    async getTeacherRequests(teacherUserId: string) {
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });

        if (!teacherProfile) throw new NotFoundException('Teacher profile not found');

        return this.prisma.booking.findMany({
            where: {
                teacherId: teacherProfile.id,
                status: 'PENDING_TEACHER_APPROVAL'
            },
            include: {
                bookedByUser: { include: { parentProfile: { include: { user: true } } } },
                studentUser: true,
                subject: true,
                child: true
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    // Get teacher's all sessions (for My Sessions page)
    async getTeacherSessions(teacherUserId: string) {
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });

        if (!teacherProfile) throw new NotFoundException('Teacher profile not found');

        return this.prisma.booking.findMany({
            where: { teacherId: teacherProfile.id },
            include: {
                bookedByUser: { include: { parentProfile: { include: { user: true } } } },
                studentUser: true,
                subject: true,
                child: true
            },
            orderBy: { startTime: 'desc' }
        });
    }

    // Get ALL teacher bookings (for requests page - shows all statuses)
    async getAllTeacherBookings(teacherUserId: string) {
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });

        if (!teacherProfile) throw new NotFoundException('Teacher profile not found');

        return this.prisma.booking.findMany({
            where: { teacherId: teacherProfile.id },
            include: {
                bookedByUser: { include: { parentProfile: { include: { user: true } } } },
                studentUser: true,
                subject: true,
                child: true
            },
            orderBy: { createdAt: 'desc' }  // Newest requests first
        });
    }
    // Get parent's bookings
    async getParentBookings(parentUserId: string) {
        const parentProfile = await this.prisma.parentProfile.findUnique({
            where: { userId: parentUserId }
        });

        if (!parentProfile) throw new NotFoundException('Parent profile not found');

        return this.prisma.booking.findMany({
            where: { bookedByUserId: parentUserId },
            include: {
                teacherProfile: { include: { user: true } },
                bookedByUser: { include: { parentProfile: { include: { user: true } } } },
                studentUser: true,
                subject: true,
                child: true,
                rating: true  // Include rating to show if booking has been rated
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Get student's bookings
    async getStudentBookings(studentUserId: string) {
        const studentProfile = await this.prisma.studentProfile.findUnique({
            where: { userId: studentUserId }
        });

        if (!studentProfile) throw new NotFoundException('Student profile not found');

        return this.prisma.booking.findMany({
            where: { bookedByUserId: studentUserId },
            include: {
                teacherProfile: { include: { user: true } },
                bookedByUser: true,
                subject: true,
                rating: true  // Include rating to show if booking has been rated
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Get single booking by ID (for session detail page)
    async getBookingById(userId: string, userRole: string, bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacherProfile: { include: { user: true } },
                bookedByUser: true,
                studentUser: true,
                subject: true,
                child: true
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Authorization: Only allow access to own bookings
        if (userRole === 'TEACHER') {
            const teacherProfile = await this.prisma.teacherProfile.findUnique({
                where: { userId }
            });
            if (!teacherProfile || booking.teacherId !== teacherProfile.id) {
                throw new ForbiddenException('Not authorized to view this booking');
            }
        } else if (userRole === 'PARENT' || userRole === 'STUDENT') {
            if (booking.bookedByUserId !== userId) {
                throw new ForbiddenException('Not authorized to view this booking');
            }
        } else if (userRole !== 'ADMIN') {
            throw new ForbiddenException('Not authorized to view bookings');
        }

        return booking;
    }

    // Teacher updates their private notes (prep notes and summary)
    async updateTeacherNotes(
        teacherUserId: string,
        bookingId: string,
        dto: { teacherPrepNotes?: string; teacherSummary?: string }
    ) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { teacherProfile: true }
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Verify teacher owns this booking
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });

        if (!teacherProfile || booking.teacherId !== teacherProfile.id) {
            throw new ForbiddenException('Not authorized to update notes for this session');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                teacherPrepNotes: dto.teacherPrepNotes,
                teacherSummary: dto.teacherSummary
            }
        });
    }
    // Cron job: Expire old pending requests (24 hours)
    // Run every hour
    @Cron(CronExpression.EVERY_HOUR)
    async expireOldRequests() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await this.prisma.booking.updateMany({
            where: {
                status: 'PENDING_TEACHER_APPROVAL',
                createdAt: { lt: cutoff }
            },
            data: { status: 'EXPIRED' }
        });

        // Also run expiration for unpaid bookings
        await this.expireUnpaidBookings();

        return { expired: result.count };
    }

    /**
     * Cron Job: Expire bookings waiting for payment where deadline has passed
     */
    async expireUnpaidBookings() {
        const now = new Date();

        // Find bookings that missed their payment deadline
        const unpaidBookings = await this.prisma.booking.findMany({
            where: {
                status: 'WAITING_FOR_PAYMENT',
                paymentDeadline: { lt: now }
            },
            include: {
                teacherProfile: { include: { user: true } },
                bookedByUser: true
            }
        });

        if (unpaidBookings.length === 0) return;

        const logger = new Logger('BookingCleanup');
        logger.log(`Found ${unpaidBookings.length} unpaid bookings to expire`);

        for (const booking of unpaidBookings) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    // Update status to EXPIRED
                    await tx.booking.update({
                        where: { id: booking.id },
                        data: { status: 'EXPIRED' }
                    });
                });

                // Notify Parent (You missed the payment deadline)
                await this.notificationService.notifyUser({
                    userId: booking.bookedByUserId,
                    title: 'انتهاء مهلة الدفع',
                    message: `نأسف، تم إلغاء حجزك مع ${booking.teacherProfile.user.phoneNumber || 'المعلم'} لعدم سداد المبلغ في الوقت المحدد.`,
                    type: 'SYSTEM_ALERT',
                    link: '/parent/bookings',
                    dedupeKey: `PAYMENT_EXPIRED:${booking.id}`
                });

                // Notify Teacher (Slot is free again)
                await this.notificationService.notifyUser({
                    userId: booking.teacherProfile.user.id,
                    title: 'إلغاء حجز لعدم الدفع',
                    message: `تم إلغاء الحجز المعلق من ${booking.bookedByUser.phoneNumber || 'ولي الأمر'} لعدم سداد المبلغ. الموعد متاح مرة أخرى.`,
                    type: 'SYSTEM_ALERT',
                    link: '/teacher/sessions',
                    dedupeKey: `PAYMENT_EXPIRED:${booking.id}`
                });

            } catch (error) {
                logger.error(`Failed to expire booking ${booking.id}`, error);
            }
        }
    }

    // --- Phase 2C: Payment Integration ---

    /**
     * Parent pays for approved booking (WAITING_FOR_PAYMENT → SCHEDULED)
     * Locks funds from parent's wallet
     */
    async payForBooking(parentUserId: string, bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookedByUser: { include: { parentProfile: { include: { user: true } } } },
                teacherProfile: { include: { user: true } }
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.bookedByUser.id !== parentUserId) {
            throw new ForbiddenException('Not your booking');
        }
        if (booking.status !== 'WAITING_FOR_PAYMENT') {
            throw new BadRequestException('Booking is not awaiting payment');
        }

        // Lock funds atomically
        await this.walletService.lockFundsForBooking(
            parentUserId,
            bookingId,
            Number(booking.price)
        );

        // Update booking status
        const updatedBooking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'SCHEDULED' }
        });

        // Notify parent about successful payment
        await this.notificationService.notifyUser({
            userId: parentUserId,
            title: 'تم الدفع بنجاح',
            message: 'تم الدفع بنجاح وتم تأكيد الحجز. ستتلقى رابط الاجتماع قريباً.',
            type: 'PAYMENT_SUCCESS',
            link: '/parent/bookings',
            dedupeKey: `PAYMENT_SUCCESS:${bookingId}:${parentUserId}`,
            metadata: { bookingId }
        });

        // Notify teacher about new scheduled session
        await this.notificationService.notifyUser({
            userId: booking.teacherProfile.user.id,
            title: 'حجز جديد مؤكد',
            message: `تم تأكيد حجز جديد ودفع المبلغ. تحقق من جدولك.`,
            type: 'PAYMENT_SUCCESS',
            link: '/teacher/sessions',
            dedupeKey: `PAYMENT_SUCCESS:${bookingId}:${booking.teacherProfile.user.id}`,
            metadata: { bookingId }
        });

        return updatedBooking;
    }

    /**
     * Mark session as completed (SCHEDULED → COMPLETED)
     * Releases funds to teacher (minus commission)
     * NOTE: In MVP, this is called by Admin. In Phase 3, this would be automated.
     */
    async markCompleted(bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookedByUser: true,
                teacherProfile: { include: { user: true } }
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== 'SCHEDULED') {
            throw new BadRequestException('Booking is not scheduled');
        }

        // Release funds to teacher atomically
        await this.walletService.releaseFundsOnCompletion(
            booking.bookedByUser.id,
            booking.teacherProfile.user.id,
            bookingId,
            Number(booking.price),
            Number(booking.commissionRate)
        );

        // Update booking status
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' }
        });
    }

    async completeSession(teacherUserId: string, bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacherProfile: { include: { user: true } },
                bookedByUser: true,
                dispute: true
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Check ownership
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });

        if (!teacherProfile || booking.teacherId !== teacherProfile.id) {
            throw new BadRequestException('Not authorized to complete this session');
        }

        // Only SCHEDULED sessions can be marked complete
        if (booking.status !== 'SCHEDULED') {
            throw new BadRequestException('Session must be SCHEDULED to mark complete');
        }

        // Get system settings for dispute window
        const settings = await this.getSystemSettings();
        const now = new Date();
        const disputeWindowClosesAt = new Date(
            now.getTime() + settings.disputeWindowHours * 60 * 60 * 1000
        );

        // Update to PENDING_CONFIRMATION with dispute window tracking
        const updatedBooking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'PENDING_CONFIRMATION',
                // NEW: Dispute window tracking
                disputeWindowOpensAt: now,
                disputeWindowClosesAt: disputeWindowClosesAt,
                // LEGACY: Keep for backward compatibility
                teacherCompletedAt: now,
                autoReleaseAt: disputeWindowClosesAt,
            }
        });

        // Trigger notification cascade (T+0h)
        await this.notificationService.notifySessionComplete({
            bookingId: booking.id,
            parentUserId: booking.bookedByUserId,
            teacherName: booking.teacherProfile.user.phoneNumber, // Use phone as identifier
            disputeDeadline: disputeWindowClosesAt,
        });

        return updatedBooking;
    }

    /**
     * Parent/Student confirms session early (before auto-release)
     * Releases payment immediately and notifies teacher
     */
    async confirmSessionEarly(userId: string, bookingId: string, rating?: number) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookedByUser: true,
                teacherProfile: { include: { user: true } },
                packageRedemption: true // Include package link
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Only the person who booked can confirm
        if (booking.bookedByUserId !== userId) {
            throw new ForbiddenException('Not authorized to confirm this session');
        }

        // Only PENDING_CONFIRMATION sessions can be confirmed
        if (booking.status !== 'PENDING_CONFIRMATION') {
            throw new BadRequestException('Session is not pending confirmation');
        }

        // Check if dispute window has expired
        if (booking.disputeWindowClosesAt && new Date() > booking.disputeWindowClosesAt) {
            throw new BadRequestException('Dispute window has expired - payment already auto-released');
        }

        const now = new Date();

        // Update booking and release payment
        const updatedBooking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'COMPLETED',
                studentConfirmedAt: now,
                paymentReleasedAt: now
            }
        });

        // Release payment to teacher (calculate after commission)
        await this.releasePaymentToTeacher(booking);

        // =====================================================
        // PACKAGE INTEGRATION: Release session from package
        // =====================================================
        if (booking.packageRedemption) {
            try {
                const idempotencyKey = `RELEASE_${bookingId}_${Date.now()}`;
                await this.packageService.releaseSession(bookingId, idempotencyKey);
                this.logger.log(`Package session released for booking ${bookingId}`);
            } catch (err) {
                this.logger.error(`Failed to release package session for booking ${bookingId}`, err);
                // Don't block completion - session is complete, log the error
            }
        }

        // =====================================================
        // DEMO INTEGRATION: Mark demo as used
        // =====================================================
        // Check if this was a demo booking (price = 0 typically indicates demo)
        const isDemo = Number(booking.price) === 0;
        if (isDemo && booking.studentUserId) {
            try {
                await this.demoService.markDemoCompleted(
                    booking.studentUserId,
                    booking.teacherId
                );
                this.logger.log(`Demo marked complete for student ${booking.studentUserId} with teacher ${booking.teacherId}`);
            } catch (err) {
                this.logger.error(`Failed to mark demo complete for booking ${bookingId}`, err);
                // Don't block completion - session is complete, log the error
            }
        }

        // Notify teacher that payment was released (confirmed by student)
        await this.notificationService.notifyTeacherPaymentReleased({
            bookingId: booking.id,
            teacherId: booking.teacherProfile.user.id,
            amount: Number(booking.price) * (1 - Number(booking.commissionRate)),
            releaseType: 'CONFIRMED',
        });

        return updatedBooking;
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
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    rating: true,
                    teacherProfile: true
                }
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
            if (booking.rating) {
                throw new ConflictException('لقد قمت بتقييم هذه الجلسة مسبقاً');
            }

            // 2. Create the rating
            const rating = await tx.rating.create({
                data: {
                    bookingId: bookingId,
                    teacherId: booking.teacherId,
                    ratedByUserId: userId,
                    score: dto.score,
                    comment: dto.comment || null
                }
            });

            // 3. Update teacher's aggregates using running average formula
            const currentAvg = booking.teacherProfile.averageRating;
            const currentCount = booking.teacherProfile.totalReviews;
            const newCount = currentCount + 1;
            // Running average: newAvg = ((oldAvg * oldCount) + newScore) / newCount
            const newAverage = ((currentAvg * currentCount) + dto.score) / newCount;
            // Round to 2 decimal places
            const roundedAverage = Math.round(newAverage * 100) / 100;

            await tx.teacherProfile.update({
                where: { id: booking.teacherId },
                data: {
                    averageRating: roundedAverage,
                    totalReviews: newCount
                }
            });

            return rating;
        });
    }

    // Student/Parent raises a dispute
    async raiseDispute(
        userId: string,
        bookingId: string,
        dto: { type: string; description: string; evidence?: string[] }
    ) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookedByUser: true,
                dispute: true
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');

        // Only the person who booked can raise dispute
        if (booking.bookedByUserId !== userId) {
            throw new ForbiddenException('Not authorized to raise dispute for this session');
        }

        // Can only dispute PENDING_CONFIRMATION or SCHEDULED sessions
        if (!['PENDING_CONFIRMATION', 'SCHEDULED'].includes(booking.status)) {
            throw new BadRequestException('Cannot dispute this session');
        }

        // Check if dispute already exists
        if (booking.dispute) {
            throw new BadRequestException('A dispute already exists for this session');
        }

        // Validate dispute type
        const validTypes = ['TEACHER_NO_SHOW', 'SESSION_TOO_SHORT', 'QUALITY_ISSUE', 'TECHNICAL_ISSUE', 'OTHER'];
        if (!validTypes.includes(dto.type)) {
            throw new BadRequestException('Invalid dispute type');
        }

        // Create dispute and update booking status in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const dispute = await tx.dispute.create({
                data: {
                    bookingId: bookingId,
                    raisedByUserId: userId,
                    type: dto.type as any,
                    description: dto.description,
                    evidence: dto.evidence || [],
                    status: 'PENDING'
                }
            });

            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: { status: 'DISPUTED' }
            });

            return { booking: updatedBooking, dispute };
        });

        // Notify all admin users about the new dispute
        const adminUsers = await this.prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true }
        });

        for (const admin of adminUsers) {
            await this.notificationService.notifyUser({
                userId: admin.id,
                title: 'نزاع جديد',
                message: `تم رفع نزاع جديد على حجز رقم ${bookingId.slice(0, 8)}...`,
                type: 'DISPUTE_RAISED'
            });
        }

        return result;
    }

    // Helper: Get system settings (with defaults)
    async getSystemSettings() {
        let settings = await this.prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        // Create default settings if not exist
        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    id: 'default',
                    confirmationWindowHours: 48,
                    autoReleaseEnabled: true,
                    reminderHoursBeforeRelease: 6,
                    defaultCommissionRate: 0.18
                }
            });
        }

        return settings;
    }

    // Helper: Release payment to teacher wallet
    private async releasePaymentToTeacher(booking: any) {
        const price = Number(booking.price);
        const commissionRate = Number(booking.commissionRate);

        // Use the existing wallet method for proper escrow release
        await this.walletService.releaseFundsOnCompletion(
            booking.bookedByUserId,           // Parent/Student who paid
            booking.teacherProfile.userId,     // Teacher receiving payment
            booking.id,                        // Booking ID
            price,                             // Total amount
            commissionRate                     // Commission rate
        );
    }

    // --- Phase 2C: Payment Integration ---
    // (Existing payment methods are above)

    // --- Phase 3: Booking Validation ---

    /**
     * Validate that a time slot is actually available for booking
     * Checks: 1) Weekly availability, 2) Exceptions, 3) Existing bookings
     * 
     * IMPORTANT: startTime is in UTC. Teacher's availability is stored in their local timezone.
     * We must convert UTC to teacher's timezone before comparing.
     */
    async validateSlotAvailability(teacherId: string, startTime: Date): Promise<boolean> {
        // Get teacher's timezone
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { id: teacherId },
            select: { timezone: true }
        });
        const teacherTimezone = teacherProfile?.timezone || 'UTC';

        // Get day and time in teacher's timezone (using correct utility)
        const dayOfWeek = this.getDayOfWeekFromZoned(startTime, teacherTimezone);
        const timeStr = formatInTimezone(startTime, teacherTimezone, 'HH:mm');

        // For date comparisons, normalize to start of day in teacher's timezone
        const dateStr = formatInTimezone(startTime, teacherTimezone, 'yyyy-MM-dd');
        const dateForComparison = new Date(dateStr + 'T00:00:00.000Z');

        // DEBUG LOGGING
        console.log(`[Validation DEBUG] Input UTC: ${startTime.toISOString()}`);
        console.log(`[Validation DEBUG] Teacher TZ: ${teacherTimezone}`);
        console.log(`[Validation DEBUG] Computed Day: ${dayOfWeek}, Time: ${timeStr}`);

        // Get ALL availability for this teacher to see what exists
        const allAvailability = await this.prisma.availability.findMany({
            where: { teacherId },
            select: { dayOfWeek: true, startTime: true, endTime: true }
        });
        console.log(`[Validation DEBUG] Teacher's availability:`, JSON.stringify(allAvailability));

        // 1. Check weekly availability exists
        const weeklySlot = await this.prisma.availability.findFirst({
            where: {
                teacherId,
                dayOfWeek: dayOfWeek as any,
                startTime: { lte: timeStr },
                endTime: { gt: timeStr }
            }
        });

        if (!weeklySlot) {
            console.log(`[Validation FAIL] No weekly slot for ${dayOfWeek} at ${timeStr}`);
            console.log(`[Validation FAIL] Expected: dayOfWeek=${dayOfWeek}, startTime<=${timeStr}, endTime>${timeStr}`);
            return false; // Teacher not available on this day/time weekly
        }

        // 2. Check for ALL_DAY exceptions
        const allDayException = await this.prisma.availabilityException.findFirst({
            where: {
                teacherId,
                type: 'ALL_DAY',
                startDate: { lte: dateForComparison },
                endDate: { gte: dateForComparison }
            }
        });

        if (allDayException) {
            return false; // Entire day is blocked
        }

        // 3. Check for PARTIAL_DAY exceptions
        const partialException = await this.prisma.availabilityException.findFirst({
            where: {
                teacherId,
                type: 'PARTIAL_DAY',
                startDate: { lte: dateForComparison },
                endDate: { gte: dateForComparison },
                startTime: { lte: timeStr },
                endTime: { gt: timeStr }
            }
        });

        if (partialException) {
            return false; // This specific time is blocked
        }

        // 4. Check for existing bookings (use UTC times directly for booking comparison)
        const existingBooking = await this.prisma.booking.findFirst({
            where: {
                teacherId,
                startTime: { lte: startTime },
                endTime: { gt: startTime },
                status: { in: ['SCHEDULED', 'PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'] as any }
            }
        });

        if (existingBooking) {
            return false; // Slot already booked
        }

        console.log(`[Validation] Slot available: ${dayOfWeek} at ${timeStr} (UTC: ${startTime.toISOString()})`);
        return true; // Slot is available!
    }

    /**
     * Get day of week from a date in a specific timezone
     * Uses formatInTimezone to get the correct day name
     */
    private getDayOfWeekFromZoned(date: Date, timezone: string): string {
        // Get the day name using formatInTimezone (e.g., "TUESDAY")
        const dayName = formatInTimezone(date, timezone, 'EEEE').toUpperCase();
        // Map to our enum format
        const dayMap: { [key: string]: string } = {
            'SUNDAY': 'SUNDAY',
            'MONDAY': 'MONDAY',
            'TUESDAY': 'TUESDAY',
            'WEDNESDAY': 'WEDNESDAY',
            'THURSDAY': 'THURSDAY',
            'FRIDAY': 'FRIDAY',
            'SATURDAY': 'SATURDAY'
        };
        return dayMap[dayName] || dayName;
    }

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
    async getCancellationEstimate(userId: string, userRole: string, bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { teacherProfile: true }
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
                teacherCompAmount: 0
            };
        }

        // If no payment yet (PENDING_TEACHER_APPROVAL or WAITING_FOR_PAYMENT), no funds involved
        if (['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'].includes(booking.status)) {
            return {
                canCancel: true,
                refundPercent: 100,
                refundAmount: 0,
                teacherCompAmount: 0,
                policy: null,
                hoursRemaining: null,
                message: 'لم يتم الدفع بعد - الإلغاء مجاني'
            };
        }

        // SCHEDULED booking - calculate based on policy
        const policy = booking.teacherProfile.cancellationPolicy;
        const paidAmount = Number(booking.price);
        const refund = this.calculateRefund(booking, policy, userRole);

        const hoursRemaining = Math.max(0,
            (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
        );

        return {
            canCancel: true,
            refundPercent: refund.percent,
            refundAmount: refund.amount,
            teacherCompAmount: paidAmount - refund.amount,
            policy,
            hoursRemaining: Math.round(hoursRemaining * 10) / 10,
            message: refund.message
        };
    }

    /**
     * Cancel booking (unified endpoint - role determines logic)
     */
    async cancelBooking(userId: string, userRole: string, bookingId: string, reason?: string) {
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Get booking with lock-like behavior (inside transaction)
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { teacherProfile: { include: { user: true } } }
            });

            if (!booking) {
                throw new NotFoundException('Booking not found');
            }

            // 2. Idempotency: If already cancelled, return existing state (skip notification)
            if (booking.status.startsWith('CANCELLED')) {
                return { updatedBooking: booking, recipientId: null, cancelledByRole: null };
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
                newStatus = 'CANCELLED_BY_ADMIN'; // Use existing status (or create CANCELLED_BY_TEACHER later)
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
                    const policy = booking.teacherProfile.cancellationPolicy;
                    const refund = this.calculateRefund(booking, policy, userRole);
                    refundPercent = refund.percent;
                }
            }

            // 5. Handle wallet settlement (only if payment was made)
            const paidAmount = Number(booking.price);
            if (booking.status === 'SCHEDULED' && paidAmount > 0) {
                refundAmount = (paidAmount * refundPercent) / 100;
                teacherCompAmount = paidAmount - refundAmount;

                // Settle via wallet
                await this.walletService.settleCancellation(
                    booking.bookedByUserId,
                    booking.teacherProfile.user.id,
                    bookingId,
                    paidAmount,
                    refundAmount,
                    teacherCompAmount
                );
            }

            // 6. Update booking with cancellation audit trail
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: newStatus as any,
                    cancelReason: reason || 'ملغى بواسطة المستخدم',
                    cancelledAt: new Date(),
                    cancelledBy,
                    refundPercent,
                    refundAmount,
                    teacherCompAmount,
                    cancellationPolicySnapshot: booking.status === 'SCHEDULED'
                        ? booking.teacherProfile.cancellationPolicy
                        : null
                }
            });

            // =====================================================
            // PACKAGE INTEGRATION: Cancel redemption if exists
            // =====================================================
            // Update PackageRedemption status to CANCELLED (no funds released)
            await tx.packageRedemption.updateMany({
                where: {
                    bookingId,
                    status: 'RESERVED' // Only cancel if not already released
                },
                data: { status: 'CANCELLED' }
            });

            // Return booking with extra context for notification
            return {
                updatedBooking,
                recipientId: userRole === 'TEACHER'
                    ? booking.bookedByUserId  // Notify parent if teacher cancelled
                    : booking.teacherProfile.user.id,  // Notify teacher if parent cancelled
                cancelledByRole: userRole
            };
        });

        // Notify the other party about cancellation (after transaction commits)
        // Skip if idempotent return (recipientId is null) or admin cancellation
        if (result.recipientId && result.cancelledByRole && result.cancelledByRole !== 'ADMIN') {
            const recipientLink = result.cancelledByRole === 'TEACHER'
                ? '/parent/bookings'
                : '/teacher/sessions';

            await this.notificationService.notifyUser({
                userId: result.recipientId,
                title: 'تم إلغاء الحجز',
                message: reason || 'تم إلغاء الحجز.',
                type: 'BOOKING_CANCELLED',
                link: recipientLink,
                dedupeKey: `BOOKING_CANCELLED:${bookingId}:${result.recipientId}`,
                metadata: { bookingId }
            });
        }

        return result.updatedBooking;
    }

    /**
     * Check if a user can cancel a booking
     */
    private canUserCancel(booking: any, userId: string, userRole: string): { allowed: boolean; reason?: string } {
        // Status check - common for all roles
        const cancellableStatuses = ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT', 'SCHEDULED'];
        if (!cancellableStatuses.includes(booking.status)) {
            return { allowed: false, reason: 'لا يمكن إلغاء هذا الحجز في حالته الحالية' };
        }

        // Can't cancel once session has started
        if (booking.status === 'SCHEDULED' && new Date(booking.startTime) <= new Date()) {
            return { allowed: false, reason: 'لا يمكن الإلغاء بعد بدء الجلسة' };
        }

        if (userRole === 'ADMIN') {
            return { allowed: true };
        }

        if (userRole === 'TEACHER') {
            // Teacher can only cancel their own bookings
            if (booking.teacherProfile.userId !== userId) {
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
    private calculateRefund(booking: any, policy: string, userRole: string): { percent: number; amount: number; message: string } {
        const paidAmount = Number(booking.price);

        // Teacher cancellation = always 100% refund
        if (userRole === 'TEACHER') {
            return { percent: 100, amount: paidAmount, message: 'إلغاء المعلم - استرداد كامل' };
        }

        // Grace period: booking created < 1 hour ago = 100% refund
        const createdAt = new Date(booking.createdAt);
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation < 1) {
            return { percent: 100, amount: paidAmount, message: 'ضمن فترة السماح - استرداد كامل' };
        }

        // Calculate hours until session
        const startTime = new Date(booking.startTime);
        const hoursUntilSession = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

        let percent: number;
        let message: string;

        switch (policy) {
            case 'FLEXIBLE':
                if (hoursUntilSession > 24) {
                    percent = 100;
                    message = 'قبل ٢٤ ساعة - استرداد كامل';
                } else {
                    percent = 50;
                    message = 'أقل من ٢٤ ساعة - استرداد ٥٠٪';
                }
                break;

            case 'MODERATE':
                if (hoursUntilSession > 48) {
                    percent = 100;
                    message = 'قبل ٤٨ ساعة - استرداد كامل';
                } else if (hoursUntilSession > 24) {
                    percent = 50;
                    message = 'بين ٢٤-٤٨ ساعة - استرداد ٥٠٪';
                } else {
                    percent = 0;
                    message = 'أقل من ٢٤ ساعة - لا استرداد';
                }
                break;

            case 'STRICT':
                if (hoursUntilSession > 72) {
                    percent = 100;
                    message = 'قبل ٧٢ ساعة - استرداد كامل';
                } else if (hoursUntilSession > 48) {
                    percent = 50;
                    message = 'بين ٤٨-٧٢ ساعة - استرداد ٥٠٪';
                } else {
                    percent = 0;
                    message = 'أقل من ٤٨ ساعة - لا استرداد';
                }
                break;

            default:
                // Default to FLEXIBLE if unknown
                percent = hoursUntilSession > 24 ? 100 : 50;
                message = 'سياسة افتراضية';
        }

        return { percent, amount: (paidAmount * percent) / 100, message };
    }
}
