import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from '../src/booking/booking.service';
import { WalletService } from '../src/wallet/wallet.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationService } from '../src/notification/notification.service';
import { DemoService } from '../src/package/demo.service';
import { PackageService } from '../src/package/package.service';
import { TeacherService } from '../src/teacher/teacher.service';
import { EscrowSchedulerService } from '../src/booking/escrow-scheduler.service';
import { SystemSettingsService } from '../src/admin/system-settings.service'; // Added
import { BadRequestException, ForbiddenException } from '@nestjs/common';

// Mocks
const mockPrisma = {
    booking: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
    },
    wallet: { update: jest.fn() },
    transaction: { create: jest.fn() },
    teacherProfile: { findUnique: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
};

const mockTeacherService = {
    isSlotAvailable: jest.fn(),
    getProfile: jest.fn(),
};

const mockWalletService = {
    lockFundsForBooking: jest.fn(),
    releaseFundsOnCompletion: jest.fn(),
    getBalance: jest.fn(),
};

const mockNotificationService = {
    notifyUser: jest.fn(),
};

const mockSystemSettingsService = { getSettings: jest.fn() }; // Mock

describe('AdminBookingControl Integration', () => {
    let bookingService: BookingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookingService,
                EscrowSchedulerService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: WalletService, useValue: mockWalletService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: TeacherService, useValue: mockTeacherService },
                { provide: DemoService, useValue: {} },
                { provide: PackageService, useValue: {} },
                { provide: SystemSettingsService, useValue: mockSystemSettingsService }, // Added
            ],
        }).compile();

        bookingService = module.get<BookingService>(BookingService);
        jest.clearAllMocks();
    });

    describe('Admin Reschedule', () => {
        it('should reschedule booking when teacher is available and no conflict exists', async () => {
            const bookingId = 'booking-1';
            const oldStart = new Date('2025-01-01T10:00:00Z');
            const oldEnd = new Date('2025-01-01T11:00:00Z');
            const newStart = new Date('2025-01-02T15:00:00Z');

            mockPrisma.booking.findUnique.mockResolvedValue({
                id: bookingId,
                teacherId: 'teacher-1',
                startTime: oldStart,
                endTime: oldEnd,
                teacherProfile: {
                    userId: 'teacher-user-1',
                    timezone: 'UTC',
                    user: { id: 'teacher-user-1' } // Needed for notification
                },
                bookedByUser: { id: 'student-1' },
            });

            // Mock Availability: Available
            mockTeacherService.isSlotAvailable.mockResolvedValue(true);
            // Mock Conflict: None
            mockPrisma.booking.findFirst.mockResolvedValue(null);

            mockPrisma.booking.update.mockResolvedValue({ id: bookingId, status: 'SCHEDULED' });

            await bookingService.adminReschedule(bookingId, newStart);

            // Verify Teacher Availability logic called
            expect(mockTeacherService.isSlotAvailable).toHaveBeenCalledWith('teacher-1', newStart);

            // Verify DB Update
            expect(mockPrisma.booking.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: bookingId },
                    data: expect.objectContaining({
                        rescheduledByRole: 'ADMIN',
                        rescheduleCount: { increment: 1 },
                    })
                })
            );
        });

        it('should throw BadRequest if teacher is NOT available', async () => {
            const bookingId = 'booking-1';
            mockPrisma.booking.findUnique.mockResolvedValue({
                id: bookingId,
                teacherId: 'teacher-1',
                startTime: new Date(),
                endTime: new Date(),
                teacherProfile: { userId: 't-1', timezone: 'UTC', user: { id: 't-1' } },
                bookedByUser: { id: 's-1' },
            });

            // Mock Unavailable
            mockTeacherService.isSlotAvailable.mockResolvedValue(false);

            await expect(bookingService.adminReschedule(bookingId, new Date()))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('Admin Force Complete', () => {
        it('should allow ADMIN to confirm session even if not owner', async () => {
            const bookingId = 'booking-1';
            const adminId = 'admin-1';

            // Booking owned by student-1
            const booking = {
                id: bookingId,
                bookedByUserId: 'student-1', // Different from adminId
                status: 'PENDING_CONFIRMATION',
                teacherProfile: { userId: 'teacher-1', user: { id: 'teacher-1', email: 't@t.com' } },
                include: { teacherProfile: true }, // Mock include payload
            };

            mockPrisma.booking.findUnique.mockResolvedValue(booking);
            mockPrisma.booking.update.mockResolvedValue({ status: 'COMPLETED' });

            // Call as ADMIN
            await bookingService.confirmSessionEarly(adminId, bookingId, undefined, 'ADMIN');

            // Verify no ForbiddeException
            expect(mockPrisma.booking.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: bookingId },
                    data: expect.objectContaining({ status: 'COMPLETED' })
                })
            );
        });

        it('should BLOCK non-owner if role is not ADMIN', async () => {
            const bookingId = 'booking-1';
            const intruderId = 'hacker-1';

            // Booking owned by student-1
            mockPrisma.booking.findUnique.mockResolvedValue({
                id: bookingId,
                bookedByUserId: 'student-1',
                teacherProfile: { userId: 't-1' },
                status: 'PENDING_CONFIRMATION'
            });

            // Call as intruder (default role STUDENT)
            await expect(bookingService.confirmSessionEarly(intruderId, bookingId))
                .rejects.toThrow(ForbiddenException);
        });
    });

});
