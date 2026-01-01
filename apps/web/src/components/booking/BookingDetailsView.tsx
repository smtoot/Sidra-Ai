'use client';

import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    User,
    ChevronLeft,
    Star,
    Wallet,
    Info,
    FileText,
    GraduationCap,
    Clock9,
    ChevronDown,
    AlertTriangle,
    ArrowRight,
    ChevronUp,
    Timer,
    History
} from 'lucide-react';
import { Booking, BookingStatus, BookingAction } from '@/lib/api/booking';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from 'react';

interface BookingDetailsViewProps {
    booking: Booking;
    userRole: 'PARENT' | 'STUDENT';
    availableActions: BookingAction[];
    onAction: (action: BookingAction) => void;
}

export function BookingDetailsView({ booking, userRole, availableActions, onAction }: BookingDetailsViewProps) {
    const config = getStatusConfig(booking.status, booking);
    // Use the config icon or fallback
    const StatusIcon = config.icon || Info;

    // Format ID
    const formattedId = booking.readableId ? `رقم الحجز: ${booking.readableId}` : `رقم الحجز: BK-${booking.id.slice(0, 4)}-${booking.id.slice(4, 8)}`.toUpperCase();

    // Timeline Default Logic: Expanded for Cancelled/Payment, Collapsed for others
    const isTimelineExpandedByDefault = ['WAITING_FOR_PAYMENT', 'PENDING_TEACHER_APPROVAL'].includes(booking.status) || booking.status.includes('CANCELLED');

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans" dir="rtl">

            {/* --- 1) Compact Status Header (Reduced Height) --- */}
            <div className={cn("py-4 px-4 border-b transition-colors", config.bgClass)}>
                <div className="max-w-xl mx-auto space-y-2">
                    {/* Back Link */}
                    <Link
                        href={userRole === 'PARENT' ? '/parent/bookings' : '/student/bookings'}
                        className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors mb-1"
                    >
                        <ArrowRight className="w-3 h-3 ml-1" />
                        <span>العودة للحجوزات</span>
                    </Link>

                    <div className="flex items-start gap-3">
                        <span className={cn("p-1.5 rounded-lg bg-white/60 shadow-sm shrink-0 mt-0.5", config.iconColor)}>
                            <StatusIcon className="w-5 h-5" />
                        </span>
                        <div>
                            <h1 className={cn("text-lg font-bold tracking-tight", config.textClass)}>
                                {config.label}
                            </h1>
                            <p className="text-gray-600 text-sm font-medium opacity-90 leading-snug mt-0.5">
                                {config.description}
                            </p>
                            <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-black/5 rounded text-[10px] text-gray-500 font-mono tracking-wide">
                                {formattedId}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 -mt-3 space-y-5">

                {/* --- 2) Action Panel (Top Action Card) & 3) Explicit Next Step --- */}
                <div className="bg-white rounded-xl shadow-lg shadow-gray-200/40 border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-2">

                    {/* 1. WAITING FOR PAYMENT */}
                    {booking.status === 'WAITING_FOR_PAYMENT' && (
                        <div className="flex flex-col items-center text-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">المبلغ المطلوب سداده</span>
                            <div className="text-3xl font-black text-gray-900 tracking-tight flex items-baseline justify-center gap-1 mb-1">
                                {booking.price.toLocaleString()}
                            </div>
                            <span className="text-sm text-gray-400 font-medium mb-5">جنيه سوداني</span>

                            <Button
                                size="lg"
                                className="w-full text-base h-11 font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/10 mb-2"
                                onClick={() => onAction('pay')}
                            >
                                <Wallet className="w-4 h-4 ml-2" />
                                ادفع الآن
                            </Button>
                            <button
                                onClick={() => onAction('cancel')}
                                className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors py-2"
                            >
                                إلغاء الطلب
                            </button>

                            {/* Explicit Next Step & Deadline */}
                            <div className="mt-4 w-full bg-amber-50 rounded-lg p-3 flex items-start gap-3 border border-amber-100">
                                <Timer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-right">
                                    <p className="text-xs font-bold text-amber-800">التالي: إتمام الدفع لتأكيد الحجز</p>
                                    <p className="text-[11px] text-amber-600 mt-0.5">يرجى إتمام الدفع خلال 24 ساعة لتجنب إلغاء الحجز.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. PENDING TEACHER APPROVAL */}
                    {booking.status === 'PENDING_TEACHER_APPROVAL' && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">طلبك قيد المراجعة</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    عادةً يرد المعلم خلال 24 ساعة.
                                </p>
                            </div>
                            <div className="w-full pt-1">
                                <Button
                                    variant="outline"
                                    onClick={() => onAction('cancel')}
                                    className="w-full h-10 border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    إلغاء الطلب
                                </Button>
                            </div>
                            {/* Explicit Next Step */}
                            <p className="text-xs font-bold text-gray-400 border-t pt-3 w-full">
                                التالي: انتظار رد المعلم
                            </p>
                        </div>
                    )}

                    {/* 3. PENDING CONFIRMATION */}
                    {booking.status === 'PENDING_CONFIRMATION' && (
                        <div className="flex flex-col items-center text-center space-y-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">تأكيد إتمام الحصة</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    انتهت الحصة حسب توقيت المعلم. يرجى التأكيد لإتمام الدفع.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row w-full gap-3">
                                <Button
                                    size="lg"
                                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                                    onClick={() => onAction('confirm')}
                                >
                                    تأكيد الحصة
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 h-11 border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={() => onAction('dispute')}
                                >
                                    رفع اعتراض
                                </Button>
                            </div>
                            {/* Explicit Next Step */}
                            <p className="text-xs font-bold text-gray-400 border-t pt-3 w-full">
                                التالي: تأكيد الحصة أو الإبلاغ عن مشكلة
                            </p>
                        </div>
                    )}

                    {/* 4. CANCELLED / REJECTED */}
                    {(booking.status.includes('CANCELLED') || booking.status.includes('REJECTED')) && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">تم إلغاء هذا الحجز</h3>
                                {booking.status === 'CANCELLED_BY_PARENT' && <p className="text-xs text-gray-400 mt-1">قمت أنت بإلغاء الحجز.</p>}
                                {booking.status === 'CANCELLED_BY_TEACHER' && <p className="text-xs text-gray-400 mt-1">قام المعلم بإلغاء الحجز.</p>}
                                {booking.status === 'REJECTED_BY_TEACHER' && <p className="text-xs text-gray-400 mt-1">اعتذر المعلم عن قبول الطلب.</p>}
                                {/* No Payment Taken Logic */}
                                <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block mt-2">
                                    لم يتم خصم أي مبلغ مالي.
                                </p>
                            </div>

                            <Button
                                onClick={() => onAction('book-new')}
                                className="w-full h-11"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                حجز حصة جديدة
                            </Button>
                            {/* Explicit Next Step */}
                            <p className="text-xs font-bold text-gray-400 border-t pt-3 w-full">
                                هذا الحجز مغلق
                            </p>
                        </div>
                    )}

                    {/* 5. COMPLETED */}
                    {booking.status === 'COMPLETED' && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">اكتملت الحصة بنجاح</h3>
                            <div className="flex gap-3 w-full">
                                <Button
                                    onClick={() => onAction('book-new')}
                                    variant="outline"
                                    className="flex-1 h-11"
                                >
                                    حجز مرة أخرى
                                </Button>
                                {availableActions.includes('rate') && (
                                    <Button
                                        onClick={() => onAction('rate')}
                                        className="flex-1 h-11"
                                    >
                                        <Star className="w-4 h-4 ml-2" />
                                        تقييم المعلم
                                    </Button>
                                )}
                            </div>
                            {/* Explicit Next Step */}
                            <p className="text-xs font-bold text-gray-400 border-t pt-3 w-full">
                                تمت هذه الحصة
                            </p>
                        </div>
                    )}

                    {/* 6. SCHEDULED (Info only) */}
                    {booking.status === 'SCHEDULED' && (
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-bold mb-2">
                                <CheckCircle className="w-4 h-4" />
                                الحجز مؤكد
                            </div>
                            <p className="text-sm text-gray-500">
                                استعد للحصة في الموعد المحدد.
                            </p>
                            {availableActions.includes('cancel') && (
                                <button
                                    onClick={() => onAction('cancel')}
                                    className="text-red-500 hover:text-red-700 text-xs mt-2 font-medium"
                                >
                                    إلغاء الحجز
                                </button>
                            )}
                            {/* Explicit Next Step */}
                            <p className="text-xs font-bold text-gray-400 border-t pt-3 w-full">
                                التالي: حضور الحصة في الموعد
                            </p>
                        </div>
                    )}
                </div>

                {/* --- 4) Booking Details Card (Strict No Contact Info) --- */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                    <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        تفاصيل الحجز
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
                        {/* Row 1: Student | Subject */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">الطالب</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-gray-900">
                                    {booking.child?.name || booking.student?.name || (userRole === 'STUDENT' ? 'أنت' : 'الابن')}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">المادة</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-gray-900">
                                    {booking.subject?.nameAr || booking.subject?.nameEn}
                                </span>
                            </div>
                        </div>

                        {/* Row 2: Teacher | Date & Time Merged */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">المعلم</p>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">
                                            {booking.teacherProfile?.displayName || 'المعلم'}
                                        </p>
                                        <Link href={`/teachers/${booking.teacherId}`} className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-0.5 mt-0.5" target="_blank">
                                            عرض ملف المعلم
                                            <ChevronLeft className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Merged Date/Time Block */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">الموعد</p>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-bold text-gray-900 leading-tight">
                                        {new Date(booking.startTime).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700 dir-rtl">
                                        {new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}
                                        {' - '}
                                        {new Date(booking.endTime).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="mt-2 text-[10px] text-gray-400 border-t border-gray-200 pt-1.5 flex justify-end">
                                    (بتوقيت {getTimezoneName()})
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 5) Notes (Only if exists) --- */}
                {booking.bookingNotes && (
                    <ExpandableCard
                        title="ملاحظات أُرسلت للمعلم"
                        helperText="هذه الملاحظات يراها المعلم قبل الحصة للتحضير"
                        icon={FileText}
                        content={booking.bookingNotes}
                        bgClass="bg-gray-50"
                        borderClass="border-gray-200"
                        titleColor="text-gray-600"
                    />
                )}

                {/* --- 6) Session Summary (COMPLETED Only) --- */}
                {booking.status === 'COMPLETED' && (
                    <ExpandableCard
                        title="ملخص الحصة من المعلم"
                        icon={Star}
                        content={booking.teacherSummary || "لم يقم المعلم بإضافة ملخص للحصة بعد."}
                        bgClass="bg-emerald-50/50"
                        borderClass="border-emerald-100"
                        titleColor="text-emerald-800"
                        iconColor="text-emerald-600"
                        empty={!booking.teacherSummary}
                    />
                )}

                {/* --- 7) Timeline (Consistent Names & Dates) --- */}
                <div className="pt-2">
                    <Accordion type="single" collapsible className="w-full bg-white rounded-xl border border-gray-200 shadow-sm" defaultValue={isTimelineExpandedByDefault ? "timeline" : ""}>
                        <AccordionItem value="timeline" className="border-none px-4">
                            <AccordionTrigger className="text-gray-600 hover:text-gray-900 hover:no-underline py-4 text-sm font-bold">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-400" />
                                    سجل الحجز
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Timeline booking={booking} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Footer Safe Space */}
                <div className="h-8" />
            </div>
        </div>
    );
}

// --- Sub-components & Helpers ---

function ExpandableCard({ title, helperText, icon: Icon, content, bgClass, borderClass, titleColor, iconColor, empty }: any) {
    const [expanded, setExpanded] = useState(false);
    // Simple check if content is long (approx 150 chars)
    const isLong = content?.length > 150;
    const displayContent = (!expanded && isLong) ? content.slice(0, 150) + "..." : content;

    return (
        <div className={cn("rounded-xl border p-5 transition-all", bgClass, borderClass)}>
            <div className="mb-3">
                <h3 className={cn("text-sm font-bold flex items-center gap-2", titleColor)}>
                    <Icon className={cn("w-4 h-4", iconColor)} />
                    {title}
                </h3>
                {helperText && (
                    <p className="text-xs text-gray-400 mt-1 mr-6 opacity-80">{helperText}</p>
                )}
            </div>

            <p className={cn("text-gray-800 leading-relaxed text-sm whitespace-pre-wrap", empty && "text-gray-400 italic")}>
                {displayContent}
            </p>
            {isLong && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                    {expanded ? "عرض أقل" : "عرض المزيد"}
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            )}
        </div>
    )
}

function getTimezoneName() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1]?.replace('_', ' ') || 'المحلي';
}

function Timeline({ booking }: { booking: Booking }) {
    const created = booking.createdAt;

    // Consistent Step Names
    const steps = [
        { label: 'تم إرسال الطلب', status: 'done', date: created },
        {
            label: 'موافقة المعلم',
            status: !['PENDING_TEACHER_APPROVAL', 'REJECTED_BY_TEACHER', 'CANCELLED_BY_PARENT', 'CANCELLED_BY_TEACHER'].includes(booking.status) ? 'done' :
                (booking.status === 'PENDING_TEACHER_APPROVAL' ? 'active' : 'pending'),
        },
        {
            label: 'الدفع',
            status: (!['WAITING_FOR_PAYMENT', 'PENDING_TEACHER_APPROVAL', 'REJECTED_BY_TEACHER'].includes(booking.status) && !booking.status.includes('CANCELLED')) && booking.status !== 'WAITING_FOR_PAYMENT' ? 'done' :
                (booking.status === 'WAITING_FOR_PAYMENT' ? 'active' : 'pending'),
        },
        {
            label: 'اكتمال الحصة', // Updated Label
            status: booking.status === 'COMPLETED' ? 'done' : 'pending',
            date: booking.teacherCompletedAt
        }
    ];

    // Handle Cancelled/Rejected terminal state with Reasons
    if (booking.status.includes('CANCELLED') || booking.status === 'REJECTED_BY_TEACHER') {
        const lastIndex = steps.findIndex(s => s.status === 'pending');
        if (lastIndex !== -1) steps.splice(lastIndex);
        const updated = (booking as any).updatedAt || new Date().toISOString();

        let label = 'تم الإلغاء';
        if (booking.status === 'CANCELLED_BY_PARENT') label = 'تم الإلغاء من قبلك';
        if (booking.status === 'CANCELLED_BY_TEACHER') label = 'تم الإلغاء من المعلم';
        if (booking.status === 'REJECTED_BY_TEACHER') label = 'لم تتم الموافقة';

        steps.push({ label, status: 'error', date: updated });
    }

    return (
        <div className="relative border-r-2 border-gray-100 mr-2 space-y-6">
            {steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pr-6">
                    <div className={cn(
                        "absolute -right-[7px] top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-colors z-10",
                        step.status === 'done' ? "border-primary bg-primary" :
                            step.status === 'active' ? "border-primary bg-white ring-2 ring-primary/20" :
                                step.status === 'error' ? "border-red-500 bg-red-500" :
                                    "border-gray-200"
                    )} />

                    <div className={cn(
                        "flex flex-col",
                        step.status === 'pending' && "opacity-40"
                    )}>
                        <p className={cn("font-bold text-sm",
                            step.status === 'active' ? "text-primary" :
                                step.status === 'done' ? "text-gray-900" : "text-gray-400"
                        )}>
                            {step.label}
                        </p>
                        {/* Always show date if available / applicable */}
                        {step.date && step.status !== 'pending' && (
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5" dir="ltr">
                                {new Date(step.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}


function getStatusConfig(status: BookingStatus, booking: Booking) {
    switch (status) {
        case 'PENDING_TEACHER_APPROVAL':
            return {
                label: 'بانتظار رد المعلم',
                description: 'تم إرسال الطلب للمعلم للموافقة.',
                bgClass: 'bg-amber-50',
                textClass: 'text-amber-800',
                iconColor: 'bg-amber-100/50 text-amber-600',
                icon: Clock
            };
        case 'WAITING_FOR_PAYMENT':
            return {
                label: 'موافقة المعلم – بانتظار الدفع',
                description: 'تمت الموافقة، يرجى الدفع.',
                bgClass: 'bg-blue-50',
                textClass: 'text-blue-800',
                iconColor: 'bg-blue-100/50 text-blue-600',
                icon: Wallet
            };
        case 'SCHEDULED':
            return {
                label: 'حجز مؤكد',
                description: 'تم تأكيد حجز الحصة.',
                bgClass: 'bg-emerald-50',
                textClass: 'text-emerald-800',
                iconColor: 'bg-emerald-100/50 text-emerald-600',
                icon: CheckCircle
            };
        case 'PENDING_CONFIRMATION':
            return {
                label: 'بانتظار تأكيد إتمام الحصة',
                description: 'يرجى تأكيد إتمام الحصة أو رفع اعتراض.',
                bgClass: 'bg-amber-50',
                textClass: 'text-amber-800',
                iconColor: 'bg-amber-100/50 text-amber-600',
                icon: AlertTriangle
            };
        case 'COMPLETED':
            return {
                label: 'حصة مكتملة',
                description: 'تمت الحصة بنجاح.',
                bgClass: 'bg-white',
                textClass: 'text-gray-900',
                iconColor: 'bg-gray-100 text-gray-600',
                icon: CheckCircle
            };
        case 'CANCELLED_BY_PARENT':
            return {
                label: 'حجز ملغى',
                description: 'تم إلغاء الحجز من قبلك.',
                bgClass: 'bg-gray-50',
                textClass: 'text-gray-600',
                iconColor: 'bg-gray-200/50 text-gray-500',
                icon: XCircle
            };
        case 'CANCELLED_BY_TEACHER':
            return {
                label: 'حجز ملغى',
                description: 'تم إلغاء الحجز من قبل المعلم.',
                bgClass: 'bg-red-50',
                textClass: 'text-red-800',
                iconColor: 'bg-red-100/50 text-red-600',
                icon: XCircle
            };
        case 'REJECTED_BY_TEACHER':
            return {
                label: 'طلب مرفوض',
                description: 'نعتذر، المعلم غير متاح.',
                bgClass: 'bg-red-50',
                textClass: 'text-red-800',
                iconColor: 'bg-red-100/50 text-red-600',
                icon: XCircle
            };
        default:
            return {
                label: 'حجز ملغى',
                description: 'تم إلغاء هذا الحجز.',
                bgClass: 'bg-gray-50',
                textClass: 'text-gray-600',
                iconColor: 'bg-gray-200/50 text-gray-500',
                icon: XCircle
            };
    }
}
