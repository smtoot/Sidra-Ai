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
    }
};
