'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Search, Heart, Calendar, Wallet, Clock, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { format, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ActiveSessionCard } from '@/components/dashboard/ActiveSessionCard';
import { ParentStatsGrid } from './components/ParentStatsGrid';
import { ParentEmptyStateGuided } from './components/ParentEmptyStateGuided';
import { ParentBookingEmptyState } from './components/ParentBookingEmptyState';
import { FamilyUpcomingSessionsList } from './components/FamilyUpcomingSessionsList';
import { ParentQuickActions } from './components/ParentQuickActions';
import { ChildrenSelector } from './components/ChildrenSelector';

export default function ParentDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await parentApi.getDashboardStats();
                setStats(data);
                // Auto-select first child
                if (data?.children?.length === 1) {
                    setSelectedChildId(data.children[0].id);
                }
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

    const { balance, upcomingClasses, children, activeSessions } = stats;
    const hasChildren = children && children.length > 0;
    const hasUpcoming = upcomingClasses && upcomingClasses.length > 0;
    const nextClass = hasUpcoming ? upcomingClasses[0] : null;
    const selectedChild = children?.find((c: any) => c.id === selectedChildId);

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 lg:pb-8 space-y-4 md:space-y-6">

                {/* 1️⃣ Header + Context (Simplified on Mobile) */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6 mb-2">
                    <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5 md:hidden">لوحة ولي الأمر</p>
                        <h1 className="text-lg md:text-3xl font-semibold text-gray-700 md:text-gray-900 mb-1 md:mb-2">
                            مرحباً، {user?.firstName || 'ولي الأمر'}
                        </h1>
                        <p className="text-gray-800 md:text-gray-500 flex items-center gap-1.5 text-sm md:text-base font-medium md:font-normal">
                            <Heart className="w-4 h-4 text-red-500 fill-red-100" />
                            <span>اختر أحد أبنائك وابدأ بحجز حصة له</span>
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

                {/* MOBILE-FIRST LAYOUT */}
                <div className="lg:hidden space-y-3">

                    {/* 1.5 ACTIVE SESSIONS (Priority) */}
                    {activeSessions && activeSessions.length > 0 && (
                        <div className="space-y-3">
                            {activeSessions.map((session: any) => (
                                <ActiveSessionCard
                                    key={session.id}
                                    session={session}
                                    userRole="PARENT"
                                />
                            ))}
                        </div>
                    )}

                    {/* 2️⃣ HERO SECTION - Parent-focused */}
                    {hasChildren && (
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-4 text-center">
                                <h2 className="text-base font-bold text-gray-900 mb-1">
                                    ابدأ بحجز حصة لابنك
                                </h2>
                                <p className="text-xs text-gray-500 mb-3">
                                    اختر الابن ثم احجز له حصة مع المعلم المناسب
                                </p>

                                {/* Child Selector - Inline */}
                                {children.length > 1 && (
                                    <div className="mb-3">
                                        <ChildrenSelector
                                            children={children}
                                            selectedChildId={selectedChildId}
                                            onSelect={setSelectedChildId}
                                        />
                                    </div>
                                )}

                                {/* Primary CTA */}
                                <Link href={selectedChildId ? `/search?childId=${selectedChildId}` : '/search'}>
                                    <Button className="w-full h-10 font-bold shadow-md">
                                        <Search className="w-4 h-4 ml-1.5" />
                                        {selectedChild ? `احجز حصة لـ ${selectedChild.name}` : 'احجز حصة'}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* No Children - Onboarding */}
                    {!hasChildren && (
                        <ParentEmptyStateGuided />
                    )}

                    {/* 3️⃣ Upcoming Sessions (Merged Smart Section) */}
                    {hasChildren && (
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="border-b bg-white px-3 py-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-gray-700">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                    حصص أبنائك القادمة
                                </CardTitle>
                                {hasUpcoming && (
                                    <Link href="/parent/bookings" className="text-[10px] text-gray-500 hover:text-indigo-600 font-medium">
                                        عرض الكل
                                    </Link>
                                )}
                            </CardHeader>
                            <CardContent className="p-2.5">
                                {hasUpcoming && nextClass ? (
                                    <div className="flex items-center gap-2.5">
                                        <Avatar
                                            src={nextClass.teacherProfile?.user?.photoUrl}
                                            fallback={nextClass.child?.name?.[0] || 'ا'}
                                            className="w-9 h-9 ring-2 ring-gray-100 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 text-sm truncate">
                                                حصة لـ {nextClass.child?.name || 'ابنك'}
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
                                        <Link href={`/parent/bookings/${nextClass.id}`}>
                                            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2">
                                                التفاصيل
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-500 mb-2">لا توجد حصص قادمة</p>
                                        <Link href="/search">
                                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-indigo-600">
                                                احجز حصة لأحد أبنائك
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* 4️⃣ Children Summary (Promoted) */}
                    {hasChildren && (
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-2.5">
                                <div className="flex items-center gap-1.5 text-blue-600 mb-2">
                                    <Users className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-medium">ملخص أبنائك</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-lg font-bold text-gray-900">{children.length}</div>
                                        <div className="text-[10px] text-gray-500">عدد الأبناء</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-lg font-bold text-gray-900">{upcomingClasses?.length || 0}</div>
                                        <div className="text-[10px] text-gray-500">حصص قادمة</div>
                                    </div>
                                </div>
                                <Link href="/parent/children">
                                    <Button size="sm" variant="ghost" className="w-full h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0">
                                        إدارة أبنائك
                                        <ChevronLeft className="w-3 h-3 mr-1" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* 5️⃣ Quick Actions (Reordered & Compact) */}
                    <ParentQuickActions />

                    {/* 6️⃣ Wallet (De-emphasized) */}
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-2.5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                                        <Wallet className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-medium">المحفظة</span>
                                    </div>
                                    <div className="text-base font-bold text-gray-900" style={{ direction: 'ltr' }}>
                                        {balance?.toLocaleString() || 0} <span className="text-[10px] text-gray-500 font-normal">SDG</span>
                                    </div>
                                </div>
                                <Link href="/parent/wallet">
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                        شحن
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* DESKTOP LAYOUT */}
                <div className="hidden lg:block">
                    {/* Top Stats Grid */}
                    <ParentStatsGrid
                        balance={balance}
                        upcomingClasses={upcomingClasses}
                        childrenCount={children?.length || 0}
                    />

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Left Column: Dynamic Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Desktop Active Sessions */}
                            {activeSessions && activeSessions.length > 0 && (
                                <div className="space-y-4">
                                    {activeSessions.map((session: any) => (
                                        <ActiveSessionCard
                                            key={session.id}
                                            session={session}
                                            userRole="PARENT"
                                        />
                                    ))}
                                </div>
                            )}

                            {!hasChildren ? (
                                <ParentEmptyStateGuided />
                            ) : !hasUpcoming ? (
                                <ParentBookingEmptyState childrenList={children} />
                            ) : (
                                <FamilyUpcomingSessionsList bookings={upcomingClasses} />
                            )}
                        </div>

                        {/* Right Column: Quick Actions - Desktop Only */}
                        <div className="space-y-6">
                            <ParentQuickActions />
                        </div>
                    </div>
                </div>

            </div>

            {/* Sticky Bottom CTA - Mobile Only */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 lg:hidden safe-area-bottom z-50">
                <Link href={selectedChildId ? `/search?childId=${selectedChildId}` : '/search'} className="block">
                    <Button className="w-full h-11 rounded-xl text-base font-bold shadow-lg">
                        <Search className="w-4 h-4 ml-1.5" />
                        احجز حصة
                    </Button>
                </Link>
            </div>
        </div>
    );
}

