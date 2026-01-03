'use client';

import { Check, Plus, Info, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Child } from '@/lib/api/auth';
import { BookingSummaryCard } from '../BookingSummaryCard';
import { BookingTypeOption, SlotWithTimezone, RecurringPattern, ScheduledSession, MultiSlotAvailabilityResponse, Weekday } from '../types';
import { formatTime, parseUtcDate } from '../formatUtils';

// Arabic weekday labels
const WEEKDAY_LABELS: Record<Weekday, string> = {
    SUNDAY: 'الأحد',
    MONDAY: 'الاثنين',
    TUESDAY: 'الثلاثاء',
    WEDNESDAY: 'الأربعاء',
    THURSDAY: 'الخميس',
    FRIDAY: 'الجمعة',
    SATURDAY: 'السبت',
};

// Format time for display (24h -> 12h with Arabic AM/PM)
function formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface Step4DetailsProps {
    teacherName: string;
    subjectName: string;
    bookingOption: BookingTypeOption | null;
    selectedDate: Date | null;
    selectedSlot: SlotWithTimezone | null;
    // NEW: Multi-slot recurring patterns
    recurringPatterns?: RecurringPattern[];
    scheduledSessions?: ScheduledSession[];
    availabilityResponse?: MultiSlotAvailabilityResponse | null;
    userRole: 'PARENT' | 'STUDENT' | null;
    userName: string;
    children: Child[];
    selectedChildId: string;
    onChildSelect: (childId: string) => void;
    bookingNotes: string;
    onNotesChange: (notes: string) => void;
    onAddChild?: () => void;
    termsAccepted: boolean;
    onTermsChange: (accepted: boolean) => void;
}

export function Step4Details({
    teacherName,
    subjectName,
    bookingOption,
    selectedDate,
    selectedSlot,
    // NEW: Multi-slot recurring patterns
    recurringPatterns = [],
    scheduledSessions = [],
    availabilityResponse,
    userRole,
    userName,
    children,
    selectedChildId,
    onChildSelect,
    bookingNotes,
    onNotesChange,
    onAddChild,
    termsAccepted,
    onTermsChange
}: Step4DetailsProps) {
    // Check if this is a new package purchase with multi-slot patterns
    const isNewPackagePurchase = bookingOption?.tierId !== undefined;
    const hasMultiSlotPatterns = recurringPatterns.length > 0;

    return (
        <div className="space-y-6">
            {/* NEW PACKAGE PURCHASE - Multi-slot Summary */}
            {isNewPackagePurchase && hasMultiSlotPatterns && availabilityResponse?.available && (
                <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-semibold text-gray-900">ملخص الباقة</h3>
                        </div>

                        {/* Package Info */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white rounded-lg p-3 border border-emerald-100">
                                <p className="text-xs text-gray-500 mb-1">المعلم</p>
                                <p className="font-medium text-gray-900">{teacherName}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-emerald-100">
                                <p className="text-xs text-gray-500 mb-1">المادة</p>
                                <p className="font-medium text-gray-900">{subjectName}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-emerald-100">
                                <p className="text-xs text-gray-500 mb-1">عدد الحصص</p>
                                <p className="font-medium text-gray-900">{bookingOption?.sessionCount} حصص</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-emerald-100">
                                <p className="text-xs text-gray-500 mb-1">المدة الإجمالية</p>
                                <p className="font-medium text-gray-900">{availabilityResponse.totalWeeksNeeded} أسابيع</p>
                            </div>
                        </div>

                        {/* Weekly Patterns */}
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">المواعيد الأسبوعية:</p>
                            <div className="flex flex-wrap gap-2">
                                {recurringPatterns.map((pattern, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 text-sm"
                                    >
                                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="font-medium">{WEEKDAY_LABELS[pattern.weekday]}</span>
                                        <span className="text-gray-500">{formatTimeDisplay(pattern.time)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Date Range */}
                        {availabilityResponse.firstSession && availabilityResponse.lastSession && (
                            <div className="bg-white rounded-lg p-3 border border-emerald-100">
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500">أول حصة</p>
                                        <p className="font-medium text-gray-900">
                                            {format(new Date(availabilityResponse.firstSession), 'EEEE، d MMM yyyy', { locale: ar })}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-gray-500">آخر حصة</p>
                                        <p className="font-medium text-gray-900">
                                            {format(new Date(availabilityResponse.lastSession), 'EEEE، d MMM yyyy', { locale: ar })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Primary Price Display */}
                    <div className="bg-white border-t border-emerald-100 p-4 flex items-center justify-between">
                        <span className="text-gray-600 font-medium">الإجمالي المطلوب:</span>
                        <div className="text-xl md:text-2xl font-bold text-primary">
                            {bookingOption.price === 0 ? 'مجاناً' : `${bookingOption.price.toLocaleString('en-US')} SDG`}
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE SESSION / DEMO / EXISTING PACKAGE - Booking Summary */}
            {!isNewPackagePurchase && selectedDate && selectedSlot && bookingOption && (
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-4 opacity-75 hover:opacity-100 transition-opacity">
                        <BookingSummaryCard
                            teacherName={teacherName}
                            subjectName={subjectName}
                            selectedDate={selectedDate}
                            selectedTime={formatTime(parseUtcDate(selectedSlot.startTimeUtc))}
                            price={0} // Hide price in summary to highlight it separately
                            bookingType={bookingOption.type === 'DEMO' ? 'حصة تجريبية' : bookingOption.type === 'SINGLE' ? 'حصة واحدة' : 'باقة'}
                        />
                    </div>

                    {/* Primary Price Display */}
                    <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
                        <span className="text-gray-600 font-medium">الإجمالي المطلوب:</span>
                        <div className="text-xl md:text-2xl font-bold text-primary">
                            {bookingOption.price === 0 ? 'مجاناً' : `${bookingOption.price.toLocaleString('en-US')} SDG`}
                        </div>
                    </div>
                </div>
            )}

            {/* Child Selection (Parents only) */}
            {userRole === 'PARENT' && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        هذا الحجز لـ:
                    </h3>

                    {children.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                                إضافة طالب للحجز
                            </h4>
                            <p className="text-sm text-gray-500 mb-6 px-8 max-w-sm mx-auto leading-relaxed">
                                لإكمال الحجز، يرجى إضافة بيانات الابن أو الابنة. سيمكنك هذا من تتبع تقدمهم الدراسي لاحقًا.
                            </p>
                            {onAddChild && (
                                <button
                                    onClick={onAddChild}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium shadow-md shadow-primary/20 transform hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة ابن / ابنة
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {children.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => onChildSelect(child.id)}
                                    className={cn(
                                        'w-full p-4 rounded-xl border-2 transition-all text-right',
                                        'hover:border-primary hover:shadow-sm',
                                        selectedChildId === child.id
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-gray-200 bg-white'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                                                selectedChildId === child.id
                                                    ? 'border-primary bg-primary'
                                                    : 'border-gray-300'
                                            )}
                                        >
                                            {selectedChildId === child.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className="text-right flex-1">
                                            <p className="font-semibold text-gray-900">
                                                {child.name}
                                            </p>
                                            {child.gradeLevel && (
                                                <p className="text-sm text-gray-500">
                                                    الصف {child.gradeLevel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Student view */}
            {userRole === 'STUDENT' && (
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-700">
                        هذا الحجز لـ: <span className="font-semibold">{userName}</span>
                    </p>
                </div>
            )}

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات للمعلم (اختياري)
                </label>
                <div className="relative">
                    <textarea
                        value={bookingNotes}
                        onChange={(e) => onNotesChange(e.target.value.slice(0, 300))}
                        placeholder="أضف أي ملاحظات أو مواضيع تود التركيز عليها في الحصة..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows={4}
                        maxLength={300}
                    />
                    <div className="absolute bottom-2 left-2 text-xs text-gray-400">
                        {bookingNotes.length}/300
                    </div>
                </div>
            </div>

            {/* Footer Area: Reassurance & Terms */}
            <div className="pt-4 space-y-4">
                {/* Reassurance Message */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                        سيتم إرسال طلب الحجز للمعلم للمراجعة، ولن يتم خصم أي مبلغ من رصيدك إلا بعد موافقة المعلم على الطلب.
                    </p>
                </div>

                {/* Terms & Conditions */}
                <div className={`border rounded-xl p-4 transition-all duration-200 ${termsAccepted ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <div className="relative flex items-center mt-0.5">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => onTermsChange(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                        </div>
                        <div className="flex-1 text-sm">
                            <p className="text-gray-900 font-medium mb-1">
                                أوافق على شروط وأحكام الحجز
                            </p>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                بالمتابعة، أوافق على سياسة الإلغاء والاسترجاع وشروط الاستخدام الخاصة بالمنصة.
                            </p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
