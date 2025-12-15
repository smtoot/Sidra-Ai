'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { bookingApi } from '@/lib/api/booking';
import { authApi, Child } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CreateBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherId: string;
    teacherName: string;
    teacherSubjects: { id: string; name: string; price: number }[];
}

export function CreateBookingModal({
    isOpen,
    onClose,
    teacherId,
    teacherName,
    teacherSubjects
}: CreateBookingModalProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [userRole, setUserRole] = useState<'PARENT' | 'STUDENT' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Data state
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);

    // Available time slots from API
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Format time slot for display (Arabic)
    const formatTimeSlot = (time: string) => {
        const [hourStr, period] = time.split(' ');
        let suffix = period === 'AM' ? 'ص' : 'م';
        return `${hourStr} ${suffix}`;
    };

    useEffect(() => {
        if (isOpen) {
            fetchChildren();
        }
    }, [isOpen]);

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

    const fetchAvailableSlots = async () => {
        if (!selectedDate || !teacherId) return;

        setIsLoadingSlots(true);
        setSelectedTime(''); // Reset selected time when date changes
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/marketplace/teachers/${teacherId}/available-slots?date=${dateStr}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch available slots');
            }

            const slots = await response.json();
            setAvailableSlots(slots);
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
    const canSubmit = selectedDate && selectedTime && selectedSubject && (!isParent || selectedChildId);

    const handleSubmit = async () => {
        if (!canSubmit || !selectedSubjectData) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setIsLoading(true);
        try {
            // Construct start and end times with better parsing
            const [timeStr, period] = selectedTime.split(' ');
            const [hours, minutes = 0] = timeStr.split(':').map(Number);

            const startDateTime = new Date(selectedDate!);
            let hour24 = hours;
            if (period === 'PM' && hours !== 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;

            startDateTime.setHours(hour24, minutes, 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(hour24 + 1, minutes, 0, 0); // 1 hour session

            // Create booking request
            await bookingApi.createRequest({
                teacherId,
                childId: selectedChildId || undefined,
                studentId: '', // Legacy compatibility
                subjectId: selectedSubject,
                price: selectedSubjectData.price,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString()
            });

            // Success feedback
            toast.success('تم إنشاء الحجز بنجاح! ✅');

            // Reset form and close
            resetForm();
            onClose();

            // Redirect based on user role
            const redirectPath = userRole === 'PARENT' ? '/parent/bookings' : '/student/bookings';
            router.push(redirectPath);

        } catch (error: any) {
            console.error('Failed to create booking:', error);

            // Better error handling
            const errorMessage = error?.response?.data?.message || error?.message || 'فشل إنشاء الحجز';

            if (errorMessage.includes('غير متاح')) {
                toast.error('هذا الموعد غير متاح. يرجى اختيار وقت آخر.');
            } else if (errorMessage.includes('Unauthorized')) {
                toast.error('يرجى تسجيل الدخول أولاً');
            } else {
                toast.error('حدث خطأ. الرجاء المحاولة مرة أخرى.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedDate(undefined);
        setSelectedTime('');
        setSelectedSubject('');
        setSelectedChildId('');
        setAvailableSlots([]);
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
                            حجز جلسة مع {teacherName}
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

                        {/* Child Selection - Only for Parents */}
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

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-bold text-text-main mb-3">
                                اختر التاريخ
                            </label>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <DayPicker
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={ar}
                                    disabled={{ before: new Date() }}
                                    className="rdp-custom"
                                    classNames={{
                                        day_selected: 'bg-primary text-white rounded-full',
                                        day_today: 'font-bold text-primary',
                                        day: 'h-9 w-9 rounded-full hover:bg-gray-100 transition-colors'
                                    }}
                                />
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
                                        {availableSlots.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-3 rounded-lg border text-sm font-medium transition-all ${selectedTime === time
                                                    ? 'border-secondary bg-secondary text-white shadow-md shadow-secondary/20'
                                                    : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                                                    }`}
                                            >
                                                {formatTimeSlot(time)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                                    مدة الجلسة: 60 دقيقة
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 rounded-b-2xl">
                        {/* Validation Feedback */}
                        {!canSubmit && (selectedDate || selectedTime || selectedSubject) && (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-yellow-600 text-lg">info</span>
                                    <div>
                                        <p className="font-medium mb-1">يرجى استكمال المعلومات التالية:</p>
                                        <ul className="text-xs space-y-1 mr-4">
                                            {!selectedDate && <li>• اختر التاريخ</li>}
                                            {!selectedTime && <li>• اختر الوقت</li>}
                                            {!selectedSubject && <li>• اختر المادة</li>}
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
            </div>
        </div>
    );
}
