'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { Globe, CheckCircle } from 'lucide-react';
import TimezoneSelector from '@/components/common/TimezoneSelector';
import { getUserTimezone } from '@/lib/utils/timezone';
import { toast } from 'sonner';

interface TimezoneSettingsProps {
    isReadOnly?: boolean;
}

export function TimezoneSettings({ isReadOnly = false }: TimezoneSettingsProps) {
    const [timezone, setTimezone] = useState('UTC');
    const [savingTimezone, setSavingTimezone] = useState(false);
    const [timezoneSuccess, setTimezoneSuccess] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await teacherApi.getProfile();
            if (!profile.timezone || profile.timezone === 'UTC') {
                const detectedTimezone = getUserTimezone();
                setTimezone(detectedTimezone);
            } else {
                setTimezone(profile.timezone);
            }
        } catch (err) {
            console.error('Failed to load profile', err);
            setTimezone(getUserTimezone());
        }
    };

    const handleTimezoneChange = async (newTimezone: string) => {
        setTimezone(newTimezone);
        setSavingTimezone(true);
        try {
            await teacherApi.updateProfile({ timezone: newTimezone });
            setTimezoneSuccess(true);
            setTimeout(() => setTimezoneSuccess(false), 3000);
            toast.success('تم حفظ المنطقة الزمنية');
        } catch (err) {
            console.error('Failed to save timezone', err);
            toast.error('فشل في حفظ المنطقة الزمنية');
        } finally {
            setSavingTimezone(false);
        }
    };

    return (
        <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="font-bold">المنطقة الزمنية</h2>
                </div>
                {savingTimezone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        جاري الحفظ...
                    </span>
                )}
                {timezoneSuccess && !savingTimezone && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        تم الحفظ
                    </span>
                )}
            </div>
            <p className="text-sm text-text-subtle mb-4">
                حدد منطقتك الزمنية المحلية - سيشاهد كل طالب المواعيد حسب منطقته الزمنية الخاصة
            </p>

            <TimezoneSelector
                value={timezone}
                onChange={handleTimezoneChange}
                label=""
                disabled={isReadOnly}
            />

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>ملاحظة:</strong> هذه المنطقة الزمنية تُستخدم لضبط أوقاتك المتاحة. سيرى الطلاب جميع المواعيد محوّلة تلقائياً إلى منطقتهم الزمنية الخاصة.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                    مثال: إذا كنت في الرياض وحددت 3:00 م، سيراها طالب في القاهرة كـ 2:00 م تلقائياً.
                </p>
            </div>
        </div>
    );
}
