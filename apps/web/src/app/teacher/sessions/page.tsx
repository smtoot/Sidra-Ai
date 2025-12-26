'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Video, Bell, Loader2, Eye, Link as LinkIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import Link from 'next/link';
import { BookingCard } from '@/components/teacher/BookingCard';
import { teacherApi } from '@/lib/api/teacher';

const ITEMS_PER_PAGE = 10;

export default function TeacherSessionsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedBookingForComplete, setSelectedBookingForComplete] = useState<Booking | null>(null);
    const [showMeetingLinkInput, setShowMeetingLinkInput] = useState(false);
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

    const handleCompleteSession = async () => {
        if (!selectedBookingForComplete) return;

        setCompletingId(selectedBookingForComplete.id);
        try {
            await bookingApi.completeSession(selectedBookingForComplete.id);
            toast.success('تم إنهاء الحصة! سيتم تحويل الدفع خلال 48 ساعة بعد تأكيد الطالب ✅');
            setConfirmModalOpen(false);
            setSelectedBookingForComplete(null);
            await loadSessions(true); // Silent refresh
        } catch (error) {
            console.error('Failed to complete session', error);
            toast.error('حدث خطأ أثناء إنهاء الحصة');
        } finally {
            setCompletingId(null);
        }
    };

    const handleSaveMeetingLink = async () => {
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
            await teacherApi.updateProfile({ meetingLink: meetingLinkInput });
            toast.success('تم حفظ رابط الاجتماع بنجاح! ✅');
            setShowMeetingLinkInput(false);
            setMeetingLinkInput('');
            await loadSessions(true); // Reload to get updated meeting links
        } catch (error) {
            console.error('Failed to save meeting link', error);
            toast.error('فشل حفظ رابط الاجتماع');
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

        // Allow starting 15 min before until session end
        const fifteenMinutesBefore = new Date(sessionStart.getTime() - 15 * 60 * 1000);
        const thirtyMinutesAfterEnd = new Date(sessionEnd.getTime() + 30 * 60 * 1000);

        const canStart = now >= fifteenMinutesBefore && now <= thirtyMinutesAfterEnd;
        const sessionInProgress = now >= sessionStart && now <= sessionEnd;
        const sessionEnded = now > sessionEnd;

        if (now < fifteenMinutesBefore) {
            const diff = sessionStart.getTime() - now.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) {
                return { canStart: false, canComplete: false, label: `بعد ${days} يوم`, sublabel: 'سيتم تفعيل الرابط قبل الموعد بـ15 دقيقة' };
            } else if (hours > 0) {
                return { canStart: false, canComplete: false, label: `بعد ${hours} ساعة`, sublabel: 'سيتم تفعيل الرابط قبل الموعد بـ15 دقيقة' };
            } else {
                return { canStart: false, canComplete: false, label: `بعد ${minutes} دقيقة`, sublabel: 'سيتم تفعيل الرابط قبل الموعد بـ15 دقيقة' };
            }
        } else if (sessionInProgress) {
            return { canStart: true, canComplete: true, label: '🔴 بدء الاجتماع', sublabel: 'الحصة جارية' };
        } else if (sessionEnded) {
            return { canStart: false, canComplete: true, label: 'انتهت الحصة', sublabel: 'يرجى إنهاء الحصة لتحويل الأرباح' };
        } else {
            return { canStart: true, canComplete: false, label: 'بدء الاجتماع' };
        }
    };

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">حصصي</h1>
                        <p className="text-sm md:text-base text-gray-600">الجدول الدراسي وجميع الحصص</p>
                    </header>

                    {/* Missing Meeting Link Banner */}
                    {sessionsWithoutMeetingLink.length > 0 && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-red-800 mb-1">
                                            ⚠️ رابط الاجتماع غير متوفر ({sessionsWithoutMeetingLink.length} حصة)
                                        </h3>
                                        <p className="text-sm text-red-700 mb-3">
                                            لديك حصص مجدولة ولكن لم تقم بإضافة رابط الاجتماع بعد. أضف الرابط الآن لتتمكن من بدء الحصص.
                                        </p>

                                        {!showMeetingLinkInput ? (
                                            <Button
                                                onClick={() => setShowMeetingLinkInput(true)}
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                إضافة رابط الاجتماع الآن
                                            </Button>
                                        ) : (
                                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    رابط الاجتماع (Google Meet, Zoom, Teams)
                                                </label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="url"
                                                        placeholder="https://meet.google.com/abc-defg-hij"
                                                        value={meetingLinkInput}
                                                        onChange={(e) => setMeetingLinkInput(e.target.value)}
                                                        className="flex-1"
                                                        dir="ltr"
                                                        disabled={savingMeetingLink}
                                                    />
                                                    <Button
                                                        onClick={handleSaveMeetingLink}
                                                        disabled={savingMeetingLink || !meetingLinkInput.trim()}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {savingMeetingLink ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                                                جاري الحفظ...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-4 h-4 ml-2" />
                                                                حفظ
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setShowMeetingLinkInput(false);
                                                            setMeetingLinkInput('');
                                                        }}
                                                        variant="outline"
                                                        disabled={savingMeetingLink}
                                                    >
                                                        إلغاء
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    💡 نصيحة: استخدم نفس رابط الاجتماع لجميع الحصص، أو يمكنك تغييره لاحقاً من الإعدادات
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Completion Banner */}
                    {pendingCompletions.length > 0 && (
                        <Card className="border-warning-200 bg-warning-50">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bell className="w-5 h-5 text-warning-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-warning-800 mb-1">
                                            لديك {pendingCompletions.length} حصة تحتاج إلى إنهاء
                                        </h3>
                                        <p className="text-sm text-warning-700 mb-3">
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
                        <Card className="border-success-200 bg-success-50">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-success-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-success-800 mb-1">
                                            💰 {pendingPaymentRelease.length} حصة في انتظار تحويل الدفع
                                        </h3>
                                        <p className="text-sm text-success-700 mb-2">
                                            اكتملت الحصص بنجاح! سيتم تحويل الأرباح إلى محفظتك تلقائياً خلال 48 ساعة
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs text-success-700">
                                            {pendingPaymentRelease.slice(0, 5).map(booking => (
                                                <span key={booking.id} className="bg-success-100 px-2 py-1 rounded-lg font-medium">
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
                        <Card>
                            <CardContent className="p-12 text-center text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                                <p>جاري التحميل...</p>
                            </CardContent>
                        </Card>
                    ) : bookings.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد حصص مجدولة</h3>
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
                                                    packageSessionCount={booking.packageBooking?.package?.sessionCount}
                                                    isDemo={booking.isDemo}
                                                    actionSlot={
                                                        booking.status === 'SCHEDULED' ? (() => {
                                                            const buttonState = getSessionButtonState(booking);
                                                            return (
                                                                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                                                    <div className="flex flex-wrap items-center gap-2 justify-end">
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
                                                                                } else if (buttonState.canStart && !booking.meetingLink) {
                                                                                    toast.error('رابط الاجتماع غير متوفر. يرجى إضافة رابط الاجتماع في الإعدادات');
                                                                                }
                                                                            }}
                                                                            title={!booking.meetingLink ? 'يجب إضافة رابط الاجتماع في الإعدادات أولاً' : ''}
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
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-md w-full">
                            <CardContent className="p-6 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">إنهاء الحصة</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    هل تأكدت من انتهاء الحصة التعليمية؟ سيتم إخطار الطالب للتأكيد وتحويل الأرباح إلى محفظتك.
                                </p>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleCompleteSession}
                                        disabled={completingId === selectedBookingForComplete.id}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                                    >
                                        {completingId === selectedBookingForComplete.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                جاري الإنهاء...
                                            </>
                                        ) : (
                                            'نعم، تم الإنهاء'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setConfirmModalOpen(false);
                                            setSelectedBookingForComplete(null);
                                        }}
                                        disabled={completingId === selectedBookingForComplete.id}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        إلغاء
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
