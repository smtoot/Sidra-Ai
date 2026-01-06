import { api } from '../api';

export interface Child {
    id: string;
    name: string;
    gradeLevel: string;
    schoolName?: string;
    curriculumId?: string;
    curriculum?: {
        id: string;
        code: string;
        nameAr: string;
        nameEn: string;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    role: 'PARENT' | 'TEACHER' | 'ADMIN' | 'STUDENT';
    phoneNumber?: string;
    isVerified: boolean;
    parentProfile?: {
        id: string;
        children: Child[];
    };
    teacherProfile?: {
        id: string;
        displayName: string;
        // Add other teacher fields if needed
        // Add other teacher fields if needed
    };
    studentProfile?: {
        id: string;
        gradeLevel?: string;
        curriculumId?: string;
        curriculum?: {
            id: string;
            nameAr: string;
            nameEn: string;
        };
    };
}

export const authApi = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    },
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/reset-password', { token, newPassword });
        return response.data;
    },
    markTourCompleted: async (): Promise<void> => {
        await api.post('/users/tour-completed');
    }
};
