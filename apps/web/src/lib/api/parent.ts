import { api } from '../api';

export interface Curriculum {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
}

export const parentApi = {
    getDashboardStats: async () => {
        const response = await api.get('/parent/dashboard');
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/parent/profile');
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.patch('/parent/profile', data);
        return response.data;
    },
    getChildren: async () => {
        const response = await api.get('/parent/children');
        return response.data;
    },
    addChild: async (data: { name: string; gradeLevel: string; schoolName?: string; curriculumId?: string }) => {
        const response = await api.post('/parent/children', data);
        return response.data;
    },
    updateChild: async (id: string, data: { name?: string; gradeLevel?: string; schoolName?: string; curriculumId?: string }) => {
        const response = await api.patch(`/parent/children/${id}`, data);
        return response.data;
    },
    getCurricula: async (): Promise<Curriculum[]> => {
        const response = await api.get('/parent/curricula');
        return response.data;
    }
};
