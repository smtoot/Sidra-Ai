import { TeacherService } from './teacher.service';
import { UpdateTeacherProfileDto, CreateTeacherSubjectDto, CreateAvailabilityDto } from '@sidra/shared';
export declare class TeacherController {
    private readonly teacherService;
    constructor(teacherService: TeacherService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, dto: UpdateTeacherProfileDto): Promise<{
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
    addSubject(req: any, dto: CreateTeacherSubjectDto): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        curriculumId: string;
        pricePerHour: import("@prisma/client/runtime/library").Decimal;
        gradeLevels: string[];
    }>;
    removeSubject(req: any, id: string): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        curriculumId: string;
        pricePerHour: import("@prisma/client/runtime/library").Decimal;
        gradeLevels: string[];
    }>;
    setAvailability(req: any, dto: CreateAvailabilityDto): Promise<{
        id: string;
        teacherId: string;
        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
    }>;
    removeAvailability(req: any, id: string): Promise<{
        id: string;
        teacherId: string;
        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
    }>;
}
