'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Palmtree,
    ChevronRight,
    ChevronLeft,
    Calendar as CalendarIcon,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardState } from '../AvailabilityWizard';
import { format, addDays } from 'date-fns';

type VacationScreenProps = {
    state: WizardState;
    onUpdate: (updates: Partial<WizardState>) => void;
    onNext: () => void;
    onBack: () => void;
};

export default function VacationScreen({ state, onUpdate, onNext, onBack }: VacationScreenProps) {
    const handleToggle = (checked: boolean) => {
        onUpdate({
            isOnVacation: checked,
            vacationRange: checked && !state.vacationRange.end
                ? { start: format(new Date(), 'yyyy-MM-dd'), end: format(addDays(new Date(), 7), 'yyyy-MM-dd') }
                : state.vacationRange
        });
    };

    const minDate = format(new Date(), 'yyyy-MM-dd');

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">وضع الإجازة</h2>
                <p className="text-lg text-text-subtle">
                    هل تخطط لإجازة قريبة؟ يمكنك إيقاف استقبال الحجوزات مؤقتاً وسنقوم بإيقاف ظهور مواعيدك تلقائياً حتى تاريخ عودتك.
                </p>
            </div>

            <div className={cn(
                "p-8 rounded-3xl border-2 transition-all flex flex-col items-center text-center space-y-6",
                state.isOnVacation ? "bg-accent/5 border-accent shadow-sm" : "bg-surface border-gray-100"
            )}>
                <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                    state.isOnVacation ? "bg-accent text-white scale-110" : "bg-gray-100 text-gray-300"
                )}>
                    <Palmtree className="w-12 h-12" />
                </div>

                <div className="space-y-1">
                    <h3 className="font-bold text-2xl text-primary">تفعيل وضع الإجازة</h3>
                    <p className="text-text-subtle">عند التفعيل، لن يظهر أي موعد متاح لك للطلاب.</p>
                </div>

                <Switch
                    checked={state.isOnVacation}
                    onCheckedChange={handleToggle}
                    className="scale-150"
                />
            </div>

            {state.isOnVacation && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            متى تخطط للعودة؟
                        </h4>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-500 mr-2">تاريخ العودة (ستكون متاحاً ابتداءً من هذا اليوم)</label>
                            <input
                                type="date"
                                min={minDate}
                                value={state.vacationRange.end || ''}
                                onChange={(e) => onUpdate({ vacationRange: { ...state.vacationRange, end: e.target.value } })}
                                className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-white text-lg font-medium"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="font-bold text-amber-900 text-sm">تنبيه بخصوص الحصص القائمة:</h5>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                وضع الإجازة يمنع الحجوزات **الجديدة** فقط. إذا كان لديك حصص مؤكدة بالفعل خلال فترة الإجازة، فمن المفترض تقديمها أو التنسيق مع الطالب لإعادة جدولتها.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1" />

            <div className="flex justify-between pt-6 border-t">
                <Button variant="ghost" onClick={onBack} size="lg" className="gap-2 text-lg">
                    <ChevronRight className="w-5 h-5" />
                    السابق
                </Button>
                <Button
                    onClick={onNext}
                    size="lg"
                    className="px-10 gap-2 text-lg font-bold"
                >
                    مراجعة الجدول
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
