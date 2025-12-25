'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, CreditCard, Video, Globe, AlertTriangle, ThumbsUp, Star, XOctagon, Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { RatingModal } from '@/components/booking/RatingModal';
import { CancelConfirmModal } from '@/components/booking/CancelConfirmModal';
import { CountdownTimer } from '@/components/booking/CountdownTimer';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { toast } from 'sonner';

export default function ParentBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>('');

    // Dispute modal state
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [selectedBookingForDispute, setSelectedBookingForDispute] = useState<Booking | null>(null);
    const [disputeType, setDisputeType] = useState<string>('');
    const [disputeDescription, setDisputeDescription] = useState<string>('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    // Rating modal state
    const [ratingModalOpen, setRatingModalOpen] = useState(false);

    // Cancel modal state
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
    const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null);

    // Confirm session modal state
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedBookingForConfirm, setSelectedBookingForConfirm] = useState<Booking | null>(null);

    // Compute sessions awaiting confirmation (PENDING_CONFIRMATION status)
    const pendingConfirmations = useMemo(() => {
        return bookings.filter(booking => booking.status === 'PENDING_CONFIRMATION');
    }, [bookings]);

    const loadBookings = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await bookingApi.getParentBookings();
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

    const getStatusBadge = (status: BookingStatus) => {
        // Parent/Student-specific labels (different from teacher view)
        const statusMap = {
            PENDING_TEACHER_APPROVAL: { label: 'بانتظار موافقة المعلم', color: 'bg-warning/10 text-warning', icon: Clock },
            WAITING_FOR_PAYMENT: { label: 'في انتظار الدفع', color: 'bg-blue-100 text-blue-600', icon: AlertCircle },
            PAYMENT_REVIEW: { label: 'مراجعة الدفع', color: 'bg-blue-100 text-blue-600', icon: AlertCircle },
            SCHEDULED: { label: 'مجدولة', color: 'bg-green-100 text-green-600', icon: CheckCircle },
            // Student/Parent sees: Awaiting your confirmation
            PENDING_CONFIRMATION: { label: 'يرجى التأكيد أو الإبلاغ', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, sublabel: 'المعلم أنهى الحصة - يرجى المراجعة' },
            COMPLETED: { label: 'مكتملة', color: 'bg-success/10 text-success', icon: CheckCircle },
            DISPUTED: { label: 'تحت المراجعة', color: 'bg-orange-100 text-orange-600', icon: AlertCircle, sublabel: 'الإدارة تراجع شكواك' },
            REFUNDED: { label: 'تم الاسترداد', color: 'bg-gray-100 text-gray-600', icon: XCircle },
            PARTIALLY_REFUNDED: { label: 'استرداد جزئي', color: 'bg-orange-100 text-orange-600', icon: AlertCircle },
            REJECTED_BY_TEACHER: { label: 'مرفوضة', color: 'bg-error/10 text-error', icon: XCircle },
            CANCELLED_BY_PARENT: { label: 'ملغاة', color: 'bg-gray-100 text-gray-600', icon: XCircle },
            CANCELLED_BY_ADMIN: { label: 'ملغاة من الإدارة', color: 'bg-gray-100 text-gray-600', icon: XCircle },
            EXPIRED: { label: 'منتهية', color: 'bg-gray-100 text-gray-600', icon: XCircle },
        };

        const config = statusMap[status] || statusMap.PENDING_TEACHER_APPROVAL;
        const Icon = config.icon;
        const sublabel = 'sublabel' in config ? config.sublabel : undefined;

        return (
            <div className="flex flex-col items-end gap-1">
                <span className={cn("flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium", config.color)}>
                    <Icon className="w-4 h-4" />
                    {config.label}
                </span>
                {sublabel && (
                    <span className="text-xs text-gray-500">{sublabel}</span>
                )}
            </div>
        );
    };

    // Helper function to determine Join button state based on session time
    const getJoinButtonState = (booking: Booking): {
        show: boolean;
        label: string;
        enabled: boolean;
        sublabel?: string;
    } => {
        if (booking.status !== 'SCHEDULED') return { show: false, label: '', enabled: false };

        const sessionStart = new Date(booking.startTime);
        const sessionEnd = new Date(booking.endTime);
        const now = new Date();

        // Allow joining 15 min before until 30 min after session end
        const fifteenMinutesBefore = new Date(sessionStart.getTime() - 15 * 60 * 1000);
        const thirtyMinutesAfterEnd = new Date(sessionEnd.getTime() + 30 * 60 * 1000);

        const canJoin = now >= fifteenMinutesBefore && now <= thirtyMinutesAfterEnd;
        const sessionInProgress = now >= sessionStart && now <= sessionEnd;

        if (now < fifteenMinutesBefore) {
            // Session is in the future
            const diff = sessionStart.getTime() - now.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) {
                return {
                    show: true,
                    label: `بعد ${days} يوم`,
                    sublabel: 'سيتم تفعيل الرابط قبل الموعد بـ15 دقيقة',
                    enabled: false
                };
            } else if (hours > 0) {
                return {
                    show: true,
                    label: `بعد ${hours} ساعة`,
                    sublabel: 'سيتم تفعيل الرابط قبل الموعد بـ15 دقيقة',
                    enabled: false
                };
            } else {
                return {
                    show: true,
                    label: `بعد ${minutes} دقيقة`,
                    sublabel: 'سيتم تفعيل الرابط قبل الموعد بـ15 دقيقة',
                    enabled: false
                };
            }
        } else if (sessionInProgress) {
            // Session is happening now
            return {
                show: true,
                label: '🔴 انضم الآن',
                sublabel: 'الحصة جارية',
                enabled: true
            };
        } else if (canJoin) {
            // Within join window (15 min before or after)
            return {
                show: true,
                label: 'انضم للاجتماع',
                enabled: true
            };
        } else {
            // Session ended
            return {
                show: false,
                label: 'انتهت الحصة',
                enabled: false
            };
        }
    };

    // Handle session confirmation
    const handleConfirmSession = async () => {
        if (!selectedBookingForConfirm) return;

        setConfirmingId(selectedBookingForConfirm.id);
        try {
            await bookingApi.confirmSessionEarly(selectedBookingForConfirm.id);
            toast.success('تم تأكيد الحصة بنجاح! شكراً لك 🎉');
            setConfirmModalOpen(false);
            setSelectedBookingForConfirm(null);
            await loadBookings(true); // Silent refresh
        } catch (error) {
            console.error('Failed to confirm session', error);
            toast.error('حدث خطأ أثناء تأكيد الحصة');
        } finally {
            setConfirmingId(null);
        }
    };

    // Open dispute modal
    const handleOpenDispute = (booking: Booking) => {
        setSelectedBookingForDispute(booking);
        setDisputeType('');
        setDisputeDescription('');
        setDisputeModalOpen(true);
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
            toast.success('تم إرسال شكواك بنجاح. ستقوم الإدارة بمراجعتها قريباً 📝');
            setDisputeModalOpen(false);
            loadBookings();
        } catch (error) {
            console.error('Failed to submit dispute', error);
            toast.error('حدث خطأ أثناء إرسال الشكوى');
        } finally {
            setSubmittingDispute(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">حجوزاتي</h1>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-text-subtle">جميع الحصص المحجوزة</p>
                        {userTimezone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Globe className="w-4 h-4" />
                                <span>الأوقات بتوقيت {getTimezoneDisplay(userTimezone)}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Pending Confirmation Alert */}
                {pendingConfirmations.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-yellow-800">
                                    ⚠️ {pendingConfirmations.length} حصة بانتظار تأكيدك
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    يرجى تأكيد اكتمال الحصص أو الإبلاغ عن أي مشكلة خلال 48 ساعة. سيتم إغلاقها تلقائياً بعد ذلك.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                                    {booking.readableId && (
                                                        <div className="mb-1">
                                                            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                                #{booking.readableId}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-text-subtle">
                                                        الطالب: {booking.child ? booking.child.name : (booking.student?.name || booking.studentUser?.email)}
                                                    </p>
                                                    {/* Package indicator */}
                                                    {booking.pendingTierSessionCount && booking.pendingTierSessionCount > 1 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mt-1">
                                                            <Package className="w-3 h-3" />
                                                            باقة {booking.pendingTierSessionCount} حصص
                                                        </span>
                                                    )}
                                                    {booking.isDemo && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mt-1">
                                                            🎓 حصة تجريبية
                                                        </span>
                                                    )}
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
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedBookingForPayment(booking)}
                                                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                        ادفع الآن
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBookingForCancel(booking);
                                                            setCancelModalOpen(true);
                                                        }}
                                                        className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <XOctagon className="w-4 h-4" />
                                                        إلغاء
                                                    </button>
                                                </div>
                                            )}

                                            {/* Cancel button for PENDING_TEACHER_APPROVAL */}
                                            {booking.status === 'PENDING_TEACHER_APPROVAL' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedBookingForCancel(booking);
                                                        setCancelModalOpen(true);
                                                    }}
                                                    className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                    <XOctagon className="w-4 h-4" />
                                                    إلغاء الطلب
                                                </button>
                                            )}

                                            {booking.status === 'SCHEDULED' && (() => {
                                                const buttonState = getJoinButtonState(booking);
                                                if (!buttonState.show) return null;

                                                return (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <button
                                                            className={cn(
                                                                "px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm",
                                                                buttonState.enabled
                                                                    ? "bg-green-600 text-white hover:bg-green-700"
                                                                    : "bg-gray-200 text-gray-500 cursor-not-allowed",
                                                                buttonState.label.includes('🔴') && "animate-pulse"
                                                            )}
                                                            disabled={!buttonState.enabled}
                                                            onClick={() => {
                                                                if (buttonState.enabled && booking.meetingLink) {
                                                                    window.open(booking.meetingLink, '_blank');
                                                                } else if (buttonState.enabled) {
                                                                    alert('لم يتم تحديد رابط الاجتماع من قبل المعلم');
                                                                }
                                                            }}
                                                        >
                                                            <Video className="w-5 h-5" />
                                                            {buttonState.label}
                                                        </button>
                                                        {buttonState.sublabel && (
                                                            <span className="text-xs text-gray-400">
                                                                {buttonState.sublabel}
                                                            </span>
                                                        )}
                                                        {/* Cancel button for SCHEDULED (only before session starts) */}
                                                        {new Date(booking.startTime) > new Date() && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBookingForCancel(booking);
                                                                    setCancelModalOpen(true);
                                                                }}
                                                                className="text-xs text-red-500 hover:text-red-700 underline"
                                                            >
                                                                إلغاء الحجز
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Confirm/Dispute buttons for PENDING_CONFIRMATION */}
                                            {booking.status === 'PENDING_CONFIRMATION' && (
                                                <div className="flex flex-col items-end gap-3">
                                                    {/* Countdown Timer */}
                                                    {booking.disputeWindowClosesAt && (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                                            <p className="text-xs text-yellow-700 mb-1">الوقت المتبقي للمراجعة:</p>
                                                            <CountdownTimer
                                                                deadline={booking.disputeWindowClosesAt}
                                                                className="text-sm font-bold text-yellow-800"
                                                                onExpire={() => loadBookings(true)}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBookingForConfirm(booking);
                                                                setConfirmModalOpen(true);
                                                            }}
                                                            disabled={confirmingId === booking.id}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                                        >
                                                            {confirmingId === booking.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <ThumbsUp className="w-4 h-4" />
                                                            )}
                                                            {confirmingId === booking.id ? 'جاري التأكيد...' : 'تأكيد الحصة'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDispute(booking)}
                                                            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                            الإبلاغ عن مشكلة
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rate button for COMPLETED bookings without rating */}
                                            {booking.status === 'COMPLETED' && !(booking as any).rating && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedBookingForRating(booking);
                                                        setRatingModalOpen(true);
                                                    }}
                                                    className="bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm"
                                                >
                                                    <Star className="w-4 h-4" />
                                                    قيّم الحصة
                                                </button>
                                            )}

                                            {/* Show rated badge */}
                                            {booking.status === 'COMPLETED' && (booking as any).rating && (
                                                <div className="flex items-center gap-1 text-accent bg-accent/10 px-3 py-1.5 rounded-lg">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span className="font-bold">{(booking as any).rating.score}</span>
                                                    <span className="text-sm">تم التقييم</span>
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

            {/* Payment Modal */}
            {selectedBookingForPayment && (
                <PaymentModal
                    booking={selectedBookingForPayment}
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    onSuccess={() => {
                        loadBookings(); // Refresh list to show updated status
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

                        {/* Dispute Type Selection */}
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

                        {/* Description */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">وصف المشكلة</label>
                            <textarea
                                value={disputeDescription}
                                onChange={(e) => setDisputeDescription(e.target.value)}
                                placeholder="اشرح المشكلة بالتفصيل..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-none"
                            />
                        </div>

                        {/* Buttons */}
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

            {/* Rating Modal */}
            {ratingModalOpen && selectedBookingForRating && (
                <RatingModal
                    isOpen={ratingModalOpen}
                    onClose={() => {
                        setRatingModalOpen(false);
                        setSelectedBookingForRating(null);
                    }}
                    bookingId={selectedBookingForRating.id}
                    teacherName={selectedBookingForRating.teacherProfile?.displayName || 'المعلم'}
                    onSuccess={() => {
                        toast.success('شكراً على تقييمك! 🌟');
                        loadBookings();
                    }}
                />
            )}

            {/* Cancel Confirmation Modal */}
            {cancelModalOpen && selectedBookingForCancel && (
                <CancelConfirmModal
                    isOpen={cancelModalOpen}
                    onClose={() => {
                        setCancelModalOpen(false);
                        setSelectedBookingForCancel(null);
                    }}
                    bookingId={selectedBookingForCancel.id}
                    onSuccess={() => {
                        toast.success('تم إلغاء الحجز بنجاح');
                        loadBookings();
                    }}
                />
            )}

            {/* Session Confirmation Modal */}
            {confirmModalOpen && selectedBookingForConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ThumbsUp className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-2">تأكيد اكتمال الحصة</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            هل أنت متأكد من اكتمال الحصة؟ عند التأكيد سيتم تحويل المبلغ إلى محفظة المعلم مباشرة.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmSession}
                                disabled={confirmingId === selectedBookingForConfirm.id}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {confirmingId === selectedBookingForConfirm.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'نعم، تأكيد'
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmModalOpen(false);
                                    setSelectedBookingForConfirm(null);
                                }}
                                disabled={confirmingId === selectedBookingForConfirm.id}
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
