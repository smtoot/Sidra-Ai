'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Search, Heart, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ParentStatsGrid } from './components/ParentStatsGrid';
import { ParentEmptyStateGuided } from './components/ParentEmptyStateGuided';
import { ParentBookingEmptyState } from './components/ParentBookingEmptyState';
import { FamilyUpcomingSessionsList } from './components/FamilyUpcomingSessionsList';
import { ParentQuickActions } from './components/ParentQuickActions';

export default function ParentDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await parentApi.getDashboardStats();
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
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">جاري تحميل لوحة التحكم...</p>
                        </div>
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

    const { balance, upcomingClasses, children } = stats;
    const hasChildren = children && children.length > 0;
    const hasUpcoming = upcomingClasses && upcomingClasses.length > 0;

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                            مرحباً، {user?.firstName || 'ولي الأمر'}
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-50" />
                            <span>لوحة تحكم لمتابعة أبنائك</span>
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/parent/children">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Users className="w-4 h-4" />
                                إدارة أبنائك
                            </Button>
                        </Link>
                        <Link href="/search">
                            <Button className="gap-2 shadow-sm">
                                <Search className="w-4 h-4" />
                                احجز حصة
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Top Stats Grid */}
                <ParentStatsGrid
                    balance={balance}
                    upcomingClasses={upcomingClasses}
                    childrenCount={children?.length || 0}
                />

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Dynamic Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {!hasChildren ? (
                            // Mode 1: No Children (Onboarding)
                            <ParentEmptyStateGuided />
                        ) : !hasUpcoming ? (
                            // Mode 2: Has Children, No Bookings
                            <ParentBookingEmptyState childrenList={children} />
                        ) : (
                            // Mode 3: Has Upcoming Sessions
                            <FamilyUpcomingSessionsList bookings={upcomingClasses} />
                        )}

                        {/* Additional Sections (e.g. Recommendations) can go here later */}
                    </div>

                    {/* Right Column: Quick Actions */}
                    <div className="space-y-6">
                        <ParentQuickActions />
                    </div>
                </div>

            </div>
        </div>
    );
}
