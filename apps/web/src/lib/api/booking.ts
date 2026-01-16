import { api } from '../api';

export type BookingStatus =
    | 'PENDING_TEACHER_APPROVAL'
    | 'WAITING_FOR_PAYMENT'
    | 'PAYMENT_REVIEW'
    | 'SCHEDULED'
    | 'PENDING_CONFIRMATION'  // NEW: Teacher marked complete, awaiting student confirmation
    | 'COMPLETED'
    | 'DISPUTED'              // NEW: Student raised an issue
    | 'REFUNDED'              // NEW: Admin decided to refund student
    | 'PARTIALLY_REFUNDED'    // NEW: Admin split the payment
    | 'REJECTED_BY_TEACHER'
    | 'CANCELLED_BY_PARENT'
    | 'CANCELLED_BY_TEACHER'
    | 'CANCELLED_BY_ADMIN'
    | 'EXPIRED';

export type BookingAction = 'pay' | 'cancel' | 'confirm' | 'dispute' | 'rate' | 'book-new' | 'details' | 'support' | 'join';


export interface CreateBookingRequest {
    teacherId: string;
    subjectId: string;
    childId?: string; // Optional: Only for Parent bookings
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    price: number;
    timezone?: string; // User's IANA timezone
    bookingNotes?: string; // Notes from parent/student about what they want to study
    // Package & Demo support
    packageId?: string; // If booking using a purchased package
    tierId?: string; // If booking will trigger a new package purchase (deferred payment)
    isDemo?: boolean; // If this is a demo session
    termsAccepted: boolean;
}

export interface Booking {
    id: string;
    readableId?: string | null;
    teacherId: string;
    parentId: string;
    studentId: string;
    subjectId: string;
    startTime: string;
    endTime: string;
    price: string;
    status: BookingStatus;
    cancelReason?: string;
    createdAt: string;
    // Dispute window fields
    disputeWindowOpensAt?: string | null;
    disputeWindowClosesAt?: string | null;
    disputeReminderSentAt?: string | null;
    // Legacy fields (kept for backward compatibility)
    teacherCompletedAt?: string | null;
    autoReleaseAt?: string | null;
    studentConfirmedAt?: string | null;
    paymentReleasedAt?: string | null;
    // Related entities
    teacherProfile?: any;
    parentProfile?: any;
    bookedByUser?: { // The user who made the booking (parent or student)
        id: string;
        email: string;
    };
    studentUser?: { // Independent student user (note: displayName only exists on teacher_profiles, not users)
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        studentProfile?: {
            gradeLevel?: string;
            curriculum?: {
                id: string;
                nameAr: string;
                nameEn: string;
            };
        };
    };
    child?: { // Child entity for parent bookings
        id: string;
        name: string;
        gradeLevel?: string;
        curriculum?: {
            id: string;
            nameAr: string;
            nameEn: string;
        };
    };
    student?: any; // Legacy compatibility
    meetingLink?: string;
    jitsiEnabled?: boolean;
    jitsiRoomId?: string;
    subject?: {
        id: string;
        nameAr: string;
        nameEn: string;
    };
    // Teacher notes
    bookingNotes?: string;     // Notes from parent/student about what they want to study
    teacherPrepNotes?: string; // Teacher's private preparation notes
    teacherSummary?: string;   // Teacher's class summary after session
    // Package support
    pendingTierId?: string | null; // Tier ID for pending package purchase
    pendingTierSessionCount?: number | null; // Number of sessions in the pending tier
    isDemo?: boolean; // If this is a demo session
    rating?: number | null; // Review rating if exists
}

export const bookingApi = {
    createRequest: async (dto: CreateBookingRequest) => {
        const response = await api.post('/bookings', dto);
        return response.data;
    },

    approveRequest: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/approve`);
        return response.data;
    },

    rejectRequest: async (id: string, cancelReason?: string) => {
        const response = await api.patch(`/bookings/${id}/reject`, { cancelReason });
        return response.data;
    },

    completeSession: async (id: string, data?: {
        sessionProofUrl?: string;
        topicsCovered?: string;
        studentPerformanceRating?: number;
        studentPerformanceNotes?: string;
        homeworkAssigned?: boolean;
        homeworkDescription?: string;
        nextSessionRecommendations?: string;
        additionalNotes?: string;
    }) => {
        const response = await api.patch(`/bookings/${id}/complete-session`, data || {});
        return response.data;
    },

    getTeacherRequests: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/teacher/requests');
        return response.data;
    },

    getTeacherSessions: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/teacher/my-sessions');
        return response.data;
    },

    // Get all teacher bookings (for requests page - shows all statuses)
    getAllTeacherBookings: async (): Promise<Booking[]> => {
        try {
            const response = await api.get('/bookings/teacher/all');
            // Backend returns paginated response: { data: Booking[], meta: {...} }
            const result = response.data;
            // Handle both paginated response and direct array (for backwards compatibility)
            if (result && Array.isArray(result.data)) {
                return result.data;
            }
            if (Array.isArray(result)) {
                return result;
            }
            return [];
        } catch (error) {
            console.error('Failed to load teacher bookings', error);
            return [];
        }
    },

    getBookingById: async (id: string): Promise<Booking> => {
        const response = await api.get(`/bookings/${id}`);
        return response.data;
    },

    updateTeacherNotes: async (id: string, notes: { teacherPrepNotes?: string; teacherSummary?: string }) => {
        const response = await api.patch(`/bookings/${id}/teacher-notes`, notes);
        return response.data;
    },

    updateMeetingLink: async (id: string, meetingLink: string) => {
        const response = await api.patch(`/bookings/${id}/meeting-link`, { meetingLink });
        return response.data;
    },

    getParentBookings: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/parent/my-bookings');
        // Backend returns paginated response: { data: Booking[], meta: {...} }
        const result = response.data;
        if (result && Array.isArray(result.data)) {
            return result.data;
        }
        if (Array.isArray(result)) {
            return result;
        }
        return [];
    },

    getStudentBookings: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/student/my-bookings');
        return response.data;
    },

    payBooking: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/pay`);
        return response.data;
    },

    // --- Escrow Payment Release System ---

    // Parent/Student confirms session early (before auto-release)
    confirmSessionEarly: async (id: string, rating?: number) => {
        const response = await api.patch(`/bookings/${id}/confirm-early`, { rating });
        return response.data;
    },

    // Parent/Student raises a dispute
    raiseDispute: async (id: string, type: string, description: string, evidence?: string[]) => {
        const response = await api.post(`/bookings/${id}/dispute`, {
            type,
            description,
            evidence: evidence || []
        });
        return response.data;
    },

    // --- Cancellation Flow ---

    // Get cancellation estimate (read-only preview)
    getCancelEstimate: async (id: string): Promise<CancelEstimate> => {
        const response = await api.get(`/bookings/${id}/cancel-estimate`);
        return response.data;
    },

    // Cancel booking
    cancelBooking: async (id: string, reason?: string) => {
        const response = await api.patch(`/bookings/${id}/cancel`, { reason });
        return response.data;
    },

    // --- Meeting Events (P1-1) ---

    // Log a meeting event
    logMeetingEvent: async (id: string, eventType: MeetingEventType, metadata?: Record<string, any>) => {
        const response = await api.post(`/bookings/${id}/meeting-event`, {
            eventType,
            metadata
        });
        return response.data;
    },

    // Get meeting events for a booking (admin only)
    getMeetingEvents: async (id: string): Promise<MeetingEvent[]> => {
        const response = await api.get(`/bookings/${id}/meeting-events`);
        return response.data;
    }
};

// Meeting Event Types (P1-1)
export type MeetingEventType =
    | 'PARTICIPANT_JOINED'
    | 'PARTICIPANT_LEFT'
    | 'MEETING_STARTED'
    | 'MEETING_ENDED';

export interface MeetingEvent {
    id: string;
    bookingId: string;
    userId: string;
    userName: string;
    userRole: string;
    eventType: MeetingEventType;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface CancelEstimate {
    canCancel: boolean;
    reason?: string;
    refundPercent: number;
    refundAmount: number;
    teacherCompAmount: number;
    policy?: string;
    hoursRemaining?: number;
    message?: string;
}
