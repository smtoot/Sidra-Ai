'use client';

import 'reflect-metadata';
import TeacherProfileWizard from '@/components/teacher/TeacherProfileWizard';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';

export default function TeacherProfilePage() {
    return (
        <TeacherApprovalGuard>
            <main className="container mx-auto py-10 px-4">
                <TeacherProfileWizard />
            </main>
        </TeacherApprovalGuard>
    );
}
