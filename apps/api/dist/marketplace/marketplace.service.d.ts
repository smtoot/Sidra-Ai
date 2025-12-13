import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto } from '@sidra/shared';
export declare class MarketplaceService {
    private prisma;
    constructor(prisma: PrismaService);
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
