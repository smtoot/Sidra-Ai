import { api } from '../api';
import { CreateCurriculumDto, CreateSubjectDto } from '@sidra/shared';

export interface TeacherQualification {
    id: string;
    degreeName: string;
    institution: string;
    fieldOfStudy: string | null;
    status: 'IN_PROGRESS' | 'GRADUATED' | 'INCOMPLETE';
    graduationYear: number | null;
    startDate: string | null;
    endDate: string | null;
    verified: boolean;
}

export interface TeacherSkillPublic {
    id: string;
    name: string;
    category: 'TEACHING_METHOD' | 'TECHNOLOGY' | 'SOFT_SKILL' | 'SUBJECT_SPECIFIC' | null;
    proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface TeacherWorkExperiencePublic {
    id: string;
    title: string;
    organization: string;
    experienceType: 'TEACHING' | 'TUTORING' | 'CURRICULUM_DEVELOPMENT' | 'EDUCATIONAL_LEADERSHIP' | 'OTHER';
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
    subjects: string[];
}

export interface TeacherPublicProfile {
    id: string;
    userId: string;
    displayName: string | null;
    profilePhotoUrl: string | null;
    introVideoUrl: string | null; // <-- Add video URL
    bio: string | null;
    averageRating: number;
    totalReviews: number;
    totalSessions: number;
    education: string | null;
    yearsOfExperience: number | null;
    gender: string | null;
    globalSettings: {
        packagesEnabled: boolean;
        demosEnabled: boolean;
    };
    teacherSettings: {
        demoEnabled: boolean;
        packagesEnabled: boolean;
    };
    packageTiers: Array<{
        id: string;
        sessionCount: number;
        discountPercent: number;
    }>;
    subjects: Array<{
        id: string;
        pricePerHour: string;
        gradeLevels: string[];
        grades: Array<{
            id: string;
            nameAr: string;
            nameEn: string;
            code: string;
            stageNameAr: string;
            stageNameEn: string;
        }>;
        subject: { id: string; nameAr: string; nameEn: string };
        curriculum: { id: string; nameAr: string; nameEn: string };
    }>;
    qualifications: TeacherQualification[];
    skills: TeacherSkillPublic[];
    workExperiences: TeacherWorkExperiencePublic[];
    availability: Array<{
        id: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
    }>;
    applicationStatus: 'DRAFT' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'INTERVIEW_SCHEDULED' | 'APPROVED' | 'REJECTED';
    teachingApproach: {
        text: string | null;
        tags: Array<{ id: string; labelAr: string }>;
    } | null;
    isFavorited?: boolean;
    // Vacation Mode
    isOnVacation?: boolean;
    vacationEndDate?: string | null;
}

export interface GradeLevel {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
}

export interface EducationalStage {
    id: string;
    nameAr: string;
    nameEn: string;
    grades: GradeLevel[];
}

export interface CurriculumHierarchy {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    stages: EducationalStage[];
}

export interface Curriculum {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    isActive: boolean;
}

export interface Subject {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    isActive: boolean;
}

export interface PlatformConfig {
    defaultSessionDurationMinutes: number;
    allowedSessionDurations: number[];
    searchConfig?: {
        enableGenderFilter?: boolean;
        enablePriceFilter?: boolean;
    };
}

export const marketplaceApi = {
    getPlatformConfig: async (): Promise<PlatformConfig> => {
        const response = await api.get('/marketplace/config');
        return response.data;
    },
    getCurricula: async (): Promise<Curriculum[]> => {
        const response = await api.get('/marketplace/curricula');
        return response.data;
    },
    getCurriculumHierarchy: async (id: string): Promise<CurriculumHierarchy> => {
        const response = await api.get(`/curricula/${id}/hierarchy`);
        return response.data;
    },
    getSubjects: async (): Promise<Subject[]> => {
        const response = await api.get('/marketplace/subjects');
        return response.data;
    },
    getTeacherProfile: async (idOrSlug: string): Promise<TeacherPublicProfile> => {
        const response = await api.get(`/marketplace/teachers/${idOrSlug}/profile`);
        return response.data;
    },
    getAvailableSlots: async (teacherId: string, date: string, userTimezone?: string) => {
        const params = new URLSearchParams({ date });
        if (userTimezone) params.append('userTimezone', userTimezone);
        const response = await api.get(`/marketplace/teachers/${teacherId}/available-slots?${params.toString()}`);
        return response.data;
    },
    getAvailabilityCalendar: async (teacherId: string, month: string, subjectId?: string): Promise<AvailabilityCalendar> => {
        const params = new URLSearchParams({ month });
        if (subjectId) params.append('subjectId', subjectId);
        const response = await api.get(`/marketplace/teachers/${teacherId}/availability-calendar?${params.toString()}`);
        return response.data;
    },
    getTeacherRatings: async (teacherId: string, page: number = 1, limit: number = 10): Promise<TeacherRatingsResponse> => {
        const response = await api.get(`/marketplace/teachers/${teacherId}/ratings?page=${page}&limit=${limit}`);
        return response.data;
    },
    getNextAvailableSlot: async (teacherId: string): Promise<NextAvailableSlot | null> => {
        try {
            const response = await api.get(`/marketplace/teachers/${teacherId}/next-available`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch next available slot:', error);
            return null;
        }
    },
};

export interface AvailabilityCalendar {
    availableDates: string[];  // ["2025-01-15", "2025-01-16", ...]
    fullyBookedDates: string[];  // ["2025-01-14", ...]
    nextAvailableSlot: {
        date: string;
        time: string;
        startTimeUtc?: string; // Added for timezone handling
        display: string;  // "Tomorrow at 3pm"
    } | null;
}

export interface TeacherRating {
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
    raterType: string;
}

export interface TeacherRatingsResponse {
    ratings: TeacherRating[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface NextAvailableSlot {
    date: string;  // ISO date string
    time: string;  // Time string
    startTimeUtc?: string; // User-friendly UTC time
    display: string;  // Human-readable Arabic display (e.g., "غداً الساعة 3م")
}
