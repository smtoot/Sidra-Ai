'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { teacherApi } from '@/lib/api/teacher';
import { DayOfWeek } from '@sidra/shared';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Screens
import IntroScreen from './screens/IntroScreen';
import DayPickerScreen from './screens/DayPickerScreen';
import DefaultPeriodsScreen from './screens/DefaultPeriodsScreen';
import CustomizationScreen from './screens/CustomizationScreen';
import ExceptionsScreen from './screens/ExceptionsScreen';
import VacationScreen from './screens/VacationScreen';
import ReviewScreen from './screens/ReviewScreen';

export type AvailabilityPeriod = {
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
};

export type WizardState = {
    selectedDays: DayOfWeek[];
    defaultPeriods: AvailabilityPeriod[];
    dailyCustomization: Record<DayOfWeek, AvailabilityPeriod[]>;
    exceptions: any[];
    isOnVacation: boolean;
    vacationRange: { start: string | null; end: string | null };
};

type AvailabilityWizardProps = {
    onClose: () => void;
    onComplete: () => void;
    initialState?: Partial<WizardState>;
};

const STEPS = [
    'مقدمة',
    'اختيار الأيام',
    'المواعيد الافتراضية',
    'تخصيص الأيام',
    'الاستثناءات',
    'الإجازة',
    'المراجعة والتأكيد'
];

export default function AvailabilityWizard({ onClose, onComplete, initialState }: AvailabilityWizardProps) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Core Wizard State
    const [state, setState] = useState<WizardState>({
        selectedDays: initialState?.selectedDays || [],
        defaultPeriods: initialState?.defaultPeriods || [{ startTime: '09:00', endTime: '10:00' }],
        dailyCustomization: initialState?.dailyCustomization || {} as any,
        exceptions: initialState?.exceptions || [],
        isOnVacation: initialState?.isOnVacation || false,
        vacationRange: initialState?.vacationRange || { start: null, end: null },
    });

    const updateState = (updates: Partial<WizardState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const [vacationEnabled, setVacationEnabled] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await teacherApi.getVacationSettings();
                setVacationEnabled(settings.vacationEnabled ?? true);
            } catch (error) {
                console.error('Failed to fetch vacation settings', error);
            }
        };
        fetchSettings();
    }, []);

    const nextStep = () => {
        setStep(prev => {
            let next = prev + 1;
            if (prev === 4 && !vacationEnabled) { // If currently on Exceptions (step 4) and vacation is disabled
                next = prev + 2; // Skip Vacation (step 5)
            }
            return Math.min(next, STEPS.length - 1);
        });
    };

    const prevStep = () => {
        setStep(prev => {
            let next = prev - 1;
            if (prev === 6 && !vacationEnabled) { // If currently on Review (step 6) and vacation is disabled
                next = prev - 2; // Skip Vacation (step 5) backwards
            }
            return Math.max(next, 0);
        });
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            // Transform state to API payload (bulk slots)
            const slots: any[] = [];

            state.selectedDays.forEach(day => {
                const periods = state.dailyCustomization[day] || state.defaultPeriods;
                periods.forEach(p => {
                    slots.push({
                        dayOfWeek: day,
                        startTime: p.startTime,
                        endTime: p.endTime,
                        isRecurring: true
                    });
                });
            });

            // 1. Save Bulk Availability (Slot Regeneration is automatic)
            await teacherApi.setBulkAvailability(slots);

            // 2. Clear then Save Exceptions
            await teacherApi.setBulkExceptions(state.exceptions);

            // 3. Update Vacation Mode
            if (state.isOnVacation && state.vacationRange.end) {
                await teacherApi.updateVacationMode({
                    isOnVacation: true,
                    returnDate: state.vacationRange.end
                });
            } else if (!state.isOnVacation) {
                await teacherApi.updateVacationMode({
                    isOnVacation: false
                });
            }

            toast.success('تم تحديث جدول التوفر بنجاح');
            onComplete();
        } catch (err) {
            console.error('Failed to save availability wizard', err);
            toast.error('حدث خطأ أثناء حفظ التوفر');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0: return <IntroScreen onNext={nextStep} />;
            case 1: return <DayPickerScreen state={state} onUpdate={updateState} onNext={nextStep} onBack={prevStep} />;
            case 2: return <DefaultPeriodsScreen state={state} onUpdate={updateState} onNext={nextStep} onBack={prevStep} />;
            case 3: return <CustomizationScreen state={state} onUpdate={updateState} onNext={nextStep} onBack={prevStep} />;
            case 4: return <ExceptionsScreen state={state} onUpdate={updateState} onNext={nextStep} onBack={prevStep} />;
            case 5: return <VacationScreen state={state} onUpdate={updateState} onNext={nextStep} onBack={prevStep} />;
            case 6: return <ReviewScreen state={state} onConfirm={handleFinalSubmit} onBack={prevStep} loading={loading} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col font-tajawal" dir="rtl">
            {/* Header */}
            <header className="border-b px-6 py-4 flex items-center justify-between bg-surface">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500" />
                    </Button>
                    <h1 className="text-xl font-bold text-primary">مساعد التوفر الذكي V2.1</h1>
                </div>

                {/* Progress */}
                <div className="hidden md:flex items-center gap-2">
                    {STEPS.map((s, i) => {
                        // Hide vacation step from progress bar payload if disabled
                        if (!vacationEnabled && i === 5) return null;

                        return (
                            <div key={i} className="flex items-center">
                                <div className={cn(
                                    "w-3 h-3 rounded-full transition-colors",
                                    i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-gray-200"
                                )} />
                                {i < STEPS.length - 1 && <div className="w-8 h-[2px] bg-gray-100 mx-1" />}
                            </div>
                        );
                    })}
                </div>

                <div className="text-sm font-medium text-text-subtle">
                    الخطوة {step + 1} من {STEPS.length}
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto bg-background/30">
                <div className="max-w-4xl mx-auto px-6 py-10 h-full">
                    {renderStep()}
                </div>
            </main>

            {/* Footer Navigation (Optional for screens that handle their own buttons) */}
            {/* Some screens might want custom buttons, but we can provide a container here if needed */}
        </div>
    );
}
