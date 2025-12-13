import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '@sidra/shared';
export declare class BookingService {
    private prisma;
    private walletService;
    constructor(prisma: PrismaService, walletService: WalletService);
    createRequest(parentUserId: string, dto: CreateBookingDto): Promise<{
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
    approveRequest(teacherUserId: string, bookingId: string): Promise<{
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
    rejectRequest(teacherUserId: string, bookingId: string, dto: UpdateBookingStatusDto): Promise<{
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
    getTeacherRequests(teacherUserId: string): Promise<({
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
    getTeacherSessions(teacherUserId: string): Promise<({
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
    getParentBookings(parentUserId: string): Promise<({
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
    expireOldRequests(): Promise<{
        expired: number;
    }>;
    payForBooking(parentUserId: string, bookingId: string): Promise<{
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
    markCompleted(bookingId: string): Promise<{
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
