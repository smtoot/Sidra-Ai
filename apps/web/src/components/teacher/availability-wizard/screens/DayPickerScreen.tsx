'use client';

import { Button } from '@/components/ui/button';
import { DayOfWeek } from '@sidra/shared';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardState } from '../AvailabilityWizard';

type DayPickerScreenProps = {
    state: WizardState;
    onUpdate: (updates: Partial<WizardState>) => void;
    onNext: () => void;
    onBack: () => void;
};

const DAYS = [
    { id: DayOfWeek.SATURDAY, label: 'السبت' },
    { id: DayOfWeek.SUNDAY, label: 'الأحد' },
    { id: DayOfWeek.MONDAY, label: 'الاثنين' },
    { id: DayOfWeek.TUESDAY, label: 'الثلاثاء' },
    { id: DayOfWeek.WEDNESDAY, label: 'الأربعاء' },
    { id: DayOfWeek.THURSDAY, label: 'الخميس' },
    { id: DayOfWeek.FRIDAY, label: 'الجمعة' }
];

export default function DayPickerScreen({ state, onUpdate, onNext, onBack }: DayPickerScreenProps) {
    const toggleDay = (day: DayOfWeek) => {
        const current = state.selectedDays;
        const next = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        onUpdate({ selectedDays: next });
    };

    const isAnySelected = state.selectedDays.length > 0;

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">أيام التدريس</h2>
                <p className="text-lg text-text-subtle">
                    اختر الأيام التي ترغب في استقبال حصص فيها خلال الأسبوع.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DAYS.map((day) => {
                    const isSelected = state.selectedDays.includes(day.id);
                    return (
                        <div
                            key={day.id}
                            onClick={() => toggleDay(day.id)}
                            className={cn(
                                "cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-4 text-center group",
                                isSelected
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-surface border-gray-100 hover:border-gray-200"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                isSelected
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white border-gray-100 group-hover:border-gray-200 text-transparent"
                            )}>
                                <Check className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "text-xl font-bold transition-colors",
                                isSelected ? "text-primary" : "text-gray-500"
                            )}>
                                {day.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                <div className="text-amber-600 text-xl">💡</div>
                <p className="text-sm text-amber-800 leading-relaxed">
                    يمكنك تعديل المواعيد الدقيقة لكل يوم في الخطوات القادمة. حالياً، حدّد فقط الأيام التي تكون متاحاً فيها بشكل عام.
                </p>
            </div>

            <div className="flex-1" />

            <div className="flex justify-between pt-6 border-t">
                <Button variant="ghost" onClick={onBack} size="lg" className="gap-2 text-lg">
                    <ChevronRight className="w-5 h-5" />
                    السابق
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!isAnySelected}
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
