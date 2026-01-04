'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { teacherApi, TeacherApplicationStatus } from '@/lib/api/teacher';
import { Gender, TEACHER_EVENTS } from '@sidra/shared';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

// Onboarding data shape
export interface OnboardingData {
    // Step 1: Photo + Basic Info
    profilePhotoUrl: string | null;
    introVideoUrl: string | null;
    displayName: string;
    fullName: string;
    gender: Gender | null;

    // Step 2: Teaching Experience
    yearsOfExperience: number;
    bio: string;
    // NOTE: education field REMOVED - replaced by QualificationsManager component
    // Qualifications are now managed separately via teacherApi.getQualifications()
    qualifications: any[];

    // Step 3: Subjects (managed separately via API)
    subjects: any[];

    // Step 4: ID Verification
    idType: string | null;
    idNumber: string;
    idImageUrl: string | null;

    // Legacy: Documents (still needed for certificates)
    documents: any[];

    // Application status
    applicationStatus: TeacherApplicationStatus | null;
}

interface OnboardingContextType {
    // Current step (0 = welcome, 1-5 = steps, 6 = status dashboard)
    currentStep: number;
    setCurrentStep: (step: number) => void;

    // Data
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;

    // Loading states
    loading: boolean;
    saving: boolean;
    autoSaving: boolean; // P1-2 FIX: New state to track auto-save status

    // Actions
    saveCurrentStep: () => Promise<void>;
    loadProfile: () => Promise<void>;
    submitForReview: () => Promise<void>;
}

const defaultData: OnboardingData = {
    profilePhotoUrl: null,
    introVideoUrl: null,
    displayName: '',
    fullName: '',
    gender: null,
    yearsOfExperience: 0,
    bio: '',
    // education field REMOVED
    qualifications: [],
    subjects: [],
    idType: null,
    idNumber: '',
    idImageUrl: null,
    documents: [],
    applicationStatus: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(defaultData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false); // P1-2 FIX: Track auto-save state
    const autoSaveRetryCount = useRef(0); // P1-2 FIX: Track retry attempts
    const MAX_AUTO_SAVE_RETRIES = 3;

    const updateData = useCallback((partial: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...partial }));
    }, []);

    // Step names for analytics
    const STEP_NAMES = ['welcome', 'photo', 'experience', 'subjects', 'identity', 'review', 'status'];

    // Wrapped setCurrentStep to track step views
    const handleSetCurrentStep = useCallback((step: number) => {
        const stepName = STEP_NAMES[step] || `step_${step}`;

        // Track step view
        if (step > 0 && step < 6) {
            trackEvent(TEACHER_EVENTS.ONBOARDING_STEP_VIEWED, { onboarding_step: stepName });
        }

        // Track step completion (when moving forward from a step)
        if (step > currentStep && currentStep > 0 && currentStep < 6) {
            const completedStepName = STEP_NAMES[currentStep] || `step_${currentStep}`;
            trackEvent(TEACHER_EVENTS.ONBOARDING_STEP_COMPLETED, { onboarding_step: completedStepName });
        }

        setCurrentStep(step);
    }, [currentStep]);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, status, qualifications] = await Promise.all([
                teacherApi.getProfile(),
                teacherApi.getApplicationStatus().catch(() => null),
                teacherApi.getQualifications().catch(() => []),
            ]);

            if (profile) {
                setData({
                    profilePhotoUrl: profile.profilePhotoUrl || null,
                    introVideoUrl: profile.introVideoUrl || null,
                    displayName: profile.displayName || '',
                    fullName: profile.fullName || '',
                    gender: profile.gender as Gender || null,
                    yearsOfExperience: profile.yearsOfExperience || 0,
                    bio: profile.bio || '',
                    // education field REMOVED
                    subjects: profile.subjects || [],
                    idType: profile.idType || null,
                    idNumber: profile.idNumber || '',
                    idImageUrl: profile.idImageUrl || null,
                    documents: profile.documents || [],
                    applicationStatus: status,
                    qualifications: qualifications, // Add qualifications to data
                });

                // Determine starting step based on strict completion
                if (status?.applicationStatus === 'SUBMITTED' ||
                    status?.applicationStatus === 'APPROVED' ||
                    status?.applicationStatus === 'REJECTED' ||
                    status?.applicationStatus === 'CHANGES_REQUESTED' ||
                    status?.applicationStatus === 'INTERVIEW_REQUIRED' ||
                    status?.applicationStatus === 'INTERVIEW_SCHEDULED') {
                    setCurrentStep(6); // Status dashboard
                } else if (profile.idNumber && profile.idImageUrl && profile.subjects?.length > 0) {
                    setCurrentStep(5); // Review (All previous steps done)
                } else if (profile.subjects?.length > 0) {
                    // Check if previous steps (Experience/Qualifications) are actually done?
                    // Ideally we should checks qualifications here too, but if subjects are present, 
                    // users likely passed step 2. However, strictly:
                    if (qualifications.length > 0) {
                        setCurrentStep(4); // Documents/Identity
                    } else {
                        setCurrentStep(2); // Back to Experience if no quals
                    }
                } else if (profile.bio && qualifications.length > 0) {
                    setCurrentStep(3); // Subjects
                } else if (profile.displayName && profile.profilePhotoUrl) {
                    setCurrentStep(2); // Experience
                } else if (profile.displayName) {
                    setCurrentStep(1); // Photo Step (Step 1 is Photo, Step 0 is Welcome)
                    // Wait, Welcome is 0. Photo is 1.
                    // If they have nothing, they go to 0 or 1? 
                    // Usually Welcome (0) -> Click 'Start' -> Photo (1).
                    // If they have registration data, maybe 1. 
                    // Let's stick to:
                    // 0: Welcome
                    // 1: Photo
                    // 2: Experience
                    // 3: Subjects
                    // 4: Identity
                    // 5: Review

                } else {
                    setCurrentStep(0); // Welcome
                }
            }
        } catch (error) {
            console.error('Failed to load profile', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveCurrentStep = useCallback(async () => {
        setSaving(true);
        try {
            await teacherApi.updateProfile({
                displayName: data.displayName,
                fullName: data.fullName,
                bio: data.bio,
                yearsOfExperience: Number(data.yearsOfExperience) || 0, // Ensure number
                // education field REMOVED - qualifications managed separately
                gender: data.gender || undefined,
                profilePhotoUrl: data.profilePhotoUrl || undefined,
                introVideoUrl: data.introVideoUrl || undefined,
                // ID Verification fields (cast to enum type)
                idType: data.idType as any || undefined,
                idNumber: data.idNumber || undefined,
                idImageUrl: data.idImageUrl || undefined,
            });
        } catch (error: any) {
            console.error('Failed to save step', error);

            // CRITICAL: Always show user-friendly error messages
            if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                console.error('VALIDATION ERROR DETAILS:', errorMessage);

                // Show validation error to user
                if (Array.isArray(errorMessage)) {
                    toast.error(errorMessage.join(', ') || 'فشل حفظ البيانات. الرجاء التحقق من الحقول المطلوبة.');
                } else {
                    toast.error(errorMessage || 'فشل حفظ البيانات. الرجاء المحاولة مرة أخرى.');
                }
            } else {
                // Network or unknown error
                toast.error('فشل حفظ البيانات. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
            }

            throw error;
        } finally {
            setSaving(false);
        }
    }, [data]);

    const submitForReview = useCallback(async () => {
        setSaving(true);
        try {
            await teacherApi.submitForReview();
            const status = await teacherApi.getApplicationStatus();
            updateData({ applicationStatus: status });

            // Track application submission
            trackEvent(TEACHER_EVENTS.APPLICATION_SUBMITTED);

            setCurrentStep(6); // Go to status dashboard
        } catch (error: any) {
            console.error('Failed to submit for review', error);

            // CRITICAL: Always show user-friendly error messages
            if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                toast.error(errorMessage || 'فشل إرسال الطلب. الرجاء التحقق من إكمال جميع الحقول المطلوبة.');
            } else {
                toast.error('فشل إرسال الطلب. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
            }

            throw error;
        } finally {
            setSaving(false);
        }
    }, [updateData]);

    // P1-2 FIX: IMPROVED AUTO-SAVE with error handling and retry logic
    const [hasLoadedInitially, setHasLoadedInitially] = useState(false);

    useEffect(() => {
        // Mark as loaded after first profile load
        if (!loading && !hasLoadedInitially) {
            setHasLoadedInitially(true);
            return;
        }

        // Don't auto-save during loading or before initial load
        if (loading || !hasLoadedInitially) return;

        // Don't auto-save if on welcome or status dashboard
        if (currentStep === 0 || currentStep === 6) return;

        // Don't auto-save if manual save is in progress
        if (saving) return;

        // P1-2 FIX: Increased debounce to 3 seconds to reduce API calls
        const timer = setTimeout(async () => {
            setAutoSaving(true);
            autoSaveRetryCount.current = 0; // Reset retry count

            const attemptAutoSave = async (attempt: number): Promise<void> => {
                try {
                    await teacherApi.updateProfile({
                        displayName: data.displayName || undefined,
                        fullName: data.fullName || undefined,
                        bio: data.bio || undefined,
                        yearsOfExperience: data.yearsOfExperience || undefined,
                        // education field REMOVED
                        gender: data.gender || undefined,
                        profilePhotoUrl: data.profilePhotoUrl || undefined,
                        introVideoUrl: data.introVideoUrl || undefined,
                    });

                    // P1-2 FIX: Success - reset retry count
                    autoSaveRetryCount.current = 0;
                    setAutoSaving(false);

                } catch (err: any) {
                    console.error(`Auto-save failed (attempt ${attempt}/${MAX_AUTO_SAVE_RETRIES}):`, err);

                    // P1-2 FIX: Retry with exponential backoff
                    if (attempt < MAX_AUTO_SAVE_RETRIES) {
                        autoSaveRetryCount.current = attempt;
                        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s

                        await new Promise(resolve => setTimeout(resolve, backoffDelay));
                        return attemptAutoSave(attempt + 1);
                    } else {
                        // P1-2 FIX: All retries failed - show error to user
                        setAutoSaving(false);

                        // Only show error for network/server issues, not validation errors
                        const isNetworkError = !err.response || err.response.status >= 500;
                        if (isNetworkError) {
                            toast.error('فشل الحفظ التلقائي. تحقق من اتصال الإنترنت.', {
                                duration: 5000,
                                action: {
                                    label: 'إعادة المحاولة',
                                    onClick: () => {
                                        // Allow manual retry
                                        attemptAutoSave(1);
                                    }
                                }
                            });
                        }
                    }
                }
            };

            await attemptAutoSave(1);
        }, 3000); // P1-2 FIX: Increased from 2s to 3s

        return () => clearTimeout(timer);
    }, [data, loading, hasLoadedInitially, currentStep, saving]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return (
        <OnboardingContext.Provider
            value={{
                currentStep,
                setCurrentStep: handleSetCurrentStep, // Use wrapped version with analytics
                data,
                updateData,
                loading,
                saving,
                autoSaving, // P1-2 FIX: Expose auto-save status
                saveCurrentStep,
                loadProfile,
                submitForReview,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
}
