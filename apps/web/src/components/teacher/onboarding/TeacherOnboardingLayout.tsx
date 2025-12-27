'use client';

import { ReactNode } from 'react';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { StepProgressIndicator } from './StepProgressIndicator';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { Loader2 } from 'lucide-react';

function OnboardingLayoutContent({ children }: { children: ReactNode }) {
    const { currentStep, loading } = useOnboarding();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-text-subtle">جاري تحميل بياناتك...</p>
                </div>
            </div>
        );
    }

    const showProgressIndicator = currentStep >= 1 && currentStep <= 5;

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background" dir="rtl">
            {/* Progress Indicator - Fixed at top for steps 1-5 */}
            {showProgressIndicator && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <StepProgressIndicator currentStep={currentStep} />
                            {/* P1-2 FIX: Auto-save status indicator */}
                            <AutoSaveIndicator />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    );
}

export function TeacherOnboardingLayout({ children }: { children: ReactNode }) {
    return (
        <OnboardingProvider>
            <OnboardingLayoutContent>{children}</OnboardingLayoutContent>
        </OnboardingProvider>
    );
}
