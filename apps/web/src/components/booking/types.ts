// Shared types for booking flow

export type BookingType = 'DEMO' | 'SINGLE' | 'PACKAGE';

// Weekday enum matching backend
export type Weekday = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

// Recurring pattern for multi-slot selection
export interface RecurringPattern {
    weekday: Weekday;
    time: string; // "HH:mm" format (24h)
}

// Scheduled session from availability check
export interface ScheduledSession {
    date: string; // ISO date string
    weekday: Weekday;
    time: string;
    sessionNumber: number;
}

// Per-pattern availability status
export interface PatternAvailability {
    weekday: Weekday;
    time: string;
    availableWeeks: number;
    conflicts: Array<{
        date: string;
        reason: string;
    }>;
}

// Response from multi-slot availability check
export interface MultiSlotAvailabilityResponse {
    available: boolean;
    patterns: PatternAvailability[];
    scheduledSessions: ScheduledSession[];
    totalWeeksNeeded: number;
    firstSession: string | null;
    lastSession: string | null;
    packageEndDate: string | null;
    message: string;
}

export interface BookingTypeOption {
    type: BookingType;
    enabled: boolean;
    reason?: string;
    packageId?: string;
    tierId?: string;
    price: number;
    displayPrice?: string;
    savings?: string;
    sessionCount?: number;
    sessionsRemaining?: number;
    expiresAt?: string;
    isRecommended?: boolean;
    recurringRatio?: number; // From tier, e.g., 0.8 for 80% recurring
}

export interface SlotWithTimezone {
    startTimeUtc: string;
    label: string;
    userDate: string;
}

export interface BookingStep {
    id: number;
    label: string;
    shortLabel: string;
    requiredFields: string[];
    guestAllowed: boolean;
}

export interface BookingFlowState {
    // Meta
    currentStep: number;
    completedSteps: number[];

    // Step 1: Subject
    selectedSubject: string;

    // Step 2: Type
    selectedBookingType: BookingType | null;
    selectedBookingOption: BookingTypeOption | null;

    // Step 3: Schedule
    selectedDate: Date | null;
    selectedSlot: SlotWithTimezone | null;

    // NEW: Multi-slot recurring patterns (replaces single recurringWeekday/recurringTime)
    recurringPatterns: RecurringPattern[];
    scheduledSessions: ScheduledSession[];
    availabilityResponse: MultiSlotAvailabilityResponse | null;

    // DEPRECATED: Legacy single-pattern fields (kept for backward compatibility)
    recurringWeekday: string;
    recurringTime: string;
    suggestedDates: Date[];

    // Step 4: Details
    selectedChildId: string;
    bookingNotes: string;

    // Step 5: Review
    termsAccepted: boolean;
}

export const BOOKING_STEPS: BookingStep[] = [
    {
        id: 0,
        label: 'اختر المادة',
        shortLabel: 'المادة',
        requiredFields: ['selectedSubject'],
        guestAllowed: true
    },
    {
        id: 1,
        label: 'اختر عدد الحصص',
        shortLabel: 'عدد الحصص',
        requiredFields: ['selectedBookingType', 'selectedBookingOption'],
        guestAllowed: true
    },
    {
        id: 2,
        label: 'حدد التاريخ والوقت',
        shortLabel: 'التاريخ والوقت',
        requiredFields: [], // Dynamic based on booking type
        guestAllowed: true
    },
    {
        id: 3,
        label: 'البيانات والتأكيد',
        shortLabel: 'البيانات والتأكيد',
        requiredFields: ['termsAccepted'], // Dynamic based on user role + terms
        guestAllowed: false
    }
];
