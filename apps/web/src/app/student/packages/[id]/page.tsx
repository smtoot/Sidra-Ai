'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { packageApi, StudentPackage } from '@/lib/api/package';
import {
    ArrowRight, Package, User, BookOpen, Calendar, Clock,
    CheckCircle, XCircle, Timer, AlertCircle, CalendarPlus,
    DollarSign, TrendingUp, Sparkles, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SchedulePackageSessionModal } from '@/components/packages/SchedulePackageSessionModal';

// Status badge component
function StatusBadge({ status }: { status: StudentPackage['status'] }) {
    const config = {
        ACTIVE: { label: 'نشط', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
        COMPLETED: { label: 'مكتمل', icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
        EXPIRED: { label: 'منتهي', icon: Timer, className: 'bg-orange-100 text-orange-700' },
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

// Session Card component
interface SessionCardProps {
    sessionNumber: number;
    totalSessions: number;
    redemption?: {
        id: string;
        bookingId: string;
        createdAt: string;
        booking?: {
            startTime?: string;
            status: string;
        };
    };
    teacherName: string;
    subjectName: string;
    isActive: boolean;
    onSchedule: () => void;
}

function SessionCard({ sessionNumber, totalSessions, redemption, teacherName, subjectName, isActive, onSchedule }: SessionCardProps) {
    const isScheduled = !!redemption;
    const booking = redemption?.booking;
    const isCompleted = booking?.status === 'COMPLETED';
    const isPending = booking?.status === 'PENDING_CONFIRMATION';

    return (
        <div className={cn(
            "relative p-4 sm:p-5 rounded-2xl border-2 transition-all",
            isScheduled
                ? isCompleted
                    ? "bg-blue-50 border-blue-200"
                    : "bg-green-50 border-green-200"
                : isActive
                    ? "bg-white border-gray-200 hover:border-primary/50 hover:shadow-lg cursor-pointer"
                    : "bg-gray-50 border-gray-200 opacity-60"
        )}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Session Number Badge */}
                    <div className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center font-bold shrink-0",
                        isScheduled
                            ? isCompleted
                                ? "bg-blue-500 text-white"
                                : "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                    )}>
                        <span className="text-base sm:text-lg">{sessionNumber}</span>
                        <span className="text-xs opacity-80">/{totalSessions}</span>
                    </div>

                    {/* Session Info */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="font-bold text-gray-800 truncate">{teacherName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-500 truncate">{subjectName}</span>
                        </div>
                    </div>
                </div>

                {/* Status / Action */}
                <div className="text-right sm:text-left">
                    {isScheduled ? (
                        <div className="text-right sm:text-left">
                            <div className={cn(
                                "text-sm font-bold mb-1",
                                isCompleted ? "text-blue-600" : "text-green-600"
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
                    ) : isActive ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSchedule();
                            }}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-bold text-sm hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg shadow-primary/20 hover:shadow-xl"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            جدول الآن
                        </button>
                    ) : (
                        <span className="text-sm text-gray-400">غير متاح</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper for text
function remainingText(remaining: number, total: number) {
    if (remaining === 0) return 'جميع الحصص مكتملة';
    if (remaining === total) return 'لم تكتمل أي حصة';
    return `متبقي ${remaining} من ${total} حصص للانتهاء`;
}

export default function PackageDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [pkg, setPkg] = useState<StudentPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [schedulingSession, setSchedulingSession] = useState<number | null>(null);

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
            const data = await packageApi.getPackageById(packageId);
            setPkg(data);
        } catch (err: any) {
            console.error('Failed to load package', err);
            setError('فشل تحميل تفاصيل الباقة');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleSuccess = () => {
        setSchedulingSession(null);
        loadPackage(); // Reload to get updated data
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/4" />
                        <div className="bg-white rounded-3xl p-8 space-y-4">
                            <div className="flex gap-6">
                                <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                                </div>
                            </div>
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center" dir="rtl">
                <div className="text-center bg-white p-12 rounded-3xl shadow-xl">
                    <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">{error || 'الباقة غير موجودة'}</h2>
                    <button
                        onClick={() => router.push('/student/packages')}
                        className="text-primary hover:underline font-medium"
                    >
                        العودة للباقات
                    </button>
                </div>
            </div>
        );
    }

    // Calculate stats from redemptions
    const allBookings = pkg.redemptions?.map(r => r.booking) || [];
    const completedSessions = allBookings.filter(b => b.status === 'COMPLETED').length;
    const scheduledSessions = allBookings.filter(b =>
        ['SCHEDULED', 'CONFIRMED', 'PENDING_CONFIRMATION'].includes(b.status)
    ).length;

    // Remaining based on Completed only
    const sessionsRemaining = pkg.sessionCount - completedSessions;

    const daysUntilExpiry = differenceInDays(new Date(pkg.expiresAt), new Date());
    const isActive = pkg.status === 'ACTIVE';
    const isExpiringSoon = isActive && daysUntilExpiry <= 7;
    const savingsPerSession = Number(pkg.originalPricePerSession) - Number(pkg.discountedPricePerSession);
    const totalSavings = savingsPerSession * pkg.sessionCount;

    // Build session cards data
    const sessions = Array.from({ length: pkg.sessionCount }, (_, i) => {
        const sessionNumber = i + 1;
        const redemption = pkg.redemptions?.[i];
        return { sessionNumber, redemption };
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-x-hidden" dir="rtl">
            <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/student/packages')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
                >
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    <span className="font-medium">العودة للباقات</span>
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                            باقة {pkg.sessionCount} حصص
                                        </h1>
                                        <p className="text-gray-500 flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-sm">
                                            <User className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{pkg.teacher?.displayName || 'معلم'}</span>
                                            <span className="mx-1">•</span>
                                            <BookOpen className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{pkg.subject?.nameAr || 'مادة'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                    <StatusBadge status={pkg.status} />
                                    {pkg.readableId && (
                                        <span className="text-xs text-gray-400 font-mono" dir="ltr">#{pkg.readableId}</span>
                                    )}
                                </div>
                            </div>

                            {/* Progress Summary */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">التقدم (المكتملة)</span>
                                    <span className="font-bold text-gray-800">
                                        {remainingText(sessionsRemaining, pkg.sessionCount)}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all"
                                        style={{ width: `${(completedSessions / pkg.sessionCount) * 100}%` }}
                                    />
                                </div>
                                <div className="flex gap-4 mt-2 text-xs">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>مكتملة ({completedSessions})</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span>مجدولة ({scheduledSessions})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session Cards */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                جميع الحصص
                            </h2>
                            {sessions.map(({ sessionNumber, redemption }) => (
                                <SessionCard
                                    key={sessionNumber}
                                    sessionNumber={sessionNumber}
                                    totalSessions={pkg.sessionCount}
                                    redemption={redemption}
                                    teacherName={pkg.teacher?.displayName || 'معلم'}
                                    subjectName={pkg.subject?.nameAr || 'مادة'}
                                    isActive={isActive && !redemption && sessionsRemaining > 0}
                                    onSchedule={() => setSchedulingSession(sessionNumber)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Package Details */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 sticky top-6">
                            <h2 className="text-lg font-bold text-gray-700 mb-6">تفاصيل الباقة</h2>
                            <div className="space-y-5">
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
                                        isExpiringSoon ? "text-orange-600" : "text-gray-800"
                                    )}>
                                        {format(new Date(pkg.expiresAt), 'd MMM yyyy', { locale: ar })}
                                    </span>
                                </div>
                                <hr className="border-gray-100" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        المبلغ المدفوع
                                    </span>
                                    <span className="font-black text-xl text-primary">
                                        {Number(pkg.totalPaid).toLocaleString()} SDG
                                    </span>
                                </div>
                                {savingsPerSession > 0 && (
                                    <div className="bg-green-50 -mx-6 px-6 py-3 flex items-center justify-between">
                                        <span className="text-green-700 flex items-center gap-2 text-sm">
                                            <Sparkles className="w-4 h-4" />
                                            إجمالي التوفير
                                        </span>
                                        <span className="font-bold text-green-700">
                                            {totalSavings.toLocaleString()} SDG
                                        </span>
                                    </div>
                                )}
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {schedulingSession !== null && pkg && (
                <SchedulePackageSessionModal
                    isOpen={true}
                    onClose={() => setSchedulingSession(null)}
                    onSuccess={handleScheduleSuccess}
                    packageId={pkg.id}
                    teacherId={pkg.teacherId}
                    teacherName={pkg.teacher?.displayName || 'معلم'}
                    subjectName={pkg.subject?.nameAr || 'مادة'}
                    sessionNumber={schedulingSession}
                    totalSessions={pkg.sessionCount}
                />
            )}
        </div>
    );
}
