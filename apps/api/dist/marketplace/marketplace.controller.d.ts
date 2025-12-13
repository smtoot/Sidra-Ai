import { MarketplaceService } from './marketplace.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto } from '@sidra/shared';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    createCurriculum(dto: CreateCurriculumDto): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
    findAllCurricula(all?: string): Promise<{
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
    removeCurriculum(id: string): Promise<{
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
    findAllSubjects(all?: string): Promise<{
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
    removeSubject(id: string): Promise<{
        id: string;
        isActive: boolean;
        nameAr: string;
        nameEn: string;
    }>;
}
