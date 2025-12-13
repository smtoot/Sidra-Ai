import { PrismaService } from '../prisma/prisma.service';
import { UpdateTeacherProfileDto, CreateTeacherSubjectDto, CreateAvailabilityDto } from '@sidra/shared';
export declare class TeacherService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        availability: {
            id: string;
            teacherId: string;
            dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
            startTime: string;
            endTime: string;
            isRecurring: boolean;
        }[];
        subjects: ({
            curriculum: {
                id: string;
                isActive: boolean;
                nameAr: string;
                nameEn: string;
            };
            subject: {
                id: string;
                isActive: boolean;
                nameAr: string;
                nameEn: string;
            };
        } & {
            id: string;
            teacherId: string;
            subjectId: string;
            curriculumId: string;
            pricePerHour: import("@prisma/client/runtime/library").Decimal;
            gradeLevels: string[];
        })[];
        documents: {
            id: string;
            teacherId: string;
            type: import("@prisma/client").$Enums.DocumentType;
            fileName: string;
            fileUrl: string;
            uploadedAt: Date;
        }[];
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
    }>;
    updateProfile(userId: string, dto: UpdateTeacherProfileDto): Promise<{
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
    }>;
    addSubject(userId: string, dto: CreateTeacherSubjectDto): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        curriculumId: string;
        pricePerHour: import("@prisma/client/runtime/library").Decimal;
        gradeLevels: string[];
    }>;
    removeSubject(userId: string, subjectId: string): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        curriculumId: string;
        pricePerHour: import("@prisma/client/runtime/library").Decimal;
        gradeLevels: string[];
    }>;
    setAvailability(userId: string, dto: CreateAvailabilityDto): Promise<{
        id: string;
        teacherId: string;
        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
    }>;
    removeAvailability(userId: string, availabilityId: string): Promise<{
        id: string;
        teacherId: string;
        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
    }>;
    getOnboardingProgress(userId: string): Promise<{
        hasCompletedOnboarding: boolean;
        step: number;
    }>;
}
