'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api/student';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, Search, User, ExternalLink, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function StudentDashboardPage() {
    const { user } = useAuth();
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
            <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-5xl mx-auto">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                            <p className="text-gray-500">جاري تحميل البيانات...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-5xl mx-auto">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-12 text-center text-red-700">
                            فشل تحميل البيانات
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const { balance, upcomingClasses, totalClasses } = stats;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Welcome Header */}
                <header>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">مرحباً، {user?.firstName || 'طالب'} 🎓</h1>
                    <p className="text-sm md:text-base text-gray-600">تابع دروسك وتقدمك الدراسي</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Wallet Card */}
                    <Card className="border-l-4 border-l-primary-600">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">رصيد المحفظة</p>
                                    <p className="text-3xl font-bold text-gray-900">{balance} SDG</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Classes */}
                    <Card className="border-l-4 border-l-success-600">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-success-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">إجمالي الحصص</p>
                                    <p className="text-3xl font-bold text-gray-900">{totalClasses || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Action Card */}
                    <Card className="border-l-4 border-l-blue-600">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Search className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">احجز حصة جديدة</h2>
                                    <p className="text-sm text-gray-600">تصفح المعلمين واحجز الآن</p>
                                </div>
                            </div>
                            <Link href="/search">
                                <Button className="w-full">
                                    تصفح المعلمين
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Classes */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        الدروس القادمة
                    </h2>
                    {upcomingClasses && upcomingClasses.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingClasses.map((booking: any) => (
                                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <Avatar
                                                    src={booking.teacherProfile?.user?.photoUrl}
                                                    fallback={booking.teacherProfile?.user?.displayName?.[0] || 'م'}
                                                    size="md"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {booking.teacherProfile?.user?.displayName || 'المعلم'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {booking.subject?.nameAr} • {new Date(booking.startTime || booking.createdAt).toLocaleDateString('ar-SA')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(booking.startTime || booking.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {booking.status === 'SCHEDULED' ? (
                                                    <Button size="sm" className="gap-2">
                                                        دخول
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs px-3 py-1.5 bg-warning-100 text-warning-700 rounded-lg font-medium">
                                                        {booking.status === 'PENDING_TEACHER_APPROVAL' ? 'بانتظار الموافقة' : booking.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 mb-4">لا توجد دروس قادمة</p>
                                <Link href="/search">
                                    <Button variant="outline">تصفح المعلمين</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
