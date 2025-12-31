import { api } from '../api';
import { SearchSortBy } from '@sidra/shared';

export interface SearchFilters {
    subjectId?: string;
    curriculumId?: string;
    gradeLevelId?: string;
    maxPrice?: number;
    minPrice?: number;
    gender?: 'MALE' | 'FEMALE';
    sortBy?: SearchSortBy;
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
        profilePhotoUrl: string | null;
        introVideoUrl: string | null;
        gender: 'MALE' | 'FEMALE' | null;
        bio: string | null;
        averageRating: number;
        totalReviews: number;
        education: string | null;
        yearsOfExperience: number | null;
        applicationStatus: string;
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
    nextAvailableSlot?: {
        date: string;
        time: string;
        display: string;
    } | null;
}

export const searchApi = {
    searchTeachers: async (filters: SearchFilters): Promise<SearchResult[]> => {
        const params = new URLSearchParams();
        if (filters.subjectId) params.append('subjectId', filters.subjectId);
        if (filters.curriculumId) params.append('curriculumId', filters.curriculumId);
        if (filters.gradeLevelId) params.append('gradeLevelId', filters.gradeLevelId);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);

        const response = await api.get(`/marketplace/teachers?${params.toString()}`);
        return response.data;
    }
};
