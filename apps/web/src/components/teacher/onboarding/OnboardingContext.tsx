'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { teacherApi, TeacherApplicationStatus } from '@/lib/api/teacher';
import { Gender } from '@sidra/shared';

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
    education: string;
    bio: string;

    // Step 3: Subjects (managed separately via API)
    subjects: any[];

    // Step 4: Documents
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
    education: '',
    bio: '',
    subjects: [],
    documents: [],
    applicationStatus: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(defaultData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const updateData = useCallback((partial: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...partial }));
    }, []);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, status] = await Promise.all([
                teacherApi.getProfile(),
                teacherApi.getApplicationStatus().catch(() => null),
            ]);

            if (profile) {
                setData({
                    profilePhotoUrl: profile.profilePhotoUrl || null,
                    introVideoUrl: profile.introVideoUrl || null,
                    displayName: profile.displayName || '',
                    fullName: profile.fullName || '',
                    gender: profile.gender as Gender || null,
                    yearsOfExperience: profile.yearsOfExperience || 0,
                    education: profile.education || '',
                    bio: profile.bio || '',
                    subjects: profile.subjects || [],
                    documents: profile.documents || [],
                    applicationStatus: status,
                });

                // Determine starting step based on completion
                if (status?.applicationStatus === 'SUBMITTED' ||
                    status?.applicationStatus === 'APPROVED' ||
                    status?.applicationStatus === 'REJECTED' ||
                    status?.applicationStatus === 'CHANGES_REQUESTED' ||
                    status?.applicationStatus === 'INTERVIEW_REQUIRED' ||
                    status?.applicationStatus === 'INTERVIEW_SCHEDULED') {
                    setCurrentStep(6); // Status dashboard
                } else if (profile.subjects?.length > 0) {
                    setCurrentStep(4); // Documents
                } else if (profile.bio) {
                    setCurrentStep(3); // Subjects
                } else if (profile.displayName) {
                    setCurrentStep(2); // Experience
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
                yearsOfExperience: data.yearsOfExperience,
                education: data.education,
                gender: data.gender || undefined,
                profilePhotoUrl: data.profilePhotoUrl || undefined,
                introVideoUrl: data.introVideoUrl || undefined,
            });
        } catch (error) {
            console.error('Failed to save step', error);
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
            setCurrentStep(6); // Go to status dashboard
        } catch (error) {
            console.error('Failed to submit for review', error);
            throw error;
        } finally {
            setSaving(false);
        }
    }, [updateData]);

    // AUTO-SAVE: Debounced save when data changes (after initial load)
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

        // Debounce: save after 2 seconds of no changes
        const timer = setTimeout(() => {
            teacherApi.updateProfile({
                displayName: data.displayName || undefined,
                fullName: data.fullName || undefined,
                bio: data.bio || undefined,
                yearsOfExperience: data.yearsOfExperience || undefined,
                education: data.education || undefined,
                gender: data.gender || undefined,
                profilePhotoUrl: data.profilePhotoUrl || undefined,
                introVideoUrl: data.introVideoUrl || undefined,
            }).catch(err => {
                console.error('Auto-save failed:', err);
                // Silent fail - don't interrupt user
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, [data, loading, hasLoadedInitially, currentStep]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return (
        <OnboardingContext.Provider
            value={{
                currentStep,
                setCurrentStep,
                data,
                updateData,
                loading,
                saving,
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
