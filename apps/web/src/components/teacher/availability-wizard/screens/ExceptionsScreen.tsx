'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Clock,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardState } from '../AvailabilityWizard';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

type ExceptionsScreenProps = {
    state: WizardState;
    onUpdate: (updates: Partial<WizardState>) => void;
    onNext: () => void;
    onBack: () => void;
};

export default function ExceptionsScreen({ state, onUpdate, onNext, onBack }: ExceptionsScreenProps) {
    const [exceptions, setExceptions] = useState(state.exceptions);
    const [showAdd, setShowAdd] = useState(false);

    // New Exception Form State
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [newType, setNewType] = useState<'ALL_DAY' | 'PARTIAL_DAY'>('ALL_DAY');
    const [newStartTime, setNewStartTime] = useState('09:00');
    const [newEndTime, setNewEndTime] = useState('10:00');

    const addException = () => {
        // Prevent duplicate dates in the UI
        const isDuplicate = exceptions.some(ex => ex.startDate === newDate);
        if (isDuplicate) {
            toast.error('لقد قمت بإضافة استثناء لهذا التاريخ مسبقاً');
            return;
        }

        const item = {
            id: crypto.randomUUID(),
            startDate: newDate,
            endDate: newDate,
            type: newType,
            startTime: newType === 'PARTIAL_DAY' ? newStartTime : undefined,
            endTime: newType === 'PARTIAL_DAY' ? newEndTime : undefined,
        };
        const next = [...exceptions, item];
        setExceptions(next);
        setShowAdd(false);
    };

    const removeException = (id: string) => {
        setExceptions(exceptions.filter(e => e.id !== id));
    };

    const handleNext = () => {
        onUpdate({ exceptions });
        onNext();
    };

    const minDate = format(new Date(), 'yyyy-MM-dd');
    const maxDate = format(addDays(new Date(), 31), 'yyyy-MM-dd');

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">الاستثناءات الشهرية</h2>
                <p className="text-lg text-text-subtle">
                    هل لديك أيام محددة تود تغيير مواعيدك فيها خلال الشهر القادم؟ (مثلاً: عطلة خاصة، أو ساعات عمل مختلفة ليوم واحد).
                </p>
            </div>

            <div className="space-y-4">
                {exceptions.length === 0 && !showAdd ? (
                    <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">لا توجد استثناءات مضافة حالياً.</p>
                        <Button
                            variant="link"
                            onClick={() => setShowAdd(true)}
                            className="text-primary font-bold mt-2"
                        >
                            إضافة استثناء جديد
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {exceptions.map((ex) => (
                            <div key={ex.id} className="bg-surface p-4 rounded-2xl border border-gray-100 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex flex-col items-center justify-center text-primary font-bold">
                                        <span className="text-xs text-primary/60">{format(new Date(ex.startDate), 'MMM')}</span>
                                        <span className="text-lg leading-none">{format(new Date(ex.startDate), 'dd')}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary">
                                            {ex.type === 'ALL_DAY' ? 'يوم كامل (مغلق)' : 'ساعات خاصة'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {ex.type === 'PARTIAL_DAY' ? `${ex.startTime} - ${ex.endTime}` : 'غير متاح طوال اليوم'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeException(ex.id)}
                                    className="text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {showAdd ? (
                    <div className="bg-white p-6 rounded-2xl border-2 border-primary shadow-lg space-y-6 animate-in zoom-in-95">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            إضافة استثناء جديد
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-500 mr-2">التاريخ</label>
                                <input
                                    type="date"
                                    min={minDate}
                                    max={maxDate}
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-500 mr-2">نوع الاستثناء</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white"
                                >
                                    <option value="ALL_DAY">يوم كامل (مغلق)</option>
                                    <option value="PARTIAL_DAY">ساعات عمل خاصة</option>
                                </select>
                            </div>
                        </div>

                        {newType === 'PARTIAL_DAY' && (
                            <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-500 mr-2">من</label>
                                    <input
                                        type="time"
                                        step="1800"
                                        value={newStartTime}
                                        onChange={(e) => setNewStartTime(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-500 mr-2">إلى</label>
                                    <input
                                        type="time"
                                        step="1800"
                                        value={newEndTime}
                                        onChange={(e) => setNewEndTime(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setShowAdd(false)}>إلغاء</Button>
                            <Button onClick={addException} className="px-6 font-bold">إضافة</Button>
                        </div>
                    </div>
                ) : (
                    exceptions.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setShowAdd(true)}
                            className="w-full h-14 border-dashed border-2 rounded-2xl gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            إضافة استثناء آخر
                        </Button>
                    )
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                    الاستثناءات تساعدك في إدارة المواعيد غير الاعتيادية خلال الـ 30 يوماً القادمة دون الحاجة لتغيير جدولك الأسبوعي الثابت.
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
