'use client';

import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, DollarSign, Eye, Check, X, Package, Wallet, MoreHorizontal, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// --- CONFIGURATION & TYPES ---

// Status configuration: "Chip" colors and "Accent" bar colors.
// No full borders.
const STATUS_CONFIG = {
    // 1. New Request
    PENDING_TEACHER_APPROVAL: {
        label: 'طلب جديد',
        chipClass: 'bg-amber-100 text-amber-800',
        accentClass: 'bg-amber-400',
        icon: AlertCircle,
        pulse: true,
    },
    // 2. Waiting Teacher Approval (Same as pending essentially, but maybe for clarification)
    // We stick to the main status keys from backend but map labels visually.

    // 3. Waiting for Payment
    WAITING_FOR_PAYMENT: {
        label: 'بانتظار الدفع',
        chipClass: 'bg-blue-100 text-blue-800',
        accentClass: 'bg-blue-400',
        icon: Clock,
    },
    PAYMENT_REVIEW: {
        label: 'مراجعة الدفع',
        chipClass: 'bg-blue-100 text-blue-800',
        accentClass: 'bg-blue-400',
        icon: AlertCircle,
    },
    // 4. Scheduled/Upcoming
    SCHEDULED: {
        label: 'قادمة', // "Scheduled"
        chipClass: 'bg-emerald-100 text-emerald-800',
        accentClass: 'bg-emerald-400',
        icon: Calendar, // Changed to Calendar for "Upcoming" feel or CheckCircle
    },
    // 5. Completed
    PENDING_CONFIRMATION: {
        label: 'مكتملة',
        chipClass: 'bg-green-100 text-green-800',
        accentClass: 'bg-green-500',
        icon: CheckCircle,
        sublabel: 'بانتظار تحويل الأرباح',
    },
    COMPLETED: {
        label: 'مكتملة',
        chipClass: 'bg-gray-100 text-gray-800', // Neutral for completed/archived
        accentClass: 'bg-gray-400',
        icon: CheckCircle,
    },
    // 6. Dispute
    DISPUTED: {
        label: 'تحت المراجعة',
        chipClass: 'bg-orange-100 text-orange-800',
        accentClass: 'bg-orange-500',
        icon: AlertCircle,
    },
    UNDER_REVIEW: {
        label: 'تحت المراجعة',
        chipClass: 'bg-orange-100 text-orange-800',
        accentClass: 'bg-orange-500',
        icon: AlertCircle,
    },
    // 7. Cancelled/Refunded
    REFUNDED: {
        label: 'مستردة',
        chipClass: 'bg-gray-100 text-gray-500',
        accentClass: 'bg-gray-300',
        icon: XCircle,
    },
    REJECTED_BY_TEACHER: {
        label: 'مرفوضة',
        chipClass: 'bg-red-50 text-red-600',
        accentClass: 'bg-red-400',
        icon: XCircle,
    },
    CANCELLED_BY_PARENT: {
        label: 'ملغاة',
        chipClass: 'bg-gray-100 text-gray-500',
        accentClass: 'bg-gray-300',
        icon: XCircle,
    },
    CANCELLED_BY_TEACHER: {
        label: 'تم الإلغاء',
        chipClass: 'bg-gray-100 text-gray-500',
        accentClass: 'bg-gray-300',
        icon: XCircle,
    },
    CANCELLED_BY_ADMIN: {
        label: 'ملغاة',
        chipClass: 'bg-gray-100 text-gray-500',
        accentClass: 'bg-gray-300',
        icon: XCircle,
    },
    EXPIRED: {
        label: 'منتهية',
        chipClass: 'bg-gray-100 text-gray-500',
        accentClass: 'bg-gray-300',
        icon: XCircle,
    },
    PARTIALLY_REFUNDED: {
        label: 'استرداد جزئي',
        chipClass: 'bg-orange-50 text-orange-700',
        accentClass: 'bg-orange-400',
        icon: AlertCircle,
    },
} as const;

type BookingStatus = keyof typeof STATUS_CONFIG;

interface BookingCardProps {
    id: string;
    readableId?: string | null;
    studentName: string;
    studentAvatar?: string; // Future proofing
    studentGrade?: string; // e.g., "ابتدائي 3"
    studentCurriculum?: string; // e.g., "المنهج السوداني"
    subjectName: string;
    startTime: string;
    endTime: string;
    price: number | string;
    status: BookingStatus;

    // Logic/Actions
    showActions?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    isProcessing?: boolean;
    variant?: 'session' | 'request';
    actionSlot?: React.ReactNode;

    // Meta
    packageSessionCount?: number;
    isDemo?: boolean;
    alert?: React.ReactNode; // Can be used for "helperText"
}

export function BookingCard({
    id,
    readableId,
    studentName,
    studentGrade,
    studentCurriculum,
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
    alert,
}: BookingCardProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_TEACHER_APPROVAL;
    const Icon = config.icon;
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Determines if this is a "Request" card needing primary Accept/Reject actions
    const isRequestCard = status === 'PENDING_TEACHER_APPROVAL';

    return (
        <div className={cn(
            "relative bg-white rounded-2xl overflow-hidden transition-all duration-200 group",
            // Clean SaaS Style: 1px gray border, soft shadow on hover only
            "border border-gray-200 shadow-sm hover:shadow-md",
        )}>

            {/* Accent Bar (Left side in RTL layout logic means 'left' CSS property) */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                config.accentClass
            )} />

            {/* Main Content Container */}
            <div className="flex flex-col h-full bg-white">

                {/* --- ZONE A: HEADER --- */}
                <div className="p-5 flex items-start justify-between gap-4">

                    {/* Right Side (RTL Start): Student & Subject */}
                    <div className="flex items-start gap-3">
                        {/* Avatar Placeholder */}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                            <User className="w-5 h-5" />
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">
                                {studentName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <span>{subjectName}</span>
                                {/* Badges */}
                                {packageSessionCount && packageSessionCount > 1 && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                                        باقة
                                    </span>
                                )}
                                {isDemo && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">
                                        تجريبية
                                    </span>
                                )}
                            </div>
                            {/* Grade & Curriculum - Beautiful pill design */}
                            {(studentGrade || studentCurriculum) && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
                                        <span className="text-[11px] font-semibold text-blue-700">
                                            {studentGrade || 'الصف غير محدد'}
                                        </span>
                                        {studentCurriculum && (
                                            <>
                                                <span className="text-blue-300">•</span>
                                                <span className="text-[11px] text-blue-600">
                                                    {studentCurriculum}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Left Side (RTL End): Status & ID */}
                    <div className="flex flex-col items-end gap-1.5">
                        {/* Status Chip */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                            config.chipClass
                        )}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{config.label}</span>
                        </div>

                        {/* Booking Code - Muted */}
                        {readableId && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono" title="رقم الحجز">
                                <span>{readableId}</span>
                                {/* Optional: <Copy className="w-2.5 h-2.5 cursor-pointer hover:text-gray-600" /> */}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- ZONE B: META GRID --- */}
                {/* Separator mostly invisible or very subtle */}
                <div className="px-5 pb-4">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                        {/* Date Col */}
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-medium">التاريخ</span>
                                <span className="text-sm font-semibold text-gray-700">
                                    {format(startDate, 'EEEE d MMM', { locale: ar })}
                                </span>
                            </div>
                        </div>

                        {/* Time Col */}
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-medium">الوقت</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-gray-700 -ml-1" dir="ltr">
                                        {format(startDate, 'h:mm a')}
                                    </span>
                                    <span className="text-xs text-gray-400">-</span>
                                    <span className="text-sm font-semibold text-gray-700" dir="ltr">
                                        {format(endDate, 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Optional Helper/Alert Text (Below Meta) */}
                    {alert && (
                        <div className="mt-3 text-sm text-gray-600 px-1">
                            {alert}
                        </div>
                    )}
                </div>

                {/* --- ZONE C: FOOTER ACTIONS --- */}
                <div className="mt-auto px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white">

                    {/* Right Side (Visual Right in RTL): Price & Hints */}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium mb-0.5">المبلغ</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-gray-900">{price}</span>
                            <span className="text-xs text-gray-500 font-medium">SDG</span>
                        </div>
                        {/* Payout Hint */}
                        {'sublabel' in config && config.sublabel && (
                            <div className="flex items-center gap-1 mt-1 text-green-600 text-[10px] font-medium">
                                <Wallet className="w-3 h-3" />
                                <span>{config.sublabel}</span>
                            </div>
                        )}
                    </div>

                    {/* Left Side (Visual Left in RTL): Buttons */}
                    <div className="flex items-center gap-2 justify-end flex-1">
                        {actionSlot ? (
                            // Custom Actions (e.g. from Sessions page)
                            actionSlot
                        ) : isRequestCard && showActions ? (
                            // Default Request Actions (New Request)
                            <>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onReject}
                                    disabled={isProcessing}
                                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 text-sm font-medium px-3 h-9"
                                >
                                    رفض
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={onApprove}
                                    disabled={isProcessing}
                                    className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-5 h-9 shadow-sm"
                                >
                                    قبول
                                </Button>
                            </>
                        ) : (
                            // Default Read-only Action (Details)
                            <Link href={`/teacher/sessions/${id}`} className="block">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 text-sm font-medium px-4 h-9"
                                >
                                    عرض التفاصيل
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Export status config for use in pages
export { STATUS_CONFIG };
export type { BookingStatus };
