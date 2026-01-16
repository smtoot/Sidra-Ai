'use client';

import { Button } from '@/components/ui/button';
import {
    CheckCircle2,
    Calendar,
    Clock,
    AlertCircle,
    Palmtree,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { DayOfWeek } from '@sidra/shared';
import { WizardState } from '../AvailabilityWizard';
import { format } from 'date-fns';

type ReviewScreenProps = {
    state: WizardState;
    onConfirm: () => void;
    onBack: () => void;
    loading: boolean;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
    [DayOfWeek.SATURDAY]: 'السبت',
    [DayOfWeek.SUNDAY]: 'الأحد',
    [DayOfWeek.MONDAY]: 'الاثنين',
    [DayOfWeek.TUESDAY]: 'الثلاثاء',
    [DayOfWeek.WEDNESDAY]: 'الأربعاء',
    [DayOfWeek.THURSDAY]: 'الخميس',
    [DayOfWeek.FRIDAY]: 'الجمعة'
};

export default function ReviewScreen({ state, onConfirm, onBack, loading }: ReviewScreenProps) {
    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">المراجعة والتأكيد</h2>
                <p className="text-lg text-text-subtle">
                    يرجى مراجعة بيانات جدولك قبل الحفظ النهائي. سيتم تحديث خانات توفرك لـ 31 يوماً قادمة.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Schedule Summary */}
                <div className="bg-surface rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2 border-b pb-3">
                        <Clock className="w-5 h-5" />
                        الجدول الأسبوعي
                    </h3>
                    <div className="space-y-3">
                        {state.selectedDays.map(day => {
                            const periods = state.dailyCustomization[day] || state.defaultPeriods;
                            return (
                                <div key={day} className="flex justify-between items-start">
                                    <span className="font-bold text-primary">{DAY_LABELS[day]}</span>
                                    <div className="flex flex-col items-end gap-1">
                                        {periods.map((p, i) => (
                                            <span key={i} className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/10">
                                                {p.startTime} - {p.endTime}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Exceptions & Vacation Summary */}
                <div className="space-y-6">
                    {/* Vacation Status */}
                    <div className="bg-surface rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2 border-b pb-3">
                            <Palmtree className="w-5 h-5" />
                            حالة الإجازة
                        </h3>
                        {state.isOnVacation ? (
                            <div className="flex items-center gap-3 text-accent font-bold">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>مفعلة حتى {state.vacationRange.end}</span>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">وضع الإجازة غير مفعل</p>
                        )}
                    </div>

                    {/* Exceptions */}
                    <div className="bg-surface rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2 border-b pb-3">
                            <Calendar className="w-5 h-5" />
                            الاستثناءات ({state.exceptions.length})
                        </h3>
                        {state.exceptions.length > 0 ? (
                            <div className="space-y-2">
                                {state.exceptions.map((ex, i) => (
                                    <div key={i} className="text-sm flex justify-between">
                                        <span className="text-gray-600">{format(new Date(ex.startDate), 'yyyy/MM/dd')}</span>
                                        <span className="font-medium text-primary">
                                            {ex.type === 'ALL_DAY' ? 'يوم كامل' : `${ex.startTime} - ${ex.endTime}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">لا توجد استثناءات مضافة</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                <div className="space-y-1">
                    <h4 className="font-bold text-amber-900">ماذا يحدث الآن؟</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                        عند النقر على "تأكيد الجدول"، سيقوم النظام فوراً بمسح المواعيد المستقبلية وإعادة توليد "خانات توفر" جديدة لضمان دقة مواعيدك لـ 31 يوماً قادمة. هذا الإجراء لن يؤثر على حجوزاتك الحالية أو الماضية.
                    </p>
                </div>
            </div>

            <div className="flex-1" />

            <div className="flex justify-between pt-6 border-t">
                <Button variant="ghost" onClick={onBack} size="lg" className="gap-2 text-lg" disabled={loading}>
                    <ChevronRight className="w-5 h-5" />
                    السابق
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    size="lg"
                    className="px-12 gap-3 text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                    تأكيد وحفظ الجدول
                </Button>
            </div>
        </div>
    );
}
