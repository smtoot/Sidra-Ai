'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types and hooks
import { BOOKING_STEPS } from './types';
import { useBookingFlow } from './useBookingFlow';

// Components
import { ProgressIndicator } from './ProgressIndicator';
import { LoginCheckpoint } from './LoginCheckpoint';
import { Button } from '@/components/ui/button'; // Assuming you have a button component, otherwise standard html button works
import { AlertCircle } from 'lucide-react';

// Steps

// Steps
import { Step1Subject } from './steps/Step1Subject';
import { Step2BookingType } from './steps/Step2BookingType';
import { Step3Schedule } from './steps/Step3Schedule';
import { Step4Details } from './steps/Step4Details';

// API
import { bookingApi } from '@/lib/api/booking';
import { authApi, Child } from '@/lib/api/auth';

interface MultiStepBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherId: string;
    teacherName: string;
    teacherSubjects: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    initialSubjectId?: string;
    initialOptionId?: string;
}

export function MultiStepBookingModal({
    isOpen,
    onClose,
    teacherId,
    teacherName,
    teacherSubjects,
    initialSubjectId,
    initialOptionId
}: MultiStepBookingModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const isGuest = !user;

    const [userRole, setUserRole] = useState<'PARENT' | 'STUDENT' | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);

    // Fetch user data when logged in
    useEffect(() => {
        if (isOpen && user) {
            fetchUserData();
        }
    }, [isOpen, user]);

    // Booking flow state management
    const {
        state,
        updateState,
        goToStep,
        goToNextStep,
        goToPreviousStep,
        isStepComplete,
        resetState,
        clearSavedState,
        checkPendingBooking,
        resumeBooking
    } = useBookingFlow({
        teacherId,
        teacherName,
        isGuest,
        userRole,
        userId
    });

    // Set initial subject if provided
    useEffect(() => {
        if (isOpen && initialSubjectId && !state.selectedSubject) {
            updateState('selectedSubject', initialSubjectId);
        }
    }, [isOpen, initialSubjectId]);

    // Handle keyboard escape to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const fetchUserData = async () => {
        setIsLoadingChildren(true);
        try {
            const profile = await authApi.getProfile();
            setUserRole(profile.role as 'PARENT' | 'STUDENT');
            // Use email as fallback since UserProfile doesn't have name field
            setUserName(profile.email?.split('@')[0] || '');
            setUserId(profile.id);

            if (profile.role === 'PARENT' && profile.parentProfile?.children) {
                setChildren(profile.parentProfile.children);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setIsLoadingChildren(false);
        }
    };

    const handleLoginRedirect = () => {
        // State is already saved by useBookingFlow hook
        toast.info('يرجى تسجيل الدخول للمتابعة');
        router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    };

    const handleRegisterRedirect = () => {
        toast.info('إنشاء حساب جديد');
        router.push(`/register?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    };

    const handleAddChild = () => {
        // Redirect to add child page, persistence will handle state
        router.push(`/parent/children/new?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    };

    // Check for pending booking on mount/open
    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure userId is loaded if logged in is tricky because fetchUserData is async
            // But we can check generic "pendingBooking" existence first or rely on checkPendingBooking robustness
            // Actually checkPendingBooking relies on userId matching if present.
            // If user is logged in, we wait for userId?
            // "fetchUserData" runs on mount if isOpen && user.
            // Let's add a dependency on userId or just run it.
            // If we run it immediately and userId isn't set yet, it might fail the "userId matches" check if logic requires it.
            // But if userId is undefined in useBookingFlow, the checkPendingBooking might skip user check?
            // "if (userId && data.userId !== userId) return false" -> if userId is undefined, it skips?
            // No, consistency is key.
            // Let's just run it. If it returns true, great.
            const hasPending = checkPendingBooking();
            if (hasPending) {
                setShowResumeDialog(true);
            }
        }
    }, [isOpen, checkPendingBooking]); // checkPendingBooking depends on userId

    const handleNext = () => {
        const result = goToNextStep();

        if (result === 'LOGIN_REQUIRED') {
            // Show login checkpoint
            return;
        }

        if (result === false && state.currentStep === BOOKING_STEPS.length - 1) {
            // Last step, submit booking
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!isStepComplete(3)) {
            toast.error('يرجى إكمال جميع الحقول المطلوبة');
            return;
        }

        setIsSubmitting(true);

        try {
            const isNewPackagePurchase = state.selectedBookingOption?.tierId !== undefined;
            const hasMultiSlotPatterns = state.recurringPatterns.length > 0;

            if (isNewPackagePurchase && hasMultiSlotPatterns) {
                // NEW: Multi-slot package purchase
                // Import packageApi dynamically to avoid circular deps
                const { packageApi } = await import('@/lib/api/package');

                // Generate idempotency key to prevent double-charging
                const idempotencyKey = `${userId}-${teacherId}-${state.selectedSubject}-${state.selectedBookingOption!.tierId}-${Date.now()}`;

                // Determine studentId based on user role
                const studentId = userRole === 'PARENT' ? state.selectedChildId : userId!;

                await packageApi.purchaseSmartPackMultiSlot({
                    studentId,
                    teacherId,
                    subjectId: state.selectedSubject,
                    tierId: state.selectedBookingOption!.tierId!,
                    recurringPatterns: state.recurringPatterns,
                    idempotencyKey,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });

                toast.success('تم شراء الباقة بنجاح! تم جدولة جميع الحصص المتكررة');
            } else if (isNewPackagePurchase) {
                // DEPRECATED: Legacy single-pattern package purchase
                // Get the first suggested date for start time
                const startTime = state.suggestedDates.length > 0
                    ? state.suggestedDates[0].toISOString()
                    : new Date().toISOString();

                // Calculate end time (assuming 1 hour sessions)
                const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

                await bookingApi.createRequest({
                    teacherId,
                    subjectId: state.selectedSubject,
                    childId: userRole === 'PARENT' ? state.selectedChildId : undefined,
                    startTime,
                    endTime,
                    price: state.selectedBookingOption!.price,
                    tierId: state.selectedBookingOption!.tierId!,
                    bookingNotes: state.bookingNotes,
                    termsAccepted: true
                });

                toast.success('تم إنشاء الحجز بنجاح! في انتظار موافقة المعلم');
            } else {
                // Regular booking (single, demo, or existing package)
                const startTime = state.selectedSlot!.startTimeUtc;
                const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

                await bookingApi.createRequest({
                    teacherId,
                    subjectId: state.selectedSubject,
                    childId: userRole === 'PARENT' ? state.selectedChildId : undefined,
                    startTime,
                    endTime,
                    price: state.selectedBookingOption!.price,
                    packageId: state.selectedBookingOption?.packageId,
                    isDemo: state.selectedBookingType === 'DEMO',
                    bookingNotes: state.bookingNotes,
                    termsAccepted: true
                });

                toast.success('تم إنشاء الحجز بنجاح! في انتظار موافقة المعلم');
            }

            clearSavedState();
            resetState();
            onClose();

            // Redirect to bookings page
            router.push(userRole === 'PARENT' ? '/parent/bookings' : '/student/sessions');
        } catch (error: any) {
            console.error('Failed to create booking:', error);
            console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
            toast.error(error.response?.data?.message || 'فشل إنشاء الحجز. يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (state.currentStep > 0 && isGuest) {
            // Confirm before closing if guest has made progress
            if (confirm('هل أنت متأكد؟ سيتم حفظ اختياراتك.')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Get current subject data
    const selectedSubjectData = teacherSubjects.find(s => s.id === state.selectedSubject);

    // Get selected child data
    const selectedChildData = children.find(c => c.id === state.selectedChildId);

    // Render current step
    const renderStep = () => {
        // Show login checkpoint if guest trying to access protected step
        if (isGuest && state.currentStep === 3) {
            return (
                <LoginCheckpoint
                    onLogin={handleLoginRedirect}
                    onRegister={handleRegisterRedirect}
                />
            );
        }

        switch (state.currentStep) {
            case 0:
                return (
                    <Step1Subject
                        subjects={teacherSubjects}
                        selectedSubject={state.selectedSubject}
                        onSelect={(subjectId) => updateState('selectedSubject', subjectId)}
                    />
                );

            case 1:
                if (!selectedSubjectData) return null;
                return (
                    <Step2BookingType
                        teacherId={teacherId}
                        subjectId={state.selectedSubject}
                        basePrice={selectedSubjectData.price}
                        selectedOption={state.selectedBookingOption}
                        onSelect={(option) => {
                            updateState('selectedBookingType', option.type);
                            updateState('selectedBookingOption', option);
                        }}
                    />
                );

            case 2:
                return (
                    <Step3Schedule
                        teacherId={teacherId}
                        subjectId={state.selectedSubject}
                        bookingOption={state.selectedBookingOption}
                        selectedDate={state.selectedDate}
                        selectedSlot={state.selectedSlot}
                        onDateSelect={(date) => updateState('selectedDate', date)}
                        onSlotSelect={(slot) => updateState('selectedSlot', slot)}
                        // NEW: Multi-slot recurring patterns
                        recurringPatterns={state.recurringPatterns}
                        onRecurringPatternsChange={(patterns) => updateState('recurringPatterns', patterns)}
                        onAvailabilityCheck={(response) => {
                            updateState('availabilityResponse', response);
                            if (response.scheduledSessions) {
                                updateState('scheduledSessions', response.scheduledSessions);
                            }
                        }}
                        // DEPRECATED: Legacy single-pattern fields
                        recurringWeekday={state.recurringWeekday}
                        recurringTime={state.recurringTime}
                        suggestedDates={state.suggestedDates}
                        onRecurringWeekdayChange={(weekday) => updateState('recurringWeekday', weekday)}
                        onRecurringTimeChange={(time) => updateState('recurringTime', time)}
                        onSuggestedDatesChange={(dates) => updateState('suggestedDates', dates)}
                    />
                );

            case 3:
                return (
                    <Step4Details
                        teacherName={teacherName}
                        subjectName={selectedSubjectData?.name || ''}
                        bookingOption={state.selectedBookingOption}
                        selectedDate={state.selectedDate}
                        selectedSlot={state.selectedSlot}
                        // NEW: Multi-slot recurring patterns
                        recurringPatterns={state.recurringPatterns}
                        scheduledSessions={state.scheduledSessions}
                        availabilityResponse={state.availabilityResponse}
                        userRole={userRole}
                        userName={userName}
                        children={children}
                        selectedChildId={state.selectedChildId}
                        onChildSelect={(childId) => updateState('selectedChildId', childId)}
                        bookingNotes={state.bookingNotes}
                        onNotesChange={(notes) => updateState('bookingNotes', notes)}
                        onAddChild={handleAddChild}
                        termsAccepted={state.termsAccepted}
                        onTermsChange={(accepted) => updateState('termsAccepted', accepted)}
                    />
                );

            default:
                return null;
        }
    };

    // Check if can proceed
    const canProceed = isStepComplete(state.currentStep);

    // Get button text
    const getNextButtonText = () => {
        if (isGuest && state.currentStep === 2) return 'متابعة وتسجيل الدخول';
        if (state.currentStep === BOOKING_STEPS.length - 1) return isSubmitting ? 'جاري الحجز...' : 'تأكيد الحجز';
        return 'التالي';
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
        >
            <div
                className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile drag handle */}
                <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3" />

                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b">
                    <div className="flex-1 min-w-0">
                        <h2 id="booking-modal-title" className="text-lg md:text-2xl font-bold text-gray-900 truncate">حجز حصة مع {teacherName}</h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 hidden md:block">اتبع الخطوات لإتمام الحجز</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
                        aria-label="إغلاق"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
                    </button>
                </div>

                {/* Progress Indicator - Mobile shows compact, Desktop shows full */}
                <div className="px-4 md:px-6 pt-4 md:pt-6">
                    {/* Mobile: compact progress */}
                    <div className="md:hidden">
                        <ProgressIndicator
                            steps={BOOKING_STEPS}
                            currentStep={state.currentStep}
                            completedSteps={state.completedSteps}
                            variant="mobile"
                        />
                    </div>
                    {/* Desktop: full progress */}
                    <div className="hidden md:block">
                        <ProgressIndicator
                            steps={BOOKING_STEPS}
                            currentStep={state.currentStep}
                            completedSteps={state.completedSteps}
                            variant="desktop"
                        />
                    </div>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto px-4 md:px-6 py-6"
                    data-booking-modal-content
                >
                    {showResumeDialog ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                                <AlertCircle className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    هل تريد إكمال الحجز السابق؟
                                </h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    وجدنا بيانات حجز غير مكتملة محفوظة من قبل. هل تود استعادتها والمتابعة من حيث توقفت؟
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                <button
                                    onClick={() => {
                                        resumeBooking();
                                        setShowResumeDialog(false);
                                    }}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                                >
                                    إكمال الحجز
                                </button>
                                <button
                                    onClick={() => {
                                        clearSavedState();
                                        setShowResumeDialog(false);
                                    }}
                                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    بدء حجز جديد
                                </button>
                            </div>
                        </div>
                    ) : (
                        renderStep()
                    )}
                </div>

                {/* Footer Navigation */}
                {!(isGuest && state.currentStep === 3) && (
                    <div className="border-t p-4 pb-8 md:p-6 md:pb-10 bg-white safe-area-pb">
                        {state.currentStep === BOOKING_STEPS.length - 1 && (
                            <div className="mb-4 text-center">
                                <p className="text-sm text-gray-500">
                                    بالضغط على تأكيد الحجز سيتم إرسال الطلب للمعلم للمراجعة.
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3 md:gap-4">
                            <button
                                onClick={goToPreviousStep}
                                disabled={state.currentStep === 0}
                                className={cn(
                                    'px-4 md:px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 min-h-[48px]',
                                    state.currentStep === 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                                )}
                            >
                                <ArrowRight className="w-4 h-4" />
                                <span className="hidden sm:inline">رجوع</span>
                            </button>

                            <div className="flex-1" />

                            <button
                                onClick={handleNext}
                                disabled={!canProceed || isSubmitting}
                                className={cn(
                                    'px-6 md:px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 min-h-[48px] shadow-lg shadow-primary/20',
                                    state.currentStep === BOOKING_STEPS.length - 1 ? 'text-lg px-8' : '', // Larger text for final step
                                    canProceed && !isSubmitting
                                        ? 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transform hover:-translate-y-0.5'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                )}
                            >
                                {getNextButtonText()}
                                {state.currentStep < BOOKING_STEPS.length - 1 && (
                                    <ArrowLeft className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        {state.currentStep === BOOKING_STEPS.length - 1 && !state.termsAccepted && (
                            <p className="text-xs text-amber-600 mt-2 text-left font-medium">
                                يرجى الموافقة على الشروط لإتمام الحجز
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
