'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Package,
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    DollarSign,
    BookOpen,
    Loader2,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    ExternalLink,
    TrendingUp,
    AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface PackageDetail {
    id: string;
    readableId: string;
    status: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    totalPrice: string;
    discountPercent: number;
    startDate: string;
    expiryDate: string;
    createdAt: string;
    updatedAt: string;

    payer?: {
        id: string;
        email: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    };

    student?: {
        id: string;
        email: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    };

    teacher?: {
        id: string;
        displayName?: string;
        hourlyRate?: number;
        user?: {
            id: string;
            email: string;
            phoneNumber?: string;
        };
    };

    packageTier?: {
        id: string;
        sessionCount: number;
        discountPercent: number;
        durationWeeks: number;
        rescheduleLimit: number;
        nameAr?: string;
        nameEn?: string;
        descriptionAr?: string;
    };

    bookings?: Array<{
        id: string;
        readableId: string;
        status: string;
        startTime: string;
        endTime: string;
        price: string;
        subject?: {
            nameAr: string;
        };
    }>;

    redemptions?: Array<{
        id: string;
        status: string;
        booking: {
            id: string;
            readableId: string;
            startTime: string;
            status: string;
        };
    }>;

    payment?: {
        id: string;
        amount: string;
        status: string;
        paymentMethod?: string;
        createdAt: string;
    };
}

const STATUS_OPTIONS: Record<string, string> = {
    'ACTIVE': 'نشطة',
    'EXPIRED': 'منتهية',
    'COMPLETED': 'مكتملة',
    'REFUNDED': 'مستردة',
    'CANCELLED': 'ملغاة',
};

const BOOKING_STATUS: Record<string, string> = {
    'SCHEDULED': 'مجدولة',
    'COMPLETED': 'مكتملة',
    'CANCELLED_BY_PARENT': 'ملغاة',
    'CANCELLED_BY_TEACHER': 'ملغاة',
    'CANCELLED_BY_ADMIN': 'ملغاة',
};

export default function AdminPackageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.id as string;

    const [packageData, setPackageData] = useState<PackageDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPackage();
    }, [packageId]);

    const loadPackage = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getStudentPackageById(packageId);
            setPackageData(data);
        } catch (error) {
            console.error('Failed to load package', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'ACTIVE') return 'success';
        if (status === 'EXPIRED' || status === 'CANCELLED') return 'error';
        if (status === 'COMPLETED') return 'info';
        if (status === 'REFUNDED') return 'warning';
        return 'info';
    };

    const getBookingStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'COMPLETED' || status === 'SCHEDULED') return 'success';
        if (status.includes('CANCELLED')) return 'error';
        return 'warning';
    };

    const getFullName = (user: any): string => {
        if (user?.firstName || user?.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        return '-';
    };

    const getProgressPercentage = (): number => {
        if (!packageData) return 0;
        return (packageData.usedSessions / packageData.totalSessions) * 100;
    };

    const getDaysRemaining = (): number => {
        if (!packageData) return 0;
        return Math.ceil((new Date(packageData.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

    if (!packageData) {
        return (
            <div className="min-h-screen bg-background font-sans rtl p-6">
                <div className="max-w-4xl mx-auto">
                    <Card padding="lg" className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">الباقة غير موجودة</h2>
                        <p className="text-gray-600 mb-4">لم يتم العثور على الباقة المطلوبة</p>
                        <Button onClick={() => router.push('/admin/packages')}>
                            العودة إلى قائمة الباقات
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const progressPercentage = getProgressPercentage();
    const daysRemaining = getDaysRemaining();
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
    const isExpired = daysRemaining <= 0;

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/admin/packages')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                باقة #{packageData.readableId}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                تم الشراء: {format(new Date(packageData.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                            </p>
                        </div>
                    </div>
                    <StatusBadge variant={getStatusVariant(packageData.status)}>
                        {STATUS_OPTIONS[packageData.status] || packageData.status}
                    </StatusBadge>
                </div>

                {/* Alert for expiring/expired packages */}
                {isExpiringSoon && (
                    <Card padding="md" className="bg-orange-50 border-orange-200">
                        <div className="flex items-center gap-2 text-orange-900">
                            <AlertTriangle className="w-5 h-5" />
                            <p className="font-medium">تنبيه: الباقة ستنتهي خلال {daysRemaining} يوم</p>
                        </div>
                    </Card>
                )}

                {isExpired && (
                    <Card padding="md" className="bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-900">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-medium">هذه الباقة منتهية الصلاحية</p>
                        </div>
                    </Card>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-gray-500">الجلسات المستخدمة</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 font-mono">{packageData.usedSessions}</p>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-blue-600" />
                            <p className="text-sm text-gray-500">الجلسات المتبقية</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 font-mono">{packageData.remainingSessions}</p>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <p className="text-sm text-gray-500">نسبة الاستخدام</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 font-mono">{Math.round(progressPercentage)}%</p>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <p className="text-sm text-gray-500">أيام متبقية</p>
                        </div>
                        <p className={`text-2xl font-bold font-mono ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                            {isExpired ? 'منتهي' : daysRemaining}
                        </p>
                    </Card>
                </div>

                {/* Package Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Package Details */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            معلومات الباقة
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">نوع الباقة</p>
                                <p className="font-medium text-gray-900">
                                    {packageData.packageTier?.nameAr || `${packageData.totalSessions} حصة`}
                                </p>
                                {packageData.packageTier?.descriptionAr && (
                                    <p className="text-sm text-gray-600 mt-1">{packageData.packageTier.descriptionAr}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">إجمالي الحصص</p>
                                    <p className="font-bold text-gray-900 font-mono">{packageData.totalSessions}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">نسبة الخصم</p>
                                    <p className="font-bold text-green-600 font-mono">{packageData.discountPercent}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">تاريخ البداية</p>
                                    <p className="font-medium text-gray-900">
                                        {format(new Date(packageData.startDate), 'dd MMM yyyy', { locale: ar })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">تاريخ الانتهاء</p>
                                    <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                        {format(new Date(packageData.expiryDate), 'dd MMM yyyy', { locale: ar })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-2">التقدم</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${progressPercentage >= 80 ? 'bg-red-500' : progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    {packageData.usedSessions} من {packageData.totalSessions} حصة
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">السعر الإجمالي</p>
                                <p className="font-bold text-primary text-xl">{packageData.totalPrice} SDG</p>
                            </div>
                        </div>
                    </Card>

                    {/* Teacher Info */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            معلومات المعلم
                        </h2>
                        <div className="space-y-4">
                            {packageData.teacher ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            fallback={packageData.teacher.displayName || packageData.teacher.user?.email || 'T'}
                                            size="md"
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {packageData.teacher.displayName || '-'}
                                            </p>
                                            <Link
                                                href={`/admin/users/${packageData.teacher.user?.id}`}
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
                                            <p className="font-medium text-gray-900">{packageData.teacher.user?.email || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">رقم الهاتف</p>
                                            <p className="font-medium text-gray-900 font-mono">
                                                {packageData.teacher.user?.phoneNumber || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {packageData.teacher.hourlyRate && (
                                        <div className="flex items-start gap-3">
                                            <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">السعر بالساعة</p>
                                                <p className="font-medium text-gray-900">{packageData.teacher.hourlyRate} SDG</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-500">لا توجد معلومات</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Student/Payer Info */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Student Info */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            معلومات الطالب
                        </h2>
                        <div className="space-y-4">
                            {packageData.student ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Avatar fallback={getFullName(packageData.student) || packageData.student.email} size="md" />
                                        <div>
                                            <p className="font-semibold text-gray-900">{getFullName(packageData.student)}</p>
                                            <Link
                                                href={`/admin/users/${packageData.student.id}`}
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
                                            <p className="font-medium text-gray-900">{packageData.student.email}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500">لا توجد معلومات</p>
                            )}
                        </div>
                    </Card>

                    {/* Payer Info */}
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            معلومات الدافع
                        </h2>
                        <div className="space-y-4">
                            {packageData.payer ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Avatar fallback={getFullName(packageData.payer) || packageData.payer.email} size="md" />
                                        <div>
                                            <p className="font-semibold text-gray-900">{getFullName(packageData.payer)}</p>
                                            <Link
                                                href={`/admin/users/${packageData.payer.id}`}
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
                                            <p className="font-medium text-gray-900">{packageData.payer.email}</p>
                                        </div>
                                    </div>
                                    {packageData.payer.phoneNumber && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">رقم الهاتف</p>
                                                <p className="font-medium text-gray-900 font-mono">{packageData.payer.phoneNumber}</p>
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

                {/* Bookings/Sessions */}
                {packageData.bookings && packageData.bookings.length > 0 && (
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            الحجوزات ({packageData.bookings.length})
                        </h2>
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>رقم الحجز</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>الوقت</TableHead>
                                    <TableHead>السعر</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {packageData.bookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-mono text-sm">{booking.readableId}</TableCell>
                                        <TableCell>{booking.subject?.nameAr || '-'}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{format(new Date(booking.startTime), 'dd MMM yyyy', { locale: ar })}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(booking.startTime), 'hh:mm a', { locale: ar })}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-semibold text-primary">{booking.price} SDG</TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getBookingStatusVariant(booking.status)}>
                                                {BOOKING_STATUS[booking.status] || booking.status}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin/bookings/${booking.id}`}>
                                                <button className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                    <ExternalLink className="w-3 h-3" />
                                                    عرض
                                                </button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Payment Info */}
                {packageData.payment && (
                    <Card padding="lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            معلومات الدفع
                        </h2>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">المبلغ</p>
                                <p className="font-bold text-primary text-lg">{packageData.payment.amount} SDG</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">حالة الدفع</p>
                                <StatusBadge variant={packageData.payment.status === 'PAID' ? 'success' : 'warning'}>
                                    {packageData.payment.status === 'PAID' ? 'مدفوع' : packageData.payment.status}
                                </StatusBadge>
                            </div>
                            {packageData.payment.paymentMethod && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">طريقة الدفع</p>
                                    <p className="font-medium text-gray-900">{packageData.payment.paymentMethod}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500 mb-1">تاريخ الدفع</p>
                                <p className="font-medium text-gray-900">
                                    {format(new Date(packageData.payment.createdAt), 'dd MMM yyyy', { locale: ar })}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
