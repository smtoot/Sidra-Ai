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
                    parent: { userId: user.id }
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
            studentUserId = user.id;
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

        // **VALIDATION**: Check if the slot is actually available
        const isAvailable = await this.validateSlotAvailability(
            dto.teacherId,
            new Date(dto.startTime)
        );

        if (!isAvailable) {
            throw new BadRequestException('هذا الموعد غير متاح. يرجى اختيار وقت آخر.');
        }

        // Create booking
        return this.prisma.booking.create({
            data: {
                teacherId: dto.teacherId,
                bookedByUserId: user.id,
                beneficiaryType,
                childId,
                studentUserId,

                subjectId: dto.subjectId,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                price: dto.price,
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
                child: true
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
                subject: true
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
                teacherProfile: true
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

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' }
        });
    }

    // --- Phase 2C: Payment Integration ---
    // (Existing payment methods are above)

    // --- Phase 3: Booking Validation ---

    /**
     * Validate that a time slot is actually available for booking
     * Checks: 1) Weekly availability, 2) Exceptions, 3) Existing bookings
     */
    async validateSlotAvailability(teacherId: string, startTime: Date): Promise<boolean> {
        const date = new Date(startTime);
        date.setHours(0, 0, 0, 0); // Normalize to start of day for date comparisons

        const dayOfWeek = this.getDayOfWeek(startTime);
        const timeStr = this.formatTime(startTime); // "HH:MM" format

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
            return false; // Teacher not available on this day/time weekly
        }

        // 2. Check for ALL_DAY exceptions
        const allDayException = await this.prisma.availabilityException.findFirst({
            where: {
                teacherId,
                type: 'ALL_DAY',
                startDate: { lte: date },
                endDate: { gte: date }
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
                startDate: { lte: date },
                endDate: { gte: date },
                startTime: { lte: timeStr },
                endTime: { gt: timeStr }
            }
        });

        if (partialException) {
            return false; // This specific time is blocked
        }

        // 4. Check for existing bookings
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

        return true; // Slot is available!
    }

    private getDayOfWeek(date: Date): string {
        const dayMap: { [key: number]: string } = {
            0: 'SUNDAY',
            1: 'MONDAY',
            2: 'TUESDAY',
            3: 'WEDNESDAY',
            4: 'THURSDAY',
            5: 'FRIDAY',
            6: 'SATURDAY'
        };
        return dayMap[date.getDay()];
    }

    private formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}
