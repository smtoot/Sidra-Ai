import { api } from '../api';

export interface Child {
    id: string;
    name: string;
    gradeLevel: string; // Updated from grade to gradeLevel to match backend
    // gender/dob removed if not in backend MVP, checking usage.
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
    }
};
