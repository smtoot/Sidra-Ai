'use client';

import { useState, useEffect } from 'react';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Video, Globe, Loader2, Filter, ArrowLeft, BookOpen, ThumbsUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { CountdownTimer } from '@/components/booking/CountdownTimer';
import { toast } from 'sonner';
import Link from 'next/link';

const BOOKINGS_PER_PAGE = 10;

export default function StudentBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Dispute modal state
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [selectedBookingForDispute, setSelectedBookingForDispute] = useState<Booking | null>(null);
    const [disputeType, setDisputeType] = useState<string>('');
    const [disputeDescription, setDisputeDescription] = useState<string>('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    const loadBookings = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await bookingApi.getStudentBookings();
            setBookings(data);
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
        setUserTimezone(getUserTimezone());
    }, []);

    const getStatusConfig = (status: BookingStatus) => {
        const statusMap = {
            PENDING_TEACHER_APPROVAL: { label: 'بانتظار موافقة المعلم', color: 'warning', bgColor: 'bg-warning-50', borderColor: 'border-warning-200', icon: Clock },
            WAITING_FOR_PAYMENT: { label: 'في انتظار الدفع', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: CreditCard },
            PAYMENT_REVIEW: { label: 'مراجعة الدفع', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Clock },
            SCHEDULED: { label: 'مجدولة', color: 'success', bgColor: 'bg-success-50', borderColor: 'border-success-200', icon: CheckCircle },
            PENDING_CONFIRMATION: { label: 'يرجى التأكيد أو الإبلاغ', color: 'warning', bgColor: 'bg-warning-50', borderColor: 'border-warning-200', icon: AlertCircle },
            COMPLETED: { label: 'مكتملة', color: 'success', bgColor: 'bg-success-50', borderColor: 'border-success-200', icon: CheckCircle },
            DISPUTED: { label: 'تحت المراجعة', color: 'warning', bgColor: 'bg-warning-50', borderColor: 'border-warning-200', icon: AlertCircle },
            REFUNDED: { label: 'تم الاسترداد', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: XCircle },
            PARTIALLY_REFUNDED: { label: 'استرداد جزئي', color: 'warning', bgColor: 'bg-warning-50', borderColor: 'border-warning-200', icon: AlertCircle },
            REJECTED_BY_TEACHER: { label: 'مرفوضة من المعلم', color: 'error', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle },
            CANCELLED_BY_PARENT: { label: 'ملغاة', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: XCircle },
            CANCELLED_BY_TEACHER: { label: 'ملغاة من المعلم', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: XCircle },
            CANCELLED_BY_ADMIN: { label: 'ملغاة من الإدارة', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: XCircle },
            EXPIRED: { label: 'منتهية', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: XCircle },
        };

        return statusMap[status] || statusMap.PENDING_TEACHER_APPROVAL;
    };

    // Handle session confirmation
    const handleConfirmSession = async (booking: Booking) => {
        setConfirmingId(booking.id);
        try {
            await bookingApi.confirmSessionEarly(booking.id);
            toast.success('تم تأكيد الحصة بنجاح! 🎉');
            await loadBookings(true);
        } catch (error) {
            console.error('Failed to confirm session', error);
            toast.error('حدث خطأ أثناء تأكيد الحصة');
        } finally {
            setConfirmingId(null);
        }
    };

    // Submit dispute
    const handleSubmitDispute = async () => {
        if (!selectedBookingForDispute || !disputeType || !disputeDescription.trim()) {
            toast.error('يرجى اختيار نوع المشكلة ووصفها');
            return;
        }

        setSubmittingDispute(true);
        try {
            await bookingApi.raiseDispute(
                selectedBookingForDispute.id,
                disputeType,
                disputeDescription.trim()
            );
            toast.success('تم إرسال شكواك بنجاح 📝');
            setDisputeModalOpen(false);
            loadBookings();
        } catch (error) {
            console.error('Failed to submit dispute', error);
            toast.error('حدث خطأ أثناء إرسال الشكوى');
        } finally {
            setSubmittingDispute(false);
        }
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ACTIVE') return ['SCHEDULED', 'PENDING_CONFIRMATION', 'WAITING_FOR_PAYMENT', 'PAYMENT_REVIEW', 'PENDING_TEACHER_APPROVAL'].includes(booking.status);
        if (statusFilter === 'PAST') return ['COMPLETED', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'REJECTED_BY_TEACHER', 'EXPIRED', 'REFUNDED'].includes(booking.status);
        return booking.status === statusFilter;
    });

    const activeCount = bookings.filter(b => ['SCHEDULED', 'PENDING_CONFIRMATION', 'WAITING_FOR_PAYMENT', 'PAYMENT_REVIEW', 'PENDING_TEACHER_APPROVAL'].includes(b.status)).length;
    const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
    const pastCount = bookings.filter(b => ['COMPLETED', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'REJECTED_BY_TEACHER', 'EXPIRED', 'REFUNDED'].includes(b.status)).length;

    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
    const endIndex = startIndex + BOOKINGS_PER_PAGE;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-6">
                <header>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">حصصي 📚</h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                        <p className="text-sm md:text-base text-gray-600">جميع الحصص المحجوزة</p>
                        {userTimezone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <Globe className="w-4 h-4" />
                                <span>{getTimezoneDisplay(userTimezone)}</span>
                            </div>
                        )}
                    </div>
                </header>

                {loading ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                            <p className="text-gray-500">جاري التحميل...</p>
                        </CardContent>
                    </Card>
                ) : bookings.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="p-12 text-center">
                            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد حجوزات</h3>
                            <p className="text-gray-500 mb-4">ابحث عن معلم واحجز حصة جديدة</p>
                            <Link href="/search">
                                <Button>ابحث عن معلم</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Filter Tabs */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 overflow-x-auto">
                                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                                    {[
                                        { key: 'ALL', label: 'الكل', count: bookings.length },
                                        { key: 'ACTIVE', label: 'نشطة', count: activeCount },
                                        { key: 'COMPLETED', label: 'مكتملة', count: completedCount },
                                        { key: 'PAST', label: 'سابقة', count: pastCount },
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                setStatusFilter(tab.key);
                                                setCurrentPage(1);
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2",
                                                statusFilter === tab.key
                                                    ? "bg-primary-600 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            )}
                                        >
                                            {tab.label}
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-bold",
                                                statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                                            )}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bookings List */}
                        {filteredBookings.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="p-12 text-center">
                                    <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">لا توجد حجوزات في هذه الفئة</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedBookings.map((booking) => {
                                        const statusConfig = getStatusConfig(booking.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <Card key={booking.id} className={cn("border-r-4 hover:shadow-lg transition-all", statusConfig.borderColor)}>
                                                <CardContent className="p-0">
                                                    <div className="p-5">
                                                        {/* Header with Teacher Info */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar
                                                                    src={booking.teacherProfile?.user?.photoUrl}
                                                                    fallback={booking.teacherProfile?.displayName?.[0] || 'م'}
                                                                    size="lg"
                                                                />
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900">
                                                                        {booking.teacherProfile?.displayName || 'معلم'}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5">
                                                                        <BookOpen className="w-3.5 h-3.5" />
                                                                        <span>{booking.subject?.nameAr}</span>
                                                                        {booking.readableId && (
                                                                            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mr-2">
                                                                                #{booking.readableId}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={cn("px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm", statusConfig.bgColor, `text-${statusConfig.color}-700`)}>
                                                                <StatusIcon className="w-4 h-4" />
                                                                <span>{statusConfig.label}</span>
                                                            </div>
                                                        </div>

                                                        {/* Date & Time */}
                                                        <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
                                                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                                                <Calendar className="w-4 h-4 text-primary-600" />
                                                                <span className="font-medium">{new Date(booking.startTime).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                                                <Clock className="w-4 h-4 text-primary-600" />
                                                                <span className="font-medium">
                                                                    {new Date(booking.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                                    {' - '}
                                                                    {new Date(booking.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* PENDING_CONFIRMATION Actions */}
                                                        {booking.status === 'PENDING_CONFIRMATION' && (
                                                            <div className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                                                                {booking.disputeWindowClosesAt && (
                                                                    <div className="mb-3">
                                                                        <p className="text-xs text-warning-700 mb-1">الوقت المتبقي:</p>
                                                                        <CountdownTimer
                                                                            deadline={booking.disputeWindowClosesAt}
                                                                            className="text-sm font-bold text-warning-800"
                                                                            onExpire={() => loadBookings(true)}
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        onClick={() => handleConfirmSession(booking)}
                                                                        disabled={confirmingId === booking.id}
                                                                        className="flex-1 bg-success-600 hover:bg-success-700"
                                                                        size="sm"
                                                                    >
                                                                        {confirmingId === booking.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin ml-1" />
                                                                        ) : (
                                                                            <ThumbsUp className="w-4 h-4 ml-1" />
                                                                        )}
                                                                        {confirmingId === booking.id ? 'جاري التأكيد...' : 'تأكيد'}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setSelectedBookingForDispute(booking);
                                                                            setDisputeModalOpen(true);
                                                                        }}
                                                                        variant="outline"
                                                                        className="flex-1 border-warning-300 text-warning-700"
                                                                        size="sm"
                                                                    >
                                                                        <AlertTriangle className="w-4 h-4 ml-1" />
                                                                        إبلاغ
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Actions Bar */}
                                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                            <div className="text-2xl font-black text-primary-700">
                                                                {booking.price} <span className="text-sm font-normal text-gray-500">SDG</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {booking.status === 'WAITING_FOR_PAYMENT' && (
                                                                    <Button
                                                                        onClick={() => setSelectedBookingForPayment(booking)}
                                                                        className="bg-blue-600 hover:bg-blue-700"
                                                                    >
                                                                        <CreditCard className="w-4 h-4 ml-1" />
                                                                        ادفع الآن
                                                                    </Button>
                                                                )}
                                                                {booking.status === 'SCHEDULED' && (
                                                                    <Button
                                                                        className="bg-success-600 hover:bg-success-700"
                                                                        onClick={() => alert('سيتم توجيهك إلى رابط الاجتماع')}
                                                                    >
                                                                        <Video className="w-4 h-4 ml-1" />
                                                                        دخول
                                                                    </Button>
                                                                )}
                                                                <Link href={`/student/bookings/${booking.id}`}>
                                                                    <Button variant="outline">
                                                                        التفاصيل
                                                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {filteredBookings.length > BOOKINGS_PER_PAGE && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE)}
                                        onPageChange={(page) => {
                                            setCurrentPage(page);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Payment Modal */}
            {selectedBookingForPayment && (
                <PaymentConfirmModal
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    booking={selectedBookingForPayment}
                    onPaymentSuccess={() => {
                        loadBookings();
                    }}
                />
            )}

            {/* Dispute Modal */}
            {disputeModalOpen && selectedBookingForDispute && (
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
