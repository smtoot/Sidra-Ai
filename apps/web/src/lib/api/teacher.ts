import { api } from '../api';
import {
    UpdateTeacherProfileDto,
    CreateTeacherSubjectDto,
    CreateAvailabilityDto,
    AcceptTermsDto,
    CreateQualificationDto,
    UpdateQualificationDto,
    QualificationStatus,
    CreateSkillDto,
    UpdateSkillDto,
    SkillCategory,
    SkillProficiency,
    CreateWorkExperienceDto,
    UpdateWorkExperienceDto,
    ExperienceType,
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

export interface InterviewTimeSlot {
    id: string;
    proposedDateTime: string;
    meetingLink?: string;
    isSelected: boolean;
}

export interface InterviewSlotsResponse {
    applicationStatus: string;
    slots: InterviewTimeSlot[];
}

export interface TeacherQualification {
    id: string;
    teacherId: string;
    degreeName: string;
    institution: string;
    fieldOfStudy?: string;
    status: QualificationStatus;
    startDate?: string;
    endDate?: string;
    graduationYear?: number;
    certificateUrl: string;
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

// Re-export enums for convenience
export { SkillCategory, SkillProficiency, ExperienceType };

export interface TeacherSkill {
    id: string;
    name: string;
    category?: SkillCategory;
    proficiency: SkillProficiency;
    createdAt: string;
}

export interface TeacherWorkExperience {
    id: string;
    title: string;
    organization: string;
    experienceType: ExperienceType;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
    subjects: string[];
    createdAt: string;
}

export interface DashboardStats {
    profile: {
        id: string;
        slug: string | null;
        displayName: string;
        firstName: string;
        lastName: string;
        photo: string | null;
        isOnVacation: boolean;
        vacationEndDate: string | null;
    };
    counts: {
        todaySessions: number;
        pendingRequests: number;
        completedSessions: number;
        demoSessions: number;
        totalEarnings: number;
        totalReviews: number;
    };
    upcomingSession: any;
    recentSessions: any[];
    walletBalance: number;
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

    // --- Qualifications ---
    getQualifications: async (): Promise<TeacherQualification[]> => {
        const response = await api.get('/teacher/me/qualifications');
        return response.data;
    },
    addQualification: async (data: CreateQualificationDto): Promise<TeacherQualification> => {
        const response = await api.post('/teacher/me/qualifications', data);
        return response.data;
    },
    updateQualification: async (id: string, data: UpdateQualificationDto): Promise<TeacherQualification> => {
        const response = await api.patch(`/teacher/me/qualifications/${id}`, data);
        return response.data;
    },
    removeQualification: async (id: string) => {
        const response = await api.delete(`/teacher/me/qualifications/${id}`);
        return response.data;
    },

    // --- Skills ---
    getSkills: async (): Promise<TeacherSkill[]> => {
        const response = await api.get('/teacher/skills');
        return response.data;
    },
    addSkill: async (data: CreateSkillDto): Promise<TeacherSkill> => {
        const response = await api.post('/teacher/skills', data);
        return response.data;
    },
    updateSkill: async (id: string, data: UpdateSkillDto): Promise<TeacherSkill> => {
        const response = await api.patch(`/teacher/skills/${id}`, data);
        return response.data;
    },
    removeSkill: async (id: string) => {
        const response = await api.delete(`/teacher/skills/${id}`);
        return response.data;
    },

    // --- Work Experience ---
    getWorkExperiences: async (): Promise<TeacherWorkExperience[]> => {
        const response = await api.get('/teacher/work-experiences');
        return response.data;
    },
    addWorkExperience: async (data: CreateWorkExperienceDto): Promise<TeacherWorkExperience> => {
        const response = await api.post('/teacher/work-experiences', data);
        return response.data;
    },
    updateWorkExperience: async (id: string, data: UpdateWorkExperienceDto): Promise<TeacherWorkExperience> => {
        const response = await api.patch(`/teacher/work-experiences/${id}`, data);
        return response.data;
    },
    removeWorkExperience: async (id: string) => {
        const response = await api.delete(`/teacher/work-experiences/${id}`);
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
    setBulkExceptions: async (exceptions: any[]) => {
        const response = await api.post('/teacher/me/exceptions/bulk', { exceptions });
        return response.data;
    },
    getDashboardStats: async (): Promise<DashboardStats> => {
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
    getVacationSettings: async () => {
        const response = await api.get('/teacher/me/vacation-settings');
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
    acceptTerms: async (termsVersion: string) => {
        const response = await api.post('/teacher/me/accept-terms', { termsVersion } as AcceptTermsDto);
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

    // --- Smart Pack Settings ---
    getPackageTiers: async () => {
        const response = await api.get('/teacher/me/package-tiers');
        return response.data;
    },
    updatePackageSettings: async (data: { packagesEnabled: boolean }) => {
        const response = await api.patch('/teacher/me/package-settings', data);
        return response.data;
    },
    updateTierSetting: async (tierId: string, data: { isEnabled: boolean }) => {
        const response = await api.patch(`/teacher/me/package-tiers/${tierId}`, data);
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
    },

    // --- Interview Slots ---
    getInterviewSlots: async (): Promise<InterviewSlotsResponse> => {
        const response = await api.get('/teacher/me/interview-slots');
        return response.data;
    },

    updateVacationMode: async (data: { isOnVacation: boolean; returnDate?: string; reason?: string }) => {
        const response = await api.patch('/teacher/me/vacation-mode', data);
        return response.data;
    },
    selectInterviewSlot: async (slotId: string): Promise<{ message: string; scheduledAt: string; meetingLink?: string }> => {
        const response = await api.post(`/teacher/me/interview-slots/${slotId}/select`);
        return response.data;
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
