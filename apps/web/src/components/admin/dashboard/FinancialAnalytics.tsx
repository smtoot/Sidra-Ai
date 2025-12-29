'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

interface FinancialStats {
    totalRevenue: number;
    platformFees: number;
    completedBookings: number;
    averageBookingValue: number;
    revenueGrowth?: number; // percentage
    bookingsGrowth?: number; // percentage
}

export function FinancialAnalytics() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFinancialStats();
    }, []);

    const loadFinancialStats = async () => {
        try {
            setError(null);
            const data = await adminApi.getFinancialAnalytics();
            setStats(data);
        } catch (error) {
            console.error('Failed to load financial analytics:', error);
            setError('فشل في تحميل التحليلات المالية');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-64 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button
                        onClick={loadFinancialStats}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </Card>
        );
    }

    if (!stats) return null;

    const metrics = [
        {
            label: 'إجمالي الإيرادات',
            value: `${stats.totalRevenue.toLocaleString()} SDG`,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            growth: stats.revenueGrowth,
        },
        {
            label: 'عمولة المنصة',
            value: `${stats.platformFees.toLocaleString()} SDG`,
            icon: TrendingUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            label: 'الحصص المكتملة',
            value: stats.completedBookings.toLocaleString(),
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            growth: stats.bookingsGrowth,
        },
        {
            label: 'متوسط قيمة الحصة',
            value: `${stats.averageBookingValue.toLocaleString()} SDG`,
            icon: DollarSign,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    return (
        <Card>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">التحليلات المالية</h3>
                    <span className="text-xs text-gray-500">آخر 30 يوم</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.map((metric, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 font-mono tabular-nums">
                                        {metric.value}
                                    </p>
                                    {metric.growth !== undefined && (
                                        <div className={`flex items-center gap-1 mt-2 ${
                                            metric.growth >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {metric.growth >= 0 ? (
                                                <ArrowUpRight className="w-4 h-4" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {Math.abs(metric.growth).toFixed(1)}%
                                            </span>
                                            <span className="text-xs text-gray-500">عن الشهر الماضي</span>
                                        </div>
                                    )}
                                </div>
                                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Insights */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">نسبة العمولة:</span>
                            <span className="font-semibold text-gray-900 mr-2">
                                {stats.totalRevenue > 0
                                    ? ((stats.platformFees / stats.totalRevenue) * 100).toFixed(1)
                                    : '0'}%
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">إيرادات المعلمين:</span>
                            <span className="font-semibold text-gray-900 mr-2">
                                {(stats.totalRevenue - stats.platformFees).toLocaleString()} SDG
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
