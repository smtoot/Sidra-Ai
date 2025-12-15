import 'reflect-metadata';
import { Metadata } from 'next';
import TeacherProfileWizard from '@/components/teacher/TeacherProfileWizard';

export const metadata: Metadata = {
    title: 'إعداد الملف الشخصي | سدرة',
    description: 'أكمل ملفك الشخصي لتبدأ في التدريس على منصة سدرة',
};

export default function TeacherOnboardingPage() {
    return (
        <main className="container mx-auto py-10 px-4">
            <TeacherProfileWizard />
        </main>
    );
}
