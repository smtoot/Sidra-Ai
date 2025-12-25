'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, Booking } from '@/lib/api/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ArrowRight, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
    CreditCard, Video, BookOpen, Mail, Loader2, Globe, ThumbsUp, AlertTriangle, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';
import { CountdownTimer } from '@/components/booking/CountdownTimer';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ParentBookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>('');
    const [confirmingSession, setConfirmingSession] = useState(false);

    // Dispute modal state
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [disputeType, setDisputeType] = useState<string>('');
    const [disputeDescription, setDisputeDescription] = useState<string>('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    const bookingId = params.id as string;

    useEffect(() => {
        loadBooking();
        setUserTimezone(getUserTimezone());
    }, [bookingId]);

    const loadBooking = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getParentBookings();
            const found = data.find((b: Booking) => b.id === bookingId);
            setBooking(found || null);
        } catch (error) {
            console.error("Failed to load booking", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSession = async () => {
        if (!booking) return;

        setConfirmingSession(true);
        try {
            await bookingApi.confirmSessionEarly(booking.id);
            toast.success('تم تأكيد الحصة بنجاح! 🎉');
            await loadBooking();
        } catch (error) {
            console.error('Failed to confirm session', error);
            toast.error('حدث خطأ أثناء تأكيد الحصة');
        } finally {
            setConfirmingSession(false);
        }
    };

    const handleSubmitDispute = async () => {
        if (!booking || !disputeType || !disputeDescription.trim()) {
            toast.error('يرجى اختيار نوع المشكلة ووصفها');
            return;
        }

        setSubmittingDispute(true);
        try {
            await bookingApi.raiseDispute(
                booking.id,
                disputeType,
                disputeDescription.trim()
            );
            toast.success('تم إرسال شكواك بنجاح 📝');
            setDisputeModalOpen(false);
            await loadBooking();
        } catch (error) {
            console.error('Failed to submit dispute', error);
            toast.error('حدث خطأ أثناء إرسال الشكوى');
        } finally {
            setSubmittingDispute(false);
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
                            <Link href="/parent/bookings">
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
                    onClick={() => router.push('/parent/bookings')}
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

                {/* PENDING_CONFIRMATION Alert */}
                {booking.status === 'PENDING_CONFIRMATION' && (
                    <Card className="bg-warning-50 border-warning-200">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertCircle className="w-6 h-6 text-warning-700 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-warning-900 mb-1">الحصة بانتظار تأكيدك ⚠️</h3>
                                    <p className="text-sm text-warning-700">
                                        أكمل المعلم الحصة. يرجى التأكيد إذا كانت الحصة قد تمت بنجاح، أو الإبلاغ عن مشكلة إذا كان هناك خطأ.
                                    </p>
                                    {booking.disputeWindowClosesAt && (
                                        <div className="mt-3 bg-white/50 rounded-lg p-3 border border-warning-200">
                                            <p className="text-xs text-warning-700 font-medium mb-1">الوقت المتبقي للمراجعة:</p>
                                            <CountdownTimer
                                                deadline={booking.disputeWindowClosesAt}
                                                className="text-sm font-bold text-warning-900"
                                                onExpire={() => loadBooking()}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleConfirmSession}
                                    disabled={confirmingSession}
                                    className="flex-1 bg-success-600 hover:bg-success-700"
                                    size="lg"
                                >
                                    {confirmingSession ? (
                                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                    ) : (
                                        <ThumbsUp className="w-5 h-5 ml-2" />
                                    )}
                                    {confirmingSession ? 'جاري التأكيد...' : 'تأكيد الحصة'}
                                </Button>
                                <Button
                                    onClick={() => setDisputeModalOpen(true)}
                                    variant="outline"
                                    className="flex-1 border-warning-300 text-warning-700 hover:bg-warning-100"
                                    size="lg"
                                >
                                    <AlertTriangle className="w-5 h-5 ml-2" />
                                    الإبلاغ عن مشكلة
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Student/Child Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>معلومات الطالب</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {booking.child?.name || booking.studentUser?.displayName || 'طالب'}
                                        </h3>
                                        {booking.child?.gradeLevel && (
                                            <p className="text-sm text-gray-600">المرحلة: {booking.child.gradeLevel}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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

                                {booking.meetingLink && (
                                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <Video className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-sm text-green-700 mb-1">رابط الاجتماع</div>
                                            <a
                                                href={booking.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                                            >
                                                {booking.meetingLink}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {booking.bookingNotes && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-700 font-medium mb-2">ملاحظات الحجز</div>
                                        <p className="text-sm text-gray-700">{booking.bookingNotes}</p>
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
                                                if (booking.meetingLink) {
                                                    window.open(booking.meetingLink, '_blank');
                                                } else {
                                                    toast.error('لم يتم تحديد رابط الاجتماع');
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

                        {/* Timeline Card */}
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

            {/* Dispute Modal */}
            {disputeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-primary mb-4">الإبلاغ عن مشكلة</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            اختر نوع المشكلة وصفها لنتمكن من مساعدتك
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">نوع المشكلة</label>
                            <select
                                value={disputeType}
                                onChange={(e) => setDisputeType(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">اختر نوع المشكلة...</option>
                                <option value="TEACHER_NO_SHOW">المعلم لم يحضر</option>
                                <option value="SESSION_TOO_SHORT">الحصة كانت أقصر من المحدد</option>
                                <option value="QUALITY_ISSUE">مشكلة في جودة التدريس</option>
                                <option value="TECHNICAL_ISSUE">مشكلة تقنية</option>
                                <option value="OTHER">أخرى</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">وصف المشكلة</label>
                            <textarea
                                value={disputeDescription}
                                onChange={(e) => setDisputeDescription(e.target.value)}
                                placeholder="اشرح المشكلة بالتفصيل..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmitDispute}
                                disabled={submittingDispute}
                                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {submittingDispute ? 'جاري الإرسال...' : 'إرسال الشكوى'}
                            </button>
                            <button
                                onClick={() => setDisputeModalOpen(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
