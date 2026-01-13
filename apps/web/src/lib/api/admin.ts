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
    getUsers: async (role?: string, search?: string) => {
        const params: any = {};
        if (role) params.role = role;
        if (search) params.search = search;
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getUser: async (id: string) => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    updateUser: async (id: string, data: { email?: string; phoneNumber?: string; firstName?: string; lastName?: string }) => {
        const response = await api.patch(`/admin/users/${id}`, data);
        return response.data;
    },

    toggleBan: async (id: string) => {
        const response = await api.patch(`/admin/users/${id}/ban`);
        return response.data;
    },

    resetPassword: async (id: string) => {
        const response = await api.patch(`/admin/users/${id}/reset-password`);
        return response.data;
    },

    hardDeleteUser: async (id: string) => {
        const response = await api.delete(`/admin/users/${id}/permanent`);
        return response.data;
    },

    // Wallet Management
    adjustWalletBalance: async (userId: string, data: { amount: number; reason: string; type: 'CREDIT' | 'DEBIT' }) => {
        const response = await api.post(`/admin/wallets/${userId}/adjust`, data);
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
    hardDeleteCurriculum: async (id: string) => {
        const response = await api.delete(`/marketplace/curricula/${id}/permanent`);
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
    hardDeleteSubject: async (id: string) => {
        const response = await api.delete(`/marketplace/subjects/${id}/permanent`);
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
    hardDeleteStage: async (id: string) => {
        const response = await api.delete(`/marketplace/stages/${id}/permanent`);
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
    hardDeleteGrade: async (id: string) => {
        const response = await api.delete(`/marketplace/grades/${id}/permanent`);
        return response.data;
    },

    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    getFinancialAnalytics: async () => {
        const response = await api.get('/admin/analytics/financial');
        return response.data;
    },

    // Bookings
    getBookings: async (status?: string) => {
        const params = status && status !== 'ALL' ? `?status=${status}` : '';
        const response = await api.get(`/admin/bookings${params}`);
        return response.data;
    },

    getBookingById: async (id: string) => {
        const response = await api.get(`/admin/bookings/${id}`);
        return response.data;
    },

    cancelBooking: async (id: string, reason?: string) => {
        const response = await api.patch(`/admin/bookings/${id}/cancel`, { reason });
        return response.data;
    },

    completeBooking: async (id: string) => {
        const response = await api.post(`/admin/bookings/${id}/complete`);
        return response.data;
    },

    rescheduleBooking: async (id: string, newStartTime: Date) => {
        const response = await api.patch(`/admin/bookings/${id}/reschedule`, { newStartTime: newStartTime.toISOString() });
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
        meetingLinkAccessMinutesBefore?: number;
        maxVacationDays?: number;

        searchConfig?: any;
        cancellationPolicies?: any;
        jitsiConfig?: any;
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

    proposeInterviewSlots: async (id: string, timeSlots: { dateTime: string; meetingLink: string }[]) => {
        const response = await api.post(`/admin/teacher-applications/${id}/propose-interview-slots`, { timeSlots });
        return response.data;
    },

    getInterviewTimeSlots: async (id: string) => {
        const response = await api.get(`/admin/teacher-applications/${id}/interview-slots`);
        return response.data;
    },

    updateTeacherProfile: async (profileId: string, data: {
        displayName?: string;
        fullName?: string;
        bio?: string;
        introVideoUrl?: string;
        whatsappNumber?: string;
        city?: string;
        country?: string;
    }) => {
        const response = await api.patch(`/admin/teachers/${profileId}/profile`, data);
        return response.data;
    },

    // =================== PACKAGES & DEMOS ===================

    // Smart Pack Tier Management
    getPackageTiers: async () => {
        const response = await api.get('/admin/package-tiers');
        return response.data;
    },

    getAllPackageTiers: async () => {
        const response = await api.get('/admin/package-tiers/all');
        return response.data;
    },

    getPackageTierById: async (id: string) => {
        const response = await api.get(`/admin/package-tiers/${id}`);
        return response.data;
    },

    createPackageTier: async (data: {
        sessionCount: number;
        discountPercent: number;
        recurringRatio: number;
        floatingRatio: number;
        rescheduleLimit: number;
        durationWeeks: number;
        gracePeriodDays: number;
        nameAr?: string;
        nameEn?: string;
        descriptionAr?: string;
        descriptionEn?: string;
        isFeatured?: boolean;
        badge?: string;
        displayOrder?: number;
    }) => {
        const response = await api.post('/admin/package-tiers', data);
        return response.data;
    },

    updatePackageTier: async (id: string, data: {
        sessionCount?: number;
        discountPercent?: number;
        recurringRatio?: number;
        floatingRatio?: number;
        rescheduleLimit?: number;
        durationWeeks?: number;
        gracePeriodDays?: number;
        nameAr?: string;
        nameEn?: string;
        descriptionAr?: string;
        descriptionEn?: string;
        isFeatured?: boolean;
        badge?: string;
        displayOrder?: number;
        isActive?: boolean;
    }) => {
        const response = await api.patch(`/admin/package-tiers/${id}`, data);
        return response.data;
    },

    deletePackageTier: async (id: string) => {
        const response = await api.delete(`/admin/package-tiers/${id}`);
        return response.data;
    },

    getPackageStats: async () => {
        const response = await api.get('/admin/package-stats');
        return response.data;
    },

    // Student Packages (Purchased Packages)
    getStudentPackages: async (status?: string) => {
        const params = status && status !== 'ALL' ? `?status=${status}` : '';
        const response = await api.get(`/admin/student-packages${params}`);
        return response.data;
    },

    getStudentPackageById: async (id: string) => {
        const response = await api.get(`/admin/student-packages/${id}`);
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
    },

    // --- Team Management ---
    getTeamConfig: async () => {
        const response = await api.get('/admin/team/config');
        return response.data;
    },

    getTeamMembers: async () => {
        const response = await api.get('/admin/team');
        return response.data;
    },

    getTeamMember: async (id: string) => {
        const response = await api.get(`/admin/team/${id}`);
        return response.data;
    },

    createTeamMember: async (data: {
        email: string;
        phoneNumber: string;
        password: string;
        role: string;
        firstName?: string;
        lastName?: string;
        permissionOverrides?: { add?: string[]; remove?: string[] };
    }) => {
        const response = await api.post('/admin/team', data);
        return response.data;
    },

    updateTeamMemberPermissions: async (id: string, overrides: { add?: string[]; remove?: string[] }) => {
        const response = await api.patch(`/admin/team/${id}/permissions`, overrides);
        return response.data;
    },

    deactivateTeamMember: async (id: string) => {
        const response = await api.delete(`/admin/team/${id}`);
        return response.data;
    },

    getMyPermissions: async () => {
        const response = await api.get('/admin/team/me/permissions');
        return response.data;
    },

    // =================== EMAIL PREVIEWS ===================

    getEmailTemplates: async () => {
        const response = await api.get('/admin/emails/templates');
        return response.data;
    },

    getEmailPreview: async (templateId: string) => {
        const response = await api.get(`/admin/emails/preview/${templateId}`);
        return response.data;
    },

    // =================== ADVANCED ANALYTICS ===================

    getStudentAnalytics: async (filters: {
        curriculumId?: string;
        gradeLevel?: string;
        schoolName?: string;
        city?: string;
        country?: string;
        hasBookings?: boolean;
        hasPackages?: boolean;
        dateFrom?: string;
        dateTo?: string;
    } = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/admin/analytics/students?${params.toString()}`);
        return response.data;
    },

    getTeacherAnalytics: async (filters: {
        subjectId?: string;
        curriculumId?: string;
        gradeLevelId?: string;
        applicationStatus?: string;
        city?: string;
        country?: string;
        minRating?: number;
        minExperience?: number;
        hasBookings?: boolean;
        isOnVacation?: boolean;
        dateFrom?: string;
        dateTo?: string;
    } = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/admin/analytics/teachers?${params.toString()}`);
        return response.data;
    },

    getBookingAnalytics: async (filters: {
        subjectId?: string;
        curriculumId?: string;
        teacherId?: string;
        status?: string;
        beneficiaryType?: string;
        minPrice?: number;
        maxPrice?: number;
        hasRating?: boolean;
        hasHomework?: boolean;
        dateFrom?: string;
        dateTo?: string;
        groupBy?: 'subject' | 'curriculum' | 'teacher' | 'status' | 'day' | 'week' | 'month';
    } = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/admin/analytics/bookings?${params.toString()}`);
        return response.data;
    },

    getParentAnalytics: async (filters: {
        city?: string;
        country?: string;
        minChildren?: number;
        hasBookings?: boolean;
        hasPackages?: boolean;
        dateFrom?: string;
        dateTo?: string;
    } = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/admin/analytics/parents?${params.toString()}`);
        return response.data;
    },

    getAnalyticsFilterOptions: async () => {
        const response = await api.get('/admin/analytics/filter-options');
        return response.data;
    },

    exportAnalytics: async (
        type: 'students' | 'teachers' | 'bookings' | 'parents',
        format: 'csv' | 'json' = 'csv',
        filters: Record<string, string> = {}
    ) => {
        const params = new URLSearchParams({ type, format, ...filters });
        const response = await api.get(`/admin/analytics/export?${params.toString()}`);
        return response.data;
    }
};
