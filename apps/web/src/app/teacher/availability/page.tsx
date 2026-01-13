'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { DayOfWeek } from '@sidra/shared';
import { Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import AvailabilityGrid from '@/components/teacher/AvailabilityGrid';
import ExceptionsPanel from '@/components/teacher/ExceptionsPanel';
import { ExceptionFormModal } from '@/components/teacher/ExceptionFormModal';

interface AvailabilitySlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}

interface AvailabilityException {
    id: string;
    startDate: string;
    endDate: string;
    type: 'ALL_DAY' | 'PARTIAL_DAY';
    startTime?: string;
    endTime?: string;
    reason?: string;
}

export default function TeacherAvailabilityPage() {
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
    const [loading, setLoading] = useState(true);
    const [timezone, setTimezone] = useState('');
    const [profileTimezone, setProfileTimezone] = useState<string | null>(null);
    const [browserTimezone, setBrowserTimezone] = useState<string>('');

    // Modal State
    const [exceptionModalOpen, setExceptionModalOpen] = useState(false);

    useEffect(() => {
        loadData();
        // Detect timezone
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setTimezone(tz);
            setBrowserTimezone(tz);
        } catch (e) {
            setTimezone('توقيتك المحلي');
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profile, exceptionsData] = await Promise.all([
                teacherApi.getProfile(),
                teacherApi.getExceptions()
            ]);
            setAvailability(profile.availability || []);
            setExceptions(exceptionsData || []);
            setProfileTimezone(profile.timezone || 'UTC');
        } catch (err) {
            console.error('Failed to load data', err);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTimezone = async () => {
        try {
            await teacherApi.updateProfile({ timezone: browserTimezone });
            setProfileTimezone(browserTimezone);
            toast.success(`تم تحديث منطقتك الزمنية إلى ${browserTimezone}`);
            // Reload to ensuring everything syncs
            loadData();
        } catch (err) {
            console.error('Failed to update timezone:', err);
            toast.error('فشل تحديث المنطقة الزمنية');
        }
    };

    const handleSaveAvailability = async (slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[]) => {
        try {
            await teacherApi.setBulkAvailability(slots);
            toast.success('تم حفظ جدول المواعيد بنجاح');
            // Optimistic update or reload? Reload to be safe with IDs
            const profile = await teacherApi.getProfile();
            setAvailability(profile.availability || []);
        } catch (err) {
            console.error('Failed to save availability', err);
            toast.error('فشل في حفظ المواعيد');
            throw err;
        }
    };

    const handleAddException = async (data: any) => {
        try {
            if (data.type === 'PARTIAL_DAY' && data.timeSlots) {
                // Create multiple exceptions
                const promises = data.timeSlots.map((slot: any) =>
                    teacherApi.addException({
                        startDate: data.startDate,
                        endDate: data.endDate,
                        reason: data.reason || undefined,
                        type: 'PARTIAL_DAY',
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    })
                );
                await Promise.all(promises);
            } else {
                // Single exception
                await teacherApi.addException(data);
            }

            toast.success('تم إضافة الاستثناء بنجاح');
            // Reload
            const exceptionsData = await teacherApi.getExceptions();
            setExceptions(exceptionsData || []);
        } catch (err) {
            console.error('Failed to add exception', err);
            toast.error('فشل في إضافة الاستثناء');
            throw err;
        }
    };

    const handleDeleteException = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الاستثناء؟')) return;
        try {
            await teacherApi.removeException(id);
            toast.success('تم حذف الاستثناء');
            const exceptionsData = await teacherApi.getExceptions();
            setExceptions(exceptionsData || []);
        } catch (err) {
            toast.error('فشل في حذف الاستثناء');
        }
    };

    return (
        <TeacherApprovalGuard>
            <div className="max-w-7xl mx-auto py-8 px-4 font-tajawal" dir="rtl">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-8 h-8 text-primary" />
                                مواعيد التوفّر
                            </h1>
                            <p className="text-gray-600 mt-2 text-lg">
                                حدِّد الأوقات البتكون متاح فيها للحجز. الطالب ما بقدر يحجز خارج الأوقات دي.
                            </p>
                        </div>
                        {timezone && (
                            <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 self-start">
                                الأوقات حسب توقيت: <span dir="ltr">{timezone}</span>
                            </div>
                        )}
                    </div>
                </header>

                {profileTimezone && browserTimezone && profileTimezone !== browserTimezone && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 shadow-sm mx-auto max-w-4xl" dir="rtl">
                        <div className="p-2 bg-amber-100 rounded-full shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
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

                {loading ? (
                    <div className="flex items-center justify-center py-20 min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500">جاري تحميل جدولك...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Main Grid */}
                        <section>
                            <AvailabilityGrid
                                availability={availability}
                                onSave={handleSaveAvailability}
                                loading={loading}
                                onScrollToExceptions={() => {
                                    document.getElementById('exceptions-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            />
                        </section>

                        {/* Exceptions Section */}
                        <section id="exceptions-section" className="scroll-mt-20">
                            <ExceptionsPanel
                                exceptions={exceptions}
                                onDelete={handleDeleteException}
                                onAdd={() => setExceptionModalOpen(true)}
                            />
                        </section>
                    </div>
                )}

                {/* Form Modal */}
                <ExceptionFormModal
                    open={exceptionModalOpen}
                    onOpenChange={setExceptionModalOpen}
                    onSave={handleAddException}
                />
            </div>
        </TeacherApprovalGuard>
    );
}
