'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, Booking, BookingAction } from '@/lib/api/booking';
import {
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';
import { RatingModal } from '@/components/booking/RatingModal';
import { BookingDetailsView } from '@/components/booking/BookingDetailsView';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ParentBookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

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

        try {
            await bookingApi.confirmSessionEarly(booking.id);
            toast.success('تم تأكيد الحصة بنجاح! 🎉');
            await loadBooking();
            // Open rating modal after successful confirmation
            setRatingModalOpen(true);
        } catch (error) {
            console.error('Failed to confirm session', error);
            toast.error('حدث خطأ أثناء تأكيد الحصة');
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

    // --- Actions ---
    const handleAction = (action: BookingAction) => {
        if (!booking) return;

        switch (action) {
            case 'pay':
                setSelectedBookingForPayment(booking);
                break;
            case 'cancel':
                if (window.confirm('هل أنت متأكد من رغبتك في إلغاء الطلب؟')) {
                    bookingApi.cancelBooking(booking.id).then(() => {
                        toast.success('تم إلغاء الطلب');
                        loadBooking();
                    });
                }
                break;
            case 'confirm':
                handleConfirmSession();
                break;
            case 'dispute':
                setDisputeType('');
                setDisputeDescription('');
                setDisputeModalOpen(true);
                break;
            case 'rate':
                setRatingModalOpen(true);
                break;
            case 'book-new':
                router.push('/search');
                break;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900">الحجز غير موجود</h1>
                <p className="text-gray-500 mb-6">لم نتمكن من العثور على تفاصيل هذا الحجز.</p>
                <Link href="/parent/bookings">
                    <Button variant="outline">العودة للحجوزات</Button>
                </Link>
            </div>
        );
    }

    // Determine available actions based on status logic
    const availableActions: BookingAction[] = [];
    if (booking.status === 'WAITING_FOR_PAYMENT') availableActions.push('pay', 'cancel');
    if (booking.status === 'PENDING_TEACHER_APPROVAL') availableActions.push('cancel');
    if (booking.status === 'SCHEDULED') availableActions.push('cancel');
    if (booking.status === 'PENDING_CONFIRMATION') availableActions.push('confirm', 'dispute');
    if (booking.status === 'COMPLETED') availableActions.push('rate', 'book-new');
    if (booking.status.includes('CANCELLED') || booking.status.includes('REJECTED')) availableActions.push('book-new');


    return (
        <>
            <BookingDetailsView
                booking={booking}
                userRole="PARENT"
                availableActions={availableActions}
                onAction={handleAction}
            />

            {/* --- Modals (Preserved) --- */}
            {selectedBookingForPayment && (
                <PaymentConfirmModal
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    booking={selectedBookingForPayment}
                    onPaymentSuccess={() => { loadBooking(); setSelectedBookingForPayment(null); }}
                />
            )}

            {ratingModalOpen && (
                <RatingModal
                    isOpen={ratingModalOpen}
                    onClose={() => setRatingModalOpen(false)}
                    bookingId={booking.id}
                    teacherName={booking.teacherProfile?.displayName || 'المعلم'}
                    onSuccess={() => { toast.success('شكراً على تقييمك!'); loadBooking(); }}
                />
            )}

            {disputeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" dir="rtl">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">الإبلاغ عن مشكلة</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            يرجى إخبارنا بما حدث لنتمكن من المساعدة.
                        </p>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">نوع المشكلة</label>
                                <select
                                    value={disputeType}
                                    onChange={(e) => setDisputeType(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                >
                                    <option value="">اختر السبب...</option>
                                    <option value="TEACHER_NO_SHOW">المعلم لم يحضر في الموعد</option>
                                    <option value="SESSION_TOO_SHORT">وقت الحصة كان أقصر من المتفق عليه</option>
                                    <option value="QUALITY_ISSUE">جودة الشرح لم تكن مناسبة</option>
                                    <option value="OTHER">سبب آخر</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">التفاصيل</label>
                                <textarea
                                    value={disputeDescription}
                                    onChange={(e) => setDisputeDescription(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]"
                                    placeholder="اكتب التفاصيل هنا..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmitDispute}
                                disabled={submittingDispute}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {submittingDispute ? 'جاري الإرسال...' : 'إرسال البلاغ'}
                            </button>
                            <button
                                onClick={() => setDisputeModalOpen(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
