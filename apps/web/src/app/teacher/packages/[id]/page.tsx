'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ArrowRight, Package, User, BookOpen, Calendar, Clock,
    CheckCircle, XCircle, Timer, AlertCircle, DollarSign, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TeacherPackage {
    id: string;
    readableId?: string;
    studentId: string;
    payerId: string;
    sessionCount: number;
    sessionsUsed: number;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    purchasedAt: string;
    expiresAt: string;
    discountedPricePerSession: number;
    totalPaid: number;
    payer?: {
        id: string;
        email: string;
        role: string;
        parentProfile?: {
            children: Array<{ id: string; name: string; gradeLevel?: string }>;
        };
    };
    student: {
        id: string;
        email: string;
    };
    subject: {
        id: string;
        nameAr: string;
        nameEn: string;
    };
    redemptions?: Array<{
        id: string;
        booking: {
            startTime: string;
            status: string;
            childId?: string;
            child?: { id: string; name: string };
        };
    }>;
}

// Status badge component
function StatusBadge({ status }: { status: TeacherPackage['status'] }) {
    const config = {
        ACTIVE: { label: 'نشط', icon: CheckCircle, className: 'bg-success-100 text-success-700' },
        COMPLETED: { label: 'مكتمل', icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
        EXPIRED: { label: 'منتهي', icon: Timer, className: 'bg-warning-100 text-warning-700' },
        CANCELLED: { label: 'ملغي', icon: XCircle, className: 'bg-red-100 text-red-700' }
    };

    const { label, icon: Icon, className } = config[status] || config.ACTIVE;

    return (
        <span className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold",
            className
        )}>
            <Icon className="w-4 h-4" />
            {label}
        </span>
    );
}

// Get student/child name
function getStudentName(pkg: TeacherPackage): string {
    if (pkg.redemptions && pkg.redemptions.length > 0) {
        const firstChildName = pkg.redemptions.find(r => r.booking.child?.name)?.booking.child?.name;
        if (firstChildName) return firstChildName;
    }
    if (pkg.payer?.parentProfile?.children && pkg.payer.parentProfile.children.length > 0) {
        return pkg.payer.parentProfile.children[0].name;
    }
    return pkg.student?.email?.split('@')[0] || 'طالب';
}

// Session Card component
interface SessionCardProps {
    sessionNumber: number;
    totalSessions: number;
    redemption?: {
        id: string;
        booking: {
            startTime: string;
            status: string;
            child?: { name: string };
        };
    };
    studentName: string;
    subjectName: string;
}

function SessionCard({ sessionNumber, totalSessions, redemption, studentName, subjectName }: SessionCardProps) {
    const isScheduled = !!redemption;
    const booking = redemption?.booking;
    const isCompleted = booking?.status === 'COMPLETED';
    const isPending = booking?.status === 'PENDING_CONFIRMATION';

    return (
        <Card className={cn(
            "relative transition-all",
            isScheduled
                ? isCompleted
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-success-200 bg-success-50/50"
                : "border-gray-200"
        )}>
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Session Number Badge */}
                        <div className={cn(
                            "w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold",
                            isScheduled
                                ? isCompleted
                                    ? "bg-blue-500 text-white"
                                    : "bg-success-500 text-white"
                                : "bg-gray-200 text-gray-600"
                        )}>
                            <span className="text-lg">{sessionNumber}</span>
                            <span className="text-xs opacity-80">/{totalSessions}</span>
                        </div>

                        {/* Session Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-gray-800">{studentName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">{subjectName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="text-left">
                        {isScheduled ? (
                            <div className="text-left">
                                <div className={cn(
                                    "text-sm font-bold mb-1",
                                    isCompleted ? "text-blue-600" : "text-success-600"
                                )}>
                                    {isCompleted ? '✓ مكتملة' : isPending ? '⏳ بانتظار التأكيد' : '📅 مجدولة'}
                                </div>
                                {booking?.startTime && (
                                    <div className="text-sm text-gray-500">
                                        {format(new Date(booking.startTime), 'd MMM yyyy', { locale: ar })}
                                        <br />
                                        {format(new Date(booking.startTime), 'h:mm a', { locale: ar })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                بانتظار الجدولة
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function remainingText(remaining: number, total: number) {
    if (remaining === 0) return 'جميع الحصص مستخدمة';
    if (remaining === total) return 'لم تُستخدم أي حصة';
    return `متبقي ${remaining} من ${total} حصص`;
}

export default function TeacherPackageDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [pkg, setPkg] = useState<TeacherPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const packageId = params.id as string;

    useEffect(() => {
        if (packageId) {
            loadPackage();
        }
    }, [packageId]);

    const loadPackage = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/packages/${packageId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load package');
            }

            const data = await response.json();
            setPkg(data);
        } catch (err: any) {
            console.error('Failed to load package', err);
            setError('فشل تحميل تفاصيل الباقة');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto">
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

    if (error || !pkg) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
                <Card className="max-w-md w-full">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">{error || 'الباقة غير موجودة'}</h2>
                        <Button
                            onClick={() => router.push('/teacher/packages')}
                            variant="outline"
                        >
                            العودة للباقات
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const studentName = getStudentName(pkg);

    // Calculate stats from redemptions
    const allBookings = pkg.redemptions?.map(r => r.booking) || [];
    const completedSessions = allBookings.filter(b => b.status === 'COMPLETED').length;
    const scheduledSessions = allBookings.filter(b =>
        ['SCHEDULED', 'CONFIRMED', 'PENDING_CONFIRMATION'].includes(b.status)
    ).length;
    const sessionsRemaining = pkg.sessionCount - completedSessions;

    const daysUntilExpiry = differenceInDays(new Date(pkg.expiresAt), new Date());
    const isExpiringSoon = pkg.status === 'ACTIVE' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

    // Build session cards data
    const sessions = Array.from({ length: pkg.sessionCount }, (_, i) => {
        const sessionNumber = i + 1;
        const redemption = pkg.redemptions?.[i];
        return { sessionNumber, redemption };
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/teacher/packages')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                >
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    <span className="font-medium">العودة للباقات</span>
                </button>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar
                                            fallback={studentName[0] || 'ط'}
                                            size="xl"
                                        />
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">
                                                {studentName}
                                            </h1>
                                            <p className="text-gray-500 flex items-center gap-2 mt-1">
                                                <Package className="w-4 h-4" />
                                                باقة {pkg.sessionCount} حصص
                                                <span className="mx-1">•</span>
                                                <BookOpen className="w-4 h-4" />
                                                {pkg.subject?.nameAr || 'مادة'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end px-3">
                                        <StatusBadge status={pkg.status} />
                                        {pkg.readableId && (
                                            <div className="text-xs text-gray-400 font-mono mt-1" dir="ltr">#{pkg.readableId}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Summary */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-500">التقدم (المكتملة)</span>
                                        <span className="font-bold text-gray-800">
                                            {remainingText(sessionsRemaining, pkg.sessionCount)}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(completedSessions / pkg.sessionCount) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-2 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>مكتملة ({completedSessions})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-success-500" />
                                            <span>مجدولة ({scheduledSessions})</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Session Cards */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                جميع الحصص
                            </h2>
                            {sessions.map(({ sessionNumber, redemption }) => (
                                <SessionCard
                                    key={sessionNumber}
                                    sessionNumber={sessionNumber}
                                    totalSessions={pkg.sessionCount}
                                    redemption={redemption}
                                    studentName={studentName}
                                    subjectName={pkg.subject?.nameAr || 'مادة'}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Package Details */}
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle className="text-lg">تفاصيل الباقة</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            تاريخ الشراء
                                        </span>
                                        <span className="font-bold text-gray-800">
                                            {format(new Date(pkg.purchasedAt), 'd MMM yyyy', { locale: ar })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <Timer className="w-4 h-4" />
                                            تاريخ الانتهاء
                                        </span>
                                        <span className={cn(
                                            "font-bold",
                                            isExpiringSoon ? "text-warning-600" : "text-gray-800"
                                        )}>
                                            {format(new Date(pkg.expiresAt), 'd MMM yyyy', { locale: ar })}
                                        </span>
                                    </div>
                                    <hr className="border-gray-100" />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            المبلغ الإجمالي
                                        </span>
                                        <span className="font-black text-xl text-primary-700">
                                            {Number(pkg.totalPaid).toLocaleString()} SDG
                                        </span>
                                    </div>
                                </div>

                                {/* Sessions Summary */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-xl col-span-2">
                                            <div className="text-3xl font-bold text-gray-800">{sessionsRemaining}</div>
                                            <div className="text-xs text-gray-500 mt-1">حصص متبقية</div>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                                            <div className="text-xl font-bold text-blue-600">{completedSessions}</div>
                                            <div className="text-xs text-blue-700 mt-1">مكتملة</div>
                                        </div>
                                        <div className="text-center p-3 bg-success-50 rounded-xl">
                                            <div className="text-xl font-bold text-success-600">{scheduledSessions}</div>
                                            <div className="text-xs text-success-700 mt-1">مجدولة</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry Warning */}
                                {isExpiringSoon && (
                                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-amber-800 text-sm">تنبيه!</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    الباقة تنتهي خلال {daysUntilExpiry} أيام
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
