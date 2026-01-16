'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { DayOfWeek } from '@sidra/shared';
import { Clock, AlertTriangle, Calendar, Settings2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AvailabilityWizard, { WizardState } from '@/components/teacher/availability-wizard/AvailabilityWizard';
import { format } from 'date-fns';

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
    const [profile, setProfile] = useState<any>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [vacationEnabled, setVacationEnabled] = useState(true);

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
            const [profileData, exceptionsData, vacationSettings] = await Promise.all([
                teacherApi.getProfile(),
                teacherApi.getExceptions(),
                teacherApi.getVacationSettings()
            ]);
            setProfile(profileData);
            setAvailability(profileData.availability || []);
            setExceptions(exceptionsData || []);
            setVacationEnabled(vacationSettings.vacationEnabled ?? true);
        } catch (err) {
            console.error('Failed to load data', err);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleWizardComplete = () => {
        setIsWizardOpen(false);
        loadData();
    };

    if (isWizardOpen) {
        // Map current data to wizard initial state
        const initialWizardState: Partial<WizardState> = {
            selectedDays: Array.from(new Set(availability.map(s => s.dayOfWeek))),
            defaultPeriods: availability.length > 0 ? [] : [{ startTime: '09:00', endTime: '10:00' }],
            dailyCustomization: availability.reduce((acc, slot) => {
                if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
                acc[slot.dayOfWeek].push({ startTime: slot.startTime, endTime: slot.endTime });
                return acc;
            }, {} as any),
            exceptions: exceptions.map(ex => ({
                id: ex.id,
                startDate: ex.startDate,
                endDate: ex.endDate,
                type: ex.type,
                startTime: ex.startTime,
                endTime: ex.endTime
            })),
            isOnVacation: profile?.isOnVacation || false,
            vacationRange: { start: null, end: profile?.vacationEndDate || null }
        } as WizardState;

        return <AvailabilityWizard
            onClose={() => setIsWizardOpen(false)}
            onComplete={handleWizardComplete}
            initialState={initialWizardState}
        />;
    }

    const DAY_LABELS: Record<string, string> = {
        'SATURDAY': 'السبت',
        'SUNDAY': 'الأحد',
        'MONDAY': 'الاثنين',
        'TUESDAY': 'الثلاثاء',
        'WEDNESDAY': 'الأربعاء',
        'THURSDAY': 'الخميس',
        'FRIDAY': 'الجمعة'
    };

    return (
        <TeacherApprovalGuard>
            <div className="max-w-5xl mx-auto py-10 px-6 font-tajawal" dir="rtl">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Clock className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">مواعيد التوفّر</h1>
                        </div>
                        <p className="text-gray-500 text-lg max-w-xl">
                            إدارة جدولك الأسبوعي، الاستثناءات، ووضع الإجازة من مكان واحد باستخدام المساعد الذكي.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsWizardOpen(true)}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold px-8 h-14 rounded-2xl shadow-xl shadow-primary/20 animate-in zoom-in-95"
                    >
                        <Sparkles className="w-5 h-5" />
                        تحديث الجدول عبر المساعد
                    </Button>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[400px] bg-surface rounded-3xl border border-gray-100 italic">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-gray-400">جاري تحميل بياناتك مـن سدرة...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Weekly Summary Column */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-surface rounded-3xl border border-gray-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        الجدول الأسبوعي الحالي
                                    </h2>
                                    {timezone && (
                                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border">
                                            التوقيت: <span dir="ltr">{timezone}</span>
                                        </span>
                                    )}
                                </div>

                                {availability.length === 0 ? (
                                    <div className="text-center py-10 space-y-4">
                                        <p className="text-gray-400">لم تقم بإعداد جدول مواعيدك بعد.</p>
                                        <Button variant="outline" onClick={() => setIsWizardOpen(true)} className="rounded-xl">بدء الإعداد الآن</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(
                                            availability.reduce((acc: Record<string, AvailabilitySlot[]>, slot: AvailabilitySlot) => {
                                                if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
                                                acc[slot.dayOfWeek].push(slot);
                                                return acc;
                                            }, {} as Record<string, AvailabilitySlot[]>)
                                        ).map(([day, slots]: [string, AvailabilitySlot[]]) => (
                                            <div key={day} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                                                <span className="font-bold text-primary w-24">{DAY_LABELS[day]}</span>
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    {slots.map((slot: AvailabilitySlot, i: number) => (
                                                        <span key={i} className="text-sm bg-white border border-gray-100 px-3 py-1 rounded-lg text-primary/80 font-medium">
                                                            {slot.startTime} - {slot.endTime}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Sidebar */}
                        <div className="space-y-6">
                            {/* Vacation Card */}
                            {vacationEnabled && (
                                <div className={cn(
                                    "rounded-3xl border p-6 space-y-4 transition-all",
                                    profile?.isOnVacation ? "bg-accent/5 border-accent/20" : "bg-surface border-gray-100"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-primary flex items-center gap-2">
                                            <Settings2 className="w-5 h-5" />
                                            وضع الإجازة
                                        </h3>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            profile?.isOnVacation ? "bg-accent" : "bg-gray-200"
                                        )} />
                                    </div>

                                    {profile?.isOnVacation ? (
                                        <div className="text-center space-y-4 py-4">
                                            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                                                <div className="text-2xl">🌴</div>
                                            </div>
                                            <h4 className="font-bold text-gray-900">أنت في إجازة حالياً</h4>
                                            <p className="text-sm text-text-subtle px-4">
                                                جميع الحجوزات المستقبلية متوقفة حتى تقوم بتعطيل وضع الإجازة.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-subtle leading-relaxed">
                                            عند تفعيل وضع الإجازة، سيتم إخفاء جميع الأوقات المتاحة ولن يتمكن الطلاب من حجز مواعيد جديدة حتى تعود.
                                        </p>
                                    )}

                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full gap-2 border-dashed",
                                            profile?.isOnVacation
                                                ? "border-accent text-accent hover:bg-accent/5"
                                                : "text-text-subtle hover:text-primary hover:border-primary/30"
                                        )}
                                        onClick={() => setIsWizardOpen(true)}
                                    >
                                        {profile?.isOnVacation ? 'إيقاف وضع الإجازة' : 'تفعيل وضع الإجازة'}
                                    </Button>
                                </div>
                            )}
                            {/* Exceptions Card */}
                            <div className="bg-surface rounded-3xl border border-gray-100 p-6 space-y-4">
                                <h3 className="font-bold text-primary flex items-center gap-2 border-b pb-3">
                                    <Sparkles className="w-5 h-5" />
                                    الاستثناءات
                                </h3>
                                {exceptions.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">لا توجد استثناءات حالية</p>
                                ) : (
                                    <div className="space-y-2">
                                        {exceptions.slice(0, 3).map((ex: AvailabilityException, i: number) => (
                                            <div key={i} className="text-xs flex justify-between border-b border-gray-50 pb-2 last:border-0">
                                                <span className="text-gray-500">{format(new Date(ex.startDate), 'yyyy-MM-dd')}</span>
                                                <span className="font-bold text-primary/70">{ex.type === 'ALL_DAY' ? 'يوم كامل' : 'ساعات خاصة'}</span>
                                            </div>
                                        ))}
                                        {exceptions.length > 3 && (
                                            <p className="text-[10px] text-center text-gray-400">+{exceptions.length - 3} استثناءات إضافية</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherApprovalGuard>
    );
}
