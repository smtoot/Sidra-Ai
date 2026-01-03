import { api } from '../api';
import type { RecurringPattern, MultiSlotAvailabilityResponse, Weekday } from '@/components/booking/types';

// =====================================================
// TYPES
// =====================================================

export interface PackageTier {
    id: string;
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
    isFeatured: boolean;
    badge?: string;
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
    },

    // =====================================================
    // SMART PACK APIs
    // =====================================================

    /**
     * NEW: Check multi-slot recurring availability
     * Validates that teacher can accommodate multiple weekly patterns
     */
    checkMultiSlotAvailability: async (data: {
        teacherId: string;
        patterns: RecurringPattern[];
        recurringSessionCount: number;
        duration?: number;
    }): Promise<MultiSlotAvailabilityResponse> => {
        const response = await api.post('/packages/smart-pack/check-multi-slot-availability', data);
        return response.data;
    },

    /**
     * NEW: Purchase Smart Pack with multi-slot recurring patterns
     */
    purchaseSmartPackMultiSlot: async (data: {
        studentId: string;
        teacherId: string;
        subjectId: string;
        tierId: string;
        recurringPatterns: RecurringPattern[];
        idempotencyKey: string;
        timezone?: string;
    }): Promise<StudentPackage> => {
        const response = await api.post('/packages/smart-pack/purchase', data);
        return response.data;
    },

    // DEPRECATED: Legacy single-pattern purchase
    purchaseSmartPack: async (data: {
        teacherId: string;
        subjectId: string;
        tierId: string;
        recurringPattern: {
            dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
            startTime: string; // "HH:mm" format
            endTime: string;   // "HH:mm" format
            timezone: string;
        };
        firstSessionDate: string; // ISO string
    }): Promise<StudentPackage> => {
        const response = await api.post('/packages/smart-pack/purchase', data);
        return response.data;
    },

    // DEPRECATED: Legacy single-pattern availability check
    checkRecurringAvailability: async (data: {
        teacherId: string;
        subjectId: string;
        tierId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        timezone: string;
        firstSessionDate: string;
    }): Promise<{ available: boolean; conflicts?: any[] }> => {
        const response = await api.post('/packages/smart-pack/check-availability', data);
        return response.data;
    },

    // Book floating session
    bookFloatingSession: async (packageId: string, data: {
        startTime: string; // ISO string
        endTime: string;   // ISO string
        timezone: string;
    }): Promise<any> => {
        const response = await api.post(`/packages/smart-pack/${packageId}/book-floating`, data);
        return response.data;
    },

    // Reschedule package session
    reschedulePackageSession: async (bookingId: string, data: {
        newStartTime: string; // ISO string
        newEndTime: string;   // ISO string
        timezone: string;
    }): Promise<any> => {
        const response = await api.patch(`/packages/smart-pack/bookings/${bookingId}/reschedule`, data);
        return response.data;
    }
};
