'use client';

import { Booking, BookingStatus } from '@/lib/api/booking';
import { cn } from '@/lib/utils';
import {
    Clock,
    CreditCard,
    CheckCircle,
    AlertCircle,
    XCircle,
    Calendar,
    User,
    ChevronLeft,
    Star,
    MessageCircleQuestion,
    RefreshCw,
    Wallet,
    AlertTriangle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingListCardProps {
    booking: Booking;
    userRole: 'PARENT' | 'STUDENT';
    onAction: (action: BookingAction, booking: Booking) => void;
}

export type BookingAction =
    | 'pay'
    | 'cancel'
    | 'confirm'
    | 'dispute'
    | 'rate'
    | 'details'
    | 'book-new'
    | 'support';

export interface StatusUIConfig {
    label: string;
    headerBg: string; // e.g. "bg-amber-50"
    headerText: string; // e.g. "text-amber-900"
    borderColor: string; // e.g. "border-amber-100"
    icon?: any;
    primaryAction?: {
        label: string;
        actionType: BookingAction;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
        className?: string; // Additional classes
        icon?: any;
    };
    secondaryAction?: {
        label: string;
        actionType: BookingAction;
        className?: string; // e.g. "text-red-500"
    };
    microcopy?: string;
}

/**
 * Premium Booking Card Component (Polish Refinement)
 */
export function BookingListCard({ booking, userRole, onAction }: BookingListCardProps) {
    const config = getStatusUI(booking.status, booking);
    const StatusIcon = config.icon || Info;

    // Handle card click for "Details" navigation
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking buttons/interactive elements
        if ((e.target as HTMLElement).closest('button')) return;
        onAction('details', booking);
    };

    // Price Visibility Rule
    const showPrice = [
        'WAITING_FOR_PAYMENT',
        'SCHEDULED',
        'COMPLETED',
        'PENDING_CONFIRMATION',
        'PAYMENT_REVIEW'
    ].includes(booking.status);

    // UX: Special emphasis for payment
    const isPaymentRequired = booking.status === 'WAITING_FOR_PAYMENT';

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group relative bg-white rounded-2xl shadow-sm border border-gray-100/80 transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden",
                "hover:border-primary/20 ring-0 hover:ring-1 hover:ring-primary/5"
            )}
        >
            {/* --- 1. COLORED HEADER --- */}
            <div className={cn(
                "px-5 py-3 md:py-3.5 flex items-center justify-between gap-2 border-b transition-colors",
                config.headerBg,
                config.borderColor,
                config.headerText,
                "group-hover:bg-opacity-80"
            )}>
                <div className="flex items-start gap-2.5">
                    <StatusIcon className="w-5 h-5 mt-0.5 opacity-90" />
                    <div>
                        <h3 className="font-bold text-base md:text-lg leading-tight">
                            {config.label}
                        </h3>
                        {config.microcopy && (
                            <p className="text-sm opacity-85 mt-0.5 font-medium text-current/90">
                                {config.microcopy}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 2. CARD BODY --- */}
            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative">

                {/* RIGHT BLOCK: Booking Info */}
                <div className="flex-1 min-w-0 space-y-3">

                    {/* Subject | Teacher */}
                    <div>
                        <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">
                            {booking.subject?.nameAr || booking.subject?.nameEn}
                            <span className="text-gray-300 mx-2 font-light">|</span>
                            <span className="text-primary-700 group-hover:text-primary-800">{booking.teacherProfile?.displayName}</span>
                        </h4>
                    </div>

                    {/* Meta Row: Date, Time, Student */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-500">
                        {/* Student Name (Parent Only) */}
                        {userRole === 'PARENT' && (
                            <div className="flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">
                                    {booking.child?.name || booking.student?.name || 'الابن'}
                                </span>
                            </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-1.5 px-1">
                            <Calendar className="w-4 h-4 text-gray-400 group-hover:text-primary/60 transition-colors" />
                            <span dir="rtl" className="font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                {new Date(booking.startTime).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-1.5 px-1">
                            <Clock className="w-4 h-4 text-gray-400 group-hover:text-primary/60 transition-colors" />
                            <span dir="rtl" className="font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                {new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* DIVIDER (Mobile) */}
                <div className="h-px bg-gray-100 w-full md:hidden" />

                {/* LEFT BLOCK: Price & Actions & Affordance */}
                <div className="flex flex-col justify-between items-end gap-4 w-full md:w-auto min-w-[160px]">

                    {/* Price & Primary Action Grouping */}
                    <div className={cn(
                        "flex flex-col items-end w-full gap-2 transition-all p-1 -m-1 rounded-lg",
                        isPaymentRequired && "bg-blue-50/50 border border-blue-100/50 shadow-sm"
                    )}>
                        {/* Price */}
                        {showPrice && (
                            <div className={cn("text-right", isPaymentRequired && "px-1 pt-1")}>
                                <p className="text-lg md:text-xl font-black text-gray-900 leading-none">
                                    {booking.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">SDG</span>
                                </p>
                                <p className="text-[10px] text-gray-400">للحصة الواحدة</p>
                            </div>
                        )}

                        {/* Primary Button */}
                        {config.primaryAction && (
                            <Button
                                size="default"
                                variant={config.primaryAction.variant || 'default'}
                                className={cn(
                                    "w-full md:w-auto font-bold shadow-sm transition-all z-10",
                                    config.primaryAction.className,
                                    isPaymentRequired && "w-full shadow-blue-200 shadow-md"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction(config.primaryAction!.actionType, booking);
                                }}
                            >
                                {config.primaryAction.icon && <config.primaryAction.icon className="w-4 h-4 ml-1.5" />}
                                {config.primaryAction.label}
                            </Button>
                        )}
                    </div>

                    {/* Persistent "View Details" Affordance */}
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium transition-colors mt-auto",
                        config.primaryAction ? "text-gray-400 group-hover:text-primary/80" : "text-primary group-hover:text-primary-700"
                    )}>
                        <span>عرض تفاصيل الحجز</span>
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- Status Mapping (Unchanged) ---
export function getStatusUI(status: BookingStatus, booking: Booking): StatusUIConfig {

    // 1. PENDING APPROVAL
    if (status === 'PENDING_TEACHER_APPROVAL') {
        return {
            label: 'تم إرسال الطلب – بانتظار رد المعلم',
            headerBg: 'bg-amber-50',
            headerText: 'text-amber-800',
            borderColor: 'border-amber-100',
            icon: Clock,
            microcopy: 'عادةً يرد المعلم خلال 24 ساعة.',
            secondaryAction: { label: 'إلغاء الطلب', actionType: 'cancel', className: 'text-red-600 hover:bg-red-50' }
        };
    }

    // 2. WAITING PAYMENT
    if (status === 'WAITING_FOR_PAYMENT') {
        return {
            label: 'تمت الموافقة – مطلوب إتمام الدفع',
            headerBg: 'bg-blue-50',
            headerText: 'text-blue-800',
            borderColor: 'border-blue-100',
            icon: CreditCard,
            microcopy: 'يرجى إتمام الدفع خلال المهلة المحددة لتأكيد الحجز.',
            primaryAction: {
                label: 'ادفع الآن',
                actionType: 'pay',
                className: 'bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]',
                icon: Wallet
            },
            secondaryAction: { label: 'إلغاء الطلب', actionType: 'cancel', className: 'text-red-500' }
        };
    }

    // 3. SCHEDULED
    if (status === 'SCHEDULED') {
        return {
            label: 'حجز مؤكد – قادم',
            headerBg: 'bg-emerald-50',
            headerText: 'text-emerald-800',
            borderColor: 'border-emerald-100',
            icon: CheckCircle,
            // Removed primaryAction 'details' to avoid redundancy with global card link
            // secondaryAction also not rendered on card anymore
        };
    }

    // 4. PENDING CONFIRMATION
    if (status === 'PENDING_CONFIRMATION') {
        return {
            label: 'بانتظار تأكيد إتمام الحصة',
            headerBg: 'bg-amber-50', // or Yellow
            headerText: 'text-amber-800',
            borderColor: 'border-amber-100',
            icon: AlertTriangle,
            microcopy: 'يرجى التأكيد أو رفع اعتراض خلال المهلة المحددة.',
            primaryAction: {
                label: 'تأكيد إتمام الحصة',
                actionType: 'confirm',
                className: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100',
                icon: CheckCircle
            },
            secondaryAction: { label: 'رفع اعتراض', actionType: 'dispute', className: 'text-amber-700 font-bold' }
        };
    }

    // 5. COMPLETED
    if (status === 'COMPLETED') {
        // @ts-ignore
        const isRated = !!booking.rating;

        return {
            label: 'مكتملة',
            headerBg: 'bg-gray-50', // Neutral/Gray or very soft green
            headerText: 'text-gray-700',
            borderColor: 'border-gray-100',
            icon: CheckCircle,
            primaryAction: !isRated ? {
                label: 'تقييم المعلم',
                actionType: 'rate',
                variant: 'outline',
                className: 'border-primary text-primary hover:bg-primary/5',
                icon: Star
            } : {
                label: 'احجز حصة أخرى مع المعلم',
                actionType: 'book-new',
                variant: 'outline',
                className: 'border-primary text-primary hover:bg-primary/5'
            },
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // 6. REJECTED
    if (status === 'REJECTED_BY_TEACHER') {
        return {
            label: 'لم تتم الموافقة على الطلب',
            headerBg: 'bg-red-50',
            headerText: 'text-red-800',
            borderColor: 'border-red-100',
            icon: XCircle,
            primaryAction: {
                label: 'حجز معلم آخر',
                actionType: 'book-new',
                variant: 'default' // Primary styling for rebooking
            },
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // 7. CANCELLED BY PARENT
    if (status === 'CANCELLED_BY_PARENT') {
        return {
            label: 'تم إلغاء الحجز',
            headerBg: 'bg-gray-100',
            headerText: 'text-gray-600',
            borderColor: 'border-gray-200',
            icon: XCircle,
            primaryAction: {
                label: 'حجز حصة جديدة',
                actionType: 'book-new',
                variant: 'outline'
            },
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // 8. CANCELLED BY TEACHER
    if (status === 'CANCELLED_BY_TEACHER') {
        return {
            label: 'تم إلغاء الحجز بواسطة المعلم',
            headerBg: 'bg-red-50',
            headerText: 'text-red-800',
            borderColor: 'border-red-100',
            icon: XCircle,
            primaryAction: {
                label: 'حجز حصة جديدة',
                actionType: 'book-new',
                variant: 'default',
                className: 'bg-primary text-white'
            },
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // 9. CANCELLED BY ADMIN
    if (status === 'CANCELLED_BY_ADMIN') {
        return {
            label: 'تم إلغاء الحجز بواسطة إدارة المنصة',
            headerBg: 'bg-gray-100',
            headerText: 'text-gray-600',
            borderColor: 'border-gray-200',
            icon: XCircle,
            primaryAction: {
                label: 'حجز حصة جديدة',
                actionType: 'book-new',
                variant: 'outline'
            },
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // Payment Review (Extra safety)
    if (status === 'PAYMENT_REVIEW') {
        return {
            label: 'جاري مراجعة الدفع',
            headerBg: 'bg-blue-50',
            headerText: 'text-blue-800',
            borderColor: 'border-blue-100',
            icon: RefreshCw,
            microcopy: 'قد تستغرق العملية بضع دقائق',
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // Disputed (Extra safety)
    if (status === 'DISPUTED') {
        return {
            label: 'قيد المراجعة (نزاع)',
            headerBg: 'bg-orange-50',
            headerText: 'text-orange-800',
            borderColor: 'border-orange-100',
            icon: MessageCircleQuestion,
            secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
        };
    }

    // Default Fallback
    return {
        label: 'غير محدد',
        headerBg: 'bg-gray-50',
        headerText: 'text-gray-500',
        borderColor: 'border-gray-200',
        icon: AlertCircle,
        secondaryAction: { label: 'عرض التفاصيل', actionType: 'details' }
    };
}


export function BookingCardSkeleton() {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm animate-pulse overflow-hidden">
            {/* Header Skeleton */}
            <div className="h-14 bg-gray-50 border-b border-gray-100 w-full" />

            {/* Body Skeleton */}
            <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="h-6 w-48 bg-gray-100 rounded-md" />
                    <div className="flex gap-4">
                        <div className="h-4 w-24 bg-gray-100 rounded-md" />
                        <div className="h-4 w-24 bg-gray-100 rounded-md" />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    <div className="h-8 w-20 bg-gray-100 rounded-md" />
                    <div className="h-10 w-32 bg-gray-100 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
