import { api } from '../api';

export interface Curriculum {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
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
