'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import {
    ArrowRight,
    Calendar,
    Clock,
    User,
    BookOpen,
    ExternalLink,
    CheckCircle,
    XCircle,
    FileText,
    Edit3,
    Save,
    Loader2,
    AlertCircle,
    DollarSign,
    Video,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Notes state
    const [prepNotes, setPrepNotes] = useState('');
    const [summary, setSummary] = useState('');
    const [editingPrep, setEditingPrep] = useState(false);
    const [editingSummary, setEditingSummary] = useState(false);

    // Cancel modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    const loadSession = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getBookingById(sessionId);
            setSession(data);
            setPrepNotes(data.teacherPrepNotes || '');
            setSummary(data.teacherSummary || '');
        } catch (error) {
            console.error('Failed to load session:', error);
            toast.error('فشل تحميل تفاصيل الحصة');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrepNotes = async () => {
        setSaving(true);
        try {
            await bookingApi.updateTeacherNotes(sessionId, { teacherPrepNotes: prepNotes });
            toast.success('تم حفظ ملاحظات التحضير');
            setEditingPrep(false);
        } catch (error) {
            toast.error('فشل حفظ الملاحظات');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSummary = async () => {
        setSaving(true);
        try {
            await bookingApi.updateTeacherNotes(sessionId, { teacherSummary: summary });
            toast.success('تم حفظ ملخص الحصة');
            setEditingSummary(false);
        } catch (error) {
            toast.error('فشل حفظ الملخص');
        } finally {
            setSaving(false);
        }
    };

    const handleCompleteSession = async () => {
        setSaving(true);
        try {
            await bookingApi.completeSession(sessionId);
            toast.success('تم تأكيد إتمام الحصة');
            await loadSession();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشل تأكيد إتمام الحصة');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelSession = async () => {
        if (!cancelReason.trim()) {
            toast.error('يرجى إدخال سبب الإلغاء');
            return;
        }

        setCancelling(true);
        try {
            await bookingApi.cancelBooking(sessionId, cancelReason);
            toast.success('تم إلغاء الحصة');
            router.push('/teacher/sessions');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشل إلغاء الحصة');
        } finally {
            setCancelling(false);
            setShowCancelModal(false);
        }
    };

    const canComplete = session?.status === 'SCHEDULED';
    const canCancel = session?.status === 'SCHEDULED' || session?.status === 'PENDING_TEACHER_APPROVAL';
    const isCompleted = session?.status === 'COMPLETED' || session?.status === 'PENDING_CONFIRMATION';

    if (loading) {
        return (
            <TeacherApprovalGuard>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                </div>
            </TeacherApprovalGuard>
        );
    }

    if (!session) {
        return (
            <TeacherApprovalGuard>
                <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
                    <Card className="max-w-md w-full">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">لم يتم العثور على الحصة</h2>
                            <p className="text-gray-500 mb-6">ربما تم حذف هذه الحصة أو لا تملك صلاحية الوصول إليها</p>
                            <Button onClick={() => router.push('/teacher/sessions')} className="w-full">
                                العودة للحصص
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TeacherApprovalGuard>
        );
    }

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
                {/* Header */}
                <div className="bg-white border-b">
                    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
                        <button
                            onClick={() => router.push('/teacher/sessions')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowRight className="w-5 h-5" />
                            <span>العودة للحصص</span>
                        </button>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <Avatar
                                    fallback={session.child?.name?.[0] || session.studentUser?.displayName?.[0] || 'ط'}
                                    size="xl"
                                    className="flex-shrink-0"
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            {session.child?.name || session.studentUser?.displayName || 'طالب'}
                                        </h1>
                                        <StatusBadge status={session.status} />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-lg">{session.subject?.nameAr || 'مادة دراسية'}</span>
                                    </div>
                                    {/* Package/Demo indicator */}
                                    {session.packageBooking?.package?.sessionCount && session.packageBooking.package.sessionCount > 1 && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                                <Package className="w-3 h-3" />
                                                باقة {session.packageBooking.package.sessionCount} حصص
                                            </span>
                                        </div>
                                    )}
                                    {session.isDemo && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                                🎓 حصة تجريبية
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            {session.status === 'SCHEDULED' && session.meetingLink && (
                                <a
                                    href={session.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md"
                                >
                                    <Video className="w-5 h-5" />
                                    انضم للحصة الآن
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
                    {/* Info Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-5 text-center">
                                <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 mb-1">التاريخ</p>
                                <p className="font-bold text-sm">
                                    {format(new Date(session.startTime), 'EEEE، d MMM', { locale: ar })}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5 text-center">
                                <Clock className="w-6 h-6 text-success-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 mb-1">الوقت</p>
                                <p className="font-bold text-sm">
                                    {format(new Date(session.startTime), 'h:mm a', { locale: ar })}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5 text-center">
                                <User className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 mb-1">الطالب</p>
                                <p className="font-bold text-sm truncate">
                                    {session.child?.name || 'طالب'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5 text-center">
                                <DollarSign className="w-6 h-6 text-warning-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 mb-1">السعر</p>
                                <p className="font-bold text-sm">{session.price} SDG</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Notes (from parent/student) */}
                    {session.bookingNotes && (
                        <Card className="border-primary-200 bg-primary-50/50">
                            <CardHeader className="pb-3 border-b bg-primary-50">
                                <CardTitle className="text-base flex items-center gap-2 text-primary-700">
                                    <FileText className="w-5 h-5" />
                                    ملاحظات ولي الأمر
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{session.bookingNotes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Teacher Prep Notes */}
                    <Card className="border-warning-200 bg-warning-50/50">
                        <CardHeader className="pb-3 border-b bg-warning-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2 text-warning-700">
                                <Edit3 className="w-5 h-5" />
                                ملاحظات التحضير
                            </CardTitle>
                            {!editingPrep && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingPrep(true)}
                                    className="text-warning-600 hover:text-warning-700 h-auto p-0"
                                >
                                    تعديل
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-4">
                            {editingPrep ? (
                                <div className="space-y-3">
                                    <Textarea
                                        value={prepNotes}
                                        onChange={(e) => setPrepNotes(e.target.value)}
                                        placeholder="اكتب ملاحظاتك للتحضير للحصة..."
                                        rows={4}
                                        className="text-right"
                                        dir="rtl"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleSavePrepNotes} disabled={saving} size="sm">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                                            حفظ
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setEditingPrep(false)}>
                                            إلغاء
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {prepNotes || <span className="text-gray-400 italic">اضغط "تعديل" لإضافة ملاحظات التحضير الخاصة بك</span>}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teacher Summary (for completed sessions) */}
                    {isCompleted && (
                        <Card className="border-success-200 bg-success-50/50">
                            <CardHeader className="pb-3 border-b bg-success-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2 text-success-700">
                                    <CheckCircle className="w-5 h-5" />
                                    ملخص الحصة
                                </CardTitle>
                                {!editingSummary && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingSummary(true)}
                                        className="text-success-600 hover:text-success-700 h-auto p-0"
                                    >
                                        تعديل
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="pt-4">
                                {editingSummary ? (
                                    <div className="space-y-3">
                                        <Textarea
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            placeholder="اكتب ملخص الحصة وما تم تغطيته..."
                                            rows={4}
                                            className="text-right"
                                            dir="rtl"
                                        />
                                        <div className="flex gap-2">
                                            <Button onClick={handleSaveSummary} disabled={saving} size="sm">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                                                حفظ
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingSummary(false)}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {summary || <span className="text-gray-400 italic">اضغط "تعديل" لإضافة ملخص الحصة</span>}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">إجراءات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {/* Join Meeting - for scheduled sessions */}
                                {session.status === 'SCHEDULED' && session.meetingLink && (
                                    <a
                                        href={session.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        <Video className="w-4 h-4" />
                                        انضم للحصة
                                    </a>
                                )}

                                {/* Complete Session */}
                                {canComplete && (
                                    <Button
                                        onClick={handleCompleteSession}
                                        disabled={saving}
                                        className="gap-2 bg-success-600 hover:bg-success-700"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        تأكيد إتمام الحصة
                                    </Button>
                                )}

                                {/* Cancel Session */}
                                {canCancel && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCancelModal(true)}
                                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        إلغاء الحصة
                                    </Button>
                                )}

                                {/* Status message when no actions */}
                                {!canComplete && !canCancel && session.status !== 'SCHEDULED' && (
                                    <p className="text-gray-600 text-sm py-2">
                                        {session.status === 'COMPLETED' && '✅ تمت الحصة بنجاح'}
                                        {session.status === 'PENDING_CONFIRMATION' && '⏳ في انتظار تأكيد الطالب وتحويل الأرباح'}
                                        {(session.status === 'CANCELLED_BY_PARENT' || session.status === 'REJECTED_BY_TEACHER') && '❌ تم إلغاء هذه الحصة'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </main>

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-md w-full">
                            <CardContent className="p-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">إلغاء الحصة</h3>
                                    <p className="text-gray-500 text-sm">هذا الإجراء لا يمكن التراجع عنه</p>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">سبب الإلغاء</label>
                                    <Textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="يرجى توضيح سبب الإلغاء..."
                                        rows={3}
                                        className="text-right"
                                        dir="rtl"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1"
                                    >
                                        تراجع
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelSession}
                                        disabled={cancelling}
                                        className="flex-1"
                                    >
                                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                        تأكيد الإلغاء
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
