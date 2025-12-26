'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, ExternalLink, MessageCircle, Wallet, TrendingUp, AlertCircle, Link as LinkIcon, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ApplicationStatusBanner } from '@/components/teacher/ApplicationStatusBanner';
import { getFileUrl } from '@/lib/api/upload';
import { format, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TeacherDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMeetingLinkInput, setShowMeetingLinkInput] = useState(false);
    const [meetingLinkInput, setMeetingLinkInput] = useState('');
    const [savingMeetingLink, setSavingMeetingLink] = useState(false);

    const loadDashboard = async () => {
        try {
            const data = await teacherApi.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

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
            await loadDashboard(); // Reload to get updated meeting link
        } catch (error) {
            console.error('Failed to save meeting link', error);
            toast.error('فشل حفظ رابط الاجتماع');
        } finally {
            setSavingMeetingLink(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">جاري تحميل البيانات...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">فشل تحميل البيانات</div>;

    const { profile, counts, upcomingSession, recentSessions, walletBalance } = stats;

    // Compute upcoming session date labels
    let sessionDateLabel = '';
    let sessionTimeLabel = '';
    if (upcomingSession?.startTime) {
        const sessionDate = new Date(upcomingSession.startTime);
        sessionDateLabel = isToday(sessionDate)
            ? 'اليوم'
            : isTomorrow(sessionDate)
                ? 'غداً'
                : format(sessionDate, 'EEEE d MMMM', { locale: ar });
        sessionTimeLabel = format(sessionDate, 'h:mm a', { locale: ar });
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
                {/* Application Status Banner */}
                <ApplicationStatusBanner />

                {/* Welcome Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {/* Profile Photo with Avatar Component */}
                        <Avatar
                            src={profile.photo ? getFileUrl(profile.photo) : undefined}
                            fallback={profile.displayName || 'م'}
                            size="xl"
                            className="flex-shrink-0"
                        />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                مرحباً، {profile.displayName || 'أستاذ'} 👋
                            </h1>
                            <p className="text-sm md:text-base text-gray-600">إليك ملخص نشاطك اليوم</p>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="حصص اليوم"
                        value={counts.todaySessions}
                        icon={Calendar}
                        color="primary"
                        subtext="جلسات مجدولة"
                    />
                    <StatsCard
                        title="طلبات جديدة"
                        value={counts.pendingRequests}
                        icon={MessageCircle}
                        color="warning"
                        subtext="بانتظار الموافقة"
                    />
                    <StatsCard
                        title="إجمالي الأرباح"
                        value={`${Math.round(counts.totalEarnings || 0)} SDG`}
                        icon={TrendingUp}
                        color="success"
                        subtext={`${counts.completedSessions || 0} حصة مكتملة`}
                    />
                    <StatsCard
                        title="الرصيد المتاح"
                        value={`${Math.round(Number(walletBalance) || 0)} SDG`}
                        icon={Wallet}
                        color="success"
                        subtext="قابل للسحب"
                    />
                </div>

                {/* Upcoming Session - Clean Design */}
                {upcomingSession ? (
                    <Card className="overflow-hidden">
                        <CardContent className="p-6">
                            {/* Header with Clock Icon and Date/Time */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-semibold">الحصة القادمة</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span>{sessionDateLabel}</span>
                                    <span className="mx-2">•</span>
                                    <span>{sessionTimeLabel}</span>
                                </div>
                            </div>

                            {/* Student Info and Join Button */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        fallback={upcomingSession.studentName?.[0] || 'ط'}
                                        size="lg"
                                    />
                                    <div>
                                        <div className="font-bold text-lg text-gray-900">
                                            {upcomingSession.studentName || 'طالب'}
                                        </div>
                                        <div className="text-gray-600">
                                            {upcomingSession.subject?.nameAr || 'مادة دراسية'}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    className="w-full sm:w-auto bg-primary-700 hover:bg-primary-800"
                                    disabled={!upcomingSession.meetingLink}
                                    onClick={() => {
                                        if (upcomingSession.meetingLink) {
                                            window.open(upcomingSession.meetingLink, '_blank');
                                        }
                                    }}
                                    title={!upcomingSession.meetingLink ? 'يجب إضافة رابط الاجتماع في الإعدادات أولاً' : ''}
                                >
                                    انضم للدرس الآن
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                </Button>
                            </div>
                            {!upcomingSession.meetingLink && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2 mb-3">
                                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div className="text-sm text-amber-800 flex-1">
                                            <strong>تنبيه:</strong> لم تقم بإضافة رابط الاجتماع بعد.
                                        </div>
                                    </div>

                                    {!showMeetingLinkInput ? (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setShowMeetingLinkInput(true)}
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                إضافة الرابط الآن
                                            </Button>
                                            <Link href="/teacher/settings">
                                                <Button size="sm" variant="outline" className="border-amber-300">
                                                    الذهاب للإعدادات
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                رابط الاجتماع (Google Meet, Zoom, Teams)
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="url"
                                                    placeholder="https://meet.google.com/abc-defg-hij"
                                                    value={meetingLinkInput}
                                                    onChange={(e) => setMeetingLinkInput(e.target.value)}
                                                    className="flex-1 text-sm"
                                                    dir="ltr"
                                                    disabled={savingMeetingLink}
                                                />
                                                <Button
                                                    onClick={handleSaveMeetingLink}
                                                    disabled={savingMeetingLink || !meetingLinkInput.trim()}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {savingMeetingLink ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 animate-spin ml-1" />
                                                            حفظ...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-3 h-3 ml-1" />
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
                                                    size="sm"
                                                    disabled={savingMeetingLink}
                                                >
                                                    إلغاء
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed border-2">
                        <CardContent className="p-8 text-center">
                            <div className="text-gray-400 mb-3">
                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            </div>
                            <p className="text-gray-600 mb-3">لا توجد حصص مجدولة قادمة</p>
                            <Link href="/teacher/availability">
                                <Button variant="outline" size="sm">تحديث جدول المواعيد</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity - Clean Design */}
                {recentSessions && recentSessions.length > 0 && (
                    <Card>
                        <CardHeader className="border-b bg-gray-50">
                            <CardTitle className="text-base font-semibold text-gray-800">
                                📋 آخر النشاطات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {recentSessions.map((session: any) => (
                                    <div key={session.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Avatar
                                                fallback={session.studentName?.[0] || 'ط'}
                                                size="md"
                                                className="flex-shrink-0"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">{session.studentName}</div>
                                                <div className="text-sm text-gray-600">{session.subjectName}</div>
                                            </div>
                                        </div>
                                        <div className="text-left shrink-0">
                                            <div className="font-bold text-success-600 mb-1">
                                                SDG {Math.round(session.earnings || 0)}+
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(session.startTime), 'd MMM', { locale: ar })}
                                            </div>
                                            {session.rating && (
                                                <div className="flex items-center justify-end gap-1 text-xs text-yellow-600 mt-1">
                                                    <span>⭐</span>
                                                    <span>{session.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 border-t justify-center py-3">
                            <Link href="/teacher/sessions" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                <span>عرض جميع الحصص</span>
                                <span>←</span>
                            </Link>
                        </CardFooter>
                    </Card>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <Link href="/teacher/wallet" className="block p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md text-center transition-all">
                        <span className="text-3xl block mb-2">💰</span>
                        <div className="text-sm font-medium text-gray-700">محفظتي</div>
                    </Link>
                    <Link href="/teacher/requests" className="block p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md text-center transition-all">
                        <span className="text-3xl block mb-2">📩</span>
                        <div className="text-sm font-medium text-gray-700">الطلبات</div>
                    </Link>
                    <Link href="/teacher/packages" className="block p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md text-center transition-all">
                        <span className="text-3xl block mb-2">📦</span>
                        <div className="text-sm font-medium text-gray-700">باقاتي</div>
                    </Link>
                    <Link href="/teacher/sessions" className="block p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md text-center transition-all">
                        <span className="text-3xl block mb-2">📅</span>
                        <div className="text-sm font-medium text-gray-700">حصصي</div>
                    </Link>
                    <Link href="/teacher/profile-hub" className="block p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md text-center transition-all">
                        <span className="text-3xl block mb-2">👤</span>
                        <div className="text-sm font-medium text-gray-700">ملفي</div>
                    </Link>
                    {/* View Public Profile - Vibrant Blue Card */}
                    {profile.id && (
                        <Link
                            href={`/teachers/${profile.slug || profile.id}`}
                            target="_blank"
                            className="block p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg text-center transition-all"
                        >
                            <span className="text-3xl block mb-2">👁️</span>
                            <div className="text-sm font-medium">صفحتي</div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, subtext }: {
    title: string;
    value: string | number;
    icon: any;
    color: 'primary' | 'warning' | 'success';
    subtext: string;
}) {
    const colorClasses = {
        primary: {
            border: 'border-l-primary-600',
            bg: 'bg-primary-50',
            text: 'text-primary-600',
        },
        warning: {
            border: 'border-l-warning-600',
            bg: 'bg-warning-50',
            text: 'text-warning-600',
        },
        success: {
            border: 'border-l-success-600',
            bg: 'bg-success-50',
            text: 'text-success-600',
        },
    };

    const colors = colorClasses[color];

    return (
        <Card hover="lift" className={`relative border-l-4 ${colors.border}`}>
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
                    </div>
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                </div>
                <p className="text-xs text-gray-500">{subtext}</p>
            </CardContent>
        </Card>
    );
}
