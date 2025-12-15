import { api } from '../api';

export const adminApi = {
    // Teachers
    getPendingTeachers: async () => {
        const response = await api.get('/admin/teachers?status=PENDING');
        return response.data;
    },

    verifyTeacher: async (id: string) => {
        const response = await api.patch(`/admin/teachers/${id}/verify`);
        return response.data;
    },

    rejectTeacher: async (id: string) => {
        const response = await api.delete(`/admin/teachers/${id}/reject`);
        return response.data;
    },

    // Users
    getUsers: async (query?: string) => {
        const response = await api.get('/admin/users', { params: { query } });
        return response.data;
    },

    toggleBan: async (id: string) => {
        const response = await api.patch(`/admin/users/${id}/ban`);
        return response.data;
    },

    // CMS (Marketplace)
    getCurricula: async (all = false) => {
        const response = await api.get(`/marketplace/curricula${all ? '?all=true' : ''}`);
        return response.data;
    },
    createCurriculum: async (data: any) => {
        const response = await api.post('/marketplace/curricula', data);
        return response.data;
    },
    updateCurriculum: async (id: string, data: any) => {
        const response = await api.patch(`/marketplace/curricula/${id}`, data);
        return response.data;
    },
    deleteCurriculum: async (id: string) => {
        const response = await api.delete(`/marketplace/curricula/${id}`);
        return response.data;
    },

    getSubjects: async (all = false) => {
        const response = await api.get(`/marketplace/subjects${all ? '?all=true' : ''}`);
        return response.data;
    },
    createSubject: async (data: any) => {
        const response = await api.post('/marketplace/subjects', data);
        return response.data;
    },
    updateSubject: async (id: string, data: any) => {
        const response = await api.patch(`/marketplace/subjects/${id}`, data);
        return response.data;
    },
    deleteSubject: async (id: string) => {
        const response = await api.delete(`/marketplace/subjects/${id}`);
        return response.data;
    },

    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    }
};
