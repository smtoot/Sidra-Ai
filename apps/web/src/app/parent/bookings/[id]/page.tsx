'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, Booking } from '@/lib/api/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ArrowRight, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
    CreditCard, Video, BookOpen, Mail, Loader2, Globe, ThumbsUp, AlertTriangle, User, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';
import { CountdownTimer } from '@/components/booking/CountdownTimer';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { SessionDetailsCard } from '@/components/booking/SessionDetailsCard';
import { RatingModal } from '@/components/booking/RatingModal';
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

    // Rating modal state
    const [ratingModalOpen, setRatingModalOpen] = useState(false);

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
            // Open rating modal after successful confirmation
            setRatingModalOpen(true);
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

                {/* PENDING_CONFIRMATION - Show Summary First, Then Actions */}
                {booking.status === 'PENDING_CONFIRMATION' && (
                    <Card className="bg-gradient-to-br from-warning-50 to-orange-50 border-warning-300 border-2">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3 mb-5">
                                <AlertCircle className="w-7 h-7 text-warning-700 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-warning-900 text-lg mb-2">الحصة بانتظار تأكيدك ⚠️</h3>
                                    <p className="text-sm text-warning-700 mb-3">
                                        أكمل المعلم الحصة. يرجى مراجعة ملخص الحصة أدناه، ثم تأكيد إذا تمت الحصة بنجاح، أو الإبلاغ عن مشكلة.
                                    </p>
                                    {booking.disputeWindowClosesAt && (
                                        <div className="bg-white rounded-lg p-3 border border-warning-200">
                                            <p className="text-xs text-warning-700 font-medium mb-1">⏰ الوقت المتبقي للمراجعة:</p>
                                            <CountdownTimer
                                                deadline={booking.disputeWindowClosesAt}
                                                className="text-sm font-bold text-warning-900"
                                                onExpire={() => loadBooking()}
                                            />
                                            <p className="text-xs text-warning-600 mt-2">
                                                سيتم تحويل الدفع تلقائياً للمعلم بعد انتهاء الوقت
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5 border-t border-warning-200">
                                <Button
                                    onClick={handleConfirmSession}
                                    disabled={confirmingSession}
                                    className="flex-1 bg-success-600 hover:bg-success-700 shadow-lg"
                                    size="lg"
                                >
                                    {confirmingSession ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                            جاري التأكيد...
                                        </>
                                    ) : (
                                        <>
                                            <ThumbsUp className="w-5 h-5 ml-2" />
                                            ✅ تأكيد الحصة وتقييم المعلم
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setDisputeModalOpen(true)}
                                    variant="outline"
                                    className="flex-1 border-2 border-red-300 text-red-700 hover:bg-red-50 shadow-md"
                                    size="lg"
                                >
                                    <AlertTriangle className="w-5 h-5 ml-2" />
                                    🚨 الإبلاغ عن مشكلة
                                </Button>
                            </div>

                            <p className="text-xs text-center text-warning-600 mt-3">
                                📝 ملاحظة: عند التأكيد، ستتمكن من تقييم المعلم ومشاركة تجربتك
                            </p>
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

                        {/* Session Completion Details (show if completed or pending confirmation) */}
                        {(booking.status === 'COMPLETED' || booking.status === 'PENDING_CONFIRMATION') && (
                            <SessionDetailsCard
                                booking={booking}
                                showProof={false} // Parents don't see proof
                                userRole="parent"
                            />
                        )}

                        {/* Rebook Button (only for COMPLETED sessions) */}
                        {booking.status === 'COMPLETED' && booking.teacherProfile && (
                            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <RefreshCw className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-green-900 mb-2">
                                                أعجبتك الحصة؟ 🎉
                                            </h3>
                                            <p className="text-sm text-green-700 mb-4">
                                                احجز حصة أخرى مع <span className="font-bold">{booking.teacherProfile.displayName}</span> وواصل رحلة التعلم!
                                            </p>
                                            <Link
                                                href={`/teachers/${booking.teacherProfile.slug}`}
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                                احجز حصة جديدة
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
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

            {/* Improved Dispute Modal */}
            {disputeModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">الإبلاغ عن مشكلة</h2>
                            </div>
                            <p className="text-white/90 text-sm">
                                سيقوم فريق الإدارة بمراجعة شكواك والتواصل معك في أقرب وقت
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    ⚠️ ما هي المشكلة؟
                                </label>
                                <select
                                    value={disputeType}
                                    onChange={(e) => setDisputeType(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-medium"
                                >
                                    <option value="">اختر نوع المشكلة...</option>
                                    <option value="TEACHER_NO_SHOW">🚫 المعلم لم يحضر</option>
                                    <option value="SESSION_TOO_SHORT">⏱️ الحصة كانت أقصر من المدة المحددة</option>
                                    <option value="POOR_QUALITY">📉 جودة التدريس ضعيفة</option>
                                    <option value="NOT_AS_DESCRIBED">❌ الحصة لم تكن كما هو متفق عليه</option>
                                    <option value="TECHNICAL_ISSUE">💻 مشكلة تقنية منعت إتمام الحصة</option>
                                    <option value="INAPPROPRIATE_BEHAVIOR">⚠️ سلوك غير مناسب من المعلم</option>
                                    <option value="OTHER">📝 أخرى</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    📋 اشرح المشكلة بالتفصيل
                                </label>
                                <textarea
                                    value={disputeDescription}
                                    onChange={(e) => setDisputeDescription(e.target.value)}
                                    placeholder="يرجى وصف ما حدث بالتفصيل حتى نتمكن من مساعدتك..."
                                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[120px] resize-none"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-left">
                                    {disputeDescription.length}/500
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>💡 ملاحظة:</strong> سيتم إيقاف تحويل الدفع للمعلم حتى يتم حل المشكلة. سنتواصل معك خلال 24-48 ساعة.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex gap-3">
                            <button
                                onClick={() => {
                                    setDisputeModalOpen(false);
                                    setDisputeType('');
                                    setDisputeDescription('');
                                }}
                                disabled={submittingDispute}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSubmitDispute}
                                disabled={submittingDispute || !disputeType || !disputeDescription.trim()}
                                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {submittingDispute ? (
                                    <>
                                        <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    '📨 إرسال الشكوى للإدارة'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {booking && (
                <RatingModal
                    isOpen={ratingModalOpen}
                    onClose={() => setRatingModalOpen(false)}
                    bookingId={booking.id}
                    teacherName={booking.teacherProfile.user.fullName}
                    onSuccess={() => {
                        loadBooking();
                        toast.success('شكراً لتقييمك! 🌟');
                    }}
                />
            )}
        </div>
    );
}
