'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api/student';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, Search, User, ExternalLink, BookOpen } from 'lucide-react';
import Link from 'next/link';

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

    if (loading) return <div className="p-8 text-center text-gray-500">جاري تحميل البيانات...</div>;
    // Handle error gracefully or show empty state if stats is null
    if (!stats) return <div className="p-8 text-center text-red-500">فشل تحميل البيانات</div>;

    const { balance, upcomingClasses, totalClasses } = stats;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">لوحة الطالب 🎓</h1>
                        <p className="text-text-subtle">تابع دروسك وتقدمك الدراسي</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Wallet Card */}
                    <div className="md:col-span-1 bg-surface p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-text-subtle text-sm font-medium mb-1">رصيد المحفظة</h3>
                                <div className="text-3xl font-bold text-gray-900">{balance} د.ك</div>
                            </div>
                            <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                        {/* Students might verify via parents usually, but can view wallet */}
                        {/* <Link href="/student/wallet">
                            <Button variant="outline" size="sm" className="w-full">تفاصيل المحفظة</Button>
                        </Link> */}
                    </div>

                    {/* Stats Card */}
                    <div className="md:col-span-1 bg-surface p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-text-subtle text-sm font-medium mb-1">إجمالي الحصص</h3>
                                <div className="text-3xl font-bold text-gray-900">{totalClasses || 0}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                <BookOpen className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="md:col-span-1 bg-gradient-to-l from-primary to-blue-600 rounded-xl p-6 text-white flex flex-col justify-between shadow-lg">
                        <div>
                            <h2 className="text-xl font-bold mb-2">احجز حصة جديدة</h2>
                            <p className="opacity-90 mb-4 text-sm">تصفح المعلمين واحجز الآن.</p>
                        </div>
                        <Link href="/search">
                            <Button variant="secondary" className="w-full gap-2">
                                تصفح المعلمين
                                <Search className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Upcoming Classes */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        الدروس القادمة
                    </h2>
                    <div className="space-y-4">
                        {upcomingClasses && upcomingClasses.length > 0 ? (
                            upcomingClasses.map((booking: any) => (
                                <div key={booking.id} className="bg-surface rounded-xl border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold">{booking.teacherProfile?.user?.displayName || 'المعلم'}</div>
                                            <div className="text-sm text-text-subtle">{booking.subject?.nameAr} • {new Date(booking.createdAt).toLocaleDateString('ar-KW')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-1 bg-gray-50 rounded-lg">
                                            <Clock className="w-4 h-4" />
                                            {new Date(booking.createdAt).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {booking.status === 'SCHEDULED' ? (
                                            <Button size="sm" className="gap-2">
                                                دخول
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        ) : (
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">
                                                {booking.status === 'PENDING_TEACHER_APPROVAL' ? 'بانتظار الموافقة' : booking.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-text-subtle mb-4">لا توجد دروس قادمة.</p>
                                <Link href="/search">
                                    <Button variant="outline">تصفح المعلمين</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
