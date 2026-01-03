'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ExternalLink, MessageCircle, Wallet, TrendingUp, AlertCircle, Bell, Video, Users, ArrowUpRight, ChevronRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { ApplicationStatusBanner } from '@/components/teacher/ApplicationStatusBanner';
import { VacationBanner } from '@/components/teacher/VacationBanner';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import { getFileUrl } from '@/lib/api/upload';
import { format, isToday, isTomorrow, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';


export default function TeacherDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">جاري تحميل لوحة التحكم...</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!stats) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-12 text-center text-red-700">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                        <p>فشل تحميل البيانات</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

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

    // Generate week timeline for upcoming sessions
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 6 }); // Saturday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans" dir="rtl">
                {/* Application Status Banner */}
                <ApplicationStatusBanner />

                {/* Vacation Mode Banner */}
                <VacationBanner
                    isOnVacation={profile?.isOnVacation ?? false}
                    vacationEndDate={profile?.vacationEndDate ?? null}
                />
                <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                    {/* Header Section - Modern & Clean */}
                    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-2">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={profile.photo ? getFileUrl(profile.photo) : undefined}
                                fallback={profile.displayName || 'م'}
                                size="xl"
                                className="ring-4 ring-white shadow-lg"
                            />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                                    مرحباً، {profile.firstName || profile.displayName || 'أستاذ'}
                                </h1>
                                <p className="text-gray-600 flex items-center gap-2">
                                    <span>لوحة التحكم</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm">{format(new Date(), 'EEEE، d MMMM', { locale: ar })}</span>
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions Bar - Desktop */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link href="/teacher/profile-hub">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Users className="w-4 h-4" />
                                    الملف الشخصي
                                </Button>
                            </Link>
                            <Link href="/teacher/sessions">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Calendar className="w-4 h-4" />
                                    الحصص
                                </Button>
                            </Link>
                        </div>
                    </header>

                    {/* Stats Overview - Enhanced Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="حصص اليوم"
                            value={counts.todaySessions}
                            icon={Calendar}
                            gradient="from-blue-500 to-blue-600"
                            subtext="حصص مجدولة"
                        />
                        <StatCard
                            title="طلبات جديدة"
                            value={counts.pendingRequests}
                            icon={Bell}
                            gradient="from-amber-500 to-orange-600"
                            subtext="بانتظار الرد"
                            href="/teacher/requests"
                        />
                        <StatCard
                            title="إجمالي الأرباح"
                            value={`${Math.round(counts.totalEarnings || 0)}`}
                            icon={TrendingUp}
                            gradient="from-emerald-500 to-green-600"
                            subtext="جنيه سوداني"
                            suffix="SDG"
                        />
                        <StatCard
                            title="الرصيد المتاح"
                            value={`${Math.round(Number(walletBalance) || 0)}`}
                            icon={Wallet}
                            gradient="from-purple-500 to-purple-600"
                            subtext="قابل للسحب"
                            suffix="SDG"
                            href="/teacher/wallet"
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Next Session Highlight */}
                            {upcomingSession ? (
                                <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700">
                                    <CardContent className="p-6 text-white">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 opacity-90">
                                                    <PlayCircle className="w-5 h-5" />
                                                    <span className="text-sm font-medium">الحصة القادمة</span>
                                                </div>
                                                <h2 className="text-2xl font-bold mb-1">
                                                    {upcomingSession.subject?.nameAr || 'مادة دراسية'}
                                                </h2>
                                                <div className="flex items-center gap-2 text-primary-100">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-sm">{sessionDateLabel} • {sessionTimeLabel}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                                <span className="text-xs font-medium">قريباً</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/20">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={upcomingSession.studentName?.[0] || 'ط'}
                                                    size="md"
                                                    className="ring-2 ring-white/50"
                                                />
                                                <div>
                                                    <div className="font-semibold">
                                                        {upcomingSession.studentName || 'طالب'}
                                                    </div>
                                                    <div className="text-xs text-primary-100">الطالب</div>
                                                </div>
                                            </div>
                                            <Button
                                                size="lg"
                                                className="w-full sm:w-auto bg-white text-primary-600 hover:bg-primary-50 shadow-lg"
                                                disabled={!upcomingSession.meetingLink}
                                                onClick={() => {
                                                    if (upcomingSession.meetingLink) {
                                                        window.open(upcomingSession.meetingLink, '_blank');
                                                    }
                                                }}
                                            >
                                                <Video className="w-4 h-4 ml-2" />
                                                انضم للدرس
                                            </Button>
                                        </div>

                                        {!upcomingSession.meetingLink && (
                                            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                                                <div className="flex items-start gap-2 text-sm">
                                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <div>
                                                        <strong>تنبيه:</strong> لم تقم بإضافة رابط الاجتماع.
                                                        <Link href="/teacher/sessions" className="underline font-semibold mr-1">
                                                            إضافة الآن
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-2 border-dashed border-gray-200">
                                    <CardContent className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-2">لا توجد حصص قادمة</h3>
                                        <p className="text-gray-500 text-sm mb-4">تحقق من جدولك أو قم بتحديث المواعيد المتاحة</p>
                                        <Link href="/teacher/availability">
                                            <Button variant="outline">تحديث الجدول</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Week Timeline */}
                            <Card className="border-none shadow-md">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary-600" />
                                        جدول الأسبوع
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                        {weekDays.map((day, index) => {
                                            const isCurrentDay = isToday(day);
                                            const hasSession = upcomingSession && isSameDay(new Date(upcomingSession.startTime), day);

                                            return (
                                                <div
                                                    key={index}
                                                    className={`
                                                    p-2 sm:p-3 rounded-lg text-center transition-all
                                                    ${isCurrentDay ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-50'}
                                                    ${hasSession && !isCurrentDay ? 'ring-2 ring-primary-300' : ''}
                                                `}
                                                >
                                                    <div className={`text-[10px] sm:text-xs font-medium mb-1 ${isCurrentDay ? 'text-primary-100' : 'text-gray-500'}`}>
                                                        {format(day, 'EEE', { locale: ar })}
                                                    </div>
                                                    <div className={`text-sm sm:text-lg font-bold ${isCurrentDay ? 'text-white' : 'text-gray-900'}`}>
                                                        {format(day, 'd')}
                                                    </div>
                                                    {hasSession && (
                                                        <div className={`mt-1 w-2 h-2 rounded-full mx-auto ${isCurrentDay ? 'bg-white' : 'bg-primary-500'}`}></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            {recentSessions && recentSessions.length > 0 && (
                                <Card className="border-none shadow-md">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-success-600" />
                                                آخر النشاطات
                                            </CardTitle>
                                            <Link href="/teacher/sessions" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                                <span>عرض الكل</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-gray-100">
                                            {recentSessions.map((session: any) => (
                                                <div key={session.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                fallback={session.studentName?.[0] || 'ط'}
                                                                size="md"
                                                            />
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{session.studentName}</div>
                                                                <div className="text-sm text-gray-500">{session.subjectName}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-success-600 mb-1 flex items-center gap-1">
                                                                <span className="text-lg">+{Math.round(session.earnings || 0)}</span>
                                                                <span className="text-xs">SDG</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {format(new Date(session.startTime), 'd MMM', { locale: ar })}
                                                            </div>
                                                            {session.rating && (
                                                                <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                                                                    <span>⭐</span>
                                                                    <span>{session.rating}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Sidebar - Quick Actions & Notifications */}
                        <div className="space-y-6">
                            {/* Quick Actions Panel */}
                            <Card className="border-none shadow-md">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2">
                                    <QuickActionButton
                                        href="/teacher/requests"
                                        icon={MessageCircle}
                                        label="الطلبات"
                                        count={counts.pendingRequests}
                                        color="amber"
                                    />
                                    <QuickActionButton
                                        href="/teacher/sessions"
                                        icon={Calendar}
                                        label="حصصي"
                                        color="blue"
                                    />
                                    <QuickActionButton
                                        href="/teacher/wallet"
                                        icon={Wallet}
                                        label="المحفظة"
                                        color="purple"
                                    />
                                    <QuickActionButton
                                        href="/teacher/packages"
                                        icon={TrendingUp}
                                        label="الباقات"
                                        color="green"
                                    />
                                    {profile.id && (
                                        <QuickActionButton
                                            href={`/teachers/${profile.slug || profile.id}`}
                                            icon={ExternalLink}
                                            label="صفحتي العامة"
                                            color="primary"
                                            external
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Notifications/Alerts */}
                            {(counts.pendingRequests > 0 || !upcomingSession?.meetingLink) && (
                                <Card className="border-none shadow-md border-l-4 border-l-amber-500">
                                    <CardHeader className="border-b bg-amber-50/50">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
                                            <Bell className="w-5 h-5" />
                                            التنبيهات
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {counts.pendingRequests > 0 && (
                                            <NotificationItem
                                                type="warning"
                                                title="طلبات جديدة"
                                                message={`لديك ${counts.pendingRequests} طلبات بانتظار الموافقة`}
                                                href="/teacher/requests"
                                            />
                                        )}
                                        {upcomingSession && !upcomingSession.meetingLink && (
                                            <NotificationItem
                                                type="warning"
                                                title="رابط الاجتماع مفقود"
                                                message="أضف رابط الاجتماع للحصة القادمة"
                                                href="/teacher/sessions"
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Performance Summary */}
                            <Card className="border-none shadow-md bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">الأداء الشهري</div>
                                            <div className="text-3xl font-bold">{counts.completedSessions || 0}</div>
                                            <div className="text-sm text-gray-400">حصة مكتملة</div>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-lg">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <Link href="/teacher/sessions" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                                            <span>عرض التفاصيل</span>
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </TeacherApprovalGuard>
    );
}

// Enhanced Stat Card Component
function StatCard({ title, value, icon: Icon, gradient, subtext, suffix, href }: {
    title: string;
    value: string | number;
    icon: any;
    gradient: string;
    subtext: string;
    suffix?: string;
    href?: string;
}) {
    const content = (
        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {href && <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />}
                </div>
                <div>
                    <div className="text-sm text-gray-600 mb-1">{title}</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold text-gray-900">{value}</div>
                        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{subtext}</div>
                </div>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

// Quick Action Button Component
function QuickActionButton({ href, icon: Icon, label, count, color, external }: {
    href: string;
    icon: any;
    label: string;
    count?: number;
    color: string;
    external?: boolean;
}) {
    const colorClasses = {
        amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
        green: 'bg-green-50 text-green-700 hover:bg-green-100',
        primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
    };

    return (
        <Link href={href} target={external ? '_blank' : undefined}>
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                </div>
                {count !== undefined && count > 0 && (
                    <div className="px-2 py-0.5 bg-white rounded-full text-xs font-bold">
                        {count}
                    </div>
                )}
                <ChevronRight className="w-4 h-4" />
            </div>
        </Link>
    );
}

// Notification Item Component
function NotificationItem({ type, title, message, href }: {
    type: 'warning' | 'info';
    title: string;
    message: string;
    href: string;
}) {
    return (
        <Link href={href}>
            <div className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm mb-0.5">{title}</div>
                        <div className="text-xs text-gray-600">{message}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                </div>
            </div>
        </Link>
    );
}
