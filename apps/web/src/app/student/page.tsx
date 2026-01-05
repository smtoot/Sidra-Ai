'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DashboardHeader } from './components/DashboardHeader';
import { StatsGrid } from './components/StatsGrid';
import { EmptyStateGuided } from './components/EmptyStateGuided';
import { QuickActions } from './components/QuickActions';

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
        suggestedTeachers
    } = stats;
    const hasUpcoming = upcomingClasses && upcomingClasses.length > 0;

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
                {/* Header */}
                <DashboardHeader />

                {/* Priority Stats Grid */}
                <StatsGrid
                    balance={balance}
                    upcomingClasses={upcomingClasses}
                    totalClasses={totalClasses}
                    completedClassesCount={completedClassesCount}
                    totalHoursLearned={totalHoursLearned}
                />

                {/* Quick Actions - Show on mobile first */}
                <div className="lg:hidden">
                    <QuickActions />
                </div>

                {/* Main Content & Sidebar Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
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

                    {/* Right Column: Quick Actions - Hidden on mobile (shown above) */}
                    <div className="hidden lg:block space-y-6">
                        <QuickActions />
                    </div>
                </div>
            </div>
        </div>
    );
}
