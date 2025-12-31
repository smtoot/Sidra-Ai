'use client';

import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, DollarSign, Eye, Check, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Status configuration with colors, gradients, and icons
const STATUS_CONFIG = {
    PENDING_TEACHER_APPROVAL: {
        label: 'طلب جديد',
        gradient: 'from-amber-400 to-orange-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        icon: AlertCircle,
        pulse: true,
    },
    WAITING_FOR_PAYMENT: {
        label: 'بانتظار الدفع',
        gradient: 'from-blue-400 to-indigo-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: Clock,
    },
    PAYMENT_REVIEW: {
        label: 'مراجعة الدفع',
        gradient: 'from-blue-400 to-indigo-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: AlertCircle,
    },
    SCHEDULED: {
        label: 'مؤكدة',
        gradient: 'from-emerald-400 to-teal-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        icon: CheckCircle,
    },
    PENDING_CONFIRMATION: {
        label: 'اكتملت ✓',
        gradient: 'from-green-400 to-emerald-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: CheckCircle,
        sublabel: 'بانتظار تحويل الأرباح',
    },
    COMPLETED: {
        label: 'مكتملة',
        gradient: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: CheckCircle,
    },
    DISPUTED: {
        label: 'تحت المراجعة',
        gradient: 'from-orange-400 to-red-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        icon: AlertCircle,
    },
    REFUNDED: {
        label: 'مستردة',
        gradient: 'from-gray-400 to-slate-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        icon: XCircle,
    },
    REJECTED_BY_TEACHER: {
        label: 'مرفوضة',
        gradient: 'from-red-400 to-rose-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: XCircle,
    },
    CANCELLED_BY_PARENT: {
        label: 'ملغاة',
        gradient: 'from-gray-400 to-slate-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        icon: XCircle,
    },
    CANCELLED_BY_TEACHER: {
        label: 'ملغاة من المعلم',
        gradient: 'from-gray-400 to-slate-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        icon: XCircle,
    },
    CANCELLED_BY_ADMIN: {
        label: 'ملغاة',
        gradient: 'from-gray-400 to-slate-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        icon: XCircle,
    },
    EXPIRED: {
        label: 'منتهية',
        gradient: 'from-gray-400 to-slate-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        icon: XCircle,
    },
    PARTIALLY_REFUNDED: {
        label: 'استرداد جزئي',
        gradient: 'from-orange-400 to-amber-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        icon: AlertCircle,
    },
} as const;

type BookingStatus = keyof typeof STATUS_CONFIG;

interface BookingCardProps {
    id: string;
    readableId?: string | null; // Human-readable ID like BK-2512-0042
    studentName: string;
    subjectName: string;
    startTime: string;
    endTime: string;
    price: number | string;
    status: BookingStatus;
    showActions?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    isProcessing?: boolean;
    variant?: 'session' | 'request';
    actionSlot?: React.ReactNode;
    // Package indicator
    packageSessionCount?: number; // If set, shows a badge indicating this is a package booking
    isDemo?: boolean; // If set, shows a demo badge
}

export function BookingCard({
    id,
    readableId,
    studentName,
    subjectName,
    startTime,
    endTime,
    price,
    status,
    showActions = false,
    onApprove,
    onReject,
    isProcessing = false,
    variant = 'session',
    actionSlot,
    packageSessionCount,
    isDemo,
}: BookingCardProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_TEACHER_APPROVAL;
    const Icon = config.icon;
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    return (
        <div className={cn(
            "relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group",
            "border-2",
            config.borderColor,
        )}>
            {/* Gradient Top Accent Bar */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                config.gradient
            )} />

            {/* Pulse Animation for Pending Requests */}
            {'pulse' in config && config.pulse && (
                <div className="absolute top-4 left-4">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                </div>
            )}

            <div className="p-4 sm:p-5">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
                            "bg-gradient-to-br",
                            config.gradient,
                            "text-white shadow-lg"
                        )}>
                            <User className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <Link
                                href={`/teacher/sessions/${id}`}
                                className="font-bold text-gray-800 hover:text-primary transition-colors text-base sm:text-lg"
                            >
                                {studentName}
                            </Link>
                            <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1">📚 {subjectName}</span>
                                {readableId && (
                                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                        #{readableId}
                                    </span>
                                )}
                            </p>
                            {/* Package/Demo indicator */}
                            {packageSessionCount && packageSessionCount > 1 && (
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                        <Package className="w-3 h-3" />
                                        باقة {packageSessionCount} حصص
                                    </span>
                                </div>
                            )}
                            {isDemo && (
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                        🎓 حصة تجريبية
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold w-fit",
                        config.bgColor,
                        config.textColor,
                    )}>
                        <Icon className="w-4 h-4" />
                        <span>{config.label}</span>
                    </div>
                </div>

                {/* Date/Time Row */}
                <div className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3 rounded-xl mb-4",
                    config.bgColor,
                )}>
                    <div className="flex items-center gap-2">
                        <Calendar className={cn("w-5 h-5 shrink-0", config.textColor)} />
                        <div>
                            <p className="text-xs text-gray-500">التاريخ</p>
                            <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                {format(startDate, 'EEEE d MMM', { locale: ar })}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <Clock className={cn("w-5 h-5 shrink-0", config.textColor)} />
                        <div>
                            <p className="text-xs text-gray-500">الوقت</p>
                            <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                {format(startDate, 'h:mm a', { locale: ar })}
                                <span className="text-gray-400 mx-1">←</span>
                                {format(endDate, 'h:mm a', { locale: ar })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Price */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            <span className="text-xl sm:text-2xl font-bold text-gray-800">{price}</span>
                            <span className="text-sm text-gray-500">SDG</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {actionSlot ? (
                            actionSlot
                        ) : showActions && status === 'PENDING_TEACHER_APPROVAL' ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={onApprove}
                                    disabled={isProcessing}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-4 shadow-lg shadow-emerald-500/25"
                                >
                                    <Check className="w-4 h-4" />
                                    قبول
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={onReject}
                                    disabled={isProcessing}
                                    className="gap-1 px-4 shadow-lg shadow-red-500/25"
                                >
                                    <X className="w-4 h-4" />
                                    رفض
                                </Button>
                            </>
                        ) : (
                            <Link href={`/teacher/sessions/${id}`}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
                                >
                                    <Eye className="w-4 h-4" />
                                    عرض التفاصيل
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Sublabel if exists */}
                {'sublabel' in config && config.sublabel && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span>💰</span>
                            {config.sublabel}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export status config for use in pages
export { STATUS_CONFIG };
export type { BookingStatus };
