'use client';

import { useState, useEffect } from 'react';
import { format, formatISO, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { bookingApi } from '@/lib/api/booking';
import { parentApi } from '@/lib/api/parent';
import { teacherApi } from '@/lib/api/teacher';
import { packageApi } from '@/lib/api/package';
import { marketplaceApi, AvailabilityCalendar } from '@/lib/api/marketplace';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { authApi, Child } from '@/lib/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookingTypeSelectorV2 } from './BookingTypeSelectorV2';
import { BookingSummaryCard } from './BookingSummaryCard';
import { BookingType, BookingTypeOption } from './BookingTypeSelector';
import { RecurringPatternSelector } from './RecurringPatternSelector';

// New slot format from UTC-first API
interface SlotWithTimezone {
    startTimeUtc: string;  // Canonical identifier
    label: string;         // Display label (e.g., "9:30 AM")
    userDate: string;      // Date in user's timezone
}

interface CreateBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherId: string;
    teacherName: string;
    teacherSubjects: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    userRole: 'PARENT' | 'STUDENT';
    initialSubjectId?: string;
    initialOptionId?: string;
}

export function CreateBookingModal({
    isOpen,
    onClose,
    teacherId,
    teacherName,
    teacherSubjects,
    initialSubjectId,
    initialOptionId
}: CreateBookingModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedSlot, setSelectedSlot] = useState<SlotWithTimezone | null>(null);  // Now stores full slot object
    const [selectedSubject, setSelectedSubject] = useState<string>(initialSubjectId || '');
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [bookingNotes, setBookingNotes] = useState<string>('');
    const [userRole, setUserRole] = useState<'PARENT' | 'STUDENT' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    // Booking type state (demo/single/package)
    const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(
        initialOptionId === 'demo' ? 'DEMO' :
            initialOptionId === 'single' ? 'SINGLE' :
                initialOptionId?.startsWith('package-') ? 'PACKAGE' : null
    );
    const [selectedBookingOption, setSelectedBookingOption] = useState<BookingTypeOption | null>(null);

    // Recurring pattern state for NEW package purchases
    const [recurringWeekday, setRecurringWeekday] = useState<string>('');
    const [recurringTime, setRecurringTime] = useState<string>('');
    const [suggestedDates, setSuggestedDates] = useState<Date[]>([]);

    // Data state
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);

    // Available time slots from API (new format)
    const [availableSlots, setAvailableSlots] = useState<SlotWithTimezone[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [userTimezoneDisplay, setUserTimezoneDisplay] = useState<string>('');

    // Availability calendar data
    const [availabilityCalendar, setAvailabilityCalendar] = useState<AvailabilityCalendar | null>(null);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Only fetch children if user is logged in
            // This allows guests to browse booking options
            if (user) {
                fetchChildren();
            }
            setUserTimezoneDisplay(getTimezoneDisplay(getUserTimezone()));
            // Fetch availability calendar for current month
            if (teacherId && selectedSubject) {
                fetchAvailabilityCalendar();
            }
        } else {
            // Reset validation state when modal closes
            setHasAttemptedSubmit(false);
        }
    }, [isOpen, selectedSubject, user]);

    useEffect(() => {
        if (selectedDate && teacherId) {
            fetchAvailableSlots();
        }
    }, [selectedDate, teacherId]);

    const fetchChildren = async () => {
        setIsLoadingChildren(true);
        try {
            const profile = await authApi.getProfile();
            // @ts-ignore - Role literal match
            setUserRole(profile.role);

            if (profile.role === 'PARENT' && profile.parentProfile?.children) {
                setChildren(profile.parentProfile.children);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
        } finally {
            setIsLoadingChildren(false);
        }
    };

    const fetchAvailabilityCalendar = async () => {
        if (!teacherId) return;

        setIsLoadingCalendar(true);
        try {
            const currentMonth = format(new Date(), 'yyyy-MM');
            const calendar = await marketplaceApi.getAvailabilityCalendar(teacherId, currentMonth, selectedSubject);
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
        setSelectedSlot(null); // Reset selected slot when date changes
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

            // Handle new format with SlotWithTimezone objects
            const slots: SlotWithTimezone[] = data.slots || [];
            setAvailableSlots(slots);

            console.log(`Loaded ${slots.length} slots for ${dateStr}`);
            if (data.teacherTimezone && data.userTimezone) {
                console.log(`Teacher TZ: ${data.teacherTimezone}, User TZ: ${data.userTimezone}`);
            }
        } catch (error) {
            console.error('Failed to fetch available slots:', error);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    if (!isOpen) return null;

    const selectedSubjectData = teacherSubjects.find(s => s.id === selectedSubject);
    const isParent = userRole === 'PARENT';

    // Check if this is a NEW package purchase (has tierId)
    const isNewPackagePurchase = selectedBookingOption?.tierId !== undefined;

    // Different validation for new package purchase vs existing package/single
    const canSubmit = isNewPackagePurchase
        ? selectedSubject && selectedBookingOption && recurringWeekday && recurringTime && suggestedDates.length > 0 && (!isParent || selectedChildId)
        : selectedDate && selectedSlot && selectedSubject && selectedBookingOption && (!isParent || selectedChildId);

    const handleSubmit = async () => {
        // Mark that user has attempted to submit
        setHasAttemptedSubmit(true);

        // Check authentication FIRST - before validation
        if (!user) {
            // Save booking state to localStorage
            const bookingState = {
                teacherId,
                teacherName,
                selectedSubject,
                selectedDate: selectedDate?.toISOString(),
                selectedSlot,
                selectedBookingType,
                selectedBookingOption,
                recurringWeekday,
                recurringTime,
                suggestedDates: suggestedDates.map(d => d.toISOString()),
                bookingNotes,
                returnUrl: window.location.pathname
            };
            localStorage.setItem('pendingBooking', JSON.stringify(bookingState));

            toast.info('يرجى تسجيل الدخول لإتمام الحجز');
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        // Different validation based on booking type
        if (isNewPackagePurchase) {
            // NEW PACKAGE PURCHASE - requires recurring pattern
            if (!recurringWeekday || !recurringTime) {
                toast.error('يرجى اختيار النمط الأسبوعي للحصص');
                return;
            }
            if (suggestedDates.length === 0) {
                toast.error('يرجى التحقق من التوفر أولاً');
                return;
            }
        } else {
            // EXISTING PACKAGE or SINGLE/DEMO - requires specific date/time
            if (!selectedDate || !selectedSlot) {
                toast.error('يرجى اختيار الموعد');
                return;
            }
        }

        if (userRole === 'PARENT' && !selectedChildId) {
            toast.error('يرجى اختيار الطالب');
            return;
        }

        if (!selectedSubject) {
            toast.error('يرجى اختيار المادة');
            return;
        }

        if (!selectedBookingOption) {
            toast.error('يرجى اختيار نوع الحجز');
            return;
        }

        setIsLoading(true);

        try {
            const packageIdToUse = selectedBookingOption?.packageId; // Only for existing packages
            const tierIdToUse = selectedBookingOption?.tierId; // For new package purchases

            if (isNewPackagePurchase) {
                // NEW PACKAGE PURCHASE - use first suggested date as startTime
                const firstSessionDate = suggestedDates[0];
                const [hours, minutes] = recurringTime.split(':');
                firstSessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                const startTime = formatISO(firstSessionDate);
                const duration = 60;
                const endDt = new Date(firstSessionDate.getTime() + duration * 60 * 1000);
                const endTime = formatISO(endDt);

                await bookingApi.createRequest({
                    teacherId,
                    subjectId: selectedSubject,
                    childId: userRole === 'PARENT' ? selectedChildId : undefined,
                    startTime,
                    endTime,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    bookingNotes,
                    price: selectedBookingOption?.price || 0,
                    isDemo: false,
                    packageId: undefined,
                    tierId: tierIdToUse,
                    // Note: recurringWeekday and recurringTime are handled by the backend
                    // when tierId is provided for Smart Pack purchases
                    termsAccepted: true
                });
            } else {
                // EXISTING PACKAGE or SINGLE/DEMO - use selected slot
                const startTime = selectedSlot!.startTimeUtc;
                const duration = selectedBookingType === 'DEMO' ? 30 : 60;
                const startDt = new Date(startTime);
                const endDt = new Date(startDt.getTime() + duration * 60 * 1000);
                const endTime = formatISO(endDt);

                await bookingApi.createRequest({
                    teacherId,
                    subjectId: selectedSubject,
                    childId: userRole === 'PARENT' ? selectedChildId : undefined,
                    startTime,
                    endTime,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    bookingNotes,
                    price: selectedBookingOption?.price || 0,
                    isDemo: selectedBookingType === 'DEMO',
                    packageId: packageIdToUse,
                    tierId: undefined,
                    termsAccepted: true
                });
            }

            toast.success('تم إرسال طلب الحجز بنجاح!');
            onClose();
            router.push(userRole === 'PARENT' ? '/parent/bookings' : '/student/sessions');
        } catch (error: any) {
            console.error('Booking failed:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'فشل إنشاء الحجز';
            const errorDetails = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;

            if (errorDetails.includes('غير متاح') || errorDetails.includes('not available')) {
                toast.error('هذا الموعد غير متاح. يرجى اختيار وقت آخر.');
            } else if (errorDetails.includes('Unauthorized')) {
                toast.error('يرجى تسجيل الدخول أولاً');
            } else if (errorDetails.includes('Child')) {
                toast.error('يرجى اختيار الطالب');
            } else {
                toast.error(`حدث خطأ: ${errorDetails}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setSelectedSubject('');
        setSelectedChildId('');
        setBookingNotes('');
        setAvailableSlots([]);
        setSelectedBookingType(null);
        setSelectedBookingOption(null);
    };

    // Handler for booking type selection
    const handleBookingTypeSelect = (option: BookingTypeOption) => {
        setSelectedBookingType(option.type);
        setSelectedBookingOption(option);
    };

    // Format slot label for Arabic display (AM/PM -> ص/م)
    const formatSlotLabel = (label: string) => {
        return label.replace('AM', 'ص').replace('PM', 'م');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-float max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined">event_note</span>
                            حجز حصة مع {teacherName}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-400">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Guest Info Banner */}
                        {!user && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                                <div className="flex-1 text-sm">
                                    <p className="font-medium text-blue-900 mb-1">يمكنك تصفح الأوقات المتاحة قبل التسجيل</p>
                                    <p className="text-blue-700">اختر المادة والموعد المناسب، ثم سنطلب منك تسجيل الدخول لإتمام الحجز.</p>
                                </div>
                            </div>
                        )}

                        {/* Subject Selection */}
                        <div>
                            <label className="block text-sm font-bold text-text-main mb-3">
                                اختر المادة
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {teacherSubjects.map((subject) => (
                                    <label
                                        key={subject.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedSubject === subject.id
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-gray-200 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="subject"
                                                value={subject.id}
                                                checked={selectedSubject === subject.id}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="h-5 w-5 text-primary"
                                            />
                                            <span className="font-medium text-text-main">{subject.name}</span>
                                        </div>
                                        <span className="font-bold text-primary font-sans">{subject.price} ج.س</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Child Selection - Only for Parents (MOVED BEFORE booking type) */}
                        {userRole === 'PARENT' && (
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-3">
                                    اختر الابن
                                </label>
                                {isLoadingChildren ? (
                                    <div className="text-sm text-gray-500">جاري تحميل الطلاب...</div>
                                ) : (
                                    <select
                                        value={selectedChildId}
                                        onChange={(e) => setSelectedChildId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    >
                                        <option value="">اختر الطالب...</option>
                                        {children.map((child) => (
                                            <option key={child.id} value={child.id}>
                                                {child.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {children.length === 0 && !isLoadingChildren && (
                                    <p className="text-xs text-red-500 mt-1">
                                        لا يوجد طلاب مسجلين في ملفك. يرجى إضافة طالب أولاً.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Booking Type Selection - Show after subject is selected */}
                        {selectedSubject && selectedSubjectData && (
                            <BookingTypeSelectorV2
                                teacherId={teacherId}
                                subjectId={selectedSubject}
                                basePrice={selectedSubjectData.price}
                                onSelect={handleBookingTypeSelect}
                                selectedOption={selectedBookingOption}
                            />
                        )}

                        {/* Conditional Flow: NEW Package Purchase vs Existing Package/Single/Demo */}
                        {isNewPackagePurchase ? (
                            /* NEW PACKAGE PURCHASE - Show Recurring Pattern Selector */
                            <RecurringPatternSelector
                                teacherId={teacherId}
                                sessionCount={selectedBookingOption?.sessionCount || 8}
                                sessionDuration={60}
                                onPatternSelect={(weekday, time, dates) => {
                                    setRecurringWeekday(weekday);
                                    setRecurringTime(time);
                                    setSuggestedDates(dates);
                                }}
                            />
                        ) : selectedBookingOption && (
                            /* EXISTING PACKAGE or SINGLE/DEMO - Show Date/Time Picker */
                            <>
                                {/* Date Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-text-main mb-3">
                                        اختر التاريخ
                                        {availabilityCalendar?.nextAvailableSlot && (
                                            <button
                                                onClick={() => setSelectedDate(parseISO(availabilityCalendar.nextAvailableSlot!.date))}
                                                className="mr-3 text-xs text-primary hover:underline font-normal"
                                            >
                                                ⚡ التالي المتاح: {availabilityCalendar.nextAvailableSlot.display}
                                            </button>
                                        )}
                                    </label>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        {isLoadingCalendar ? (
                                            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary ml-2"></div>
                                                جاري تحميل التقويم...
                                            </div>
                                        ) : (
                                            <>
                                                <DayPicker
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={setSelectedDate}
                                                    locale={ar}
                                                    disabled={{ before: new Date() }}
                                                    modifiers={{
                                                        available: availabilityCalendar?.availableDates.map(d => parseISO(d)) || [],
                                                        fullyBooked: availabilityCalendar?.fullyBookedDates.map(d => parseISO(d)) || []
                                                    }}
                                                    modifiersClassNames={{
                                                        available: 'has-availability',
                                                        fullyBooked: 'fully-booked'
                                                    }}
                                                    className="rdp-custom"
                                                    classNames={{
                                                        day_selected: 'bg-primary text-white rounded-full',
                                                        day_today: 'font-bold text-primary',
                                                        day: 'h-9 w-9 rounded-full hover:bg-gray-100 transition-colors'
                                                    }}
                                                />
                                                {/* Legend */}
                                                <div className="flex items-center gap-4 mt-4 text-xs text-gray-600 justify-center">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span>متاح</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                        <span>محجوز بالكامل</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                {selectedDate && (
                                    <div>
                                        <label className="block text-sm font-bold text-text-main mb-3">
                                            اختر الوقت
                                            <span className="text-xs font-normal text-gray-500 mr-2">
                                                ({format(selectedDate, 'EEEE، d MMMM', { locale: ar })})
                                            </span>
                                        </label>

                                        {/* Timezone Notice - ENHANCED */}
                                        {userTimezoneDisplay && (
                                            <div className="mb-3 bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-3">
                                                <div className="flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-amber-700 text-xl flex-shrink-0">language</span>
                                                    <div className="text-sm">
                                                        <p className="font-bold text-amber-900 mb-1">
                                                            جميع الأوقات معروضة بتوقيتك المحلي
                                                        </p>
                                                        <p className="text-amber-800">
                                                            منطقتك الزمنية: <span className="font-semibold">{userTimezoneDisplay}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isLoadingSlots ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                                                <p className="text-sm">جاري تحميل الأوقات المتاحة...</p>
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-3">event_busy</span>
                                                <p className="text-sm text-gray-600 font-medium mb-1">لا توجد أوقات متاحة في هذا اليوم</p>
                                                <p className="text-xs text-gray-400">يرجى اختيار تاريخ آخر</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {availableSlots.map((slot) => (
                                                    <button
                                                        key={slot.startTimeUtc}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`py-3 rounded-lg border text-sm font-medium transition-all ${selectedSlot?.startTimeUtc === slot.startTimeUtc
                                                            ? 'border-secondary bg-secondary text-white shadow-md shadow-secondary/20'
                                                            : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                                                            }`}
                                                    >
                                                        {formatSlotLabel(slot.label)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Price Summary */}
                        {selectedSubjectData && (
                            <div className="bg-primary/5 border-r-4 border-r-primary rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-text-main">السعر الإجمالي:</span>
                                    <span className="text-2xl font-bold text-primary font-sans">
                                        {selectedSubjectData.price} ج.س
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    مدة الحصة: 60 دقيقة
                                </p>
                            </div>
                        )}

                        {/* Booking Notes */}
                        <div>
                            <label className="block text-sm font-bold text-text-main mb-3">
                                ملاحظات للمعلم
                                <span className="text-xs font-normal text-gray-400 mr-2">(اختياري)</span>
                            </label>
                            <textarea
                                value={bookingNotes}
                                onChange={(e) => setBookingNotes(e.target.value)}
                                placeholder="ما المواضيع التي تريد تغطيتها؟ هل لديك أسئلة محددة؟..."
                                rows={3}
                                maxLength={1000}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-right"
                                dir="rtl"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-left">{bookingNotes.length}/1000</p>
                        </div>

                        {/* Booking Summary - Show when all info is filled */}
                        {canSubmit && selectedSubjectData && selectedSlot && (
                            <BookingSummaryCard
                                teacherName={teacherName}
                                subjectName={selectedSubjectData.name}
                                childName={selectedChildId ? children.find(c => c.id === selectedChildId)?.name : undefined}
                                selectedDate={selectedDate!}
                                selectedTime={formatSlotLabel(selectedSlot.label)}
                                price={selectedBookingOption?.price || selectedSubjectData.price}
                                bookingType={
                                    selectedBookingType === 'DEMO' ? 'حصة تجريبية' :
                                        selectedBookingType === 'PACKAGE' ?
                                            (selectedBookingOption?.packageId ? 'من باقتك الحالية' : `باقة ${selectedBookingOption?.sessionCount} حصص`) :
                                            'حصة واحدة'
                                }
                                notes={bookingNotes}
                                userTimezone={userTimezoneDisplay}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 rounded-b-2xl">
                        {/* Validation Feedback - Only show after user attempts to submit */}
                        {!canSubmit && hasAttemptedSubmit && (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-yellow-600 text-lg">info</span>
                                    <div>
                                        <p className="font-medium mb-1">يرجى استكمال المعلومات التالية:</p>
                                        <ul className="text-xs space-y-1 mr-4">
                                            {!selectedDate && !isNewPackagePurchase && <li>• اختر التاريخ</li>}
                                            {!selectedSlot && !isNewPackagePurchase && <li>• اختر الوقت</li>}
                                            {!selectedSubject && <li>• اختر المادة</li>}
                                            {!selectedBookingOption && <li>• اختر نوع الحجز</li>}
                                            {isNewPackagePurchase && !recurringWeekday && <li>• اختر اليوم المفضل</li>}
                                            {isNewPackagePurchase && !recurringTime && <li>• اختر الوقت المفضل</li>}
                                            {isParent && !selectedChildId && <li>• اختر الطالب</li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit || isLoading}
                                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                        جاري الحجز...
                                    </>
                                ) : !user ? (
                                    <>
                                        متابعة وتسجيل الدخول
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </>
                                ) : (
                                    <>
                                        تأكيد الحجز
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Material Symbols Font (if not already loaded globally) */}
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

                {/* Custom Styles for Calendar Availability Indicators */}
                <style jsx global>{`
                    .has-availability {
                        position: relative;
                    }
                    .has-availability::after {
                        content: '';
                        position: absolute;
                        bottom: 2px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 4px;
                        height: 4px;
                        background-color: #10b981;
                        border-radius: 50%;
                    }
                    .fully-booked {
                        opacity: 0.4;
                        text-decoration: line-through;
                        pointer-events: none;
                    }
                `}</style>
            </div>
        </div>
    );
}
