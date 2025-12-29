'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';

interface RecurringPatternSelectorProps {
    teacherId: string;
    sessionCount: number;
    sessionDuration: number;
    onPatternSelect: (weekday: string, time: string, suggestedDates: Date[]) => void;
    availableWeekdays?: string[];
}

const WEEKDAYS = [
    { value: 'SUNDAY', label: 'الأحد' },
    { value: 'MONDAY', label: 'الاثنين' },
    { value: 'TUESDAY', label: 'الثلاثاء' },
    { value: 'WEDNESDAY', label: 'الأربعاء' },
    { value: 'THURSDAY', label: 'الخميس' },
    { value: 'FRIDAY', label: 'الجمعة' },
    { value: 'SATURDAY', label: 'السبت' },
];

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

interface RecurringAvailabilityResponse {
    available: boolean;
    conflicts: Array<{ date: string; reason: string }>;
    suggestedDates: string[];
    packageEndDate?: string;
    message?: string;
}

export function RecurringPatternSelector({
    teacherId,
    sessionCount,
    sessionDuration,
    onPatternSelect,
    availableWeekdays
}: RecurringPatternSelectorProps) {
    const [selectedWeekday, setSelectedWeekday] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [checking, setChecking] = useState(false);
    const [validationResult, setValidationResult] = useState<RecurringAvailabilityResponse | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>('');

    // Get user's timezone on mount
    useEffect(() => {
        setUserTimezone(getTimezoneDisplay(getUserTimezone()));
    }, []);

    // Filter weekdays based on teacher availability if provided
    const displayWeekdays = availableWeekdays
        ? WEEKDAYS.filter(w => availableWeekdays.includes(w.value))
        : WEEKDAYS;

    // Reset validation when pattern changes
    useEffect(() => {
        setValidationResult(null);
    }, [selectedWeekday, selectedTime]);

    const checkAvailability = async () => {
        if (!selectedWeekday || !selectedTime) return;

        setChecking(true);
        try {
            const response = await fetch(
                `/api/teachers/${teacherId}/availability/check-recurring?` +
                new URLSearchParams({
                    weekday: selectedWeekday,
                    time: selectedTime,
                    sessionCount: sessionCount.toString(),
                    duration: sessionDuration.toString()
                })
            );

            const data: RecurringAvailabilityResponse = await response.json();
            setValidationResult(data);

            if (data.available && data.suggestedDates) {
                const dates = data.suggestedDates.map(d => new Date(d));
                onPatternSelect(selectedWeekday, selectedTime, dates);
            }
        } catch (error) {
            console.error('Failed to check recurring availability:', error);
            setValidationResult({
                available: false,
                conflicts: [],
                suggestedDates: [],
                message: 'حدث خطأ أثناء التحقق من التوفر'
            });
        } finally {
            setChecking(false);
        }
    };

    const canCheck = selectedWeekday && selectedTime;

    return (
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200" dir="rtl">
            <div className="flex items-center gap-2 text-primary font-bold">
                <Calendar className="w-5 h-5" />
                <h3>اختر النمط الأسبوعي للحصص المتكررة</h3>
            </div>

            {/* Timezone Notice - PROMINENT */}
            {userTimezone && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-sm">
                    <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-900 mb-1">
                                جميع الأوقات معروضة بتوقيتك المحلي
                            </p>
                            <p className="text-amber-800">
                                منطقتك الزمنية: <span className="font-semibold">{userTimezone}</span>
                            </p>
                            <p className="text-amber-700 text-xs mt-1">
                                المعلم سيرى الأوقات محولة إلى منطقته الزمنية تلقائياً
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">ستحجز {sessionCount} حصص متكررة تلقائياً</p>
                <p className="text-blue-700">اختر يوم ووقت ثابت كل أسبوع لمدة {sessionCount} أسابيع متتالية</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Weekday Selector */}
                <div className="space-y-2">
                    <Label className="text-base">اليوم الأسبوعي</Label>
                    <select
                        className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedWeekday}
                        onChange={(e) => setSelectedWeekday(e.target.value)}
                    >
                        <option value="">اختر اليوم</option>
                        {displayWeekdays.map(day => (
                            <option key={day.value} value={day.value}>
                                {day.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Time Selector */}
                <div className="space-y-2">
                    <Label className="text-base">الوقت</Label>
                    <select
                        className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                    >
                        <option value="">اختر الوقت</option>
                        {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Check Availability Button */}
            <Button
                onClick={checkAvailability}
                disabled={!canCheck || checking}
                className="w-full gap-2"
                variant={validationResult?.available ? "default" : "outline"}
            >
                <Clock className="w-4 h-4" />
                {checking ? 'جاري التحقق من التوفر...' : 'تحقق من التوفر'}
            </Button>

            {/* Validation Result */}
            {validationResult && (
                <div className={`rounded-lg p-4 border ${
                    validationResult.available
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                }`}>
                    <div className="flex items-start gap-3">
                        {validationResult.available ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className={`font-semibold ${
                                validationResult.available ? 'text-green-800' : 'text-red-800'
                            }`}>
                                {validationResult.available
                                    ? '✓ المعلم متاح لهذا النمط الأسبوعي'
                                    : '✗ المعلم غير متاح لهذا النمط'}
                            </p>
                            {validationResult.message && (
                                <p className="text-sm mt-1 text-gray-700">{validationResult.message}</p>
                            )}

                            {/* Show scheduled dates if available */}
                            {validationResult.available && validationResult.suggestedDates && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-sm font-semibold text-gray-700">المواعيد المقررة:</p>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {validationResult.suggestedDates.map((dateStr, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white border border-green-200 rounded px-3 py-2 text-sm text-gray-800"
                                            >
                                                <span className="font-semibold">الحصة {idx + 1}:</span>{' '}
                                                {format(new Date(dateStr), 'dd MMM yyyy', { locale: ar })}
                                            </div>
                                        ))}
                                    </div>
                                    {validationResult.packageEndDate && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            تنتهي الباقة: {format(new Date(validationResult.packageEndDate), 'dd MMMM yyyy', { locale: ar })}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Show conflicts if any */}
                            {!validationResult.available && validationResult.conflicts.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    <p className="text-sm font-semibold text-red-700">تعارضات:</p>
                                    {validationResult.conflicts.slice(0, 3).map((conflict, idx) => (
                                        <p key={idx} className="text-xs text-red-600">
                                            • {conflict.date}: {conflict.reason}
                                        </p>
                                    ))}
                                    {validationResult.conflicts.length > 3 && (
                                        <p className="text-xs text-red-600">
                                            و {validationResult.conflicts.length - 3} تعارضات أخرى...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
