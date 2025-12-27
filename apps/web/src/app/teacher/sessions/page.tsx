'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingApi, Booking } from '@/lib/api/booking';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, CheckCircle, AlertCircle, Video, Bell, Loader2, Link as LinkIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import Link from 'next/link';
import { BookingCard } from '@/components/teacher/BookingCard';
import { SessionCompletionModal } from '@/components/booking/SessionCompletionModal';

const ITEMS_PER_PAGE = 10;
// Default meeting link access time (minutes before session start)
const DEFAULT_MEETING_LINK_ACCESS_MINUTES = 15;

export default function TeacherSessionsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedBookingForComplete, setSelectedBookingForComplete] = useState<Booking | null>(null);
    const [editingLinkForBooking, setEditingLinkForBooking] = useState<string | null>(null);
    const [meetingLinkInput, setMeetingLinkInput] = useState('');
    const [savingMeetingLink, setSavingMeetingLink] = useState(false);

    const loadSessions = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await bookingApi.getTeacherSessions();
            setBookings(data);
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    // Compute sessions that need completion (past end time but still SCHEDULED)
    const pendingCompletions = useMemo(() => {
        const now = new Date();
        return bookings.filter(booking => {
            if (booking.status !== 'SCHEDULED') return false;
            const endTime = new Date(booking.endTime);
            return now > endTime; // Session has ended but not marked complete
        });
    }, [bookings]);

    // Compute sessions awaiting payment release (PENDING_CONFIRMATION status)
    const pendingPaymentRelease = useMemo(() => {
        return bookings.filter(booking => booking.status === 'PENDING_CONFIRMATION');
    }, [bookings]);

    // Check if there are any scheduled sessions without meeting links
    const sessionsWithoutMeetingLink = useMemo(() => {
        return bookings.filter(booking => booking.status === 'SCHEDULED' && !booking.meetingLink);
    }, [bookings]);

    const handleSaveMeetingLink = async (bookingId: string) => {
        if (!meetingLinkInput.trim()) {
            toast.error('يرجى إدخال رابط الاجتماع');
            return;
        }

        // Basic URL validation
        try {
            new URL(meetingLinkInput);
        } catch {
            toast.error('يرجى إدخال رابط صحيح (مثال: https://meet.google.com/abc-defg-hij)');
            return;
        }

        setSavingMeetingLink(true);
        try {
            await bookingApi.updateMeetingLink(bookingId, meetingLinkInput);
            toast.success('تم حفظ رابط الاجتماع بنجاح! ✅');
            setEditingLinkForBooking(null);
            setMeetingLinkInput('');
            await loadSessions(true); // Reload to get updated meeting links
        } catch (error: any) {
            console.error('Failed to save meeting link', error);
            toast.error(error?.response?.data?.message || 'فشل حفظ رابط الاجتماع');
        } finally {
            setSavingMeetingLink(false);
        }
    };

    // Helper function to determine Join/Start button state based on session time
    const getSessionButtonState = (booking: Booking): {
        canStart: boolean;
        canComplete: boolean;
        label: string;
        sublabel?: string;
    } => {
        const sessionStart = new Date(booking.startTime);
        const sessionEnd = new Date(booking.endTime);
        const now = new Date();

        // Allow starting X min before (configurable) until session end
        const minutesBefore = new Date(sessionStart.getTime() - DEFAULT_MEETING_LINK_ACCESS_MINUTES * 60 * 1000);
        const thirtyMinutesAfterEnd = new Date(sessionEnd.getTime() + 30 * 60 * 1000);

        const canStart = now >= minutesBefore && now <= thirtyMinutesAfterEnd;
        const sessionInProgress = now >= sessionStart && now <= sessionEnd;
        const sessionEnded = now > sessionEnd;

        if (now < minutesBefore) {
            const diff = sessionStart.getTime() - now.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) {
                return { canStart: false, canComplete: false, label: `بعد ${days} يوم`, sublabel: `سيتم تفعيل الرابط قبل الموعد بـ${DEFAULT_MEETING_LINK_ACCESS_MINUTES} دقيقة` };
            } else if (hours > 0) {
                return { canStart: false, canComplete: false, label: `بعد ${hours} ساعة`, sublabel: `سيتم تفعيل الرابط قبل الموعد بـ${DEFAULT_MEETING_LINK_ACCESS_MINUTES} دقيقة` };
            } else {
                return { canStart: false, canComplete: false, label: `بعد ${minutes} دقيقة`, sublabel: `سيتم تفعيل الرابط قبل الموعد بـ${DEFAULT_MEETING_LINK_ACCESS_MINUTES} دقيقة` };
            }
        } else if (sessionInProgress) {
            // FIXED: Cannot complete during session - only after it ends
            return { canStart: true, canComplete: false, label: '🔴 بدء الاجتماع', sublabel: 'الحصة جارية' };
        } else if (sessionEnded) {
            // Can complete only AFTER session ends
            return { canStart: false, canComplete: true, label: 'انتهت الحصة', sublabel: 'يرجى إنهاء الحصة لتحويل الأرباح' };
        } else {
            return { canStart: true, canComplete: false, label: 'بدء الاجتماع' };
        }
    };

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">حصصي</h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <span>الجدول الدراسي وجميع الحصص</span>
                        </p>
                    </header>

                    {/* Missing Meeting Link Banner */}
                    {sessionsWithoutMeetingLink.length > 0 && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-500">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-amber-900 mb-1">
                                            حصص بدون رابط اجتماع ({sessionsWithoutMeetingLink.length})
                                        </h3>
                                        <p className="text-sm text-amber-700">
                                            أضف رابط الاجتماع لكل حصة أدناه. يمكنك إضافة روابط مختلفة لكل حصة حسب الحاجة.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Completion Banner */}
                    {pendingCompletions.length > 0 && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-red-50 border-l-4 border-l-orange-500">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bell className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-orange-900 mb-1">
                                            لديك {pendingCompletions.length} حصة تحتاج إلى إنهاء
                                        </h3>
                                        <p className="text-sm text-orange-700 mb-3">
                                            يرجى تأكيد إنهاء الحصص السابقة لتحويل أرباحك إلى المحفظة
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {pendingCompletions.slice(0, 3).map(booking => (
                                                <Button
                                                    key={booking.id}
                                                    onClick={() => {
                                                        setSelectedBookingForComplete(booking);
                                                        setConfirmModalOpen(true);
                                                    }}
                                                    size="sm"
                                                    className="bg-warning-600 hover:bg-warning-700 text-white gap-1"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    إنهاء حصة {new Date(booking.startTime).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                                </Button>
                                            ))}
                                            {pendingCompletions.length > 3 && (
                                                <span className="text-sm text-warning-600 self-center px-2">
                                                    +{pendingCompletions.length - 3} حصص أخرى
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Payment Release Banner */}
                    {pendingPaymentRelease.length > 0 && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-green-50 border-l-4 border-l-emerald-500">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-emerald-900 mb-1">
                                            {pendingPaymentRelease.length} حصة في انتظار تحويل الدفع
                                        </h3>
                                        <p className="text-sm text-emerald-700 mb-2">
                                            اكتملت الحصص بنجاح! سيتم تحويل الأرباح إلى محفظتك تلقائياً خلال 48 ساعة
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs text-emerald-700">
                                            {pendingPaymentRelease.slice(0, 5).map(booking => (
                                                <span key={booking.id} className="bg-emerald-100 px-2 py-1 rounded-lg font-medium">
                                                    {new Date(booking.startTime).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - {booking.subject?.nameAr || 'مادة'}
                                                </span>
                                            ))}
                                            {pendingPaymentRelease.length > 5 && (
                                                <span className="self-center">+{pendingPaymentRelease.length - 5} أخرى</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sessions List */}
                    {loading ? (
                        <Card className="border-none shadow-md">
                            <CardContent className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                                <p className="text-gray-500">جاري التحميل...</p>
                            </CardContent>
                        </Card>
                    ) : bookings.length === 0 ? (
                        <Card className="border-2 border-dashed border-gray-200">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حصص مجدولة</h3>
                                <p className="text-gray-500 mb-4">عندما يتم حجز حصص جديدة ستظهر هنا</p>
                                <Link href="/teacher/availability">
                                    <Button variant="outline">إدارة جدول المواعيد</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {(() => {
                                    // Pagination logic
                                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                                    const endIndex = startIndex + ITEMS_PER_PAGE;
                                    const paginatedBookings = bookings.slice(startIndex, endIndex);
                                    const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);

                                    return (
                                        <>
                                            {paginatedBookings.map((booking) => (
                                                <BookingCard
                                                    key={booking.id}
                                                    id={booking.id}
                                                    readableId={booking.readableId}
                                                    studentName={booking.child?.name || booking.studentUser?.email || 'طالب مجهول'}
                                                    subjectName={booking.subject?.nameAr || booking.subjectId}
                                                    startTime={booking.startTime}
                                                    endTime={booking.endTime}
                                                    price={booking.price}
                                                    status={booking.status}
                                                    packageSessionCount={booking.pendingTierSessionCount || undefined}
                                                    isDemo={booking.isDemo}
                                                    actionSlot={
                                                        booking.status === 'SCHEDULED' ? (() => {
                                                            const buttonState = getSessionButtonState(booking);
                                                            const isEditingThis = editingLinkForBooking === booking.id;

                                                            return (
                                                                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                                                    {/* Meeting Link Input (when missing and editing) */}
                                                                    {!booking.meetingLink && isEditingThis && (
                                                                        <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                رابط الاجتماع
                                                                            </label>
                                                                            <div className="flex gap-2">
                                                                                <Input
                                                                                    type="url"
                                                                                    placeholder="https://meet.google.com/..."
                                                                                    value={meetingLinkInput}
                                                                                    onChange={(e) => setMeetingLinkInput(e.target.value)}
                                                                                    className="flex-1 text-sm"
                                                                                    dir="ltr"
                                                                                    disabled={savingMeetingLink}
                                                                                    autoFocus
                                                                                />
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleSaveMeetingLink(booking.id)}
                                                                                    disabled={savingMeetingLink || !meetingLinkInput.trim()}
                                                                                    className="bg-green-600 hover:bg-green-700"
                                                                                >
                                                                                    {savingMeetingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => {
                                                                                        setEditingLinkForBooking(null);
                                                                                        setMeetingLinkInput('');
                                                                                    }}
                                                                                    disabled={savingMeetingLink}
                                                                                >
                                                                                    ✕
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-wrap items-center gap-2 justify-end">
                                                                        {/* Add Meeting Link Button (when missing) */}
                                                                        {!booking.meetingLink && !isEditingThis && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setEditingLinkForBooking(booking.id);
                                                                                    setMeetingLinkInput('');
                                                                                }}
                                                                                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                                                                            >
                                                                                <LinkIcon className="w-3 h-3" />
                                                                                إضافة رابط
                                                                            </Button>
                                                                        )}

                                                                        {/* Start Meeting Button */}
                                                                        <button
                                                                            className={cn(
                                                                                "px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-sm text-sm",
                                                                                buttonState.canStart && booking.meetingLink
                                                                                    ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                                                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                                                                                buttonState.label.includes('🔴') && booking.meetingLink && "animate-pulse"
                                                                            )}
                                                                            disabled={!buttonState.canStart || !booking.meetingLink}
                                                                            onClick={() => {
                                                                                if (buttonState.canStart && booking.meetingLink) {
                                                                                    window.open(booking.meetingLink, '_blank');
                                                                                }
                                                                            }}
                                                                            title={!booking.meetingLink ? 'يجب إضافة رابط الاجتماع أولاً' : ''}
                                                                        >
                                                                            <Video className="w-4 h-4" />
                                                                            {buttonState.label}
                                                                        </button>

                                                                        {/* Complete Session Button - only after session starts */}
                                                                        {buttonState.canComplete && (
                                                                            <button
                                                                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm text-sm shadow-blue-200"
                                                                                onClick={() => {
                                                                                    setSelectedBookingForComplete(booking);
                                                                                    setConfirmModalOpen(true);
                                                                                }}
                                                                            >
                                                                                <CheckCircle className="w-4 h-4" />
                                                                                إنهاء
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {buttonState.sublabel && (
                                                                        <span className="text-xs text-gray-400">
                                                                            {buttonState.sublabel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })() : undefined
                                                    }
                                                />
                                            ))}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Pagination */}
                            {bookings.length > ITEMS_PER_PAGE && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(bookings.length / ITEMS_PER_PAGE)}
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

                {/* Session Completion Modal */}
                {confirmModalOpen && selectedBookingForComplete && (
                    <SessionCompletionModal
                        isOpen={confirmModalOpen}
                        onClose={() => {
                            setConfirmModalOpen(false);
                            setSelectedBookingForComplete(null);
                        }}
                        bookingId={selectedBookingForComplete.id}
                        onSuccess={() => {
                            loadSessions();
                            setConfirmModalOpen(false);
                            setSelectedBookingForComplete(null);
                        }}
                    />
                )}
            </div>
        </TeacherApprovalGuard>
    );
}
