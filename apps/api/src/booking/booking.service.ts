import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '@sidra/shared';

@Injectable()
export class BookingService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService
    ) { }

    // Parent creates a booking request
    async createRequest(parentUserId: string, dto: CreateBookingDto) {
        // Verify parent owns the student
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
            include: { parent: { include: { user: true } } }
        });

        if (!student || student.parent.user.id !== parentUserId) {
            throw new ForbiddenException('Student does not belong to this parent');
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

        // Create booking
        return this.prisma.booking.create({
            data: {
                teacherId: dto.teacherId,
                parentId: student.parentId,
                studentId: dto.studentId,
                subjectId: dto.subjectId,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                price: dto.price,
                meetingLink: teacherSubject.teacherProfile.encryptedMeetingLink,
                status: 'PENDING_TEACHER_APPROVAL'
            },
            include: {
                teacherProfile: { include: { user: true } },
                parentProfile: { include: { user: true } },
                student: true
            }
        });
    }

    // Teacher approves a booking
    async approveRequest(teacherUserId: string, bookingId: string) {
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

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'WAITING_FOR_PAYMENT' }
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

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'REJECTED_BY_TEACHER',
                cancelReason: dto.cancelReason
            }
        });
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
                parentProfile: { include: { user: true } },
                student: true
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
                parentProfile: { include: { user: true } },
                student: true
            },
            orderBy: { startTime: 'desc' }
        });
    }

    // Get parent's bookings
    async getParentBookings(parentUserId: string) {
        const parentProfile = await this.prisma.parentProfile.findUnique({
            where: { userId: parentUserId }
        });

        if (!parentProfile) throw new NotFoundException('Parent profile not found');

        return this.prisma.booking.findMany({
            where: { parentId: parentProfile.id },
            include: {
                teacherProfile: { include: { user: true } },
                student: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Cron job: Expire old pending requests (24 hours)
    async expireOldRequests() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await this.prisma.booking.updateMany({
            where: {
                status: 'PENDING_TEACHER_APPROVAL',
                createdAt: { lt: cutoff }
            },
            data: { status: 'EXPIRED' }
        });

        return { expired: result.count };
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
                parentProfile: { include: { user: true } },
                teacherProfile: { include: { user: true } }
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.parentProfile.user.id !== parentUserId) {
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
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'SCHEDULED' }
        });
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
                parentProfile: { include: { user: true } },
                teacherProfile: { include: { user: true } }
            }
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== 'SCHEDULED') {
            throw new BadRequestException('Booking is not scheduled');
        }

        // Release funds to teacher atomically
        await this.walletService.releaseFundsOnCompletion(
            booking.parentProfile.user.id,
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
}
