'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatTimeAr, formatDateAr } from '@/lib/utils/availability-format';

interface ExceptionFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => Promise<void>;
}

export function ExceptionFormModal({ open, onOpenChange, onSave }: ExceptionFormModalProps) {
    const [isSingleDay, setIsSingleDay] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState<'ALL_DAY' | 'PARTIAL_DAY'>('ALL_DAY');
    const [reason, setReason] = useState('');

    // Partial day slots
    const [timeSlots, setTimeSlots] = useState<{ startTime: string; endTime: string }[]>([
        { startTime: '09:00', endTime: '17:00' }
    ]);

    // Validation state
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (!open) {
            // Reset form on close
            setErrors([]);
            setStartDate('');
            setEndDate('');
            setType('ALL_DAY');
            setIsSingleDay(true);
            setReason('');
            setTimeSlots([{ startTime: '09:00', endTime: '17:00' }]);
        }
    }, [open]);

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const validate = (): boolean => {
        const newErrors: string[] = [];

        if (!startDate) newErrors.push('يرجى اختيار تاريخ البداية');
        if (!isSingleDay && !endDate) newErrors.push('يرجى اختيار تاريخ النهاية');
        if (!isSingleDay && endDate && startDate && endDate < startDate) {
            newErrors.push('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
        }

        if (type === 'PARTIAL_DAY') {
            if (timeSlots.length === 0) {
                newErrors.push('يرجى إضافة نطاق زمني واحد على الأقل');
            }
            timeSlots.forEach((slot, idx) => {
                if (!slot.startTime || !slot.endTime) {
                    newErrors.push(`النطاق الزمني ${idx + 1}: يرجى تعبئة الأوقات`);
                } else if (slot.endTime <= slot.startTime) {
                    newErrors.push(`النطاق الزمني ${idx + 1}: وقت النهاية يجب أن يكون بعد وقت البداية`);
                }
            });
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            const finalEndDate = isSingleDay ? startDate : endDate;

            await onSave({
                startDate,
                endDate: finalEndDate,
                type,
                reason,
                timeSlots: type === 'PARTIAL_DAY' ? timeSlots : undefined
            });

            onOpenChange(false);
        } catch (error) {
            // Error handled by parent
        }
    };

    // Generate Dynamic Summary
    const getSummary = () => {
        if (!startDate) return null;

        const startAr = formatDateAr(startDate);
        const endAr = endDate ? formatDateAr(endDate) : startAr;

        // Single Day
        if (isSingleDay || startDate === endDate) {
            const dayName = new Date(startDate).toLocaleDateString('ar-SA', { weekday: 'long' });

            if (type === 'ALL_DAY') {
                return `سيتم حجب: ${dayName} ${startAr} طوال اليوم`;
            } else {
                // Partial
                if (timeSlots.length === 1 && timeSlots[0].startTime && timeSlots[0].endTime) {
                    return `سيتم حجب: ${dayName} ${startAr} من ${formatTimeAr(timeSlots[0].startTime)} إلى ${formatTimeAr(timeSlots[0].endTime)}`;
                }
                return `سيتم حجب: ${dayName} ${startAr} (${timeSlots.length} فترات زمنية)`;
            }
        }

        // Date Range
        return `سيتم حجب الفترة: من ${startAr} إلى ${endAr}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">حجب أوقات غير متاحة</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    {/* Date Selection */}
                    <div className="space-y-3">
                        <Label className="font-bold text-gray-700">التاريخ</Label>

                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="singleDay"
                                checked={isSingleDay}
                                onChange={(e) => {
                                    setIsSingleDay(e.target.checked);
                                    if (e.target.checked) setEndDate('');
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="singleDay" className="font-normal cursor-pointer select-none">
                                يوم واحد فقط
                            </Label>
                        </div>

                        <div className={cn("grid gap-3", isSingleDay ? "grid-cols-1" : "grid-cols-2")}>
                            <div>
                                <Label className="text-xs text-gray-500 mb-1.5 block">
                                    {isSingleDay ? 'التاريخ' : 'من'}
                                </Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={getTodayDate()}
                                    className="text-left" // Force LTR for date input
                                />
                            </div>
                            {!isSingleDay && (
                                <div>
                                    <Label className="text-xs text-gray-500 mb-1.5 block">إلى</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || getTodayDate()}
                                        className="text-left"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Exception Type */}
                    <div className="space-y-3">
                        <Label className="font-bold text-gray-700">نوع الاستثناء</Label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setType('ALL_DAY')}
                                className={cn(
                                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                    type === 'ALL_DAY' ? "bg-white shadow text-primary" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                اليوم كامل
                            </button>
                            <button
                                onClick={() => setType('PARTIAL_DAY')}
                                className={cn(
                                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                    type === 'PARTIAL_DAY' ? "bg-white shadow text-primary" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                أوقات محددة
                            </button>
                        </div>
                    </div>

                    {/* Time Slots (Only for Partial) */}
                    {type === 'PARTIAL_DAY' && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold text-gray-700 text-sm">الأوقات المحجوبة</Label>
                                <button
                                    onClick={() => setTimeSlots([...timeSlots, { startTime: '', endTime: '' }])}
                                    className="text-xs font-bold text-primary hover:underline hover:text-primary-700"
                                >
                                    + إضافة وقت آخر
                                </button>
                            </div>

                            <div className="space-y-2">
                                {timeSlots.map((slot, index) => (
                                    <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                            <div>
                                                <Label className="text-[10px] text-gray-500 mb-1 block">من</Label>
                                                <Input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => {
                                                        const newSlots = [...timeSlots];
                                                        newSlots[index].startTime = e.target.value;
                                                        setTimeSlots(newSlots);
                                                    }}
                                                    className="h-9 text-xs" // text-xs for time inputs
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-gray-500 mb-1 block">إلى</Label>
                                                <Input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => {
                                                        const newSlots = [...timeSlots];
                                                        newSlots[index].endTime = e.target.value;
                                                        setTimeSlots(newSlots);
                                                    }}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                        {timeSlots.length > 1 && (
                                            <button
                                                onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
                                                className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label className="font-bold text-gray-700">السبب (اختياري)</Label>
                        <Input
                            placeholder="مثال: سفر، ظرف طارئ..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {/* Summary Preview */}
                    {startDate && (
                        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span className="font-medium">{getSummary()}</span>
                        </div>
                    )}

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200 space-y-1">
                            {errors.map((err, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            إلغاء
                        </Button>
                        <Button
                            className="flex-1 bg-primary hover:bg-primary-700"
                            onClick={handleSave}
                        >
                            تأكيد الحجب
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
