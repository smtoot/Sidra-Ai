
import { api } from '../api';

export const parentApi = {
    getDashboardStats: async () => {
        const response = await api.get('/parent/dashboard');
        return response.data;
    },
    getChildren: async () => {
        const response = await api.get('/parent/children');
        return response.data;
    },
    addChild: async (data: { name: string; gradeLevel: string }) => {
        const response = await api.post('/parent/children', data);
        return response.data;
    },
    updateChild: async (id: string, data: { name?: string; gradeLevel?: string }) => {
        const response = await api.patch(`/parent/children/${id}`, data);
        return response.data;
    }
};
