'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Clock, Calendar, CheckCircle2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlotWithTimezone, BookingTypeOption } from '../types';
import { marketplaceApi, AvailabilityCalendar } from '@/lib/api/marketplace';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { formatTime, formatTimezone, parseUtcDate } from '../formatUtils';
import { RecurringPatternSelector } from '../RecurringPatternSelector';

interface Step3ScheduleProps {
    teacherId: string;
    subjectId: string;
    bookingOption: BookingTypeOption | null;
    // Single session / existing package
    selectedDate: Date | null;
    selectedSlot: SlotWithTimezone | null;
    onDateSelect: (date: Date | null) => void;
    onSlotSelect: (slot: SlotWithTimezone | null) => void;
    // New package purchase
    recurringWeekday: string;
    recurringTime: string;
    suggestedDates: Date[];
    onRecurringWeekdayChange: (weekday: string) => void;
    onRecurringTimeChange: (time: string) => void;
    onSuggestedDatesChange: (dates: Date[]) => void;
}

export function Step3Schedule({
    teacherId,
    subjectId,
    bookingOption,
    selectedDate,
    selectedSlot,
    onDateSelect,
    onSlotSelect,
    recurringWeekday,
    recurringTime,
    suggestedDates,
    onRecurringWeekdayChange,
    onRecurringTimeChange,
    onSuggestedDatesChange
}: Step3ScheduleProps) {
    const [availableSlots, setAvailableSlots] = useState<SlotWithTimezone[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [availabilityCalendar, setAvailabilityCalendar] = useState<AvailabilityCalendar | null>(null);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
    const [userTimezoneDisplay, setUserTimezoneDisplay] = useState<string>('');

    // Check if this is a new package purchase
    const isNewPackagePurchase = bookingOption?.tierId !== undefined;

    useEffect(() => {
        setUserTimezoneDisplay(formatTimezone(getUserTimezone()));
    }, []);

    // Fetch availability calendar
    useEffect(() => {
        if (!isNewPackagePurchase && teacherId && subjectId) {
            fetchAvailabilityCalendar();
        }
    }, [teacherId, subjectId, isNewPackagePurchase]);

    // Fetch slots when date selected
    useEffect(() => {
        if (!isNewPackagePurchase && selectedDate && teacherId) {
            fetchAvailableSlots();
        }
    }, [selectedDate, teacherId, isNewPackagePurchase]);

    const fetchAvailabilityCalendar = async () => {
        if (!teacherId) return;

        setIsLoadingCalendar(true);
        try {
            const currentMonth = format(new Date(), 'yyyy-MM');
            const calendar = await marketplaceApi.getAvailabilityCalendar(teacherId, currentMonth, subjectId);
            setAvailabilityCalendar(calendar);
        } catch (error) {
            console.error('Failed to fetch availability calendar:', error);
            setAvailabilityCalendar(null);
        } finally {
            setIsLoadingCalendar(false);
        }
    };

    const fetchAvailableSlots = async () => {
        if (!selectedDate || !teacherId) return;

        setIsLoadingSlots(true);
        onSlotSelect(null); // Reset selected slot
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const userTimezone = getUserTimezone();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/marketplace/teachers/${teacherId}/available-slots?date=${dateStr}&userTimezone=${encodeURIComponent(userTimezone)}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch available slots');
            }

            const data = await response.json();
            const slots: SlotWithTimezone[] = data.slots || [];
            setAvailableSlots(slots);
        } catch (error) {
            console.error('Failed to fetch available slots:', error);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    // Get available dates from calendar
    const availableDates = availabilityCalendar?.availableDates.map(d => new Date(d)) || [];
    const fullyBookedDates = availabilityCalendar?.fullyBookedDates.map(d => new Date(d)) || [];

    // NEW PACKAGE PURCHASE - Recurring pattern
    if (isNewPackagePurchase) {
        return (
            <div>
                <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                        حدد النمط الأسبوعي للحصص
                    </h3>
                    <p className="text-xs text-gray-500">
                        اختر يوم ووقت ثابت للحصص الأسبوعية
                    </p>
                </div>

                <RecurringPatternSelector
                    teacherId={teacherId}
                    sessionCount={bookingOption?.sessionCount || 0}
                    sessionDuration={60}
                    onPatternSelect={(weekday, time, dates) => {
                        onRecurringWeekdayChange(weekday);
                        onRecurringTimeChange(time);
                        onSuggestedDatesChange(dates);
                    }}
                />
            </div>
        );
    }

    // SINGLE SESSION / DEMO / EXISTING PACKAGE - Pick specific date & time
    return (
        <div>
            <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-0.5">
                    اختر التاريخ والوقت المناسب
                </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-3 h-[420px]">
                {/* Calendar */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            التقويم
                        </h4>
                        {isLoadingCalendar && (
                            <div className="text-xs text-gray-500">جاري التحميل...</div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <DayPicker
                            mode="single"
                            selected={selectedDate || undefined}
                            onSelect={(date) => onDateSelect(date || null)}
                            locale={ar}
                            dir="rtl"
                            disabled={{ before: new Date() }}
                            modifiers={{
                                available: availableDates,
                                fullyBooked: fullyBookedDates
                            }}
                            modifiersClassNames={{
                                available: 'has-availability',
                                fullyBooked: 'fully-booked'
                            }}
                            className="booking-calendar m-0 w-full"
                        />
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600 shrink-0">
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span>متاح</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                            <span>محجوز بالكامل</span>
                        </div>
                    </div>
                </div>

                {/* Time Slots */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            الأوقات المتاحة
                        </h4>
                        {selectedDate && (
                            <p className="text-xs text-gray-500">
                                {format(selectedDate, 'EEEE، d MMMM', { locale: ar })}
                            </p>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Quick select - Moved to top for better visibility */}
                        {availabilityCalendar?.nextAvailableSlot && (
                            <div className="mb-4">
                                <button
                                    onClick={() => {
                                        if (availabilityCalendar?.nextAvailableSlot) {
                                            onDateSelect(new Date(availabilityCalendar.nextAvailableSlot.date));
                                        }
                                    }}
                                    className="w-full flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                            <Calendar className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-emerald-600 font-medium">أقرب موعد متاح</div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {availabilityCalendar.nextAvailableSlot?.startTimeUtc
                                                    ? (() => {
                                                        const date = parseUtcDate(availabilityCalendar.nextAvailableSlot?.startTimeUtc!);
                                                        const today = new Date();
                                                        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
                                                        const isTomorrow = new Date(today.setDate(today.getDate() + 1)).getDate() === date.getDate();

                                                        let dayPrefix = '';
                                                        if (isToday) dayPrefix = 'اليوم';
                                                        else if (isTomorrow) dayPrefix = 'غداً';
                                                        else dayPrefix = format(date, 'EEEE', { locale: ar });

                                                        return `${dayPrefix} في ${formatTime(date)}`;
                                                    })()
                                                    : availabilityCalendar.nextAvailableSlot?.display}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        )}
                        {!selectedDate ? (
                            <div className="text-center py-8 text-gray-500 text-sm flex-1 flex items-center justify-center">
                                اختر تاريخًا لعرض الأوقات المتاحة
                            </div>
                        ) : isLoadingSlots ? (
                            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-sm text-gray-500">جاري تحميل الأوقات...</p>
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm flex-1 flex items-center justify-center">
                                لا توجد أوقات متاحة في هذا اليوم
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                                {availableSlots.map((slot) => (
                                    <button
                                        key={slot.startTimeUtc}
                                        onClick={() => onSlotSelect(slot)}
                                        className={cn(
                                            'w-full p-2.5 rounded-lg border-2 transition-all text-right flex items-center justify-between',
                                            selectedSlot?.startTimeUtc === slot.startTimeUtc
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-primary/50'
                                        )}
                                    >
                                        <span className="font-medium text-gray-900 text-sm">{formatTime(parseUtcDate(slot.startTimeUtc))}</span>
                                        {selectedSlot?.startTimeUtc === slot.startTimeUtc && (
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {availableSlots.length > 0 && (
                            <div className="mt-auto pt-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                                    <Clock className="w-3 h-3 inline ml-1" />
                                    جميع الأوقات بتوقيت: {userTimezoneDisplay}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
