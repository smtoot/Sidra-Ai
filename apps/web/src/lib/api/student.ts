import { api } from '../api';

export interface GradeLevel {
    id: string;
    stageId: string;
    nameAr: string;
    nameEn: string;
    code: string;
    sequence: number;
}

export interface EducationalStage {
    id: string;
    curriculumId: string;
    nameAr: string;
    nameEn: string;
    sequence: number;
    grades: GradeLevel[];
}

export interface Curriculum {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    stages?: EducationalStage[];
}

export const studentApi = {
    getDashboardStats: async () => {
        const response = await api.get('/student/dashboard');
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/student/profile');
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.patch('/student/profile', data);
        return response.data;
    },
    getCurricula: async (): Promise<Curriculum[]> => {
        const response = await api.get('/student/curricula');
        return response.data;
    },
    // Booking related endpoints can be added here or in booking.ts
};
