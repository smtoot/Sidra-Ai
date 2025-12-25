import { api } from '../api';

export interface SearchFilters {
    subjectId?: string;
    curriculumId?: string;
    gradeLevelId?: string;
    maxPrice?: number;
}

export interface SearchResult {
    id: string; // TeacherSubject ID (the offer)
    pricePerHour: string;
    gradeLevels?: Array<{ // Added gradeLevels
        id: string;
        nameAr: string;
        nameEn: string;
    }>;
    teacherProfile: {
        id: string;
        slug: string | null; // Added slug
        displayName: string | null;
        bio: string | null;
        averageRating: number;
        totalReviews: number;
        education: string | null;
        yearsOfExperience: number | null;
    };
    subject: {
        id: string;
        nameAr: string;
        nameEn: string;
    };
    curriculum: {
        id: string;
        nameAr: string;
        nameEn: string;
    };
}

export const searchApi = {
    searchTeachers: async (filters: SearchFilters): Promise<SearchResult[]> => {
        const params = new URLSearchParams();
        if (filters.subjectId) params.append('subjectId', filters.subjectId);
        if (filters.curriculumId) params.append('curriculumId', filters.curriculumId);
        if (filters.gradeLevelId) params.append('gradeLevelId', filters.gradeLevelId);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

        const response = await api.get(`/marketplace/teachers?${params.toString()}`);
        return response.data;
    }
};
