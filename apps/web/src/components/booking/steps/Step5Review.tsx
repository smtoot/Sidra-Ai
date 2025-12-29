'use client';

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Edit2, Calendar, Clock, User, Book, Package as PackageIcon, FileText, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingTypeOption, SlotWithTimezone } from '../types';
import { Child } from '@/lib/api/auth';

interface Step5ReviewProps {
    // Teacher info
    teacherName: string;
    subjectName: string;

    // Booking details
    bookingOption: BookingTypeOption;
    selectedDate: Date | null;
    selectedSlot: SlotWithTimezone | null;
    recurringWeekday: string;
    recurringTime: string;
    suggestedDates: Date[];

    // User info
    userRole: 'PARENT' | 'STUDENT' | null;
    userName: string;
    selectedChild: Child | null;
    bookingNotes: string;

    // Terms
    termsAccepted: boolean;
    onTermsChange: (accepted: boolean) => void;

    // Navigation
    onEdit: (step: number) => void;
}

export function Step5Review({
    teacherName,
    subjectName,
    bookingOption,
    selectedDate,
    selectedSlot,
    recurringWeekday,
    recurringTime,
    suggestedDates,
    userRole,
    userName,
    selectedChild,
    bookingNotes,
    termsAccepted,
    onTermsChange,
    onEdit
}: Step5ReviewProps) {
    const isNewPackagePurchase = bookingOption?.tierId !== undefined;

    // Get booking type label
    const getTypeLabel = () => {
        if (bookingOption.type === 'DEMO') return 'حصة تجريبية';
        if (bookingOption.type === 'SINGLE') return 'حصة واحدة';
        if (bookingOption.packageId) return 'من باقتك الحالية';
        if (bookingOption.tierId) return `باقة ${bookingOption.sessionCount} حصص`;
        return 'حجز';
    };

    // Format schedule
    const getScheduleText = () => {
        if (isNewPackagePurchase && recurringWeekday && recurringTime) {
            const weekdayNames: Record<string, string> = {
                'SUNDAY': 'الأحد',
                'MONDAY': 'الاثنين',
                'TUESDAY': 'الثلاثاء',
                'WEDNESDAY': 'الأربعاء',
                'THURSDAY': 'الخميس',
                'FRIDAY': 'الجمعة',
                'SATURDAY': 'السبت'
            };
            return `كل ${weekdayNames[recurringWeekday]} الساعة ${recurringTime}`;
        }

        if (selectedDate && selectedSlot) {
            return `${format(selectedDate, 'EEEE، d MMMM yyyy', { locale: ar })} - ${selectedSlot.label}`;
        }

        return 'غير محدد';
    };

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">ملخص الحجز</h3>
                    <div className="text-xs text-gray-500">مراجعة نهائية</div>
                </div>

                <div className="space-y-4">
                    {/* Teacher & Subject */}
                    <div className="flex items-start justify-between py-3 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">المعلم</p>
                                <p className="font-semibold text-gray-900">{teacherName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(0)}
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-start justify-between py-3 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                            <Book className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">المادة</p>
                                <p className="font-semibold text-gray-900">{subjectName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(0)}
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Booking Type */}
                    <div className="flex items-start justify-between py-3 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                            <PackageIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">نوع الحجز</p>
                                <p className="font-semibold text-gray-900">{getTypeLabel()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(1)}
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-start justify-between py-3 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">الموعد</p>
                                <p className="font-semibold text-gray-900">{getScheduleText()}</p>
                                {isNewPackagePurchase && suggestedDates.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        أول حصة: {format(suggestedDates[0], 'd MMMM', { locale: ar })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(2)}
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Student */}
                    <div className="flex items-start justify-between py-3 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">الطالب</p>
                                <p className="font-semibold text-gray-900">
                                    {userRole === 'PARENT' && selectedChild
                                        ? selectedChild.name
                                        : userName}
                                </p>
                                {userRole === 'PARENT' && selectedChild && selectedChild.gradeLevel && (
                                    <p className="text-xs text-gray-500">
                                        الصف {selectedChild.gradeLevel}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(3)}
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Notes (if any) */}
                    {bookingNotes && (
                        <div className="flex items-start justify-between py-3 border-b border-gray-200">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600">ملاحظات</p>
                                    <p className="text-sm text-gray-700 mt-1">{bookingNotes}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onEdit(3)}
                                className="text-primary hover:text-primary/80 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="pt-4 border-t-2 border-gray-300">
                        <div className="flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-2">التفاصيل المالية</p>

                                {/* Package pricing */}
                                {bookingOption.tierId && bookingOption.sessionCount && (
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>{bookingOption.sessionCount} حصص × {bookingOption.price / bookingOption.sessionCount} SDG</span>
                                            <span>{(bookingOption.price / bookingOption.sessionCount * bookingOption.sessionCount).toLocaleString()} SDG</span>
                                        </div>
                                        {bookingOption.savings && (
                                            <div className="flex justify-between text-green-600 font-medium">
                                                <span>الخصم</span>
                                                <span>-{bookingOption.savings}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-lg text-primary pt-2 border-t">
                                            <span>الإجمالي</span>
                                            <span>{bookingOption.price.toLocaleString()} SDG</span>
                                        </div>
                                    </div>
                                )}

                                {/* Existing package */}
                                {bookingOption.packageId && (
                                    <div className="text-sm">
                                        <p className="text-green-600 font-semibold">
                                            استخدام حصة من باقتك الحالية
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            متبقي {bookingOption.sessionsRemaining} من {bookingOption.sessionCount} حصة
                                        </p>
                                    </div>
                                )}

                                {/* Single session */}
                                {bookingOption.type === 'SINGLE' && (
                                    <div className="flex justify-between font-bold text-lg text-primary">
                                        <span>السعر</span>
                                        <span>{bookingOption.price.toLocaleString()} SDG</span>
                                    </div>
                                )}

                                {/* Demo */}
                                {bookingOption.type === 'DEMO' && (
                                    <div className="flex justify-between font-bold text-lg text-amber-600">
                                        <span>حصة تجريبية</span>
                                        <span>مجاناً</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-sm text-blue-800">
                <p className="flex items-start gap-2">
                    <span className="text-blue-600">ℹ️</span>
                    <span>سيقوم المعلم بمراجعة طلبك والموافقة عليه خلال 24 ساعة</span>
                </p>
                {bookingOption.price > 0 && (
                    <p className="flex items-start gap-2">
                        <span className="text-blue-600">💳</span>
                        <span>الدفع مطلوب بعد موافقة المعلم على الحجز</span>
                    </p>
                )}
                {isNewPackagePurchase && (
                    <p className="flex items-start gap-2">
                        <span className="text-blue-600">📅</span>
                        <span>سيتم حجز جميع الحصص تلقائياً وفقاً للنمط المحدد</span>
                    </p>
                )}
            </div>

            {/* Terms & Conditions */}
            <div className="border-2 border-gray-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => onTermsChange(e.target.checked)}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                    />
                    <div className="flex-1 text-sm">
                        <p className="text-gray-900 font-medium">
                            أوافق على شروط وأحكام الحجز
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            بالمتابعة، أوافق على سياسة الإلغاء والاسترجاع وشروط الاستخدام
                        </p>
                    </div>
                </label>
            </div>
        </div>
    );
}
