import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '@sidra/shared';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createRequest(req: any, dto: CreateBookingDto): Promise<{
        parentProfile: {
            user: {
                id: string;
                email: string;
                passwordHash: string;
                role: import("@prisma/client").$Enums.UserRole;
                phoneNumber: string | null;
                isActive: boolean;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
        };
        teacherProfile: {
            user: {
                id: string;
                email: string;
                passwordHash: string;
                role: import("@prisma/client").$Enums.UserRole;
                phoneNumber: string | null;
                isActive: boolean;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            displayName: string | null;
            bio: string | null;
            yearsOfExperience: number | null;
            education: string | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            kycStatus: import("@prisma/client").$Enums.KYCStatus;
            kycRejectionReason: string | null;
            hasCompletedOnboarding: boolean;
            onboardingStep: number;
            cancellationPolicy: import("@prisma/client").$Enums.CancellationPolicy;
            encryptedMeetingLink: string | null;
            averageRating: number;
            totalReviews: number;
            totalSessions: number;
            userId: string;
        };
        student: {
            id: string;
            name: string;
            parentId: string;
            gradeLevel: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    }>;
    approveRequest(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    }>;
    rejectRequest(req: any, id: string, dto: UpdateBookingStatusDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    }>;
    getTeacherRequests(req: any): Promise<({
        parentProfile: {
            user: {
                id: string;
                email: string;
                passwordHash: string;
                role: import("@prisma/client").$Enums.UserRole;
                phoneNumber: string | null;
                isActive: boolean;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
        };
        student: {
            id: string;
            name: string;
            parentId: string;
            gradeLevel: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    })[]>;
    getTeacherSessions(req: any): Promise<({
        parentProfile: {
            user: {
                id: string;
                email: string;
                passwordHash: string;
                role: import("@prisma/client").$Enums.UserRole;
                phoneNumber: string | null;
                isActive: boolean;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
        };
        student: {
            id: string;
            name: string;
            parentId: string;
            gradeLevel: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    })[]>;
    getParentBookings(req: any): Promise<({
        teacherProfile: {
            user: {
                id: string;
                email: string;
                passwordHash: string;
                role: import("@prisma/client").$Enums.UserRole;
                phoneNumber: string | null;
                isActive: boolean;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            displayName: string | null;
            bio: string | null;
            yearsOfExperience: number | null;
            education: string | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            kycStatus: import("@prisma/client").$Enums.KYCStatus;
            kycRejectionReason: string | null;
            hasCompletedOnboarding: boolean;
            onboardingStep: number;
            cancellationPolicy: import("@prisma/client").$Enums.CancellationPolicy;
            encryptedMeetingLink: string | null;
            averageRating: number;
            totalReviews: number;
            totalSessions: number;
            userId: string;
        };
        student: {
            id: string;
            name: string;
            parentId: string;
            gradeLevel: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    })[]>;
    payForBooking(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    }>;
    markCompleted(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        subjectId: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.BookingStatus;
        parentId: string;
        meetingLink: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        cancelReason: string | null;
        studentId: string;
    }>;
}
