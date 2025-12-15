'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, User, ExternalLink, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const data = await teacherApi.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">جاري تحميل البيانات...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">فشل تحميل البيانات</div>;

    const { profile, counts, upcomingSession, walletBalance } = stats;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">مرحباً، {profile.displayName || 'أستاذ'} 👋</h1>
                        <p className="text-text-subtle">إليك ملخص نشاطك اليوم</p>
                    </div>
                    {/* Optional: Status Toggle (Online/Offline) could go here */}
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="حصص اليوم"
                        value={counts.todaySessions}
                        icon={Calendar}
                        color="bg-blue-500"
                        subtext="جلسات مجدولة"
                    />
                    <StatsCard
                        title="طلبات جديدة"
                        value={counts.pendingRequests}
                        icon={MessageCircle}
                        color="bg-yellow-500"
                        subtext="بانتظار الموافقة"
                    />
                    <StatsCard
                        title="الرصيد الحالي"
                        value={`${walletBalance} د.ك`}
                        icon={DollarSign}
                        color="bg-green-500"
                        subtext="أرباح قابلة للسحب"
                    />
                </div>

                {/* Upcoming Session */}
                {upcomingSession ? (
                    <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-center">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                الحصة القادمة
                            </h3>
                            <span className="text-sm font-medium text-primary">
                                {new Date(upcomingSession.startTime || upcomingSession.createdAt).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">{upcomingSession.student?.name || 'طالب'}</div>
                                    <div className="text-text-subtle">{upcomingSession.subject?.nameAr || 'مادة دراسية'}</div>
                                </div>
                            </div>
                            <Button className="w-full md:w-auto gap-2">
                                انضم للدرس الآن
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl border border-dashed border-gray-200 p-8 text-center">
                        <p className="text-text-subtle">لا توجد حصص مجدولة قادمة.</p>
                        <Link href="/teacher/availability">
                            <Button variant="link">تحديث جدول المواعيد</Button>
                        </Link>
                    </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/teacher/requests" className="block p-4 bg-white border rounded-lg hover:bg-gray-50 text-center font-medium">
                        عرض جميع الطلبات
                    </Link>
                    <Link href="/teacher/wallet" className="block p-4 bg-white border rounded-lg hover:bg-gray-50 text-center font-medium">
                        محفظتي
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, subtext }: any) {
    return (
        <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-text-subtle text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold text-gray-900">{value}</div>
                </div>
                <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
                    <Icon className={`w-6 h-6 text-${color.replace('bg-', '')}`} />
                </div>
            </div>
            {subtext && <div className="text-xs text-gray-400">{subtext}</div>}
        </div>
    );
}
