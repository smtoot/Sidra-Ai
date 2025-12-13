"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
let BookingService = class BookingService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async createRequest(parentUserId, dto) {
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
            include: { parent: { include: { user: true } } }
        });
        if (!student || student.parent.user.id !== parentUserId) {
            throw new common_1.ForbiddenException('Student does not belong to this parent');
        }
        const teacherSubject = await this.prisma.teacherSubject.findFirst({
            where: {
                teacherId: dto.teacherId,
                subjectId: dto.subjectId
            },
            include: { teacherProfile: true }
        });
        if (!teacherSubject) {
            throw new common_1.NotFoundException('Teacher does not teach this subject');
        }
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
    async approveRequest(teacherUserId, bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { teacherProfile: { include: { user: true } } }
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.teacherProfile.user.id !== teacherUserId) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        if (booking.status !== 'PENDING_TEACHER_APPROVAL') {
            throw new common_1.BadRequestException('Booking is not pending');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'WAITING_FOR_PAYMENT' }
        });
    }
    async rejectRequest(teacherUserId, bookingId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { teacherProfile: { include: { user: true } } }
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.teacherProfile.user.id !== teacherUserId) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        if (booking.status !== 'PENDING_TEACHER_APPROVAL') {
            throw new common_1.BadRequestException('Booking is not pending');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'REJECTED_BY_TEACHER',
                cancelReason: dto.cancelReason
            }
        });
    }
    async getTeacherRequests(teacherUserId) {
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });
        if (!teacherProfile)
            throw new common_1.NotFoundException('Teacher profile not found');
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
    async getTeacherSessions(teacherUserId) {
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId: teacherUserId }
        });
        if (!teacherProfile)
            throw new common_1.NotFoundException('Teacher profile not found');
        return this.prisma.booking.findMany({
            where: { teacherId: teacherProfile.id },
            include: {
                parentProfile: { include: { user: true } },
                student: true
            },
            orderBy: { startTime: 'desc' }
        });
    }
    async getParentBookings(parentUserId) {
        const parentProfile = await this.prisma.parentProfile.findUnique({
            where: { userId: parentUserId }
        });
        if (!parentProfile)
            throw new common_1.NotFoundException('Parent profile not found');
        return this.prisma.booking.findMany({
            where: { parentId: parentProfile.id },
            include: {
                teacherProfile: { include: { user: true } },
                student: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
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
    async payForBooking(parentUserId, bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                parentProfile: { include: { user: true } },
                teacherProfile: { include: { user: true } }
            }
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.parentProfile.user.id !== parentUserId) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        if (booking.status !== 'WAITING_FOR_PAYMENT') {
            throw new common_1.BadRequestException('Booking is not awaiting payment');
        }
        await this.walletService.lockFundsForBooking(parentUserId, bookingId, Number(booking.price));
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'SCHEDULED' }
        });
    }
    async markCompleted(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                parentProfile: { include: { user: true } },
                teacherProfile: { include: { user: true } }
            }
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== 'SCHEDULED') {
            throw new common_1.BadRequestException('Booking is not scheduled');
        }
        await this.walletService.releaseFundsOnCompletion(booking.parentProfile.user.id, booking.teacherProfile.user.id, bookingId, Number(booking.price), Number(booking.commissionRate));
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' }
        });
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], BookingService);
//# sourceMappingURL=booking.service.js.map