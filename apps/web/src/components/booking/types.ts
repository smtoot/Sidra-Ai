// Shared types for booking flow

export type BookingType = 'DEMO' | 'SINGLE' | 'PACKAGE';

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
        label: 'اختر نوع الحجز',
        shortLabel: 'النوع',
        requiredFields: ['selectedBookingType', 'selectedBookingOption'],
        guestAllowed: true
    },
    {
        id: 2,
        label: 'حدد الموعد',
        shortLabel: 'الموعد',
        requiredFields: [], // Dynamic based on booking type
        guestAllowed: true
    },
    {
        id: 3,
        label: 'معلوماتك',
        shortLabel: 'التفاصيل',
        requiredFields: [], // Dynamic based on user role
        guestAllowed: false
    },
    {
        id: 4,
        label: 'المراجعة والتأكيد',
        shortLabel: 'المراجعة',
        requiredFields: ['termsAccepted'],
        guestAllowed: false
    }
];
