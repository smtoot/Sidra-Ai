'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, ChevronRight, Wallet, Clock } from 'lucide-react';
import Link from 'next/link';
import { format, differenceInMinutes, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ActiveSessionCard } from '@/components/dashboard/ActiveSessionCard';
import { DashboardHeader } from './components/DashboardHeader';
import { EmptyStateGuided } from './components/EmptyStateGuided';
import { QuickActions } from './components/QuickActions';
import { StickyBookingCTA } from './components/StickyBookingCTA';

export default function StudentDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await studentApi.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-96">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-7xl mx-auto">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-12 text-center text-red-700">
                            فشل تحميل البيانات
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const {
        balance,
        upcomingClasses,
        totalClasses,
        completedClassesCount,
        totalHoursLearned,
        suggestedTeachers,
        activeSession,
    } = stats;
    const hasUpcoming = upcomingClasses && upcomingClasses.length > 0;
    const nextClass = hasUpcoming ? upcomingClasses[0] : null;

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 lg:pb-8 space-y-5 md:space-y-8">
                {/* 1️⃣ Header (Simplified) */}
                <DashboardHeader />

                {/* MOBILE-FIRST LAYOUT */}
                <div className="lg:hidden space-y-3">
                    {/* 2️⃣ HERO SECTION - Highest Priority for new users */}
                    {!hasUpcoming && !activeSession && (
                        <EmptyStateGuided suggestedTeachers={suggestedTeachers} />
                    )}

                    {/* 3️⃣ ACTIVE SESSION CARD (Highest Mobile Priority) */}
                    {activeSession && (
                        <ActiveSessionCard
                            session={activeSession}
                            userRole="STUDENT"
                        />
                    )}

                    {/* 4️⃣ Next Session Card (Contextual) */}
                    {hasUpcoming && nextClass && (
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="border-b bg-white px-3 py-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-gray-700">
                                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                                    الحصة القادمة
                                </CardTitle>
                                <Link href="/student/bookings" className="text-[10px] text-gray-500 hover:text-primary-600 font-medium">
                                    عرض الكل
                                </Link>
                            </CardHeader>
                            <CardContent className="p-2.5">
                                <div className="flex items-center gap-2.5">
                                    <Avatar
                                        src={nextClass.teacherProfile?.user?.photoUrl}
                                        fallback={nextClass.teacherProfile?.user?.displayName?.[0] || 'م'}
                                        className="w-9 h-9 ring-2 ring-gray-100 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 text-sm truncate">
                                            {nextClass.teacherProfile?.user?.displayName || 'المعلم'}
                                        </div>
                                        <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <span>{nextClass.subject?.nameAr}</span>
                                            <span className="text-gray-300">•</span>
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>
                                                {isToday(new Date(nextClass.startTime)) ? 'اليوم' :
                                                    isTomorrow(new Date(nextClass.startTime)) ? 'غداً' :
                                                        format(new Date(nextClass.startTime), 'd MMM', { locale: ar })}
                                                {' '}
                                                {format(new Date(nextClass.startTime), 'h:mm a', { locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={`/student/bookings/${nextClass.id}`}>
                                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2">
                                            التفاصيل
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 5️⃣ Quick Actions (Moved Up) */}
                    <QuickActions />

                    {/* 6️⃣ Wallet (De-emphasized) + 7️⃣ Stats Summary (Compact) */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Wallet - Compact */}
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-2.5">
                                <div className="flex items-center gap-1.5 text-emerald-600 mb-1.5">
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-medium">المحفظة</span>
                                </div>
                                <div className="text-base font-bold text-gray-900 mb-1" style={{ direction: 'ltr' }}>
                                    {balance.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">SDG</span>
                                </div>
                                <Link href="/student/wallet">
                                    <Button size="sm" variant="ghost" className="w-full h-6 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-0">
                                        شحن
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Stats - Compact */}
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-2.5">
                                <div className="flex items-center gap-1.5 text-blue-600 mb-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-medium">الحصص</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-500">مكتملة</span>
                                        <span className="font-bold text-gray-900">{completedClassesCount ?? totalClasses}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-500">ساعات</span>
                                        <span className="font-bold text-gray-900" dir="ltr">{totalHoursLearned || 0}h</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Show more upcoming sessions if available */}
                    {upcomingClasses && upcomingClasses.length > 1 && (
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="border-b bg-white px-4 py-2.5">
                                <CardTitle className="text-sm font-bold text-gray-700">
                                    حصص أخرى قادمة ({upcomingClasses.length - 1})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50">
                                    {upcomingClasses.slice(1, 4).map((booking: any) => (
                                        <Link key={booking.id} href={`/student/bookings/${booking.id}`} className="block">
                                            <div className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={booking.teacherProfile?.user?.photoUrl}
                                                        fallback={booking.teacherProfile?.user?.displayName?.[0] || 'م'}
                                                        className="w-8 h-8"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{booking.subject?.nameAr}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(booking.startTime), 'd MMM • h:mm a', { locale: ar })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* DESKTOP LAYOUT - Preserve existing structure */}
                <div className="hidden lg:block">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Left Column: Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Desktop Active Session */}
                            {activeSession && (
                                <ActiveSessionCard
                                    session={activeSession}
                                    userRole="STUDENT"
                                />
                            )}

                            {hasUpcoming ? (
                                <Card className="border-none shadow-md overflow-hidden">
                                    <CardHeader className="border-b bg-white px-4 md:px-6 py-3 md:py-4 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                                            <Calendar className="w-4 md:w-5 h-4 md:h-5 text-primary-600" />
                                            جميع الحصص القادمة
                                        </CardTitle>
                                        <Link href="/student/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                            <span>عرض الكل</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-gray-100">
                                            {upcomingClasses.slice(0, 5).map((booking: any) => (
                                                <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <Avatar
                                                                src={booking.teacherProfile?.user?.photoUrl}
                                                                fallback={booking.teacherProfile?.user?.displayName?.[0] || 'م'}
                                                                className="w-12 h-12 ring-2 ring-gray-100"
                                                            />
                                                            <div>
                                                                <div className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                                                                    {booking.teacherProfile?.user?.displayName || 'المعلم'}
                                                                </div>
                                                                <div className="text-sm text-gray-500 mb-1">
                                                                    {booking.subject?.nameAr}
                                                                </div>
                                                                <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {booking.startTime && format(new Date(booking.startTime), 'd MMMM • h:mm a', { locale: ar })}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                                            {booking.status === 'SCHEDULED' ? (
                                                                (() => {
                                                                    const isJoinable = differenceInMinutes(new Date(booking.startTime), new Date()) <= 30;
                                                                    return (
                                                                        <Link href={`/student/bookings/${booking.id}`} className="w-full sm:w-auto">
                                                                            <Button
                                                                                size="sm"
                                                                                variant={isJoinable ? "default" : "outline"}
                                                                                className="w-full sm:w-auto gap-2 shadow-sm"
                                                                            >
                                                                                {isJoinable ? <ExternalLink className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 rotate-180" />}
                                                                                {isJoinable ? 'دخول' : 'التفاصيل'}
                                                                            </Button>
                                                                        </Link>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className={`
                                                                    text-xs px-3 py-1.5 rounded-full font-bold
                                                                    ${booking.status === 'PENDING_TEACHER_APPROVAL'
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-gray-100 text-gray-700'}
                                                                `}>
                                                                    {booking.status === 'PENDING_TEACHER_APPROVAL' ? 'بانتظار الموافقة' : booking.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <EmptyStateGuided suggestedTeachers={suggestedTeachers} />
                            )}
                        </div>

                        {/* Right Column: Sidebar */}
                        <div className="space-y-6">
                            <QuickActions />

                            {/* Desktop Wallet Card */}
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-emerald-600 mb-3">
                                        <Wallet className="w-4 h-4" />
                                        <span className="text-sm font-medium">رصيد المحفظة</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-3" style={{ direction: 'ltr' }}>
                                        {balance.toLocaleString()} <span className="text-sm text-gray-500 font-normal">SDG</span>
                                    </div>
                                    <Link href="/student/wallet">
                                        <Button size="sm" variant="outline" className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                                            شحن المحفظة
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3️⃣ Primary CTA (Sticky) - Mobile Only */}
            <StickyBookingCTA />
        </div>
    );
}
