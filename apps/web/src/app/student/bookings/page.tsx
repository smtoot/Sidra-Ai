'use client';

import { useState, useEffect } from 'react';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, CreditCard, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';

export default function StudentBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getStudentBookings();
            setBookings(data);
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
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
                    <h1 className="text-3xl font-bold text-primary">حصصي 📚</h1>
                    <p className="text-text-subtle">جميع الحصص المحجوزة</p>
                </header>

                {loading ? (
                    <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                ) : bookings.length === 0 ? (
                    <div className="bg-surface rounded-xl p-12 text-center border border-gray-100">
                        <Calendar className="w-16 h-16 mx-auto text-text-subtle mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">لا توجد حجوزات</h3>
                        <p className="text-text-subtle">ابحث عن معلم واحجز حصة جديدة</p>
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
                                                        {booking.teacherProfile?.displayName || booking.teacherProfile?.user?.email}
                                                    </h3>
                                                    <p className="text-sm text-text-subtle">
                                                        {booking.subject?.nameAr}
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
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-lg text-primary">{booking.price} SDG</span>
                                                {booking.cancelReason && (
                                                    <span className="text-xs text-error bg-error/10 px-2 py-1 rounded">
                                                        سبب الإلغاء: {booking.cancelReason}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {booking.status === 'WAITING_FOR_PAYMENT' && (
                                                <button
                                                    onClick={() => setSelectedBookingForPayment(booking)}
                                                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    ادفع الآن
                                                </button>
                                            )}

                                            {booking.status === 'SCHEDULED' && (
                                                <button
                                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                                                    onClick={() => {
                                                        alert('سيتم توجيهك إلى رابط الاجتماع (ZOOM/Meet)');
                                                    }}
                                                >
                                                    <Video className="w-5 h-5" />
                                                    انضم للاجتماع
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {selectedBookingForPayment && (
                <PaymentConfirmModal
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    booking={selectedBookingForPayment}
                    onPaymentSuccess={() => {
                        loadBookings(); // Refresh list to show updated status
                    }}
                />
            )}
        </div>
    );
}
