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

type FilterTab = 'all' | 'pending' | 'waiting_payment' | 'cancelled';

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
            case 'waiting_payment':
                return requests.filter(r => r.status === 'WAITING_FOR_PAYMENT');
            case 'cancelled':
                return requests.filter(r => ['REJECTED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'EXPIRED', 'REFUNDED'].includes(r.status));
            default: // 'all'
                return requests.filter(r =>
                    ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT', 'REJECTED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'EXPIRED', 'REFUNDED'].includes(r.status)
                ).sort((a, b) => {
                    // Custom Sort: Pending -> Waiting -> Cancelled
                    const priority = {
                        PENDING_TEACHER_APPROVAL: 0,
                        WAITING_FOR_PAYMENT: 1,
                    };
                    const pA = priority[a.status as keyof typeof priority] ?? 2;
                    const pB = priority[b.status as keyof typeof priority] ?? 2;
                    if (pA !== pB) return pA - pB;
                    // Then by date desc
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
        }
    }, [requests, activeTab]);

    // Count for each tab
    const counts = useMemo(() => ({
        all: requests.filter(r => ['PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT', 'REJECTED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'EXPIRED', 'REFUNDED'].includes(r.status)).length,
        pending: requests.filter(r => r.status === 'PENDING_TEACHER_APPROVAL').length,
        waiting_payment: requests.filter(r => r.status === 'WAITING_FOR_PAYMENT').length,
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
        { id: 'pending', label: 'طلبات جديدة', icon: Clock },
        { id: 'waiting_payment', label: 'بانتظار الدفع', icon: Clock },
        { id: 'cancelled', label: 'ملغية', icon: XCircle },
    ];

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">طلبات التدريس</h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <span>إدارة طلبات الحجز الجديدة</span>
                        </p>
                    </header>

                    {/* Filter Tabs */}
                    <Card className="border-none shadow-md">
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
                                                    ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
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
                                                {counts[tab.id as keyof typeof counts] || 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Requests List */}
                    {loading ? (
                        <Card className="border-none shadow-md">
                            <CardContent className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                                <p className="text-gray-500">جاري التحميل...</p>
                            </CardContent>
                        </Card>
                    ) : filteredRequests.length === 0 ? (
                        <Card className="border-2 border-dashed border-gray-200">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {activeTab === 'pending' && 'لا توجد طلبات جديدة حالياً'}
                                    {activeTab === 'waiting_payment' && 'لا توجد حجوزات بانتظار الدفع'}
                                    {activeTab === 'cancelled' && 'لا توجد حجوزات ملغية'}
                                    {activeTab === 'all' && 'لا توجد طلبات'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {activeTab === 'pending' && 'عندما يقوم الطلاب بحجز حصص جديدة، ستظهر هنا للموافقة عليها.'}
                                    {activeTab === 'waiting_payment' && 'الحجوزات التي وافقت عليها وبانتظار دفع الطالب ستظهر هنا.'}
                                    {activeTab === 'cancelled' && 'سجل الحجوزات الملغية فارغ.'}
                                    {activeTab === 'all' && 'ليس لديك أي طلبات حجز حالياً.'}
                                </p>
                                {activeTab !== 'all' && (
                                    <Button variant="outline" onClick={() => setActiveTab('all')}>
                                        عرض الكل
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

                                    return paginatedRequests.map((booking) => {
                                        let alertNode: React.ReactNode = null;
                                        if (booking.status === 'PENDING_TEACHER_APPROVAL') {
                                            alertNode = (
                                                <div className="bg-amber-50 text-amber-800 text-sm px-3 py-2 rounded-lg border border-amber-100 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span>يرجى الرد خلال 24 ساعة للحفاظ على معدل استجابة مرتفع.</span>
                                                </div>
                                            );
                                        } else if (booking.status === 'WAITING_FOR_PAYMENT') {
                                            alertNode = (
                                                <div className="bg-blue-50 text-blue-800 text-sm px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-600" />
                                                    <span>بانتظار دفع ولي الأمر لتأكيد الحجز.</span>
                                                </div>
                                            );
                                        }

                                        return (
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
                                                alert={alertNode}
                                                variant="request"
                                            />
                                        );
                                    });
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
                        <Card className="max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-opacity-10",
                                        confirmAction.type === 'approve' ? "bg-emerald-500" : "bg-red-500"
                                    )}>
                                        {confirmAction.type === 'approve' ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
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
                                                ? 'هل أنت متأكد من قبول هذا الطلب؟ سيتم إخطار ولي الأمر لاستكمال الدفع.'
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
                                            "flex-1 text-white",
                                            confirmAction.type === 'approve'
                                                ? "bg-emerald-600 hover:bg-emerald-700"
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
