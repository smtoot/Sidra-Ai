'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Clock,
    ChevronRight,
    ChevronLeft,
    Settings2,
    CheckCircle2,
    Plus,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { DayOfWeek } from '@sidra/shared';
import { cn } from '@/lib/utils';
import { WizardState, AvailabilityPeriod } from '../AvailabilityWizard';

type CustomizationScreenProps = {
    state: WizardState;
    onUpdate: (updates: Partial<WizardState>) => void;
    onNext: () => void;
    onBack: () => void;
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

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const min = (i % 2 === 0 ? '00' : '30');
    return `${hour}:${min}`;
});

export default function CustomizationScreen({ state, onUpdate, onNext, onBack }: CustomizationScreenProps) {
    const [activeDay, setActiveDay] = useState<DayOfWeek | null>(null);
    const [customizedDays, setCustomizedDays] = useState<Record<DayOfWeek, AvailabilityPeriod[]>>(state.dailyCustomization);

    const toggleCustom = (day: DayOfWeek) => {
        if (customizedDays[day]) {
            // Revert to default
            const next = { ...customizedDays };
            delete next[day];
            setCustomizedDays(next);
        } else {
            // Start customizing with defaults as base
            setCustomizedDays({
                ...customizedDays,
                [day]: [...state.defaultPeriods]
            });
            setActiveDay(day);
        }
    };

    const updateDayPeriods = (day: DayOfWeek, periods: AvailabilityPeriod[]) => {
        setCustomizedDays({
            ...customizedDays,
            [day]: periods
        });
    };

    const handleNext = () => {
        onUpdate({ dailyCustomization: customizedDays });
        onNext();
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">تخصيص الأيام</h2>
                <p className="text-lg text-text-subtle">
                    هل ترغب في تغيير المواعيد لأيام معينة؟ يمكنك تخصيص كل يوم على حدة أو استخدام المواعيد الافتراضية.
                </p>
            </div>

            <div className="space-y-4">
                {state.selectedDays.map((day) => {
                    const isCustom = !!customizedDays[day];
                    const periods = customizedDays[day] || state.defaultPeriods;

                    return (
                        <div key={day} className={cn(
                            "bg-surface rounded-2xl border transition-all overflow-hidden",
                            activeDay === day ? "border-primary shadow-md ring-4 ring-primary/5" : "border-gray-100"
                        )}>
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                                        isCustom ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                                    )}>
                                        {DAY_LABELS[day][0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-primary">{DAY_LABELS[day]}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {periods.map((p, i) => (
                                                <span key={i} className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                                                    {p.startTime} - {p.endTime}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={isCustom ? "outline" : "ghost"}
                                        size="sm"
                                        onClick={() => toggleCustom(day)}
                                        className={cn("gap-2", isCustom && "text-accent border-accent/20 hover:bg-accent/5")}
                                    >
                                        {isCustom ? <RotateCcw className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                                        {isCustom ? "استعادة الافتراضي" : "تخصيص"}
                                    </Button>

                                    {isCustom && (
                                        <Button
                                            variant={activeDay === day ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setActiveDay(activeDay === day ? null : day)}
                                        >
                                            {activeDay === day ? "إغلاق التعديل" : "تعديل"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {activeDay === day && isCustom && (
                                <div className="p-5 bg-gray-50/50 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2">
                                    <DayPeriodEditor
                                        periods={customizedDays[day]}
                                        onChange={(p) => updateDayPeriods(day, p)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex-1" />

            <div className="flex justify-between pt-6 border-t">
                <Button variant="ghost" onClick={onBack} size="lg" className="gap-2 text-lg">
                    <ChevronRight className="w-5 h-5" />
                    السابق
                </Button>
                <Button
                    onClick={handleNext}
                    size="lg"
                    className="px-10 gap-2 text-lg font-bold"
                >
                    متابعة
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}

function DayPeriodEditor({ periods, onChange }: { periods: AvailabilityPeriod[], onChange: (p: AvailabilityPeriod[]) => void }) {
    const addPeriod = () => {
        if (periods.length >= 5) return;
        const last = periods[periods.length - 1];
        const start = last ? last.endTime : '09:00';
        const startIdx = TIME_OPTIONS.indexOf(start);
        const end = TIME_OPTIONS[Math.min(startIdx + 2, TIME_OPTIONS.length - 1)] || '23:30';
        onChange([...periods, { startTime: start, endTime: end }]);
    };

    const removePeriod = (index: number) => {
        onChange(periods.filter((_, i) => i !== index));
    };

    const updatePeriod = (index: number, updates: Partial<AvailabilityPeriod>) => {
        const next = [...periods];
        next[index] = { ...next[index], ...updates };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {periods.map((period, index) => (
                <div key={index} className="flex items-center gap-3">
                    <select
                        value={period.startTime}
                        onChange={(e) => updatePeriod(index, { startTime: e.target.value })}
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                        {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                    <span className="text-gray-400">إلى</span>
                    <select
                        value={period.endTime}
                        onChange={(e) => updatePeriod(index, { endTime: e.target.value })}
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                        {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePeriod(index)}
                        disabled={periods.length <= 1}
                        className="text-error hover:bg-error/10 h-10 w-10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            {periods.length < 5 && (
                <Button variant="ghost" size="sm" onClick={addPeriod} className="gap-2 text-primary hover:bg-primary/5">
                    <Plus className="w-4 h-4" />
                    إضافة فترة
                </Button>
            )}
        </div>
    );
}
