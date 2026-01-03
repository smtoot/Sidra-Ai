/**
 * Centralized PostHog Analytics Event Definitions
 * Used by both frontend and backend to prevent event name mismatches
 * 
 * IMPORTANT: Only events in ALLOWED_EVENTS will be captured.
 * To add a new event, add it to the appropriate category AND to ALLOWED_EVENTS.
 */

// Teacher funnel events
export const TEACHER_EVENTS = {
    SIGNUP_STARTED: 'teacher_signup_started',
    SIGNUP_COMPLETED: 'teacher_signup_completed',
    PROFILE_SAVED: 'teacher_profile_saved',
    ONBOARDING_STEP_VIEWED: 'teacher_onboarding_step_viewed',
    ONBOARDING_STEP_COMPLETED: 'teacher_onboarding_step_completed',
    APPLICATION_SUBMITTED: 'teacher_application_submitted',
    VERIFIED_BADGE_VISIBLE: 'teacher_verified_badge_visible',
    AVAILABILITY_SAVED: 'teacher_availability_saved',
    AVAILABILITY_ERROR: 'teacher_availability_error',
} as const;

// Student/Parent funnel events
export const STUDENT_EVENTS = {
    SIGNUP_STARTED: 'student_signup_started',
    SIGNUP_COMPLETED: 'student_signup_completed',
    SEARCH_PERFORMED: 'student_search_performed',
    SEARCH_NO_RESULTS: 'search_no_results',
    TEACHER_PROFILE_VIEWED: 'teacher_profile_viewed',
} as const;

// Booking lifecycle events
export const BOOKING_EVENTS = {
    STARTED: 'booking_started',
    CONFIRMED: 'booking_confirmed',
    CANCELLED: 'booking_cancelled',
    RESCHEDULED: 'booking_rescheduled',
    ERROR: 'booking_error',
} as const;

// Payment events
export const PAYMENT_EVENTS = {
    STARTED: 'payment_started',
    SUCCEEDED: 'payment_succeeded',
    FAILED: 'payment_failed',
} as const;

// Session events
export const SESSION_EVENTS = {
    JOINED: 'session_joined',
    COMPLETED: 'session_completed',
    NO_SHOW_TEACHER: 'session_no_show_teacher',
    NO_SHOW_STUDENT: 'session_no_show_student',
} as const;

// Support ticket events
export const SUPPORT_EVENTS = {
    TICKET_CREATED: 'ticket_created',
    TICKET_VIEWED: 'support_ticket_viewed',
    TICKET_RESOLVED: 'support_ticket_resolved',
} as const;

// Error events (these trigger session replay)
export const ERROR_EVENTS = {
    BOOKING_ERROR: 'booking_error',
    CRITICAL_ONBOARDING_ERROR: 'critical_onboarding_error',
    PAYMENT_FAILED: 'payment_failed',
} as const;

// All allowed events - ONLY these will be sent to PostHog
export const ALLOWED_EVENTS: Set<string> = new Set([
    ...Object.values(TEACHER_EVENTS),
    ...Object.values(STUDENT_EVENTS),
    ...Object.values(BOOKING_EVENTS),
    ...Object.values(PAYMENT_EVENTS),
    ...Object.values(SESSION_EVENTS),
    ...Object.values(SUPPORT_EVENTS),
    ...Object.values(ERROR_EVENTS),
]);

// Events that trigger session replay recording
export const REPLAY_TRIGGER_EVENTS: Set<string> = new Set([
    ERROR_EVENTS.PAYMENT_FAILED,
    ERROR_EVENTS.BOOKING_ERROR,
    ERROR_EVENTS.CRITICAL_ONBOARDING_ERROR,
]);

// Internal PostHog events allowed in production (to control costs)
export const ALLOWED_INTERNAL_EVENTS: Set<string> = new Set([
    '$pageview',
    '$identify',
    '$set',
    '$set_once',
    '$groupidentify',
]);

// Type for all event names
export type AnalyticsEvent =
    | (typeof TEACHER_EVENTS)[keyof typeof TEACHER_EVENTS]
    | (typeof STUDENT_EVENTS)[keyof typeof STUDENT_EVENTS]
    | (typeof BOOKING_EVENTS)[keyof typeof BOOKING_EVENTS]
    | (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS]
    | (typeof SESSION_EVENTS)[keyof typeof SESSION_EVENTS]
    | (typeof SUPPORT_EVENTS)[keyof typeof SUPPORT_EVENTS]
    | (typeof ERROR_EVENTS)[keyof typeof ERROR_EVENTS];

// Event property types for type-safe tracking
// Using error_code instead of error_message to avoid PII
export interface EventProperties {
    // Teacher events
    teacher_onboarding_step_viewed: { onboarding_step: string };
    teacher_onboarding_step_completed: { onboarding_step: string };
    teacher_verified_badge_visible: { teacher_verified: boolean };
    teacher_availability_error: { error_code: string };

    // Search events
    student_search_performed: {
        curriculum?: string;
        subject?: string;
        filters_used_count: number;
    };
    search_no_results: { curriculum?: string; subject?: string };
    teacher_profile_viewed: {
        teacher_verified: boolean;
        curriculum?: string;
        teacher_id: string;
    };

    // Booking events
    booking_cancelled: {
        cancelled_by: 'student' | 'parent' | 'teacher' | 'admin';
    };
    booking_rescheduled: { rescheduled_by: 'student' | 'parent' | 'teacher' };
    booking_error: { error_code: string };

    // Payment events
    payment_failed: { error_code: string };

    // Session events
    session_no_show_teacher: { booking_id: string };
    session_no_show_student: { booking_id: string };

    // Support events
    ticket_created: { category: string; related_booking_id?: string };
    support_ticket_viewed: { ticket_id: string };
    support_ticket_resolved: {
        ticket_id: string;
        resolution_time_hours?: number;
    };

    // Error events
    critical_onboarding_error: { error_code: string; step: string };
}
