import { api } from '../api';
import {
    UpdateTeacherProfileDto,
    CreateTeacherSubjectDto,
    CreateAvailabilityDto
} from '@sidra/shared';

export type DocumentType = 'ID_CARD' | 'CERTIFICATE' | 'DEGREE' | 'OTHER';

export interface TeacherDocument {
    id: string;
    teacherId: string;
    type: DocumentType;
    fileName: string;
    fileUrl: string; // This is the fileKey, not a URL
    uploadedAt: string;
}

export interface SlugInfo {
    slug: string | null;
    slugLockedAt: string | null;
    isLocked: boolean;
    suggestedSlug: string | null;
}

export interface TeachingApproachTag {
    id: string;
    labelAr: string;
    descriptionAr?: string;
    icon?: string;
    sortOrder: number;
    isActive: boolean;
}

export interface TeacherTeachingApproach {
    teachingStyle: string | null;
    tagIds: string[]; // List of Tag IDs
}

export const teacherApi = {
    getProfile: async () => {
        const response = await api.get('/teacher/me');
        return response.data;
    },
    updateProfile: async (data: UpdateTeacherProfileDto) => {
        const response = await api.patch('/teacher/me', data);
        return response.data;
    },
    addSubject: async (data: CreateTeacherSubjectDto) => {
        const response = await api.post('/teacher/me/subjects', data);
        return response.data;
    },
    removeSubject: async (id: string) => {
        const response = await api.delete(`/teacher/me/subjects/${id}`);
        return response.data;
    },
    addAvailability: async (data: CreateAvailabilityDto) => {
        const response = await api.post('/teacher/me/availability', data);
        return response.data;
    },
    removeAvailability: async (id: string) => {
        const response = await api.delete(`/teacher/me/availability/${id}`);
        return response.data;
    },
    setBulkAvailability: async (slots: CreateAvailabilityDto[]) => {
        const response = await api.post('/teacher/me/availability/bulk', { slots });
        return response.data;
    },
    getDashboardStats: async () => {
        const response = await api.get('/teacher/dashboard');
        return response.data;
    },
    getExceptions: async () => {
        const response = await api.get('/teacher/me/exceptions');
        return response.data;
    },
    addException: async (data: any) => {
        const response = await api.post('/teacher/me/exceptions', data);
        return response.data;
    },
    removeException: async (id: string) => {
        const response = await api.delete(`/teacher/me/exceptions/${id}`);
        return response.data;
    },

    // --- Document Management ---
    getDocuments: async (): Promise<TeacherDocument[]> => {
        const response = await api.get('/teacher/me/documents');
        return response.data;
    },
    addDocument: async (data: { type: DocumentType; fileKey: string; fileName: string }): Promise<TeacherDocument> => {
        const response = await api.post('/teacher/me/documents', data);
        return response.data;
    },
    removeDocument: async (id: string) => {
        const response = await api.delete(`/teacher/me/documents/${id}`);
        return response.data;
    },

    // --- Application Status ---
    getApplicationStatus: async (): Promise<TeacherApplicationStatus> => {
        const response = await api.get('/teacher/me/application-status');
        return response.data;
    },
    submitForReview: async () => {
        const response = await api.post('/teacher/me/submit');
        return response.data;
    },

    // --- Demo Session Settings ---
    getDemoSettings: async (): Promise<{ demoEnabled: boolean } | null> => {
        const response = await api.get('/packages/demo/settings');
        return response.data;
    },
    updateDemoSettings: async (demoEnabled: boolean): Promise<{ demoEnabled: boolean }> => {
        const response = await api.post('/packages/demo/settings', { demoEnabled });
        return response.data;
    },

    // --- Session Packages ---
    getPackages: async () => {
        const response = await api.get('/packages/teacher');
        return response.data;
    },

    // --- Slug Management ---
    getSlugInfo: async (): Promise<SlugInfo> => {
        const response = await api.get('/teacher/me/slug');
        return response.data;
    },
    checkSlugAvailability: async (slug: string): Promise<{ available: boolean; slug: string; error?: string }> => {
        const response = await api.get(`/teacher/me/slug/check?slug=${encodeURIComponent(slug)}`);
        return response.data;
    },
    updateSlug: async (slug: string): Promise<{ slug: string; locked: boolean }> => {
        const response = await api.patch('/teacher/me/slug', { slug });
        return response.data;
    },
    confirmSlug: async (slug: string): Promise<{ slug: string; locked: boolean }> => {
        const response = await api.post('/teacher/me/slug/confirm', { slug });
        return response.data;
    },

    // --- Teaching Approach ---
    getTeachingApproachTags: async (): Promise<TeachingApproachTag[]> => {
        const response = await api.get('/teacher/me/teaching-approach-tags');
        return response.data;
    },

    updateTeachingApproach: async (data: TeacherTeachingApproach): Promise<void> => {
        await api.patch('/teacher/me/profile/teaching-approach', data);
    }
};

// Application Status Types
export type ApplicationStatusType =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'CHANGES_REQUESTED'
    | 'INTERVIEW_REQUIRED'
    | 'INTERVIEW_SCHEDULED'
    | 'APPROVED'
    | 'REJECTED';

export interface TeacherApplicationStatus {
    applicationStatus: ApplicationStatusType;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    changeRequestReason: string | null;
    interviewScheduledAt: string | null;
    interviewLink: string | null;
}
