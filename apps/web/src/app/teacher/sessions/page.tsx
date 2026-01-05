'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingApi, Booking } from '@/lib/api/booking';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, CheckCircle, AlertCircle, Video, Bell, Loader2, Link as LinkIcon, Save, Clock, AlertTriangle, History } from 'lucide-react';
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
import { useSystemConfig } from '@/context/SystemConfigContext';

type SessionTab = 'upcoming' | 'completed' | 'needs_action' | 'issues';

export default function TeacherSessionsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<SessionTab>('upcoming');
    const { meetingLinkAccessMinutes } = useSystemConfig();

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

    // Filter Logic
    const filteredBookings = useMemo(() => {
        const now = new Date();

        // Base filter: Exclude WAITING_FOR_PAYMENT and PENDING_TEACHER_APPROVAL (handled in requests page)
        // Also exclude cancelled pre-payment items.
        // We only want: SCHEDULED, COMPLETED, DISPUTED, PENDING_CONFIRMATION
        const relevant = bookings.filter(b =>
            ['SCHEDULED', 'COMPLETED', 'PENDING_CONFIRMATION', 'DISPUTED', 'UNDER_REVIEW', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(b.status)
        );

        switch (activeTab) {
            case 'upcoming':
                return relevant.filter(b => b.status === 'SCHEDULED' && new Date(b.endTime) > now)
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            case 'completed':
                return relevant.filter(b => ['COMPLETED', 'PENDING_CONFIRMATION'].includes(b.status))
                    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()); // Newest completed first

            case 'needs_action':
                // SCHEDULED but past endTime (Needs completion) OR Missing Link?
                // Let's focus on "Needs Completion" primarily
                return relevant.filter(b => {
                    const isPastEnd = new Date(b.endTime) < now;
                    return (b.status === 'SCHEDULED' && isPastEnd);
                }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            case 'issues':
                return relevant.filter(b => ['DISPUTED', 'UNDER_REVIEW', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(b.status));

            default:
                return [];
        }
    }, [bookings, activeTab]);

    // Compute counts for tabs
    const counts = useMemo(() => {
        const now = new Date();
        const relevant = bookings.filter(b =>
            ['SCHEDULED', 'COMPLETED', 'PENDING_CONFIRMATION', 'DISPUTED', 'UNDER_REVIEW', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(b.status)
        );

        return {
            upcoming: relevant.filter(b => b.status === 'SCHEDULED' && new Date(b.endTime) > now).length,
            completed: relevant.filter(b => ['COMPLETED', 'PENDING_CONFIRMATION'].includes(b.status)).length,
            needs_action: relevant.filter(b => b.status === 'SCHEDULED' && new Date(b.endTime) < now).length,
            issues: relevant.filter(b => ['DISPUTED', 'UNDER_REVIEW', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(b.status)).length
        };
    }, [bookings]);

    // Check if there are scheduled sessions without meeting links (Global check for banner)
    const sessionsWithoutMeetingLink = useMemo(() => {
        return bookings.filter(booking => booking.status === 'SCHEDULED' && !booking.meetingLink && new Date(booking.endTime) > new Date());
    }, [bookings]);


    const handleSaveMeetingLink = async (bookingId: string) => {
        if (!meetingLinkInput.trim()) {
            toast.error('يرجى إدخال رابط الاجتماع');
            return;
        }

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
            await loadSessions(true);
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
        // Allow starting X min before (configurable) until session end
        const minutesBefore = new Date(sessionStart.getTime() - meetingLinkAccessMinutes * 60 * 1000);
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
                return { canStart: false, canComplete: false, label: `بعد ${days} يوم`, sublabel: `سيتم تفعيل الرابط قبل الموعد بـ${meetingLinkAccessMinutes} دقيقة` };
            } else if (hours > 0) {
                return { canStart: false, canComplete: false, label: `بعد ${hours} ساعة`, sublabel: `سيتم تفعيل الرابط قبل الموعد بـ${meetingLinkAccessMinutes} دقيقة` };
            } else {
                return { canStart: false, canComplete: false, label: `بعد ${minutes} دقيقة`, sublabel: `سيتم تفعيل الرابط قبل الموعد بـ${meetingLinkAccessMinutes} دقيقة` };
            }
        } else if (sessionInProgress) {
            return { canStart: true, canComplete: false, label: '🔴 بدء الاجتماع', sublabel: 'الحصة جارية' };
        } else if (sessionEnded) {
            return { canStart: false, canComplete: true, label: 'انتهت الحصة', sublabel: 'يرجى إنهاء الحصة لتحويل الأرباح' };
        } else {
            return { canStart: true, canComplete: false, label: 'بدء الاجتماع' };
        }
    };

    const tabs: { id: SessionTab; label: string; icon: any }[] = [
        { id: 'upcoming', label: 'القادمة', icon: Calendar },
        { id: 'needs_action', label: 'تحتاج إجراء', icon: Bell },
        { id: 'completed', label: 'المكتملة', icon: CheckCircle },
        { id: 'issues', label: 'دعم/مشاكل', icon: AlertTriangle },
    ];

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">حصصي</h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            <span>جدول الحصص المؤكدة وسجل التدريس</span>
                        </p>
                    </header>

                    {/* Missing Meeting Link Banner (Global Warning) */}
                    {sessionsWithoutMeetingLink.length > 0 && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-500 animate-in fade-in slide-in-from-top-2">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-amber-900 mb-1">
                                            تنبيه: حصص قادمة بدون رابط ({sessionsWithoutMeetingLink.length})
                                        </h3>
                                        <p className="text-sm text-amber-700">
                                            يرجى إضافة رابط الاجتماع للحصص القادمة لضمان وصول الطالب في الموعد.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tabs */}
                    <Card className="border-none shadow-md">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const count = counts[tab.id];
                                    return (
                                        <button
                                            key={tab.id}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                activeTab === tab.id
                                                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                                            )}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{tab.label}</span>
                                            {count > 0 && (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-bold",
                                                    activeTab === tab.id
                                                        ? "bg-white/20 text-white"
                                                        : "bg-gray-200 text-gray-700",
                                                    (tab.id === 'needs_action' || tab.id === 'issues') && "bg-amber-100 text-amber-800"
                                                )}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sessions List */}
                    {loading ? (
                        <Card className="border-none shadow-md">
                            <CardContent className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                                <p className="text-gray-500">جاري التحميل...</p>
                            </CardContent>
                        </Card>
                    ) : filteredBookings.length === 0 ? (
                        <Card className="border-2 border-dashed border-gray-200">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {activeTab === 'upcoming' && 'لا توجد حصص قادمة'}
                                    {activeTab === 'completed' && 'لا توجد حصص مكتملة'}
                                    {activeTab === 'needs_action' && 'لا يوجد أي إجراء مطلوب حالياً'}
                                    {activeTab === 'issues' && 'لا توجد حالات دعم أو مشاكل حالياً'}
                                </h3>
                                <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                                    {activeTab === 'upcoming' && 'عندما يتم تأكيد الحجوزات، ستظهر هنا في قائمة الحصص القادمة.'}
                                    {activeTab === 'completed' && 'سجل الحصص المكتملة فارغ.'}
                                    {activeTab === 'needs_action' && 'الحصص التي انتهت وتحتاج إلى تأكيد الإتمام، أو الحصص التي ينقصها رابط اجتماع ستظهر هنا.'}
                                    {activeTab === 'issues' && 'ستظهر هنا أي حجوزات تحت المراجعة أو بها نزاع.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {(() => {
                                    // Pagination logic
                                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                                    const endIndex = startIndex + ITEMS_PER_PAGE;
                                    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

                                    return (
                                        <>
                                            {paginatedBookings.map((booking) => (
                                                <BookingCard
                                                    key={booking.id}
                                                    id={booking.id}
                                                    readableId={booking.readableId}
                                                    studentName={booking.child?.name || booking.studentUser?.displayName || 'طالب مجهول'}
                                                    subjectName={booking.subject?.nameAr || booking.subjectId}
                                                    startTime={booking.startTime}
                                                    endTime={booking.endTime}
                                                    price={booking.price}
                                                    status={booking.status}
                                                    packageSessionCount={booking.pendingTierSessionCount || undefined}
                                                    isDemo={booking.isDemo}
                                                    // Alerts for "Needs Action"
                                                    alert={activeTab === 'needs_action' && booking.status === 'SCHEDULED' ? (
                                                        <div className="bg-amber-50 text-amber-800 text-sm px-3 py-2 rounded-lg border border-amber-100 flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                <span>انتهى وقت الحصة. يرجى تأكيد الإتمام لتحويل الأرباح.</span>
                                                            </div>
                                                        </div>
                                                    ) : undefined}
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
                                                                        {!booking.meetingLink && !isEditingThis && new Date(booking.endTime) > new Date() && (
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
                                                                        {new Date(booking.endTime) > new Date() && (
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
                                                                        )}

                                                                        {/* Complete Session Button - only after session ends */}
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
                                                                    {buttonState.sublabel && new Date(booking.endTime) > new Date() && (
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
                            {filteredBookings.length > ITEMS_PER_PAGE && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)}
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
