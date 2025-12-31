'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { DayOfWeek } from '@sidra/shared';
import { Clock } from 'lucide-react';
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

    // Modal State
    const [exceptionModalOpen, setExceptionModalOpen] = useState(false);

    useEffect(() => {
        loadData();
        // Detect timezone
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setTimezone(tz);
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
        } catch (err) {
            console.error('Failed to load data', err);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
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
