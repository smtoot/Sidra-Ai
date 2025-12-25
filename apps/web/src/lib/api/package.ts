import { api } from '../api';

// =====================================================
// TYPES
// =====================================================

export interface PackageTier {
    id: string;
    sessionCount: number;
    discountPercent: number;
    displayOrder: number;
    isActive: boolean;
}

export interface StudentPackage {
    id: string;
    readableId?: string; // e.g. "PKG-2412-1234"
    payerId: string;
    studentId: string;
    teacherId: string;
    subjectId: string;
    sessionCount: number;
    sessionsUsed: number;
    originalPricePerSession: number;
    discountedPricePerSession: number;
    totalPaid: number;
    escrowRemaining: number;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    expiresAt: string;
    purchasedAt: string;
    teacher: {
        displayName: string;
        profilePhotoUrl: string | null;
        userId?: string;
    };
    subject: {
        nameAr: string;
        nameEn: string;
    };
    redemptions?: Array<{
        id: string;
        bookingId: string;
        createdAt: string;
        booking: {
            startTime?: string;
            status: string;
            childId?: string;
            child?: { id: string; name: string };
        };
    }>;
}

export interface DemoEligibility {
    allowed: boolean;
    reason?: 'ALREADY_USED' | 'PENDING_EXISTS' | 'DEMO_DISABLED' | 'NOT_ELIGIBLE';
}

// =====================================================
// API METHODS
// =====================================================

export const packageApi = {
    // Get available package tiers
    getTiers: async (): Promise<PackageTier[]> => {
        const response = await api.get('/packages/tiers');
        return response.data;
    },

    // Purchase a package
    purchasePackage: async (data: {
        studentId: string;
        teacherId: string;
        subjectId: string;
        tierId: string;
    }): Promise<StudentPackage> => {
        const response = await api.post('/packages/purchase', data);
        return response.data;
    },

    // Get user's packages
    getMyPackages: async (): Promise<StudentPackage[]> => {
        const response = await api.get('/packages/my');
        return response.data;
    },

    // Get package by ID
    getPackageById: async (id: string): Promise<StudentPackage> => {
        const response = await api.get(`/packages/${id}`);
        return response.data;
    },

    // Cancel a package
    cancelPackage: async (id: string): Promise<void> => {
        await api.post(`/packages/${id}/cancel`);
    },

    // Schedule a session from a package
    scheduleSession: async (packageId: string, data: {
        startTime: string;
        endTime: string;
        timezone: string;
    }): Promise<any> => {
        const response = await api.post(`/packages/${packageId}/schedule-session`, data);
        return response.data;
    },

    // Check demo eligibility
    checkDemoEligibility: async (teacherId: string): Promise<DemoEligibility> => {
        const response = await api.get(`/packages/demo/check/${teacherId}`);
        return response.data;
    },

    // Check if teacher has demo enabled
    isTeacherDemoEnabled: async (teacherId: string): Promise<boolean> => {
        const response = await api.get(`/packages/demo/teacher/${teacherId}`);
        return response.data.demoEnabled;
    },

    // Get user's active package for specific teacher+subject
    getActivePackageForTeacher: async (teacherId: string, subjectId: string): Promise<StudentPackage | null> => {
        const packages = await packageApi.getMyPackages();
        return packages.find(pkg =>
            pkg.teacherId === teacherId &&
            pkg.subjectId === subjectId &&
            pkg.status === 'ACTIVE' &&
            pkg.sessionsUsed < pkg.sessionCount
        ) || null;
    }
};
