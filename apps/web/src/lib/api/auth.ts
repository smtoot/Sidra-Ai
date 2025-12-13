import { api } from '../api';

export interface Student {
    id: string;
    name: string;
    grade?: string;
    gender?: string;
    dateOfBirth?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: 'PARENT' | 'TEACHER' | 'ADMIN';
    phoneNumber?: string;
    isVerified: boolean;
    parentProfile?: {
        id: string;
        students: Student[];
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
    }
};
