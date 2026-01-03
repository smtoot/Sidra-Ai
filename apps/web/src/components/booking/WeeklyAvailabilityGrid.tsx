'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, Clock, Globe, Check, X, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { packageApi } from '@/lib/api/package';
import { marketplaceApi } from '@/lib/api/marketplace';
import type { RecurringPattern, Weekday, MultiSlotAvailabilityResponse, ScheduledSession } from './types';

interface WeeklyAvailabilityGridProps {
    teacherId: string;
    recurringSessionCount: number;
    sessionDuration?: number;
    maxSlots?: number;
    onPatternsChange: (patterns: RecurringPattern[]) => void;
    onAvailabilityCheck: (response: MultiSlotAvailabilityResponse) => void;
}

// Arabic weekday labels (matching Saudi week: Sunday-Saturday)
const WEEKDAYS: { value: Weekday; label: string; shortLabel: string }[] = [
    { value: 'SUNDAY', label: 'الأحد', shortLabel: 'أحد' },
    { value: 'MONDAY', label: 'الاثنين', shortLabel: 'اثن' },
    { value: 'TUESDAY', label: 'الثلاثاء', shortLabel: 'ثلا' },
    { value: 'WEDNESDAY', label: 'الأربعاء', shortLabel: 'أرب' },
    { value: 'THURSDAY', label: 'الخميس', shortLabel: 'خمي' },
    { value: 'FRIDAY', label: 'الجمعة', shortLabel: 'جمع' },
    { value: 'SATURDAY', label: 'السبت', shortLabel: 'سبت' },
];

// Time slots from 8 AM to 10 PM (typical tutoring hours)
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
];

// Format time for display (24h -> 12h with Arabic AM/PM)
function formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Get weekday label in Arabic
function getWeekdayLabel(weekday: Weekday): string {
    return WEEKDAYS.find(w => w.value === weekday)?.label || weekday;
}

interface TeacherAvailabilitySlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

export function WeeklyAvailabilityGrid({
    teacherId,
    recurringSessionCount,
    sessionDuration = 60,
    maxSlots = 4,
    onPatternsChange,
    onAvailabilityCheck
}: WeeklyAvailabilityGridProps) {
    // State
    const [selectedPatterns, setSelectedPatterns] = useState<RecurringPattern[]>([]);
    const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailabilitySlot[]>([]);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
    const [isCheckingPatterns, setIsCheckingPatterns] = useState(false);
    const [availabilityResult, setAvailabilityResult] = useState<MultiSlotAvailabilityResponse | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>('');

    // Load user timezone
    useEffect(() => {
        setUserTimezone(getTimezoneDisplay(getUserTimezone()));
    }, []);

    // Fetch teacher's weekly availability
    useEffect(() => {
        async function fetchTeacherAvailability() {
            setIsLoadingAvailability(true);
            try {
                const profile = await marketplaceApi.getTeacherProfile(teacherId);
                setTeacherAvailability(profile.availability || []);
            } catch (error) {
                console.error('Failed to fetch teacher availability:', error);
                setTeacherAvailability([]);
            } finally {
                setIsLoadingAvailability(false);
            }
        }
        fetchTeacherAvailability();
    }, [teacherId]);

    // Build availability map: { "SUNDAY": ["09:00", "10:00", ...], ... }
    const availabilityMap = useMemo(() => {
        const map: Record<Weekday, Set<string>> = {
            SUNDAY: new Set(),
            MONDAY: new Set(),
            TUESDAY: new Set(),
            WEDNESDAY: new Set(),
            THURSDAY: new Set(),
            FRIDAY: new Set(),
            SATURDAY: new Set(),
        };

        teacherAvailability.forEach(slot => {
            const weekday = slot.dayOfWeek.toUpperCase() as Weekday;
            if (!map[weekday]) return;

            // Parse start and end times
            const [startH, startM] = slot.startTime.split(':').map(Number);
            const [endH, endM] = slot.endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            // Add all hour slots within the range
            TIME_SLOTS.forEach(time => {
                const [h, m] = time.split(':').map(Number);
                const timeMinutes = h * 60 + m;
                // Slot is available if it starts within the teacher's availability window
                // and there's enough time for the session (default 60 min)
                if (timeMinutes >= startMinutes && timeMinutes + sessionDuration <= endMinutes) {
                    map[weekday].add(time);
                }
            });
        });

        return map;
    }, [teacherAvailability, sessionDuration]);

    // Check if a slot is available
    const isSlotAvailable = useCallback((weekday: Weekday, time: string): boolean => {
        return availabilityMap[weekday]?.has(time) || false;
    }, [availabilityMap]);

    // Check if a pattern is selected
    const isPatternSelected = useCallback((weekday: Weekday, time: string): boolean => {
        return selectedPatterns.some(p => p.weekday === weekday && p.time === time);
    }, [selectedPatterns]);

    // Toggle pattern selection
    const togglePattern = useCallback((weekday: Weekday, time: string) => {
        setSelectedPatterns(prev => {
            const exists = prev.some(p => p.weekday === weekday && p.time === time);

            if (exists) {
                // Remove pattern
                return prev.filter(p => !(p.weekday === weekday && p.time === time));
            } else {
                // Add pattern (if not at max)
                if (prev.length >= maxSlots) {
                    return prev;
                }
                return [...prev, { weekday, time }];
            }
        });

        // Reset availability result when patterns change
        setAvailabilityResult(null);
    }, [maxSlots]);

    // Store callback in ref to avoid infinite loop
    const onPatternsChangeRef = useRef(onPatternsChange);
    onPatternsChangeRef.current = onPatternsChange;

    // Notify parent when patterns change (using ref to avoid dependency issues)
    useEffect(() => {
        onPatternsChangeRef.current(selectedPatterns);
    }, [selectedPatterns]);

    // Check availability for selected patterns
    const checkAvailability = useCallback(async () => {
        if (selectedPatterns.length === 0) return;

        setIsCheckingPatterns(true);
        try {
            const result = await packageApi.checkMultiSlotAvailability({
                teacherId,
                patterns: selectedPatterns,
                recurringSessionCount,
                duration: sessionDuration
            });

            setAvailabilityResult(result);
            onAvailabilityCheck(result);
        } catch (error) {
            console.error('Failed to check availability:', error);
            setAvailabilityResult({
                available: false,
                patterns: [],
                scheduledSessions: [],
                totalWeeksNeeded: 0,
                firstSession: null,
                lastSession: null,
                packageEndDate: null,
                message: 'حدث خطأ أثناء التحقق من التوفر'
            });
        } finally {
            setIsCheckingPatterns(false);
        }
    }, [teacherId, selectedPatterns, recurringSessionCount, sessionDuration, onAvailabilityCheck]);

    // Calculate weeks needed based on selected slots
    const weeksNeeded = useMemo(() => {
        if (selectedPatterns.length === 0) return recurringSessionCount;
        return Math.ceil(recurringSessionCount / selectedPatterns.length);
    }, [selectedPatterns.length, recurringSessionCount]);

    // Check if we have any available slots
    const hasAvailableSlots = useMemo(() => {
        return Object.values(availabilityMap).some(slots => slots.size > 0);
    }, [availabilityMap]);

    if (isLoadingAvailability) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>جاري تحميل أوقات المعلم...</p>
            </div>
        );
    }

    if (!hasAvailableSlots) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h3 className="font-semibold text-amber-900 mb-2">لا توجد أوقات متاحة</h3>
                <p className="text-amber-700 text-sm">
                    المعلم لم يحدد أوقات متاحة حاليًا. يرجى المحاولة لاحقًا أو اختيار معلم آخر.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Calendar className="w-5 h-5" />
                    <h3>اختر المواعيد الأسبوعية</h3>
                </div>
                <div className="text-sm text-gray-500">
                    {selectedPatterns.length}/{maxSlots} مواعيد
                </div>
            </div>

            {/* Timezone Notice */}
            {userTimezone && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm flex items-start gap-2">
                    <Globe className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-blue-800">جميع الأوقات بتوقيت: </span>
                        <span className="font-semibold text-blue-900">{userTimezone}</span>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="text-emerald-800">
                        <p className="font-medium mb-1">
                            اختر حتى {maxSlots} مواعيد أسبوعية لـ {recurringSessionCount} حصص متكررة
                        </p>
                        <p className="text-emerald-700">
                            {selectedPatterns.length === 0
                                ? `موعد واحد = ${recurringSessionCount} أسابيع`
                                : `${selectedPatterns.length} مواعيد = ${weeksNeeded} أسابيع تقريبًا`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* Header Row - Days */}
                <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
                    <div className="p-2 text-center text-xs font-medium text-gray-500 border-l border-gray-200">
                        الوقت
                    </div>
                    {WEEKDAYS.map(day => (
                        <div
                            key={day.value}
                            className="p-2 text-center text-xs font-medium text-gray-700 border-l border-gray-200 last:border-l-0"
                        >
                            <span className="hidden sm:inline">{day.label}</span>
                            <span className="sm:hidden">{day.shortLabel}</span>
                        </div>
                    ))}
                </div>

                {/* Time Rows */}
                <div className="max-h-[400px] overflow-y-auto">
                    {TIME_SLOTS.map(time => (
                        <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
                            {/* Time Label */}
                            <div className="p-2 text-center text-xs font-medium text-gray-600 border-l border-gray-200 bg-gray-50 flex items-center justify-center">
                                {formatTimeDisplay(time)}
                            </div>

                            {/* Day Cells */}
                            {WEEKDAYS.map(day => {
                                const isAvailable = isSlotAvailable(day.value, time);
                                const isSelected = isPatternSelected(day.value, time);
                                const canSelect = isAvailable && (isSelected || selectedPatterns.length < maxSlots);

                                return (
                                    <div
                                        key={`${day.value}-${time}`}
                                        className="border-l border-gray-100 last:border-l-0"
                                    >
                                        <button
                                            onClick={() => canSelect && togglePattern(day.value, time)}
                                            disabled={!canSelect}
                                            className={cn(
                                                'w-full h-10 flex items-center justify-center transition-all duration-150',
                                                !isAvailable && 'bg-gray-100 cursor-not-allowed',
                                                isAvailable && !isSelected && canSelect && 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer',
                                                isAvailable && !isSelected && !canSelect && 'bg-emerald-50 opacity-50 cursor-not-allowed',
                                                isSelected && 'bg-primary text-white hover:bg-primary/90'
                                            )}
                                            title={
                                                !isAvailable ? 'غير متاح' :
                                                    isSelected ? 'انقر للإلغاء' :
                                                        canSelect ? 'انقر للاختيار' :
                                                            'وصلت للحد الأقصى'
                                            }
                                        >
                                            {isSelected ? (
                                                <Check className="w-4 h-4" />
                                            ) : isAvailable ? (
                                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                            ) : null}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span>متاح</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>تم الاختيار</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-gray-100 rounded" />
                    <span>غير متاح</span>
                </div>
            </div>

            {/* Selected Patterns Summary */}
            {selectedPatterns.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">المواعيد المختارة:</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedPatterns.map((pattern, idx) => (
                            <div
                                key={`${pattern.weekday}-${pattern.time}`}
                                className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm"
                            >
                                <span className="font-medium">{getWeekdayLabel(pattern.weekday)}</span>
                                <span>{formatTimeDisplay(pattern.time)}</span>
                                <button
                                    onClick={() => togglePattern(pattern.weekday, pattern.time)}
                                    className="p-0.5 hover:bg-primary/20 rounded transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Check Availability Button */}
            {selectedPatterns.length > 0 && (
                <button
                    onClick={checkAvailability}
                    disabled={isCheckingPatterns}
                    className={cn(
                        'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                        isCheckingPatterns
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90'
                    )}
                >
                    {isCheckingPatterns ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري التحقق من التوفر...
                        </>
                    ) : (
                        <>
                            <Clock className="w-4 h-4" />
                            تحقق من التوفر
                        </>
                    )}
                </button>
            )}

            {/* Availability Result */}
            {availabilityResult && (
                <div className={cn(
                    'rounded-xl p-4 border',
                    availabilityResult.available
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                )}>
                    <div className="flex items-start gap-3">
                        {availabilityResult.available ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className={cn(
                                'font-semibold',
                                availabilityResult.available ? 'text-green-800' : 'text-red-800'
                            )}>
                                {availabilityResult.available
                                    ? 'المعلم متاح لهذه المواعيد'
                                    : 'المعلم غير متاح لهذه المواعيد'}
                            </p>
                            {availabilityResult.message && (
                                <p className="text-sm mt-1 text-gray-700">{availabilityResult.message}</p>
                            )}

                            {/* Show scheduled sessions preview */}
                            {availabilityResult.available && availabilityResult.scheduledSessions.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        الحصص المجدولة ({availabilityResult.scheduledSessions.length} حصة):
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                        {availabilityResult.scheduledSessions.map((session, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm"
                                            >
                                                <div className="font-medium text-gray-900">
                                                    الحصة {session.sessionNumber}
                                                </div>
                                                <div className="text-gray-600 text-xs">
                                                    {format(new Date(session.date), 'EEEE، d MMM', { locale: ar })}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {formatTimeDisplay(session.time)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary Info */}
                                    <div className="mt-3 pt-3 border-t border-green-200 text-sm text-gray-700 space-y-1">
                                        {availabilityResult.firstSession && (
                                            <p>
                                                <span className="font-medium">أول حصة:</span>{' '}
                                                {format(new Date(availabilityResult.firstSession), 'EEEE، d MMMM yyyy', { locale: ar })}
                                            </p>
                                        )}
                                        {availabilityResult.lastSession && (
                                            <p>
                                                <span className="font-medium">آخر حصة:</span>{' '}
                                                {format(new Date(availabilityResult.lastSession), 'EEEE، d MMMM yyyy', { locale: ar })}
                                            </p>
                                        )}
                                        <p>
                                            <span className="font-medium">المدة الإجمالية:</span>{' '}
                                            {availabilityResult.totalWeeksNeeded} أسابيع
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Show conflicts if not available */}
                            {!availabilityResult.available && availabilityResult.patterns.some(p => p.conflicts.length > 0) && (
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-red-700 mb-2">التعارضات:</p>
                                    {availabilityResult.patterns.map((pattern, idx) => (
                                        pattern.conflicts.length > 0 && (
                                            <div key={idx} className="mb-2">
                                                <p className="text-xs font-medium text-gray-700">
                                                    {getWeekdayLabel(pattern.weekday)} {formatTimeDisplay(pattern.time)}:
                                                </p>
                                                {pattern.conflicts.slice(0, 3).map((conflict, cIdx) => (
                                                    <p key={cIdx} className="text-xs text-red-600 mr-2">
                                                        • {conflict.date}: {conflict.reason}
                                                    </p>
                                                ))}
                                                {pattern.conflicts.length > 3 && (
                                                    <p className="text-xs text-red-600 mr-2">
                                                        و {pattern.conflicts.length - 3} تعارضات أخرى...
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
