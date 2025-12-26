'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, ChevronLeft, ChevronRight, Loader2, CheckCircle, User, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marketplaceApi } from '@/lib/api/marketplace';
import { packageApi } from '@/lib/api/package';
import { format, addDays, startOfDay, isSameDay, addMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { getUserTimezone } from '@/lib/utils/timezone';

interface SchedulePackageSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    packageId: string;
    teacherId: string;
    teacherName: string;
    subjectName: string;
    sessionNumber: number;
    totalSessions: number;
}

// New slot format from UTC-first API
interface SlotWithTimezone {
    startTimeUtc: string;  // Canonical identifier 
    label: string;         // Display label (e.g., "9:30 AM")
    userDate: string;      // Date in user's timezone
}

export function SchedulePackageSessionModal({
    isOpen,
    onClose,
    onSuccess,
    packageId,
    teacherId,
    teacherName,
    subjectName,
    sessionNumber,
    totalSessions
}: SchedulePackageSessionModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
    const [startDateOffset, setStartDateOffset] = useState(0);
    const [slots, setSlots] = useState<SlotWithTimezone[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<SlotWithTimezone | null>(null);
    const [scheduling, setScheduling] = useState(false);
    const [success, setSuccess] = useState(false);
    const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60); // Default 60 minutes

    const userTimezone = getUserTimezone();

    // Generate visible dates (7 days from offset)
    const visibleDates = Array.from({ length: 7 }, (_, i) =>
        addDays(startOfDay(new Date()), startDateOffset + i + 1)
    );

    // Load platform configuration on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await marketplaceApi.getPlatformConfig();
                setSessionDurationMinutes(config.defaultSessionDurationMinutes);
            } catch (err) {
                console.error('Failed to load platform config:', err);
                // Keep default 60 minutes
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        if (isOpen && teacherId && selectedDate) {
            loadSlots();
        }
    }, [isOpen, teacherId, selectedDate]);

    const loadSlots = async () => {
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            console.log('[ScheduleModal] Loading slots for:', { teacherId, dateStr, userTimezone });
            const data = await marketplaceApi.getAvailableSlots(teacherId, dateStr, userTimezone);
            console.log('[ScheduleModal] Slots response:', data);
            setSlots(data.slots || []);
        } catch (err) {
            console.error('Failed to load slots:', err);
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSchedule = async () => {
        if (!selectedSlot) return;

        setScheduling(true);
        try {
            // Use startTimeUtc from the slot - add configured duration for endTime
            const startTime = new Date(selectedSlot.startTimeUtc);
            const endTime = addMinutes(startTime, sessionDurationMinutes);

            await packageApi.scheduleSession(packageId, {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                timezone: userTimezone
            });

            setSuccess(true);
            toast.success('تم جدولة الحصة بنجاح!');

            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(false);
            }, 1500);
        } catch (err: any) {
            console.error('Failed to schedule session:', err);
            toast.error(err?.response?.data?.message || 'فشل في جدولة الحصة');
        } finally {
            setScheduling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                dir="rtl"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">جدولة حصة جديدة</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold">{teacherName}</p>
                            <p className="text-white/80 text-sm flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {subjectName}
                            </p>
                        </div>
                        <div className="mr-auto bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                            حصة {sessionNumber}/{totalSessions}
                        </div>
                    </div>
                </div>

                {success ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h3>
                        <p className="text-gray-500">تمت جدولة الحصة</p>
                    </div>
                ) : (
                    <>
                        {/* Date Selector */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    اختر التاريخ
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setStartDateOffset(Math.max(0, startDateOffset - 7))}
                                        disabled={startDateOffset === 0}
                                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setStartDateOffset(startDateOffset + 7)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {visibleDates.map((date) => {
                                    const isSelected = isSameDay(date, selectedDate);
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={cn(
                                                "flex flex-col items-center p-2 rounded-xl transition-all",
                                                isSelected
                                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                    : "hover:bg-gray-100"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-xs",
                                                isSelected ? "text-white/80" : "text-gray-500"
                                            )}>
                                                {format(date, 'EEE', { locale: ar })}
                                            </span>
                                            <span className="text-lg font-bold">
                                                {format(date, 'd')}
                                            </span>
                                            <span className={cn(
                                                "text-xs",
                                                isSelected ? "text-white/80" : "text-gray-400"
                                            )}>
                                                {format(date, 'MMM', { locale: ar })}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div className="p-6">
                            <span className="font-bold text-gray-700 flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-primary" />
                                اختر الوقت
                            </span>

                            {loadingSlots ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>لا توجد أوقات متاحة في هذا اليوم</p>
                                    <p className="text-sm mt-1">جرب يوماً آخر</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {slots.map((slot: SlotWithTimezone) => {
                                        const isSelected = selectedSlot?.startTimeUtc === slot.startTimeUtc;
                                        return (
                                            <button
                                                key={slot.startTimeUtc}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={cn(
                                                    "py-3 px-4 rounded-xl font-medium transition-all text-sm",
                                                    isSelected
                                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                                )}
                                            >
                                                {slot.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={handleSchedule}
                                disabled={!selectedSlot || scheduling}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                                    selectedSlot && !scheduling
                                        ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-xl"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                {scheduling ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        جاري الجدولة...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        تأكيد الجدولة
                                    </>
                                )}
                            </button>
                            {selectedSlot && (
                                <p className="text-center text-sm text-gray-500 mt-3">
                                    {format(selectedDate, 'd MMMM yyyy', { locale: ar })} • {selectedSlot.label}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
