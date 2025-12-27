'use client';

import { Settings, Lock } from 'lucide-react';
import { useTeacherApplicationStatus } from '@/hooks/useTeacherApplicationStatus';
import { DemoSettings } from '@/components/teacher/settings/DemoSettings';
import { TimezoneSettings } from '@/components/teacher/settings/TimezoneSettings';
import { SlugSettings } from '@/components/teacher/settings/SlugSettings';
import { CancellationPolicySettings } from '@/components/teacher/settings/CancellationPolicySettings';

export default function TeacherSettingsPage() {
    const { isApproved, loading: loadingStatus } = useTeacherApplicationStatus();
    const isReadOnly = !loadingStatus && !isApproved;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 font-tajawal" dir="rtl">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    الإعدادات
                </h1>
                <p className="text-text-subtle mt-1">إعدادات حسابك كمعلم</p>
            </header>

            {/* Read Only Banner */}
            {isReadOnly && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                    <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-yellow-800">الإعدادات للقراءة فقط</h3>
                        <p className="text-sm text-yellow-700">
                            لا يمكنك تعديل الإعدادات حتى تتم الموافقة على طلبك.
                        </p>
                    </div>
                </div>
            )}

            {/* Settings Components */}
            <div className="space-y-6">
                <DemoSettings isReadOnly={isReadOnly} />
                <TimezoneSettings isReadOnly={isReadOnly} />
                <SlugSettings isReadOnly={isReadOnly} />
                <CancellationPolicySettings isReadOnly={isReadOnly} />
            </div>
        </div>
    );
}
