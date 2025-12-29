'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookingFlowState, BOOKING_STEPS, BookingType, BookingTypeOption, SlotWithTimezone } from './types';
import { toast } from 'sonner';

interface UseBookingFlowProps {
    teacherId: string;
    teacherName: string;
    isGuest: boolean;
    userRole: 'PARENT' | 'STUDENT' | null;
}

export function useBookingFlow({ teacherId, teacherName, isGuest, userRole }: UseBookingFlowProps) {
    const [state, setState] = useState<BookingFlowState>({
        currentStep: 0,
        completedSteps: [],
        selectedSubject: '',
        selectedBookingType: null,
        selectedBookingOption: null,
        selectedDate: null,
        selectedSlot: null,
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
            // New package purchase - requires recurring pattern
            if (state.selectedBookingOption?.tierId) {
                return !!state.recurringWeekday && !!state.recurringTime && state.suggestedDates.length > 0;
            }
            // Single/Demo/Existing Package - requires date and slot
            return !!state.selectedDate && !!state.selectedSlot;
        }

        // Step 3: Details (dynamic based on user role)
        if (stepIndex === 3) {
            // Parents must select child
            if (userRole === 'PARENT') {
                return !!state.selectedChildId;
            }
            // Students don't need to select child
            return true;
        }

        // Step 4: Review
        if (stepIndex === 4) {
            return state.termsAccepted;
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

    // Save state to localStorage (for guests)
    useEffect(() => {
        if (isGuest) {
            const saveTimer = setTimeout(() => {
                const stateToSave = {
                    ...state,
                    teacherId,
                    teacherName,
                    timestamp: Date.now()
                };

                localStorage.setItem('pendingBooking', JSON.stringify(stateToSave));
            }, 500);

            return () => clearTimeout(saveTimer);
        }
    }, [state, isGuest, teacherId, teacherName]);

    // Restore state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pendingBooking');
        if (saved && isGuest) {
            try {
                const data = JSON.parse(saved);

                // Check if not expired (24 hours) and for same teacher
                if (
                    data.teacherId === teacherId &&
                    Date.now() - data.timestamp < 24 * 60 * 60 * 1000
                ) {
                    setState(prev => ({
                        ...prev,
                        selectedSubject: data.selectedSubject || '',
                        selectedBookingType: data.selectedBookingType || null,
                        selectedBookingOption: data.selectedBookingOption || null,
                        selectedDate: data.selectedDate ? new Date(data.selectedDate) : null,
                        selectedSlot: data.selectedSlot || null,
                        recurringWeekday: data.recurringWeekday || '',
                        recurringTime: data.recurringTime || '',
                        suggestedDates: (data.suggestedDates || []).map((d: string) => new Date(d)),
                        bookingNotes: data.bookingNotes || ''
                    }));

                    toast.success('تم استعادة اختياراتك السابقة');
                } else if (data.teacherId !== teacherId) {
                    // Different teacher, clear saved state
                    localStorage.removeItem('pendingBooking');
                }
            } catch (err) {
                console.error('Failed to restore booking state', err);
                localStorage.removeItem('pendingBooking');
            }
        }
    }, [teacherId, isGuest]);

    // Clear saved state (called after successful booking or login)
    const clearSavedState = useCallback(() => {
        localStorage.removeItem('pendingBooking');
    }, []);

    // Reset state
    const resetState = useCallback(() => {
        setState({
            currentStep: 0,
            completedSteps: [],
            selectedSubject: '',
            selectedBookingType: null,
            selectedBookingOption: null,
            selectedDate: null,
            selectedSlot: null,
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
        clearSavedState
    };
}
