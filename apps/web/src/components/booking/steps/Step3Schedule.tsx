'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlotWithTimezone, BookingTypeOption } from '../types';
import { marketplaceApi, AvailabilityCalendar } from '@/lib/api/marketplace';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
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
        setUserTimezoneDisplay(getTimezoneDisplay(getUserTimezone()));
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
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                    اختر التاريخ والوقت المناسب
                </h3>
                <p className="text-xs text-gray-500">
                    الأيام التي بها نقاط خضراء متاحة للحجز
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Calendar */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            التقويم
                        </h4>
                        {isLoadingCalendar && (
                            <div className="text-xs text-gray-500">جاري التحميل...</div>
                        )}
                    </div>

                    <DayPicker
                        mode="single"
                        selected={selectedDate || undefined}
                        onSelect={(date) => onDateSelect(date || null)}
                        locale={ar}
                        disabled={{ before: new Date() }}
                        modifiers={{
                            available: availableDates,
                            fullyBooked: fullyBookedDates
                        }}
                        modifiersClassNames={{
                            available: 'has-availability',
                            fullyBooked: 'fully-booked'
                        }}
                        className="booking-calendar"
                    />

                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>متاح</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            <span>محجوز بالكامل</span>
                        </div>
                    </div>
                </div>

                {/* Time Slots */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            الأوقات المتاحة
                        </h4>
                        {selectedDate && (
                            <p className="text-xs text-gray-500">
                                {format(selectedDate, 'EEEE، d MMMM', { locale: ar })}
                            </p>
                        )}
                    </div>

                    {!selectedDate ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            اختر تاريخاً من التقويم أولاً
                        </div>
                    ) : isLoadingSlots ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">جاري تحميل الأوقات...</p>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            لا توجد أوقات متاحة في هذا اليوم
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableSlots.map((slot) => (
                                <button
                                    key={slot.startTimeUtc}
                                    onClick={() => onSlotSelect(slot)}
                                    className={cn(
                                        'w-full p-3 rounded-lg border-2 transition-all text-right flex items-center justify-between',
                                        selectedSlot?.startTimeUtc === slot.startTimeUtc
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-primary/50'
                                    )}
                                >
                                    <span className="font-medium text-gray-900">{slot.label}</span>
                                    {selectedSlot?.startTimeUtc === slot.startTimeUtc && (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {availableSlots.length > 0 && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                            <Clock className="w-3 h-3 inline ml-1" />
                            جميع الأوقات بتوقيت {userTimezoneDisplay}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick select next available */}
            {availabilityCalendar?.nextAvailableSlot && !selectedDate && (
                <button
                    onClick={() => {
                        if (availabilityCalendar.nextAvailableSlot) {
                            const nextDate = new Date(availabilityCalendar.nextAvailableSlot.date);
                            onDateSelect(nextDate);
                        }
                    }}
                    className="mt-4 w-full md:w-auto px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                    📅 اختيار سريع: {availabilityCalendar.nextAvailableSlot?.display}
                </button>
            )}
        </div>
    );
}
