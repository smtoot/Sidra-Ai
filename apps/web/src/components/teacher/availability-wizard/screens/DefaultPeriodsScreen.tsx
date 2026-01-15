'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Clock, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardState, AvailabilityPeriod } from '../AvailabilityWizard';

type DefaultPeriodsScreenProps = {
    state: WizardState;
    onUpdate: (updates: Partial<WizardState>) => void;
    onNext: () => void;
    onBack: () => void;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const min = (i % 2 === 0 ? '00' : '30');
    return `${hour}:${min}`;
});

export default function DefaultPeriodsScreen({ state, onUpdate, onNext, onBack }: DefaultPeriodsScreenProps) {
    const [periods, setPeriods] = useState<AvailabilityPeriod[]>(
        state.defaultPeriods.length > 0 ? state.defaultPeriods : [{ startTime: '09:00', endTime: '10:00' }]
    );

    const addPeriod = () => {
        if (periods.length >= 5) return;
        const last = periods[periods.length - 1];
        // Default to 1 hour after last period or 09:00
        const start = last ? last.endTime : '09:00';
        const startIdx = TIME_OPTIONS.indexOf(start);
        const end = TIME_OPTIONS[Math.min(startIdx + 2, TIME_OPTIONS.length - 1)] || '23:30';
        setPeriods([...periods, { startTime: start, endTime: end }]);
    };

    const removePeriod = (index: number) => {
        setPeriods(periods.filter((_, i) => i !== index));
    };

    const updatePeriod = (index: number, updates: Partial<AvailabilityPeriod>) => {
        const next = [...periods];
        next[index] = { ...next[index], ...updates };
        setPeriods(next);
    };

    const validate = () => {
        if (periods.length === 0) return 'يجب إضافة فترة واحدة على الأقل.';

        for (let i = 0; i < periods.length; i++) {
            const p = periods[i];
            const startIdx = TIME_OPTIONS.indexOf(p.startTime);
            const endIdx = TIME_OPTIONS.indexOf(p.endTime);

            if (endIdx <= startIdx) return 'وقت النهاية يجب أن يكون بعد وقت البداية.';
            if (endIdx - startIdx < 2) return 'مدة الفترة يجب ألا تقل عن 60 دقيقة.';

            // Check overlaps
            for (let j = i + 1; j < periods.length; j++) {
                const other = periods[j];
                const oStartIdx = TIME_OPTIONS.indexOf(other.startTime);
                const oEndIdx = TIME_OPTIONS.indexOf(other.endTime);

                if (
                    (startIdx < oEndIdx && endIdx > oStartIdx)
                ) {
                    return 'يوجد تعارض بين الفترات الزمنية.';
                }
            }
        }
        return null;
    };

    const error = validate();

    const handleNext = () => {
        if (!error) {
            onUpdate({ defaultPeriods: periods });
            onNext();
        }
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">المواعيد الافتراضية</h2>
                <p className="text-lg text-text-subtle">
                    حدّد الفترات الزمنية المعتادة لتدريسك. سيتم تطبيق هذه المواعيد على جميع الأيام التي اخترتها، ويمكنك تخصيصها لاحقاً.
                </p>
            </div>

            <div className="space-y-4">
                {periods.map((period, index) => (
                    <div key={index} className="flex items-center gap-4 bg-surface p-4 rounded-2xl border border-gray-100 group animate-in zoom-in-95 duration-200">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 mr-2">من</label>
                                <div className="relative">
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={period.startTime}
                                        onChange={(e) => updatePeriod(index, { startTime: e.target.value })}
                                        className="w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-lg focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    >
                                        {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 mr-2">إلى</label>
                                <div className="relative">
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={period.endTime}
                                        onChange={(e) => updatePeriod(index, { endTime: e.target.value })}
                                        className="w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-lg focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    >
                                        {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {periods.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePeriod(index)}
                                className="text-error hover:bg-error/10 rounded-xl h-12 w-12"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                ))}

                {periods.length < 5 && (
                    <Button
                        variant="outline"
                        onClick={addPeriod}
                        className="w-full h-14 border-dashed border-2 rounded-2xl text-lg font-medium gap-2 hover:bg-primary/5 hover:border-primary transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة فترة زمنية أخرى
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-error/5 border border-error/20 p-4 rounded-xl flex items-center gap-3 animate-in shake-in duration-300">
                    <AlertCircle className="w-5 h-5 text-error" />
                    <p className="text-sm font-bold text-error">{error}</p>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <div className="text-blue-600 text-xl">💡</div>
                <p className="text-sm text-blue-800 leading-relaxed">
                    نظام سدرة يولد حصصاً بطول 60 دقيقة. إذا وضعت فترة زمنية مثل (09:00 - 10:30)، سيتم توليد حصتين: (09:00 - 10:00) و (09:30 - 10:30).
                </p>
            </div>

            <div className="flex-1" />

            <div className="flex justify-between pt-6 border-t">
                <Button variant="ghost" onClick={onBack} size="lg" className="gap-2 text-lg">
                    <ChevronRight className="w-5 h-5" />
                    السابق
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!!error}
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
