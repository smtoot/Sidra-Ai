'use client';

import { useState, useEffect } from 'react';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherSessionsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getTeacherSessions();
            setBookings(data);
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const getStatusBadge = (status: BookingStatus) => {
        const statusMap = {
            PENDING_TEACHER_APPROVAL: { label: 'قيد الانتظار', color: 'bg-warning/10 text-warning', icon: AlertCircle },
            WAITING_FOR_PAYMENT: { label: 'في انتظار الدفع', color: 'bg-blue-100 text-blue-600', icon: AlertCircle },
            PAYMENT_REVIEW: { label: 'مراجعة الدفع', color: 'bg-blue-100 text-blue-600', icon: AlertCircle },
            SCHEDULED: { label: 'مجدولة', color: 'bg-green-100 text-green-600', icon: CheckCircle },
            COMPLETED: { label: 'مكتملة', color: 'bg-success/10 text-success', icon: CheckCircle },
            REJECTED_BY_TEACHER: { label: 'مرفوضة', color: 'bg-error/10 text-error', icon: XCircle },
            CANCELLED_BY_PARENT: { label: 'ملغاة', color: 'bg-gray-100 text-gray-600', icon: XCircle },
            CANCELLED_BY_ADMIN: { label: 'ملغاة من الإدارة', color: 'bg-gray-100 text-gray-600', icon: XCircle },
            EXPIRED: { label: 'منتهية', color: 'bg-gray-100 text-gray-600', icon: XCircle },
        };

        const config = statusMap[status] || statusMap.PENDING_TEACHER_APPROVAL;
        const Icon = config.icon;

        return (
            <span className={cn("flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium", config.color)}>
                <Icon className="w-4 h-4" />
                {config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">حصصي</h1>
                    <p className="text-text-subtle">الجدول الدراسي وجميع الحصص</p>
                </header>

                {loading ? (
                    <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                ) : bookings.length === 0 ? (
                    <div className="bg-surface rounded-xl p-12 text-center border border-gray-100">
                        <Calendar className="w-16 h-16 mx-auto text-text-subtle mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">لا توجد حصص مجدولة</h3>
                        <p className="text-text-subtle">عندما يتم حجز حصص جديدة ستظهر هنا</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-surface rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1 space-y-3 w-full">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-primary">
                                                        {booking.student?.name || 'طالب مجهول'}
                                                    </h3>
                                                    <p className="text-sm text-text-subtle">
                                                        {booking.subject?.nameAr || booking.subjectId}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-text-subtle">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(booking.startTime).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-text-subtle">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(booking.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="font-bold text-lg text-primary">
                                                {booking.price} SDG
                                            </div>

                                            {/* Action Buttons */}
                                            {booking.status === 'SCHEDULED' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
                                                        onClick={() => {
                                                            window.open(booking.meetingLink || 'https://meet.google.com', '_blank');
                                                        }}
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        بدء الاجتماع
                                                    </button>
                                                    <button
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
                                                        onClick={async () => {
                                                            if (confirm('هل انتهت الحصة بالفعل؟ سيتم تحويل الأرباح إلى محفظتك.')) {
                                                                try {
                                                                    await bookingApi.completeSession(booking.id);
                                                                    loadSessions(); // Refresh
                                                                } catch (err) {
                                                                    alert('حدث خطأ أثناء إنهاء الحصة');
                                                                    console.error(err);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        إنهاء الحصة
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
