'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingApi, Booking } from '@/lib/api/booking';
import {
    Calendar,
    Globe,
    Loader2,
    Search,
    Plus,
    ArrowUpDown,
    AlertTriangle,
    CheckCircle,
    User,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { BookingListCard, BookingCardSkeleton } from '@/components/booking/BookingListCard';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { RatingModal } from '@/components/booking/RatingModal';
import { CancelConfirmModal } from '@/components/booking/CancelConfirmModal';
import { getUserTimezone, getTimezoneDisplay } from '@/lib/utils/timezone';
import { toast } from 'sonner';
import Link from 'next/link';

const BOOKINGS_PER_PAGE = 10;

export default function ParentBookingsPage() {
    // Data & Loading
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTimezone, setUserTimezone] = useState<string>('');

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [timeFilter, setTimeFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
    const [childFilter, setChildFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC'>('DATE_DESC');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal States
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);

    const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);

    // Confirm Session State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedBookingForConfirm, setSelectedBookingForConfirm] = useState<Booking | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Dispute State
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [selectedBookingForDispute, setSelectedBookingForDispute] = useState<Booking | null>(null);
    const [disputeType, setDisputeType] = useState<string>('');
    const [disputeDescription, setDisputeDescription] = useState<string>('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    // Load Data
    const loadBookings = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await bookingApi.getParentBookings();
            setBookings(data);
        } catch (error) {
            console.error("Failed to load bookings", error);
            toast.error("فشل تحميل الحجوزات");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
        setUserTimezone(getUserTimezone());
    }, []);

    // Derived Data: Pending Confirmations
    const pendingConfirmations = useMemo(() => {
        return bookings.filter(booking => booking.status === 'PENDING_CONFIRMATION');
    }, [bookings]);

    // Derived Data: Unique Children
    const uniqueChildren = useMemo(() => {
        const children = bookings.map(b => b.child).filter(Boolean);
        const unique = new Map();
        children.forEach(c => {
            if (c && !unique.has(c.id)) unique.set(c.id, c.name);
        });
        return Array.from(unique.entries());
    }, [bookings]);

    // --- Actions ---

    const handleConfirmSession = async () => {
        if (!selectedBookingForConfirm) return;

        setConfirmingId(selectedBookingForConfirm.id);
        try {
            await bookingApi.confirmSessionEarly(selectedBookingForConfirm.id);
            toast.success('تم تأكيد الحصة بنجاح! شكراً لك 🎉');
            setConfirmModalOpen(false);
            setSelectedBookingForConfirm(null);
            await loadBookings(true);
        } catch (error) {
            console.error('Failed to confirm session', error);
            toast.error('حدث خطأ أثناء تأكيد الحصة');
        } finally {
            setConfirmingId(null);
        }
    };

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
            await loadBookings(true);
        } catch (error) {
            console.error('Failed to submit dispute', error);
            toast.error('حدث خطأ أثناء إرسال الشكوى');
        } finally {
            setSubmittingDispute(false);
        }
    };

    const handleBookingAction = (action: string, booking: Booking) => {
        switch (action) {
            case 'pay':
                setSelectedBookingForPayment(booking);
                break;
            case 'cancel':
                setSelectedBookingForCancel(booking);
                setCancelModalOpen(true);
                break;
            case 'confirm':
                setSelectedBookingForConfirm(booking);
                setConfirmModalOpen(true);
                break;
            case 'dispute':
                setSelectedBookingForDispute(booking);
                setDisputeType('');
                setDisputeDescription('');
                setDisputeModalOpen(true);
                break;
            case 'rate':
                setSelectedBookingForRating(booking);
                setRatingModalOpen(true);
                break;
            case 'details':
                window.location.href = `/parent/bookings/${booking.id}`;
                break;
            case 'book-new':
                window.location.href = '/search';
                break;
            case 'support':
                window.location.href = '/support/new';
                break;
        }
    };

    // --- Filtering Logic ---

    const filteredBookings = bookings.filter(booking => {
        // 1. Status
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

        // 2. Time
        if (timeFilter !== 'ALL') {
            const isPast = new Date(booking.startTime) < new Date();
            if (timeFilter === 'UPCOMING' && isPast) return false;
            if (timeFilter === 'PAST' && !isPast) return false;
        }

        // 3. Child
        if (childFilter !== 'ALL') {
            if (booking.child?.id !== childFilter) return false;
        }

        // 4. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const teacher = booking.teacherProfile?.displayName?.toLowerCase() || '';
            const subject = (booking.subject?.nameAr || booking.subject?.nameEn || '').toLowerCase();
            const child = booking.child?.name?.toLowerCase() || '';
            if (!teacher.includes(q) && !subject.includes(q) && !child.includes(q)) return false;
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

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* 1. Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">حجوزاتي</h1>
                        <p className="text-gray-500 mt-1 text-lg">إدارة حجوزات الأبناء ومتابعة المدفوعات</p>
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

                {/* 2. Pending Actions Alert */}
                {pendingConfirmations.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-amber-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 text-lg">
                                    لديك {pendingConfirmations.length} حصص بانتظار التأكيد
                                </h3>
                                <p className="text-amber-800/80 mt-1 leading-relaxed">
                                    يرجى تأكيد اكتمال الحصص المعلقة أو الإبلاغ عن مشكلة لضمان حقك وحق المعلم.
                                    سيتم إغلاق الطلبات تلقائياً خلال 48 ساعة.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 font-bold"
                                onClick={() => {
                                    setStatusFilter('UPCOMING'); // Or PENDING logic? Actually UPCOMING usually has Pending Confirmed
                                    // PENDING_CONFIRMATION is technically "Past" time-wise but "Active" status-wise
                                    setStatusFilter('UPCOMING');
                                    setTimeFilter('ALL');
                                }}
                            >
                                عرض الحصص
                            </Button>
                        </div>
                    </div>
                )}

                {/* 3. Filter Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    {/* Top Row: Search, Child & Sort */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between">

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث باسم المعلم، المادة، أو الابن..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            />
                        </div>

                        {/* Child Filter & Sort */}
                        <div className="flex flex-wrap items-center gap-3">
                            {uniqueChildren.length > 0 && (
                                <select
                                    value={childFilter}
                                    onChange={(e) => { setChildFilter(e.target.value); setCurrentPage(1); }}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="ALL">جميع الأبناء</option>
                                    {uniqueChildren.map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortBy(sortBy === 'DATE_DESC' ? 'DATE_ASC' : 'DATE_DESC')}
                                className="text-gray-600 border-gray-200 h-10 px-4 rounded-xl"
                            >
                                <ArrowUpDown className="w-4 h-4 ml-2" />
                                {sortBy === 'DATE_DESC' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Filter className="w-5 h-5 text-gray-400 ml-2" />
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
                    </div>
                </div>

                {/* 4. List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            {searchQuery || statusFilter !== 'ALL'
                                ? 'لم يتم العثور على نتائج تطابق خيارات البحث'
                                : 'ابدأ بحجز حصص لأبنائك مع أفضل المعلمين'
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
                                userRole="PARENT"
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

            {/* --- Modals --- */}

            {
                selectedBookingForPayment && (
                    <PaymentModal
                        booking={selectedBookingForPayment}
                        isOpen={!!selectedBookingForPayment}
                        onClose={() => setSelectedBookingForPayment(null)}
                        onSuccess={() => loadBookings()}
                    />
                )
            }

            {
                cancelModalOpen && selectedBookingForCancel && (
                    <CancelConfirmModal
                        isOpen={cancelModalOpen}
                        onClose={() => { setCancelModalOpen(false); setSelectedBookingForCancel(null); }}
                        bookingId={selectedBookingForCancel.id}
                        onSuccess={() => { toast.success('تم إلغاء الحجز بنجاح'); loadBookings(); }}
                    />
                )
            }

            {
                ratingModalOpen && selectedBookingForRating && (
                    <RatingModal
                        isOpen={ratingModalOpen}
                        onClose={() => { setRatingModalOpen(false); setSelectedBookingForRating(null); }}
                        bookingId={selectedBookingForRating.id}
                        teacherName={selectedBookingForRating.teacherProfile?.displayName || 'المعلم'}
                        onSuccess={() => { toast.success('شكراً على تقييمك! 🌟'); loadBookings(); }}
                    />
                )
            }

            {
                confirmModalOpen && selectedBookingForConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">تأكيد اكتمال الحصة</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                هل أنت متأكد من اكتمال الحصة؟ عند التأكيد سيتم تحويل المبلغ إلى محفظة المعلم مباشرة.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleConfirmSession}
                                    disabled={confirmingId === selectedBookingForConfirm.id}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                                >
                                    {confirmingId === selectedBookingForConfirm.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'نعم، تأكيد'
                                    )}
                                </button>
                                <button
                                    onClick={() => { setConfirmModalOpen(false); setSelectedBookingForConfirm(null); }}
                                    disabled={confirmingId === selectedBookingForConfirm.id}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                disputeModalOpen && selectedBookingForDispute && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
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
                )
            }
        </div >
    );
}
