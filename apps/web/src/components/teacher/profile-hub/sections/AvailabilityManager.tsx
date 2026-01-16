'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import AvailabilityGrid from '@/components/teacher/AvailabilityGrid';
import { DayOfWeek } from '@sidra/shared';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AvailabilitySlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}

export function AvailabilityManager() {
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileTimezone, setProfileTimezone] = useState<string | null>(null);
    const [browserTimezone, setBrowserTimezone] = useState<string>('');

    useEffect(() => {
        loadAvailability();
        setBrowserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, []);

    const loadAvailability = async () => {
        setLoading(true);
        try {
            // Availability comes from profile
            const profile = await teacherApi.getProfile();
            setAvailability(profile.availability || []);
            setProfileTimezone(profile.timezone || 'UTC');
        } catch (err) {
            console.error('Failed to load availability:', err);
            toast.error('فشل تحميل المواعيد');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[]) => {
        try {
            // Use setBulkAvailability to replace all slots
            await teacherApi.setBulkAvailability(slots);
            toast.success('تم حفظ المواعيد بنجاح');
            await loadAvailability();
        } catch (err) {
            console.error('Failed to save availability:', err);
            toast.error('فشل حفظ المواعيد');
            throw err;
        }
    };

    const handleUpdateTimezone = async () => {
        try {
            await teacherApi.updateProfile({ timezone: browserTimezone });
            setProfileTimezone(browserTimezone);
            toast.success(`تم تحديث منطقتك الزمنية إلى ${browserTimezone}`);
            // Reload to ensuring everything syncs
            await loadAvailability();
        } catch (err) {
            console.error('Failed to update timezone:', err);
            toast.error('فشل تحديث المنطقة الزمنية');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    const showTimezoneWarning = profileTimezone && browserTimezone && profileTimezone !== browserTimezone;

    return (
        <div className="space-y-6">
            {showTimezoneWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3" dir="rtl">
                    <div className="p-2 bg-amber-100 rounded-full shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-800 text-base mb-1">تنبيه اختلاف المنطقة الزمنية</h3>
                        <p className="text-amber-700 text-sm leading-relaxed mb-3">
                            منطقتك الزمنية المسجلة هي <strong>{profileTimezone}</strong>، ولكن متصفحك يظهر أنك في <strong>{browserTimezone}</strong>.
                            <br />
                            هذا قد يسبب ظهور المواعيد بشكل خاطئ للطلاب. هل تريد تحديث الإعدادات؟
                        </p>
                        <button
                            onClick={handleUpdateTimezone}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm"
                        >
                            نعم، تحديث إلى {browserTimezone}
                        </button>
                    </div>
                </div>
            )}

            <AvailabilityGrid
                availability={availability}
                onSave={handleSave}
                loading={loading}
            />
        </div>
    );
}

