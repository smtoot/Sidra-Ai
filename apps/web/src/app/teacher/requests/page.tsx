'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Clock, Calendar, User, AlertCircle, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import Link from 'next/link';
import { BookingCard } from '@/components/teacher/BookingCard';

type FilterTab = 'all' | 'pending' | 'scheduled' | 'completed' | 'cancelled';

const ITEMS_PER_PAGE = 10;

export default function TeacherRequestsPage() {
    const [requests, setRequests] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Confirmation modal state
    const [confirmAction, setConfirmAction] = useState<{
        id: string;
        type: 'approve' | 'reject';
    } | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getAllTeacherBookings();
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // Filter requests based on active tab
    const filteredRequests = useMemo(() => {
        switch (activeTab) {
            case 'pending':
                return requests.filter(r => r.status === 'PENDING_TEACHER_APPROVAL');
            case 'scheduled':
                return requests.filter(r => ['WAITING_FOR_PAYMENT', 'PAYMENT_REVIEW', 'SCHEDULED', 'PENDING_CONFIRMATION'].includes(r.status));
            case 'completed':
                return requests.filter(r => r.status === 'COMPLETED');
            case 'cancelled':
                return requests.filter(r => ['REJECTED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'EXPIRED', 'REFUNDED'].includes(r.status));
            default:
                return requests;
        }
    }, [requests, activeTab]);

    // Count for each tab
    const counts = useMemo(() => ({
        all: requests.length,
        pending: requests.filter(r => r.status === 'PENDING_TEACHER_APPROVAL').length,
        scheduled: requests.filter(r => ['WAITING_FOR_PAYMENT', 'PAYMENT_REVIEW', 'SCHEDULED', 'PENDING_CONFIRMATION'].includes(r.status)).length,
        completed: requests.filter(r => r.status === 'COMPLETED').length,
        cancelled: requests.filter(r => ['REJECTED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'EXPIRED', 'REFUNDED'].includes(r.status)).length,
    }), [requests]);

    const handleApproveClick = (id: string) => {
        setConfirmAction({ id, type: 'approve' });
    };

    const handleRejectClick = (id: string) => {
        setRejectReason(''); // Reset reason when opening modal
        setConfirmAction({ id, type: 'reject' });
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;

        const { id, type } = confirmAction;

        if (type === 'reject' && !rejectReason.trim()) {
            toast.error("يرجى كتابة سبب الرفض");
            return;
        }

        setProcessingId(id);
        setConfirmAction(null);

        try {
            if (type === 'approve') {
                await bookingApi.approveRequest(id);
                toast.success("تم قبول الطلب بنجاح! ✅");
            } else {
                await bookingApi.rejectRequest(id, rejectReason);
                toast.success("تم رفض الطلب");
                setRejectReason('');
            }
            await loadRequests();
        } catch (error) {
            console.error(`Failed to ${type}`, error);
            toast.error(type === 'approve' ? "فشل القبول" : "فشل الرفض");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = () => {
        setConfirmAction(null);
    };

    const tabs: { id: FilterTab; label: string; icon: any }[] = [
        { id: 'all', label: 'الكل', icon: Calendar },
        { id: 'pending', label: 'بانتظار الموافقة', icon: Clock },
        { id: 'scheduled', label: 'مجدولة', icon: CheckCircle },
        { id: 'completed', label: 'مكتملة', icon: Check },
        { id: 'cancelled', label: 'ملغية', icon: XCircle },
    ];

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">طلبات التدريس</h1>
                        <p className="text-sm md:text-base text-gray-600">جميع طلبات الحجز الخاصة بك</p>
                    </header>

                    {/* Filter Tabs */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                activeTab === tab.id
                                                    ? "bg-primary-600 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            )}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setCurrentPage(1); // Reset to page 1 when changing tabs
                                            }}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{tab.label}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-bold",
                                                activeTab === tab.id
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                            )}>
                                                {counts[tab.id]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Requests List */}
                    {loading ? (
                        <Card>
                            <CardContent className="p-12 text-center text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                                <p>جاري التحميل...</p>
                            </CardContent>
                        </Card>
                    ) : filteredRequests.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 mb-2">
                                    {activeTab === 'pending' ? 'لا توجد طلبات معلقة' : 'لا توجد طلبات'}
                                </h3>
                                <p className="text-gray-500 mb-4">سيظهر هنا طلبات الحجز الجديدة</p>
                                {activeTab !== 'all' && (
                                    <Button variant="outline" onClick={() => setActiveTab('all')}>
                                        عرض جميع الطلبات
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {(() => {
                                    // Pagination logic
                                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                                    const endIndex = startIndex + ITEMS_PER_PAGE;
                                    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

                                    return paginatedRequests.map((booking) => (
                                        <BookingCard
                                            key={booking.id}
                                            id={booking.id}
                                            readableId={booking.readableId}
                                            studentName={booking.child?.name || booking.studentUser?.email || booking.bookedByUser?.email || 'طالب'}
                                            subjectName={booking.subject?.nameAr || booking.subjectId}
                                            startTime={booking.startTime}
                                            endTime={booking.endTime}
                                            price={booking.price}
                                            status={booking.status}
                                            showActions={true}
                                            isProcessing={processingId === booking.id}
                                            onApprove={() => handleApproveClick(booking.id)}
                                            onReject={() => handleRejectClick(booking.id)}
                                            packageSessionCount={booking.pendingTierSessionCount || undefined}
                                            isDemo={booking.isDemo}
                                        />
                                    ));
                                })()}
                            </div>

                            {/* Pagination */}
                            {filteredRequests.length > ITEMS_PER_PAGE && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)}
                                    onPageChange={(page) => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="mt-6"
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Confirmation Modal */}
                {confirmAction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-md w-full">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                                        confirmAction.type === 'approve' ? "bg-success-100" : "bg-red-100"
                                    )}>
                                        {confirmAction.type === 'approve' ? (
                                            <CheckCircle className="w-6 h-6 text-success-600" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {confirmAction.type === 'approve' ? 'تأكيد القبول' : 'تأكيد الرفض'}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            {confirmAction.type === 'approve'
                                                ? 'هل أنت متأكد من قبول هذا الطلب؟ سيتم إخطار ولي الأمر فوراً.'
                                                : 'هل أنت متأكد من رفض هذا الطلب؟ يرجى ذكر السبب:'}
                                        </p>
                                        {confirmAction.type === 'reject' && (
                                            <Input
                                                placeholder="سبب الرفض (مثلاً: تعارض في المواعيد)"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                autoFocus
                                                dir="rtl"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1"
                                        variant="outline"
                                        onClick={handleCancel}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        className={cn(
                                            "flex-1",
                                            confirmAction.type === 'approve'
                                                ? "bg-success-600 hover:bg-success-700"
                                                : "bg-red-600 hover:bg-red-700"
                                        )}
                                        onClick={handleConfirm}
                                    >
                                        {confirmAction.type === 'approve' ? 'نعم، قبول' : 'نعم، رفض'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </TeacherApprovalGuard>
    );
}
