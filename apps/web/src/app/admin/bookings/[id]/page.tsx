'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { SessionDetailsCard } from '@/components/booking/SessionDetailsCard';
import {
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    DollarSign,
    BookOpen,
    Loader2,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    XCircle,
    Video,
    FileText,
    History,
    TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface BookingDetail {
    id: string;
    readableId: string;
    status: string;
    startTime: string;
    endTime: string;
    price: string;
    cancelReason?: string;
    createdAt: string;
    updatedAt: string;
    meetingLink?: string;

    // Teacher info
    teacherProfile?: {
        id: string;
        displayName?: string;
        bio?: string;
        hourlyRate?: number;
        user?: {
            id: string;
            email: string;
            phoneNumber?: string;
        };
    };

    // Student/Parent info
    bookedByUser?: {
        id: string;
        email: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    };

    studentUser?: {
        id: string;
        email: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    };

    child?: {
        id: string;
        name: string;
        age?: number;
    };

    // Subject info
    subject?: {
        id: string;
        nameAr: string;
        nameEn: string;
    };

    curriculum?: {
        nameAr: string;
        nameEn: string;
    };

    grade?: {
        nameAr: string;
        nameEn: string;
    };

    // Session completion fields
    sessionProofUrl?: string | null;
    topicsCovered?: string | null;
    studentPerformanceRating?: number | null;
    studentPerformanceNotes?: string | null;
    homeworkAssigned?: boolean | null;
    homeworkDescription?: string | null;
    nextSessionRecommendations?: string | null;
    additionalNotes?: string | null;
    teacherSummary?: string | null;

    // Package relation
    package?: {
        id: string;
        readableId: string;
        packageTier?: {
            sessionCount: number;
            discountPercent: number;
        };
    };

    // Payment info
    payment?: {
        id: string;
        amount: string;
        status: string;
        paymentMethod?: string;
        createdAt: string;
    };
}

const STATUS_OPTIONS: Record<string, string> = {
    'PENDING_TEACHER_APPROVAL': 'قيد الانتظار',
    'WAITING_FOR_PAYMENT': 'في انتظار الدفع',
    'PAYMENT_REVIEW': 'مراجعة الدفع',
    'SCHEDULED': 'مجدولة',
    'PENDING_CONFIRMATION': 'بانتظار التأكيد',
    'COMPLETED': 'مكتملة',
    'DISPUTED': 'تحت المراجعة',
    'REFUNDED': 'مستردة',
    'PARTIALLY_REFUNDED': 'استرداد جزئي',
    'REJECTED_BY_TEACHER': 'مرفوضة',
    'CANCELLED_BY_PARENT': 'ملغاة من الوالد',
    'CANCELLED_BY_TEACHER': 'ملغاة من المعلم',
    'CANCELLED_BY_ADMIN': 'ملغاة من الإدارة',
    'EXPIRED': 'منتهية',
};

export default function AdminBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const handleComplete = async () => {
        if (!confirm('هل أنت متأكد من إكمال هذه الحصة يدوياً؟ سيتم تحويل المبلغ للمعلم.')) return;
        setActionLoading(true);
        try {
            await adminApi.completeBooking(bookingId);
            alert('تم إكمال الحصة بنجاح');
            window.location.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'فشل إكمال الحصة');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleDate) return;
        setActionLoading(true);
        try {
            await adminApi.rescheduleBooking(bookingId, new Date(rescheduleDate));
            alert('تم تغيير الموعد بنجاح');
            window.location.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'فشل تغيير الموعد');
        } finally {
            setActionLoading(false);
        }
    };

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        loadBooking();
    }, [bookingId]);

    const loadBooking = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getBookingById(bookingId);
            setBooking(data);
        } catch (error) {
            console.error('Failed to load booking', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) {
            alert('يرجى إدخال سبب الإلغاء');
            return;
        }

        setProcessing(true);
        try {
            await adminApi.cancelBooking(bookingId, cancelReason);
            alert('تم إلغاء الحجز بنجاح');
            setShowCancelDialog(false);
            loadBooking();
        } catch (error) {
            alert('فشل إلغاء الحجز');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'COMPLETED' || status === 'SCHEDULED') return 'success';
        if (status === 'PENDING_TEACHER_APPROVAL' || status === 'WAITING_FOR_PAYMENT' || status === 'PAYMENT_REVIEW' || status === 'PENDING_CONFIRMATION') return 'warning';
        if (status.includes('CANCELLED') || status === 'REJECTED_BY_TEACHER' || status === 'EXPIRED' || status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') return 'error';
        if (status === 'DISPUTED') return 'warning';
        return 'info';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background font-sans rtl p-6 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>جاري التحميل...</span>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-background font-sans rtl p-6">
                <div className="max-w-4xl mx-auto">
                    <Card padding="lg" className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">الحجز غير موجود</h2>
                        <p className="text-gray-600 mb-4">لم يتم العثور على الحجز المطلوب</p>
                        <Button onClick={() => router.push('/admin/bookings')}>
                            العودة إلى قائمة الحجوزات
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/admin/bookings')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                تفاصيل الحجز #{booking.readableId}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                تم الإنشاء: {format(new Date(booking.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                            </p>
                        </div>
                    </div>
                    <StatusBadge variant={getStatusVariant(booking.status)}>
                        {STATUS_OPTIONS[booking.status] || booking.status}
                    </StatusBadge>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Session Details */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            معلومات الحصة
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">التاريخ والوقت</p>
                                    <p className="font-medium text-gray-900">
                                        {format(new Date(booking.startTime), 'dd MMMM yyyy', { locale: ar })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {format(new Date(booking.startTime), 'hh:mm a', { locale: ar })} - {format(new Date(booking.endTime), 'hh:mm a', { locale: ar })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">المدة</p>
                                    <p className="font-medium text-gray-900">
                                        {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60))} دقيقة
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">المادة</p>
                                    <p className="font-medium text-gray-900">{booking.subject?.nameAr || '-'}</p>
                                    {booking.curriculum && (
                                        <p className="text-sm text-gray-600">{booking.curriculum.nameAr}</p>
                                    )}
                                    {booking.grade && (
                                        <p className="text-sm text-gray-600">{booking.grade.nameAr}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">السعر</p>
                                    <p className="font-bold text-primary text-lg">{booking.price} SDG</p>
                                    {booking.package && (
                                        <p className="text-xs text-gray-600">
                                            من الباقة #{booking.package.readableId}
                                            {booking.package.packageTier && ` (خصم ${booking.package.packageTier.discountPercent}%)`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {booking.meetingLink && (
                                <div className="flex items-start gap-3">
                                    <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">رابط الاجتماع</p>
                                        <a
                                            href={booking.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline break-all"
                                        >
                                            {booking.meetingLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Teacher Info */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            معلومات المعلم
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    fallback={booking.teacherProfile?.displayName || booking.teacherProfile?.user?.email || 'T'}
                                    size="md"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {booking.teacherProfile?.displayName || '-'}
                                    </p>
                                    <Link
                                        href={`/admin/users/${booking.teacherProfile?.user?.id}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        عرض الملف الشخصي
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                                    <p className="font-medium text-gray-900">{booking.teacherProfile?.user?.email || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                                    <p className="font-medium text-gray-900 font-mono">
                                        {booking.teacherProfile?.user?.phoneNumber || '-'}
                                    </p>
                                </div>
                            </div>

                            {booking.teacherProfile?.hourlyRate && (
                                <div className="flex items-start gap-3">
                                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">السعر بالساعة</p>
                                        <p className="font-medium text-gray-900">{booking.teacherProfile.hourlyRate} SDG</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Student/Parent Info */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Student Info */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            معلومات الطالب
                        </h2>
                        <div className="space-y-4">
                            {booking.child ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Avatar fallback={booking.child.name} size="md" />
                                        <div>
                                            <p className="font-semibold text-gray-900">{booking.child.name}</p>
                                            {booking.child.age && (
                                                <p className="text-sm text-gray-600">{booking.child.age} سنة</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : booking.studentUser ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            fallback={`${booking.studentUser.firstName || ''} ${booking.studentUser.lastName || ''}`.trim() || booking.studentUser.email}
                                            size="md"
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {`${booking.studentUser.firstName || ''} ${booking.studentUser.lastName || ''}`.trim() || '-'}
                                            </p>
                                            <Link
                                                href={`/admin/users/${booking.studentUser.id}`}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                عرض الملف الشخصي
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                                            <p className="font-medium text-gray-900">{booking.studentUser.email}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500">لا توجد معلومات</p>
                            )}
                        </div>
                    </Card>

                    {/* Parent Info */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            معلومات ولي الأمر
                        </h2>
                        <div className="space-y-4">
                            {booking.bookedByUser ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            fallback={`${booking.bookedByUser.firstName || ''} ${booking.bookedByUser.lastName || ''}`.trim() || booking.bookedByUser.email}
                                            size="md"
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {`${booking.bookedByUser.firstName || ''} ${booking.bookedByUser.lastName || ''}`.trim() || '-'}
                                            </p>
                                            <Link
                                                href={`/admin/users/${booking.bookedByUser.id}`}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                عرض الملف الشخصي
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                                            <p className="font-medium text-gray-900">{booking.bookedByUser.email}</p>
                                        </div>
                                    </div>
                                    {booking.bookedByUser.phoneNumber && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">رقم الهاتف</p>
                                                <p className="font-medium text-gray-900 font-mono">{booking.bookedByUser.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-500">نفس الطالب</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Payment Info */}
                {(booking.payment || Number(booking.price) === 0) && (
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            معلومات الدفع
                        </h2>
                        {Number(booking.price) === 0 ? (
                            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-purple-900 text-lg">حصة تجريبية (مجانية)</p>
                                        <p className="text-sm text-purple-700">لا يتطلب دفع رسوم</p>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-gray-900">0.00 SDG</div>
                            </div>
                        ) : booking.payment ? (
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">المبلغ</p>
                                    <p className="font-bold text-primary text-lg">{booking.payment.amount} SDG</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">حالة الدفع</p>
                                    <StatusBadge variant={booking.payment.status === 'PAID' ? 'success' : 'warning'}>
                                        {booking.payment.status === 'PAID' ? 'مدفوع' : booking.payment.status}
                                    </StatusBadge>
                                </div>
                                {booking.payment.paymentMethod && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">طريقة الدفع</p>
                                        <p className="font-medium text-gray-900">{booking.payment.paymentMethod}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">تاريخ الدفع</p>
                                    <p className="font-medium text-gray-900">
                                        {format(new Date(booking.payment.createdAt), 'dd MMM yyyy', { locale: ar })}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </Card>
                )}

                {/* Session Completion Details */}
                {(booking.status === 'COMPLETED' || booking.status === 'PENDING_CONFIRMATION') && (
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            تفاصيل إنهاء الحصة
                        </h2>
                        <SessionDetailsCard
                            booking={booking}
                            showProof={true}
                            userRole="admin"
                        />
                    </Card>
                )}

                {/* Cancel Reason */}
                {booking.cancelReason && (
                    <Card padding="lg" className="bg-red-50 border-red-200">
                        <h2 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            سبب الإلغاء
                        </h2>
                        <p className="text-red-800">{booking.cancelReason}</p>
                    </Card>
                )}

                {/* Actions */}
                <Card padding="lg">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">الإجراءات</h2>
                    <div className="flex gap-3">
                        {booking.status === 'SCHEDULED' && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowCancelDialog(true)}
                            >
                                <XCircle className="w-4 h-4 ml-2" />
                                إلغاء الحجز
                            </Button>
                        )}

                        {booking.package && (
                            <Link href={`/admin/packages/${booking.package.id}`}>
                                <Button variant="outline">
                                    <FileText className="w-4 h-4 ml-2" />
                                    عرض الباقة
                                </Button>
                            </Link>
                        )}

                        {booking.payment && (
                            <Link href={`/admin/transactions/${booking.payment.id}`}>
                                <Button variant="outline">
                                    <History className="w-4 h-4 ml-2" />
                                    عرض المعاملة
                                </Button>
                            </Link>
                        )}

                        {/* Force Complete */}
                        {(booking.status === 'SCHEDULED' || booking.status === 'PENDING_CONFIRMATION' || booking.status === 'PENDING_TEACHER_APPROVAL') && (
                            <Button variant="outline" onClick={handleComplete} disabled={actionLoading}>
                                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                إكمال بالقوة
                            </Button>
                        )}

                        {/* Force Reschedule */}
                        {!['COMPLETED', 'CANCELLED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_ADMIN', 'REJECTED_BY_TEACHER'].includes(booking.status) && (
                            <Button variant="outline" onClick={() => setShowRescheduleDialog(true)}>
                                <Calendar className="w-4 h-4 ml-2 text-blue-600" />
                                تغيير الموعد
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Cancel Dialog */}
                {showCancelDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card padding="lg" className="max-w-md w-full">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">إلغاء الحجز</h3>
                            <p className="text-gray-600 mb-4">
                                يرجى إدخال سبب الإلغاء. سيتم إرسال إشعار للمعلم وولي الأمر.
                            </p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="اكتب سبب الإلغاء هنا..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowCancelDialog(false)}>إلغاء</Button>
                                <Button variant="destructive" onClick={handleCancelBooking}>تأكيد الإلغاء</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Reschedule Dialog */}
                {showRescheduleDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card padding="lg" className="max-w-md w-full">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">تغيير موعد الحصة</h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                تجاوز القواعد وسياسات الإلغاء. يرجى التأكد من اتفاق الطرفين.
                            </p>
                            <input
                                type="datetime-local"
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowRescheduleDialog(false)}>إلغاء</Button>
                                <Button onClick={handleReschedule} disabled={actionLoading || !rescheduleDate}>
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التغيير'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

            </div >
        </div >
    );
}
