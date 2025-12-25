import 'reflect-metadata';
import { Metadata } from 'next';
import { TeacherOnboardingLayout } from '@/components/teacher/onboarding/TeacherOnboardingLayout';
import { OnboardingWizard } from '@/components/teacher/onboarding/OnboardingWizard';

export const metadata: Metadata = {
    title: 'إعداد ملفك الشخصي | سِدرة',
    description: 'أكمل ملفك الشخصي لتبدأ رحلتك في التدريس على منصة سِدرة',
};

export default function TeacherOnboardingPage() {
    return (
        <TeacherOnboardingLayout>
            <OnboardingWizard />
        </TeacherOnboardingLayout>
    );
}
