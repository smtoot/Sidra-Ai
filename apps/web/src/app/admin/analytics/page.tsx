'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    TrendingUp, TrendingDown, DollarSign, Users, Calendar, BookOpen,
    ArrowUpRight, ArrowDownRight, Loader2, BarChart3, PieChart, Download
} from 'lucide-react';

interface FinancialStats {
    totalRevenue: number;
    platformFees: number;
    completedBookings: number;
    averageBookingValue: number;
    revenueGrowth?: number;
    bookingsGrowth?: number;
}

interface DashboardStats {
    counts: {
        users: number;
        teachers: number;
        students: number;
        bookings: number;
        pendingBookings: number;
        pendingDisputes: number;
    };
    financials: {
        totalVolume: number;
    };
}

export default function AdminAnalyticsPage() {
    const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [financial, dashboard] = await Promise.all([
                adminApi.getFinancialAnalytics(),
                adminApi.getDashboardStats()
            ]);
            setFinancialStats(financial);
            setDashboardStats(dashboard);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = () => {
        if (!financialStats || !dashboardStats) return;

        const report = {
            generatedAt: new Date().toISOString(),
            period: 'Last 30 days',
            financial: financialStats,
            operational: dashboardStats.counts,
            volume: dashboardStats.financials
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sidra-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background font-sans rtl p-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            التحليلات والتقارير
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">نظرة شاملة على أداء المنصة</p>
                    </div>
                    <Button onClick={exportReport} className="gap-2">
                        <Download className="w-4 h-4" />
                        تصدير التقرير
                    </Button>
                </header>

                {/* Financial Overview */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                الأداء المالي
                            </CardTitle>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">آخر 30 يوم</span>
                        </div>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-green-700">إجمالي الإيرادات</span>
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-800 font-mono">
                                    {financialStats?.totalRevenue.toLocaleString() || 0} SDG
                                </div>
                                {financialStats?.revenueGrowth !== undefined && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${financialStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {financialStats.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                        {Math.abs(financialStats.revenueGrowth).toFixed(1)}% عن الشهر السابق
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-blue-700">عمولة المنصة</span>
                                    <PieChart className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-blue-800 font-mono">
                                    {financialStats?.platformFees.toLocaleString() || 0} SDG
                                </div>
                                <div className="text-sm text-blue-600 mt-2">
                                    {financialStats && financialStats.totalRevenue > 0
                                        ? ((financialStats.platformFees / financialStats.totalRevenue) * 100).toFixed(1)
                                        : '0'}% من الإيرادات
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-purple-700">الحصص المكتملة</span>
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold text-purple-800 font-mono">
                                    {financialStats?.completedBookings.toLocaleString() || 0}
                                </div>
                                {financialStats?.bookingsGrowth !== undefined && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${financialStats.bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {financialStats.bookingsGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                        {Math.abs(financialStats.bookingsGrowth).toFixed(1)}% عن الشهر السابق
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-orange-700">متوسط قيمة الحصة</span>
                                    <DollarSign className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="text-2xl font-bold text-orange-800 font-mono">
                                    {financialStats?.averageBookingValue.toLocaleString() || 0} SDG
                                </div>
                                <div className="text-sm text-orange-600 mt-2">
                                    لكل حصة مكتملة
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Operational Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                إحصائيات المستخدمين
                            </CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">إجمالي المستخدمين</span>
                                <span className="text-xl font-bold font-mono">{dashboardStats?.counts.users.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-700">المعلمون</span>
                                <span className="text-xl font-bold font-mono text-blue-800">{dashboardStats?.counts.teachers.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-green-700">الطلاب / أولياء الأمور</span>
                                <span className="text-xl font-bold font-mono text-green-800">{dashboardStats?.counts.students.toLocaleString() || 0}</span>
                            </div>

                            {dashboardStats && dashboardStats.counts.users > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 mb-2">توزيع المستخدمين</div>
                                    <div className="flex h-4 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-500"
                                            style={{ width: `${(dashboardStats.counts.teachers / dashboardStats.counts.users) * 100}%` }}
                                            title={`معلمون: ${dashboardStats.counts.teachers}`}
                                        />
                                        <div
                                            className="bg-green-500"
                                            style={{ width: `${(dashboardStats.counts.students / dashboardStats.counts.users) * 100}%` }}
                                            title={`طلاب: ${dashboardStats.counts.students}`}
                                        />
                                        <div
                                            className="bg-gray-300"
                                            style={{ width: `${((dashboardStats.counts.users - dashboardStats.counts.teachers - dashboardStats.counts.students) / dashboardStats.counts.users) * 100}%` }}
                                            title="آخرون"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>معلمون ({((dashboardStats.counts.teachers / dashboardStats.counts.users) * 100).toFixed(0)}%)</span>
                                        <span>طلاب ({((dashboardStats.counts.students / dashboardStats.counts.users) * 100).toFixed(0)}%)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Booking & Operations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                الحجوزات والعمليات
                            </CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">إجمالي الحجوزات</span>
                                <span className="text-xl font-bold font-mono">{dashboardStats?.counts.bookings.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                                <span className="text-warning-700">حجوزات قيد الانتظار</span>
                                <span className="text-xl font-bold font-mono text-warning-800">{dashboardStats?.counts.pendingBookings.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                                <span className="text-error-700">شكاوى معلقة</span>
                                <span className="text-xl font-bold font-mono text-error-800">{dashboardStats?.counts.pendingDisputes.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                                <span className="text-primary-700">حجم التداول الإجمالي</span>
                                <span className="text-xl font-bold font-mono text-primary-800">{dashboardStats?.financials.totalVolume.toLocaleString() || 0} SDG</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Key Metrics Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>ملخص المؤشرات الرئيسية</CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 border rounded-lg">
                                <div className="text-3xl font-bold font-mono text-gray-900">
                                    {financialStats && financialStats.completedBookings > 0
                                        ? (financialStats.totalRevenue / financialStats.completedBookings).toFixed(0)
                                        : '0'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">متوسط الإيراد/حصة</div>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="text-3xl font-bold font-mono text-gray-900">
                                    {dashboardStats && dashboardStats.counts.teachers > 0
                                        ? (dashboardStats.counts.bookings / dashboardStats.counts.teachers).toFixed(1)
                                        : '0'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">حجوزات/معلم</div>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="text-3xl font-bold font-mono text-gray-900">
                                    {dashboardStats && dashboardStats.counts.students > 0
                                        ? (dashboardStats.counts.bookings / dashboardStats.counts.students).toFixed(1)
                                        : '0'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">حجوزات/طالب</div>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="text-3xl font-bold font-mono text-gray-900">
                                    {financialStats
                                        ? (financialStats.totalRevenue - financialStats.platformFees).toLocaleString()
                                        : '0'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">إيرادات المعلمين (SDG)</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
