'use client';

import { useOnboarding } from './OnboardingContext';
import { WelcomeStep } from './steps/WelcomeStep';
import { PhotoStep } from './steps/PhotoStep';
import { ExperienceStep } from './steps/ExperienceStep';
import { SubjectsStep } from './steps/SubjectsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';
import { StatusDashboard } from './steps/StatusDashboard';

export function OnboardingWizard() {
    const { currentStep } = useOnboarding();

    switch (currentStep) {
        case 0:
            return <WelcomeStep />;
        case 1:
            return <PhotoStep />;
        case 2:
            return <ExperienceStep />;
        case 3:
            return <SubjectsStep />;
        case 4:
            return <DocumentsStep />;
        case 5:
            return <ReviewStep />;
        case 6:
            return <StatusDashboard />;
        default:
            return <WelcomeStep />;
    }
}
