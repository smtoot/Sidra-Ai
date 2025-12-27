'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Wallet, Search, ExternalLink, Users, Plus, Video, TrendingUp, ArrowUpRight, ChevronRight, Heart, PlayCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { format, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';

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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-8" dir="rtl">
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-8" dir="rtl">
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
    const nextClass = upcomingClasses?.[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                            مرحباً، {user?.firstName || 'ولي الأمر'}
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Heart className="w-5 h-5" />
                            <span>متابعة تقدم أبنائك التعليمي</span>
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/parent/children">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Users className="w-4 h-4" />
                                إدارة الأبناء
                            </Button>
                        </Link>
                        <Link href="/search">
                            <Button className="gap-2">
                                <Search className="w-4 h-4" />
                                احجز حصة
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="رصيد المحفظة"
                        value={balance}
                        icon={Wallet}
                        gradient="from-emerald-500 to-green-600"
                        subtext="جنيه سوداني"
                        suffix="SDG"
                        href="/parent/wallet"
                    />
                    <StatCard
                        title="الأبناء"
                        value={children?.length || 0}
                        icon={Users}
                        gradient="from-blue-500 to-blue-600"
                        subtext="مسجلين في المنصة"
                        href="/parent/children"
                    />
                    <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Search className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <div className="text-sm opacity-90 mb-1">احجز لأبنائك</div>
                                <div className="text-2xl font-bold mb-3">ابحث عن معلم</div>
                                <Link href="/search">
                                    <Button size="sm" className="w-full bg-white text-primary-600 hover:bg-primary-50">
                                        احجز حصة الآن
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Next Class Highlight */}
                        {nextClass ? (
                            <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700">
                                <CardContent className="p-6 text-white">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                                <PlayCircle className="w-5 h-5" />
                                                <span className="text-sm font-medium">الحصة القادمة</span>
                                            </div>
                                            <h2 className="text-2xl font-bold mb-1">
                                                {nextClass.subject?.nameAr || 'مادة دراسية'}
                                            </h2>
                                            <div className="flex items-center gap-2 text-indigo-100">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {nextClass.startTime && (
                                                        <>
                                                            {isToday(new Date(nextClass.startTime)) ? 'اليوم' :
                                                             isTomorrow(new Date(nextClass.startTime)) ? 'غداً' :
                                                             format(new Date(nextClass.startTime), 'EEEE d MMMM', { locale: ar })}
                                                            {' • '}
                                                            {format(new Date(nextClass.startTime), 'h:mm a', { locale: ar })}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <span className="text-xs font-medium">قريباً</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/20">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={nextClass.teacherProfile?.user?.photoUrl}
                                                fallback={nextClass.teacherProfile?.user?.displayName?.[0] || 'م'}
                                                size="md"
                                                className="ring-2 ring-white/50"
                                            />
                                            <div>
                                                <div className="font-semibold">
                                                    {nextClass.teacherProfile?.user?.displayName || 'المعلم'}
                                                </div>
                                                <div className="text-xs text-indigo-100">
                                                    {nextClass.child?.name && `الطالب: ${nextClass.child.name}`}
                                                </div>
                                            </div>
                                        </div>
                                        {nextClass.status === 'SCHEDULED' && (
                                            <Button
                                                size="lg"
                                                className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                                            >
                                                <Video className="w-4 h-4 ml-2" />
                                                متابعة الحصة
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-2 border-dashed border-gray-200">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">لا توجد حصص قادمة</h3>
                                    <p className="text-gray-500 text-sm mb-4">احجز حصة لأبنائك مع معلمين متميزين</p>
                                    <Link href="/search">
                                        <Button>
                                            <Search className="w-4 h-4 ml-2" />
                                            تصفح المعلمين
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Children Cards */}
                        {children && children.length > 0 && (
                            <Card className="border-none shadow-md">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Users className="w-5 h-5 text-primary-600" />
                                            أبنائي
                                        </CardTitle>
                                        <Link href="/parent/children">
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Plus className="w-4 h-4" />
                                                إضافة ابن/ابنة
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {children.map((child: any) => (
                                            <div
                                                key={child.id}
                                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Avatar
                                                    fallback={child.name[0]}
                                                    size="md"
                                                    className="bg-primary-100 text-primary-700"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">{child.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {child.gradeLevel || 'لم يحدد المستوى'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* All Upcoming Classes */}
                        {upcomingClasses && upcomingClasses.length > 0 && (
                            <Card className="border-none shadow-md">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-primary-600" />
                                            جميع الحصص القادمة
                                        </CardTitle>
                                        <Link href="/parent/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                            <span>عرض الكل</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-100">
                                        {upcomingClasses.map((booking: any) => (
                                            <div key={booking.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Avatar
                                                            src={booking.teacherProfile?.user?.photoUrl}
                                                            fallback={booking.teacherProfile?.user?.displayName?.[0] || 'م'}
                                                            size="md"
                                                        />
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {booking.teacherProfile?.user?.displayName || 'المعلم'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {booking.subject?.nameAr} • {booking.child?.name || 'طالب'}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {booking.startTime && format(new Date(booking.startTime), 'd MMMM، h:mm a', { locale: ar })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {booking.status === 'SCHEDULED' ? (
                                                            <Button size="sm" className="gap-2">
                                                                <ExternalLink className="w-3 h-3" />
                                                                متابعة
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium">
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
                        )}
                    </div>

                    {/* Right Sidebar - Quick Actions */}
                    <div className="space-y-6">
                        {/* Quick Actions Panel */}
                        <Card className="border-none shadow-md">
                            <CardHeader className="border-b bg-gray-50/50">
                                <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <QuickActionButton
                                    href="/search"
                                    icon={Search}
                                    label="احجز حصة"
                                    color="primary"
                                />
                                <QuickActionButton
                                    href="/parent/bookings"
                                    icon={Calendar}
                                    label="جميع الحجوزات"
                                    color="blue"
                                />
                                <QuickActionButton
                                    href="/parent/children"
                                    icon={Users}
                                    label="إدارة الأبناء"
                                    color="purple"
                                />
                                <QuickActionButton
                                    href="/parent/wallet"
                                    icon={Wallet}
                                    label="المحفظة"
                                    color="green"
                                />
                            </CardContent>
                        </Card>

                        {/* Wallet Summary */}
                        <Card className="border-none shadow-md bg-gradient-to-br from-green-600 to-emerald-700 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-sm text-green-100 mb-1">رصيد المحفظة</div>
                                        <div className="text-3xl font-bold">{balance}</div>
                                        <div className="text-sm text-green-100">جنيه سوداني</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <Link href="/parent/wallet" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                                        <span>شحن الرصيد</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Family Progress */}
                        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-500">
                            <CardContent className="p-6">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">🎓</div>
                                    <h3 className="font-bold text-gray-900 mb-2">استثمر في مستقبل أبنائك</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        التعليم الجيد هو أفضل هدية لأطفالك
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white p-3 rounded-lg">
                                            <div className="font-bold text-gray-900">{children?.length || 0}</div>
                                            <div className="text-gray-600">طفل</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <div className="font-bold text-gray-900">{upcomingClasses?.length || 0}</div>
                                            <div className="text-gray-600">حصة قادمة</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Performance Insights */}
                        <Card className="border-none shadow-md bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">نشاط العائلة</div>
                                        <div className="text-3xl font-bold">{upcomingClasses?.length || 0}</div>
                                        <div className="text-sm text-gray-400">حصة مجدولة</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <Link href="/parent/bookings" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                                        <span>عرض التفاصيل</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, gradient, subtext, suffix, href }: {
    title: string;
    value: string | number;
    icon: any;
    gradient: string;
    subtext: string;
    suffix?: string;
    href?: string;
}) {
    const content = (
        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {href && <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />}
                </div>
                <div>
                    <div className="text-sm text-gray-600 mb-1">{title}</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold text-gray-900">{value}</div>
                        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{subtext}</div>
                </div>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

// Quick Action Button Component
function QuickActionButton({ href, icon: Icon, label, color }: {
    href: string;
    icon: any;
    label: string;
    color: string;
}) {
    const colorClasses = {
        primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
        green: 'bg-green-50 text-green-700 hover:bg-green-100',
    };

    return (
        <Link href={href}>
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4" />
            </div>
        </Link>
    );
}
