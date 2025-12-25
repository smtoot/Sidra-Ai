'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, Booking } from '@/lib/api/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ArrowRight, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
    CreditCard, Video, BookOpen, Phone, Mail, Loader2, MapPin, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import Link from 'next/link';

export default function StudentBookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>('');

    const bookingId = params.id as string;

    useEffect(() => {
        loadBooking();
        setUserTimezone(getUserTimezone());
    }, [bookingId]);

    const loadBooking = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getStudentBookings();
            const found = data.find((b: Booking) => b.id === bookingId);
            setBooking(found || null);
        } catch (error) {
            console.error("Failed to load booking", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                            <p className="text-gray-500">جاري التحميل...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                            <h2 className="text-xl font-bold text-red-700 mb-4">الحجز غير موجود</h2>
                            <Link href="/student/bookings">
                                <Button variant="outline">العودة للحجوزات</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const getStatusConfig = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
            PENDING_TEACHER_APPROVAL: { label: 'بانتظار موافقة المعلم', color: 'warning', bgColor: 'bg-warning-100 text-warning-700', icon: Clock },
            WAITING_FOR_PAYMENT: { label: 'في انتظار الدفع', color: 'blue', bgColor: 'bg-blue-100 text-blue-700', icon: CreditCard },
            PAYMENT_REVIEW: { label: 'مراجعة الدفع', color: 'blue', bgColor: 'bg-blue-100 text-blue-700', icon: Clock },
            SCHEDULED: { label: 'مجدولة', color: 'success', bgColor: 'bg-success-100 text-success-700', icon: CheckCircle },
            PENDING_CONFIRMATION: { label: 'يرجى التأكيد أو الإبلاغ', color: 'warning', bgColor: 'bg-warning-100 text-warning-700', icon: AlertCircle },
            COMPLETED: { label: 'مكتملة', color: 'success', bgColor: 'bg-success-100 text-success-700', icon: CheckCircle },
            DISPUTED: { label: 'تحت المراجعة', color: 'warning', bgColor: 'bg-warning-100 text-warning-700', icon: AlertCircle },
            REFUNDED: { label: 'تم الاسترداد', color: 'gray', bgColor: 'bg-gray-100 text-gray-600', icon: XCircle },
            REJECTED_BY_TEACHER: { label: 'مرفوضة من المعلم', color: 'error', bgColor: 'bg-red-100 text-red-700', icon: XCircle },
            CANCELLED_BY_PARENT: { label: 'ملغاة', color: 'gray', bgColor: 'bg-gray-100 text-gray-600', icon: XCircle },
            CANCELLED_BY_ADMIN: { label: 'ملغاة من الإدارة', color: 'gray', bgColor: 'bg-gray-100 text-gray-600', icon: XCircle },
        };
        return statusMap[status] || statusMap.PENDING_TEACHER_APPROVAL;
    };

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/student/bookings')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                >
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    <span className="font-medium">العودة للحجوزات</span>
                </button>

                {/* Status Banner */}
                <Card className="bg-gradient-to-l from-primary-50 to-primary-100 border-primary-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">تفاصيل الحجز</h1>
                                <p className="text-sm text-gray-600">رقم الحجز: {booking.id.slice(0, 8)}</p>
                            </div>
                            <div className={cn("px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm", statusConfig.bgColor)}>
                                <StatusIcon className="w-5 h-5" />
                                <span>{statusConfig.label}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Teacher Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>معلومات المعلم</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar
                                        src={booking.teacherProfile?.user?.photoUrl}
                                        fallback={booking.teacherProfile?.displayName?.[0] || 'م'}
                                        size="xl"
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {booking.teacherProfile?.displayName || 'معلم'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                            <BookOpen className="w-4 h-4" />
                                            <span>{booking.subject?.nameAr}</span>
                                        </div>
                                    </div>
                                </div>
                                {booking.teacherProfile?.user?.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                        <Mail className="w-4 h-4" />
                                        <span>{booking.teacherProfile.user.email}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Session Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>تفاصيل الحصة</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">التاريخ</div>
                                        <div className="font-bold text-gray-900">
                                            {new Date(booking.startTime).toLocaleDateString('ar-SA', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">الوقت</div>
                                        <div className="font-bold text-gray-900">
                                            {new Date(booking.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(booking.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {userTimezone && (
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                {getTimezoneDisplay(userTimezone)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {booking.meetingUrl && (
                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <Video className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-sm text-green-700 mb-1">رابط الاجتماع</div>
                                            <a
                                                href={booking.meetingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                                            >
                                                {booking.meetingUrl}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {booking.notes && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-700 font-medium mb-2">ملاحظات</div>
                                        <p className="text-sm text-gray-700">{booking.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Price Card */}
                        <Card className="sticky top-6 border-primary-200 bg-primary-50/50">
                            <CardHeader>
                                <CardTitle>ملخص الدفع</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-black text-primary-700 mb-1">
                                        {booking.price}
                                    </div>
                                    <div className="text-sm text-gray-600">جنيه سوداني</div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    {booking.status === 'WAITING_FOR_PAYMENT' && (
                                        <Button
                                            onClick={() => setSelectedBookingForPayment(booking)}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            size="lg"
                                        >
                                            <CreditCard className="w-5 h-5 ml-2" />
                                            ادفع الآن
                                        </Button>
                                    )}
                                    {booking.status === 'SCHEDULED' && (
                                        <Button
                                            className="w-full bg-success-600 hover:bg-success-700"
                                            size="lg"
                                            onClick={() => {
                                                if (booking.meetingUrl) {
                                                    window.open(booking.meetingUrl, '_blank');
                                                } else {
                                                    alert('سيتم توجيهك إلى رابط الاجتماع');
                                                }
                                            }}
                                        >
                                            <Video className="w-5 h-5 ml-2" />
                                            دخول الحصة
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline/History Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">سجل الحجز</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                                        <span>تم الحجز: {new Date(booking.createdAt).toLocaleDateString('ar-SA')}</span>
                                    </div>
                                    {booking.updatedAt !== booking.createdAt && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                                            <span>آخر تحديث: {new Date(booking.updatedAt).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {selectedBookingForPayment && (
                <PaymentConfirmModal
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    booking={selectedBookingForPayment}
                    onPaymentSuccess={() => {
                        loadBooking();
                    }}
                />
            )}
        </div>
    );
}
