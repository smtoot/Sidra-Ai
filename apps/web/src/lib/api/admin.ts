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

    // --- Stages ---
    getStages: async (curriculumId?: string, all = false) => {
        let url = `/marketplace/stages?`;
        if (curriculumId) url += `curriculumId=${curriculumId}&`;
        if (all) url += `all=true`;
        const response = await api.get(url);
        return response.data;
    },
    createStage: async (data: { curriculumId: string; nameAr: string; nameEn: string; sequence: number }) => {
        const response = await api.post('/marketplace/stages', data);
        return response.data;
    },
    updateStage: async (id: string, data: any) => {
        const response = await api.patch(`/marketplace/stages/${id}`, data);
        return response.data;
    },
    deleteStage: async (id: string) => {
        const response = await api.delete(`/marketplace/stages/${id}`);
        return response.data;
    },

    // --- Grades ---
    getGrades: async (stageId?: string, all = false) => {
        let url = `/marketplace/grades?`;
        if (stageId) url += `stageId=${stageId}&`;
        if (all) url += `all=true`;
        const response = await api.get(url);
        return response.data;
    },
    createGrade: async (data: { stageId: string; nameAr: string; nameEn: string; code: string; sequence: number }) => {
        const response = await api.post('/marketplace/grades', data);
        return response.data;
    },
    updateGrade: async (id: string, data: any) => {
        const response = await api.patch(`/marketplace/grades/${id}`, data);
        return response.data;
    },
    deleteGrade: async (id: string) => {
        const response = await api.delete(`/marketplace/grades/${id}`);
        return response.data;
    },

    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    // Bookings
    getBookings: async (status?: string) => {
        const params = status && status !== 'ALL' ? `?status=${status}` : '';
        const response = await api.get(`/admin/bookings${params}`);
        return response.data;
    },

    cancelBooking: async (id: string, reason?: string) => {
        const response = await api.patch(`/admin/bookings/${id}/cancel`, { reason });
        return response.data;
    },

    completeBooking: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/complete`);
        return response.data;
    },

    // =================== DISPUTES ===================

    getDisputes: async (status?: string) => {
        const params = status && status !== 'ALL' ? `?status=${status}` : '';
        const response = await api.get(`/admin/disputes${params}`);
        return response.data;
    },

    getDisputeById: async (id: string) => {
        const response = await api.get(`/admin/disputes/${id}`);
        return response.data;
    },

    resolveDispute: async (
        id: string,
        resolutionType: 'DISMISSED' | 'TEACHER_WINS' | 'STUDENT_WINS' | 'SPLIT',
        resolutionNote: string,
        splitPercentage?: number
    ) => {
        const response = await api.patch(`/admin/disputes/${id}/resolve`, {
            resolutionType,
            resolutionNote,
            splitPercentage
        });
        return response.data;
    },

    markDisputeUnderReview: async (id: string) => {
        const response = await api.patch(`/admin/disputes/${id}/review`);
        return response.data;
    },

    // =================== SYSTEM SETTINGS ===================

    getSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },

    updateSettings: async (data: {
        platformFeePercent?: number;
        autoReleaseHours?: number;
        paymentWindowHours?: number;
        minHoursBeforeSession?: number;
        packagesEnabled?: boolean;
        demosEnabled?: boolean;
        maxPricePerHour?: number;
        defaultSessionDurationMinutes?: number;
        allowedSessionDurations?: number[];
    }) => {
        const response = await api.patch('/admin/settings', data);
        return response.data;
    },

    // =================== AUDIT LOGS ===================

    getAuditLogs: async (params: { page?: number; limit?: number; action?: string; actorId?: string }) => {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },

    // =================== TEACHER APPLICATIONS ===================

    getTeacherApplications: async (status?: string) => {
        const params = status && status !== 'ALL' ? `?status=${status}` : '';
        const response = await api.get(`/admin/teacher-applications${params}`);
        return response.data;
    },

    getTeacherApplication: async (id: string) => {
        const response = await api.get(`/admin/teacher-applications/${id}`);
        return response.data;
    },

    approveApplication: async (id: string) => {
        const response = await api.patch(`/admin/teacher-applications/${id}/approve`);
        return response.data;
    },

    rejectApplication: async (id: string, reason: string) => {
        const response = await api.patch(`/admin/teacher-applications/${id}/reject`, { reason });
        return response.data;
    },

    requestChanges: async (id: string, reason: string) => {
        const response = await api.patch(`/admin/teacher-applications/${id}/request-changes`, { reason });
        return response.data;
    },

    requestInterview: async (id: string) => {
        const response = await api.patch(`/admin/teacher-applications/${id}/request-interview`);
        return response.data;
    },

    scheduleInterview: async (id: string, datetime: string, link: string) => {
        const response = await api.patch(`/admin/teacher-applications/${id}/schedule-interview`, { datetime, link });
        return response.data;
    },

    // =================== PACKAGES & DEMOS ===================

    getPackageTiers: async () => {
        const response = await api.get('/packages/admin/tiers');
        return response.data;
    },

    createPackageTier: async (data: { sessionCount: number; discountPercent: number; displayOrder: number }) => {
        const response = await api.post('/packages/tiers', data);
        return response.data;
    },

    updatePackageTier: async (id: string, data: { isActive?: boolean; displayOrder?: number; discountPercent?: number }) => {
        const response = await api.patch(`/packages/tiers/${id}`, data);
        return response.data;
    },

    deletePackageTier: async (id: string) => {
        const response = await api.delete(`/packages/tiers/${id}`);
        return response.data;
    },

    getDemoStats: async () => {
        const response = await api.get('/packages/admin/stats');
        return response.data;
    },

    getDemoSessions: async () => {
        const response = await api.get('/packages/admin/demo-sessions');
        return response.data;
    },

    // =================== TEACHING APPROACH TAGS ===================

    getTeachingTags: async () => {
        const response = await api.get('/admin/tags');
        return response.data;
    },

    createTeachingTag: async (data: { labelAr: string; sortOrder: number }) => {
        const response = await api.post('/admin/tags', data);
        return response.data;
    },

    updateTeachingTag: async (id: string, data: { labelAr?: string; sortOrder?: number; isActive?: boolean }) => {
        const response = await api.patch(`/admin/tags/${id}`, data);
        return response.data;
    },

    deleteTeachingTag: async (id: string) => {
        const response = await api.delete(`/admin/tags/${id}`);
        return response.data;
    }
};
