'use client';

import { useEffect, useState } from 'react';
import { bookingApi } from '@/lib/api/booking';
import { Booking, BookingStatus } from '@/lib/api/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, Globe, Loader2, Filter, Search, Plus, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentConfirmModal } from '@/components/booking/PaymentConfirmModal';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { toast } from 'sonner';
import Link from 'next/link';
import { BookingListCard } from '@/components/booking/BookingListCard';

const BOOKINGS_PER_PAGE = 10;

export default function StudentBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [timeFilter, setTimeFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC'>('DATE_DESC');
    const [currentPage, setCurrentPage] = useState(1);

    // Action States
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [selectedBookingForDispute, setSelectedBookingForDispute] = useState<Booking | null>(null);
    const [disputeType, setDisputeType] = useState<string>('');
    const [disputeDescription, setDisputeDescription] = useState<string>('');
    const [submittingDispute, setSubmittingDispute] = useState(false);
    const [userTimezone, setUserTimezone] = useState<string | null>(null);

    // Loading Bookings
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

    // Handle session confirmation
    const handleConfirmSession = async (booking: Booking) => {
        setConfirmingId(booking.id);
        try {
            await bookingApi.confirmSessionEarly(booking.id);
            toast.success('تم تأكيد الحصة بنجاح! شكراً لك 🎉');
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

    // Filtering Logic
    const filteredBookings = bookings.filter(booking => {
        // 1. Status Filter
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'PENDING') {
                if (!['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT', 'PAYMENT_REVIEW'].includes(booking.status)) return false;
            } else if (statusFilter === 'UPCOMING') {
                if (!['SCHEDULED', 'PENDING_CONFIRMATION'].includes(booking.status)) return false;
            } else if (statusFilter === 'COMPLETED') {
                if (booking.status !== 'COMPLETED') return false;
            } else if (statusFilter === 'CANCELLED') {
                if (!booking.status.includes('CANCELLED') && booking.status !== 'REJECTED_BY_TEACHER' && booking.status !== 'EXPIRED') return false;
            }
        }

        // 2. Time Filter
        if (timeFilter !== 'ALL') {
            const isPast = new Date(booking.startTime) < new Date();
            if (timeFilter === 'UPCOMING' && isPast) return false;
            if (timeFilter === 'PAST' && !isPast) return false;
        }

        // 3. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const teacherName = booking.teacherProfile?.displayName?.toLowerCase() || '';
            const subjectName = (booking.subject?.nameAr || booking.subject?.nameEn || '').toLowerCase();
            if (!teacherName.includes(query) && !subjectName.includes(query)) return false;
        }

        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        return sortBy === 'DATE_DESC' ? dateB - dateA : dateA - dateB;
    });

    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
    const endIndex = startIndex + BOOKINGS_PER_PAGE;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    // Unified Action Handler
    const handleBookingAction = (action: string, booking: Booking) => {
        switch (action) {
            case 'pay': setSelectedBookingForPayment(booking); break;
            case 'cancel': toast.info('سيتم إتاحة هذا الإجراء قريباً'); break;
            case 'confirm': handleConfirmSession(booking); break;
            case 'dispute': setSelectedBookingForDispute(booking); setDisputeModalOpen(true); break;
            case 'rate': toast.info('التقييم متاح حالياً للمعلم فقط'); break;
            case 'details': window.location.href = `/student/bookings/${booking.id}`; break;
            case 'book-new': window.location.href = '/search'; break;
            case 'support': window.location.href = '/support/new'; break;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* 1. Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">حجوزاتي</h1>
                        <p className="text-gray-500 mt-1 text-lg">تابع حالة حصصك، ادفع، أو راجع الحجوزات السابقة</p>
                    </div>
                    <div>
                        <Link href="/search">
                            <Button size="lg" className="w-full md:w-auto font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                <Plus className="w-5 h-5 ml-2" />
                                حجز حصة جديدة
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 2. Controls & Filters */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    {/* Top Row: Search & Sort */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث باسم المعلم أو المادة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortBy(sortBy === 'DATE_DESC' ? 'DATE_ASC' : 'DATE_DESC')}
                                className="text-gray-600 border-gray-200"
                            >
                                <ArrowUpDown className="w-4 h-4 ml-2" />
                                {sortBy === 'DATE_DESC' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Row: Filter Tabs (Pills) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[
                            { id: 'ALL', label: 'الكل' },
                            { id: 'PENDING', label: 'بانتظار الموافقة/الدفع' },
                            { id: 'UPCOMING', label: 'القادمة' },
                            { id: 'COMPLETED', label: 'المكتملة' },
                            { id: 'CANCELLED', label: 'الملغاة' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                                    statusFilter === tab.id
                                        ? "bg-gray-900 text-white shadow-md"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
                        {[
                            { id: 'ALL', label: 'كل الأوقات' },
                            { id: 'UPCOMING', label: 'مستقبلية' },
                            { id: 'PAST', label: 'سابقة' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setTimeFilter(tab.id as any); setCurrentPage(1); }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                                    timeFilter === tab.id
                                        ? "border-primary/50 bg-primary/5 text-primary"
                                        : "border-transparent text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Bookings List */}
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
                        <p className="text-gray-500">جاري تحميل الحجوزات...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات مطابقة</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            {searchQuery || statusFilter !== 'ALL'
                                ? 'جرب تغيير فلاتر البحث للعثور على ما تبحث عنه'
                                : 'ابدأ رحلتك التعليمية اليوم واحجز حصتك الأولى مع أفضل المعلمين'
                            }
                        </p>
                        {statusFilter === 'ALL' && !searchQuery && (
                            <Link href="/search">
                                <Button size="lg" className="font-bold">تصفح المعلمين</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {paginatedBookings.map((booking) => (
                            <BookingListCard
                                key={booking.id}
                                booking={booking}
                                userRole="STUDENT"
                                onAction={handleBookingAction}
                            />
                        ))}
                    </div>
                )}

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
            </div>

            {/* Payment Modal */}
            {selectedBookingForPayment && (
                <PaymentConfirmModal
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    booking={selectedBookingForPayment}
                    onPaymentSuccess={() => { loadBookings(); }}
                />
            )}

            {/* Dispute Modal */}
            {disputeModalOpen && selectedBookingForDispute && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">الإبلاغ عن مشكلة</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            نأسف لسماع ذلك. يرجى إخبارنا بما حدث لنتمكن من المساعدة.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">نوع المشكلة</label>
                                <select
                                    value={disputeType}
                                    onChange={(e) => setDisputeType(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                >
                                    <option value="">اختر السبب...</option>
                                    <option value="TEACHER_NO_SHOW">المعلم لم يحضر في الموعد</option>
                                    <option value="SESSION_TOO_SHORT">وقت الحصة كان أقصر من المتفق عليه</option>
                                    <option value="QUALITY_ISSUE">جودة الشرح لم تكن مناسبة</option>
                                    <option value="TECHNICAL_ISSUE">واجهنا مشاكل تقنية منعت الدرس</option>
                                    <option value="OTHER">سبب آخر</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">التفاصيل</label>
                                <textarea
                                    value={disputeDescription}
                                    onChange={(e) => setDisputeDescription(e.target.value)}
                                    placeholder="اكتب المزيد من التفاصيل هنا..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none min-h-[120px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmitDispute}
                                disabled={submittingDispute}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                            >
                                {submittingDispute ? 'جاري الإرسال...' : 'إرسال البلاغ'}
                            </button>
                            <button
                                onClick={() => setDisputeModalOpen(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
