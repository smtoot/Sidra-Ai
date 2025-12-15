'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Users, Calendar, Wallet, TrendingUp, UserPlus, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await adminApi.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">جاري تحميل البيانات...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">فشل تحميل البيانات</div>;

    const { counts, financials, recentUsers } = stats;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">لوحة التحكم</h1>
                    <p className="text-text-subtle">نظرة عامة على أداء المنصة</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="إجمالي المستخدمين"
                        value={counts.users}
                        icon={Users}
                        color="bg-blue-500"
                        subtext={`${counts.teachers} معلم | ${counts.students} طالب`}
                    />
                    <StatsCard
                        title="الحجوزات"
                        value={counts.bookings}
                        icon={Calendar}
                        color="bg-purple-500"
                        subtext={`${counts.pendingBookings} قيد الانتظار`}
                    />
                    <StatsCard
                        title="حجم المعاملات"
                        value={`${financials.totalVolume} د.ك`}
                        icon={Wallet}
                        color="bg-green-500"
                        subtext="إجمالي الإيداعات"
                    />
                    <StatsCard
                        title="النمو"
                        value="+12%"
                        icon={TrendingUp}
                        color="bg-orange-500"
                        subtext="مقارنة بالشهر الماضي"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Users */}
                    <div className="lg:col-span-2 bg-surface rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">آخر المنضمين</h3>
                            <Link href="/admin/users" className="text-primary text-sm hover:underline">عرض الكل</Link>
                        </div>
                        <div className="space-y-4">
                            {recentUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <UserPlus className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold">{user.teacherProfile?.displayName || user.email.split('@')[0]}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                        user.role === 'PARENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-surface rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-xl font-bold mb-6">إجراءات سريعة</h3>
                        <div className="space-y-4">
                            <Link href="/admin/teachers" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold">طلبات المعلمين</div>
                                    <div className="text-xs text-gray-500">مراجعة الطلبات المعلقة</div>
                                </div>
                            </Link>
                            <Link href="/admin/financials" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold">الإدارة المالية</div>
                                    <div className="text-xs text-gray-500">مراجعة الإيداعات والسحوبات</div>
                                </div>
                            </Link>
                            <Link href="/admin/content" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold">إدارة المحتوى</div>
                                    <div className="text-xs text-gray-500">إضافة مناهج ومواد</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, subtext }: any) {
    return (
        <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
