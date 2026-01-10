'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookingFlowState, BOOKING_STEPS, BookingType, BookingTypeOption, SlotWithTimezone, RecurringPattern, ScheduledSession, MultiSlotAvailabilityResponse } from './types';
import { toast } from 'sonner';

interface UseBookingFlowProps {
    teacherId: string;
    teacherName: string;
    isGuest: boolean;
    userRole: 'PARENT' | 'STUDENT' | null;
    userId?: string;
}

const STORAGE_KEY = 'pendingBooking';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export function useBookingFlow({ teacherId, teacherName, isGuest, userRole, userId }: UseBookingFlowProps) {
    const [state, setState] = useState<BookingFlowState>({
        currentStep: 0,
        completedSteps: [],
        selectedSubject: '',
        selectedBookingType: null,
        selectedBookingOption: null,
        selectedDate: null,
        selectedSlot: null,
        // NEW: Multi-slot recurring patterns
        recurringPatterns: [],
        scheduledSessions: [],
        availabilityResponse: null,
        // DEPRECATED: Legacy single-pattern fields
        recurringWeekday: '',
        recurringTime: '',
        suggestedDates: [],
        selectedChildId: '',
        bookingNotes: '',
        termsAccepted: false
    });

    // Check if a step is complete
    const isStepComplete = useCallback((stepIndex: number): boolean => {
        const step = BOOKING_STEPS[stepIndex];

        // Step 0: Subject
        if (stepIndex === 0) {
            return !!state.selectedSubject;
        }

        // Step 1: Booking Type
        if (stepIndex === 1) {
            return !!state.selectedBookingType && !!state.selectedBookingOption;
        }

        // Step 2: Schedule (dynamic based on booking type)
        if (stepIndex === 2) {
            // New package purchase - requires recurring patterns with availability check
            if (state.selectedBookingOption?.tierId) {
                // NEW: Multi-slot validation - must have patterns selected and availability confirmed
                if (state.recurringPatterns.length > 0 && state.availabilityResponse?.available) {
                    return true;
                }
                // DEPRECATED: Legacy single-pattern fallback
                return !!state.recurringWeekday && !!state.recurringTime && state.suggestedDates.length > 0;
            }
            // Single/Demo/Existing Package - requires date and slot
            return !!state.selectedDate && !!state.selectedSlot;
        }

        // Step 3: Details & Review (Final Step)
        if (stepIndex === 3) {
            // Must accept terms
            if (!state.termsAccepted) return false;

            // Parents must select child
            if (userRole === 'PARENT') {
                return !!state.selectedChildId;
            }

            // Students: if terms attached, good to go
            return true;
        }

        return false;
    }, [state, userRole]);

    // Check if can navigate to a step
    const canGoToStep = useCallback((targetStep: number): boolean => {
        // Can't skip ahead if not logged in and trying to access protected steps
        if (isGuest && targetStep >= 3) {
            return false;
        }

        // Can't skip ahead if previous steps incomplete
        for (let i = 0; i < targetStep; i++) {
            if (!isStepComplete(i)) {
                return false;
            }
        }

        return true;
    }, [isGuest, isStepComplete]);

    // Navigate to specific step
    const goToStep = useCallback((targetStep: number) => {
        if (!canGoToStep(targetStep)) {
            return;
        }

        setState(prev => ({
            ...prev,
            currentStep: targetStep
        }));

        // Scroll to top of modal
        const modalContent = document.querySelector('[data-booking-modal-content]');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    }, [canGoToStep]);

    // Go to next step
    const goToNextStep = useCallback(() => {
        // Validate current step
        if (!isStepComplete(state.currentStep)) {
            toast.error('يرجى إكمال جميع الحقول المطلوبة');
            return false;
        }

        // Check if login required (guest trying to go beyond step 2)
        if (isGuest && state.currentStep === 2) {
            return 'LOGIN_REQUIRED';
        }

        // Mark current step as completed
        if (!state.completedSteps.includes(state.currentStep)) {
            setState(prev => ({
                ...prev,
                completedSteps: [...prev.completedSteps, prev.currentStep]
            }));
        }

        // Move to next step
        if (state.currentStep < BOOKING_STEPS.length - 1) {
            setState(prev => ({
                ...prev,
                currentStep: prev.currentStep + 1
            }));

            // Scroll to top
            const modalContent = document.querySelector('[data-booking-modal-content]');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }

            return true;
        }

        return false;
    }, [state.currentStep, state.completedSteps, isStepComplete, isGuest]);

    // Go to previous step
    const goToPreviousStep = useCallback(() => {
        if (state.currentStep > 0) {
            setState(prev => ({
                ...prev,
                currentStep: prev.currentStep - 1
            }));

            // Scroll to top
            const modalContent = document.querySelector('[data-booking-modal-content]');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }
    }, [state.currentStep]);

    // Update state fields
    const updateState = useCallback(<K extends keyof BookingFlowState>(
        field: K,
        value: BookingFlowState[K]
    ) => {
        setState(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Save state to localStorage (for ALL users)
    useEffect(() => {
        // Only save if we have made some progress (e.g. at least selected a subject)
        if (state.selectedSubject) {
            const saveTimer = setTimeout(() => {
                const stateToSave = {
                    ...state,
                    teacherId,
                    userId: userId || null, // null for guests
                    timestamp: Date.now()
                };

                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            }, 500);

            return () => clearTimeout(saveTimer);
        }
    }, [state, teacherId, userId]);

    // Check for pending booking
    const checkPendingBooking = useCallback((): boolean => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);

            // Validation Checks:
            // 1. Teacher matches
            if (data.teacherId !== teacherId) return false;

            // 2. User matches (if logged in) OR draft was created by a guest
            // Allow logged-in user to resume a guest draft (same teacher)
            if (userId && data.userId && data.userId !== userId) return false;

            // 3. Not expired (30 mins)
            if (Date.now() - data.timestamp > EXPIRY_TIME) {
                // Expired, clear it
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }

            // 4. Any meaningful progress made (at least selected a subject = completed step 0)
            // Previously required step >= 3 which was too restrictive
            // Now we restore if user made ANY progress (step >= 1 means they completed step 0)
            if ((data.currentStep || 0) < 1 && !data.selectedSubject) return false;

            return true;
        } catch (err) {
            return false;
        }
    }, [teacherId, userId]);

    // Resume booking from saved state
    const resumeBooking = useCallback(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setState(prev => ({
                    ...prev,
                    currentStep: data.currentStep || 0,
                    completedSteps: data.completedSteps || [],
                    selectedSubject: data.selectedSubject || '',
                    selectedBookingType: data.selectedBookingType || null,
                    selectedBookingOption: data.selectedBookingOption || null,
                    selectedDate: data.selectedDate ? new Date(data.selectedDate) : null,
                    selectedSlot: data.selectedSlot || null,
                    // NEW: Multi-slot recurring patterns
                    recurringPatterns: data.recurringPatterns || [],
                    scheduledSessions: data.scheduledSessions || [],
                    availabilityResponse: data.availabilityResponse || null,
                    // DEPRECATED: Legacy single-pattern fields
                    recurringWeekday: data.recurringWeekday || '',
                    recurringTime: data.recurringTime || '',
                    suggestedDates: (data.suggestedDates || []).map((d: string) => new Date(d)),
                    // FIX: Restore selectedChildId so parent doesn't have to re-select
                    selectedChildId: data.selectedChildId || '',
                    bookingNotes: data.bookingNotes || '',
                    // Don't restore termsAccepted, user should review again
                    termsAccepted: false
                }));
                toast.success('تم استعادة بيانات الحجز السابق');
            } catch (err) {
                console.error('Failed to restore booking', err);
                toast.error('حدث خطأ أثناء استعادة الحجز');
            }
        }
    }, []);

    // Clear saved state
    const clearSavedState = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Reset state and clear storage
    const resetState = useCallback(() => {
        setState({
            currentStep: 0,
            completedSteps: [],
            selectedSubject: '',
            selectedBookingType: null,
            selectedBookingOption: null,
            selectedDate: null,
            selectedSlot: null,
            // NEW: Multi-slot recurring patterns
            recurringPatterns: [],
            scheduledSessions: [],
            availabilityResponse: null,
            // DEPRECATED: Legacy single-pattern fields
            recurringWeekday: '',
            recurringTime: '',
            suggestedDates: [],
            selectedChildId: '',
            bookingNotes: '',
            termsAccepted: false
        });
        clearSavedState();
    }, [clearSavedState]);

    return {
        state,
        updateState,
        goToStep,
        goToNextStep,
        goToPreviousStep,
        isStepComplete,
        canGoToStep,
        resetState,
        checkPendingBooking,
        resumeBooking,
        clearSavedState
    };
}
