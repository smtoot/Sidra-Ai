'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { bookingApi } from '@/lib/api/booking';
import { authApi, Student } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

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
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Data state
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // Mock time slots - In a real app, mock these or fetch availability
    const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
        '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
    ];

    // Format time slot for display (Arabic)
    const formatTimeSlot = (time: string) => {
        const [hourStr, period] = time.split(' ');
        let suffix = period === 'AM' ? 'ص' : 'م';
        return `${hourStr} ${suffix}`;
    };

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const profile = await authApi.getProfile();
            if (profile.parentProfile?.students) {
                setStudents(profile.parentProfile.students);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    if (!isOpen) return null;

    const selectedSubjectData = teacherSubjects.find(s => s.id === selectedSubject);
    const canSubmit = selectedDate && selectedTime && selectedSubject && selectedStudent;

    const handleSubmit = async () => {
        if (!canSubmit || !selectedSubjectData) return;

        setIsLoading(true);
        try {
            // Construct start and end times
            // Note: This is a simplified date construction. In prod use date-fns properly with timezones.
            const [timeStr, period] = selectedTime.split(' ');
            const [hours, minutes] = timeStr.split(':').map(Number);

            const startDateTime = new Date(selectedDate!);
            let hour24 = hours;
            if (period === 'PM' && hours !== 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;

            startDateTime.setHours(hour24, minutes, 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(hour24 + 1); // 1 hour session

            await bookingApi.createRequest({
                teacherId,
                studentId: selectedStudent,
                subjectId: selectedSubject,
                price: selectedSubjectData.price,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString()
            });

            // Success
            onClose();
            router.push('/parent/bookings'); // Redirect to bookings page to pay

        } catch (error) {
            console.error('Failed to create booking:', error);
            // Ideally show a toast here
            alert('فشل إنشاء الحجز. الرجاء المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
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

                        {/* Student Selection */}
                        <div>
                            <label className="block text-sm font-bold text-text-main mb-3">
                                اختر الطالب
                            </label>
                            {isLoadingStudents ? (
                                <div className="text-sm text-gray-500">جاري تحميل الطلاب...</div>
                            ) : (
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">اختر الطالب...</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {students.length === 0 && !isLoadingStudents && (
                                <p className="text-xs text-red-500 mt-1">
                                    لا يوجد طلاب مسجلين في ملفك. يرجى إضافة طالب أولاً.
                                </p>
                            )}
                        </div>

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
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {timeSlots.map((time) => (
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
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isLoading}
                            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
    );
}
