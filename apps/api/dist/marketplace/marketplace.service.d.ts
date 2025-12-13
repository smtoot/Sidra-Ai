import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto, SearchTeachersDto } from '@sidra/shared';
export declare class MarketplaceService {
    private prisma;
    constructor(prisma: PrismaService);
    searchTeachers(dto: SearchTeachersDto): Promise<({
        teacherProfile: {
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
    })[]>;
    createCurriculum(dto: CreateCurriculumDto): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    findAllCurricula(includeInactive?: boolean): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }[]>;
    findOneCurriculum(id: string): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    updateCurriculum(id: string, dto: UpdateCurriculumDto): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    softDeleteCurriculum(id: string): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    createSubject(dto: CreateSubjectDto): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    findAllSubjects(includeInactive?: boolean): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }[]>;
    findOneSubject(id: string): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    updateSubject(id: string, dto: UpdateSubjectDto): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    softDeleteSubject(id: string): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
}
