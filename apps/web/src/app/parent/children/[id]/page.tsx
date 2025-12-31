'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { parentApi } from '@/lib/api/parent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Calendar, CheckCircle, Edit, Search, ArrowRight, Clock, BookOpen, GraduationCap, School as SchoolIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ChildProfilePage() {
    const params = useParams();
    const childId = params.id as string;

    const [child, setChild] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const GRADE_LABELS: Record<string, string> = {
        KINDERGARTEN: "رياض أطفال",
        GRADE_1: "الصف الأول",
        GRADE_2: "الصف الثاني",
        GRADE_3: "الصف الثالث",
        GRADE_4: "الصف الرابع",
        GRADE_5: "الصف الخامس",
        GRADE_6: "الصف السادس",
        GRADE_7: "الصف السابع",
        GRADE_8: "الصف الثامن",
        GRADE_9: "الصف التاسع",
        GRADE_10: "الصف العاشر",
        GRADE_11: "الصف الحادي عشر",
        GRADE_12: "الصف الثاني عشر",
        // Fallbacks for raw strings
        "Grade 1": "الصف الأول",
        "Grade 2": "الصف الثاني",
        "Grade 3": "الصف الثالث",
        "Grade 4": "الصف الرابع",
        "Grade 5": "الصف الخامس",
        "Grade 6": "الصف السادس",
        "Grade 7": "الصف السابع",
        "Grade 8": "الصف الثامن",
        "Grade 9": "الصف التاسع",
        "Grade 10": "الصف العاشر",
        "Grade 11": "الصف الحادي عشر",
        "Grade 12": "الصف الثاني عشر",
    };

    const formatArabicTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    };

    const formatArabicDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    useEffect(() => {
        const loadChild = async () => {
            if (!childId) return;
            try {
                const data = await parentApi.getChild(childId);
                setChild(data);
            } catch (error) {
                console.error("Failed to load child", error);
            } finally {
                setLoading(false);
            }
        };
        loadChild();
    }, [childId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-5xl mx-auto pt-20 text-center">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">جاري تحميل ملف الابن...</p>
                </div>
            </div>
        );
    }

    if (!child) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 flex items-center justify-center font-sans" dir="rtl">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">عفواً، لم يتم العثور على الملف</h3>
                    <Link href="/parent/children">
                        <Button variant="outline">عودة إلى إدارة الأبناء</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Helper for status badge
    const getBookingStatus = (status: string) => {
        if (status === 'COMPLETED') return { label: 'مكتملة', color: 'bg-green-100 text-green-700' };
        if (status === 'SCHEDULED' || status === 'CONFIRMED') return { label: 'قادمة', color: 'bg-blue-100 text-blue-700' };
        if (status === 'CANCELLED') return { label: 'ملغاة', color: 'bg-red-100 text-red-700' };
        if (status === 'PENDING_CONFIRMATION') return { label: 'في انتظار التأكيد', color: 'bg-yellow-100 text-yellow-700' };
        if (status === 'DISPUTED') return { label: 'قيد النزاع', color: 'bg-orange-100 text-orange-700' };
        return { label: status, color: 'bg-gray-100 text-gray-700' };
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Nav */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/parent/children" className="hover:text-gray-900 transition-colors">عودة إلى إدارة الأبناء</Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">{child.name}</span>
                </div>

                {/* Profile Header Card */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                        <Avatar
                            className="w-24 h-24 text-3xl font-bold bg-primary-100 text-primary-700 ring-4 ring-white shadow-sm"
                            fallback={child.name[0]}
                        />
                        <div className="flex-1 text-center md:text-right space-y-2">
                            {/* Hierarchy: Name > Grade Tag > Desc */}
                            <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-gray-900">{child.name}</h1>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100/80 rounded-full">
                                    <GraduationCap className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">{GRADE_LABELS[child.gradeLevel] || child.gradeLevel}</span>
                                </div>
                            </div>

                            <p className="text-gray-500 text-base">ملف الابن ومتابعة التقدم الدراسي</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-sm">
                                {child.curriculum && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
                                        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{child.curriculum.nameAr}</span>
                                    </div>
                                )}
                                {child.schoolName && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
                                        <SchoolIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{child.schoolName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="w-full md:w-auto flex flex-col gap-3 min-w-[240px]">
                            <Link href={`/search?childId=${child.id}`} className="w-full">
                                <Button size="lg" className="w-full gap-2 shadow-sm text-base bg-primary-600 hover:bg-primary-700 text-white">
                                    <Search className="w-4 h-4" />
                                    احجز حصة لـ {child.name.split(' ')[0]}
                                </Button>
                            </Link>
                            <div className="flex gap-3">
                                {/* Order: 1) View Bookings 2) Edit Details */}
                                <Link href="/parent/bookings" className="flex-1">
                                    <Button variant="outline" className="w-full gap-2 border-gray-200 hover:bg-gray-50 text-gray-700 h-10">
                                        <Calendar className="w-4 h-4" />
                                        عرض الحجوزات
                                    </Button>
                                </Link>
                                <Link href={`/parent/children/${child.id}/edit`} className="flex-1">
                                    <Button variant="outline" className="w-full gap-2 border-gray-200 hover:bg-gray-50 text-gray-700 h-10">
                                        <Edit className="w-4 h-4" />
                                        تعديل بيانات الابن
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats Grid - Visual Dominance */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-5 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">حصص قادمة</div>
                                    <div className={`text-3xl font-bold ${child.stats?.upcomingCount > 0 ? 'text-primary-600' : 'text-gray-300'}`}>
                                        {child.stats?.upcomingCount || 0}
                                    </div>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${child.stats?.upcomingCount > 0 ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-300'}`}>
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-5 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">حصص مكتملة</div>
                                    <div className={`text-3xl font-bold ${child.stats?.completedCount > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                                        {child.stats?.completedCount || 0}
                                    </div>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${child.stats?.completedCount > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-300'}`}>
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent / Upcoming Sessions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-bold text-gray-900">أحدث الحصص</h2>
                        {child.recentBookings?.length > 0 && (
                            <Link
                                href={`/parent/bookings?childId=${child.id}`}
                                className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 hover:underline"
                            >
                                عرض جميع حجوزات {child.name.split(' ')[0]} <ArrowRight className="w-4 h-4 rotate-180" />
                            </Link>
                        )}
                    </div>

                    {child.recentBookings && child.recentBookings.length > 0 ? (
                        <div className="grid gap-4">
                            {child.recentBookings.map((booking: any) => {
                                const status = getBookingStatus(booking.status);
                                return (
                                    <Card key={booking.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    src={booking.teacherProfile?.user?.profilePhotoUrl}
                                                    fallback={booking.teacherProfile?.user?.displayName?.[0] || 'T'}
                                                    className="w-12 h-12 border border-gray-100"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-bold text-gray-900 text-lg">
                                                            {booking.subject?.nameAr} <span className="text-gray-400 font-normal text-base">– مع {booking.teacherProfile?.user?.displayName ? `الأستاذ ${booking.teacherProfile?.user?.displayName}` : 'الأستاذ'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-left pl-2">
                                                <div className="font-bold text-gray-900 text-lg md:text-xl mb-1 dir-ltr">
                                                    {formatArabicTime(booking.startTime)}
                                                </div>
                                                <div className="text-sm text-gray-500 font-medium">
                                                    {formatArabicDate(booking.startTime)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد حصص مسجلة لهذا الابن حتى الآن</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">احجز حصة مع أفضل المعلمين لمساعدة ابنك في دراسته</p>

                            <Link href={`/search?childId=${child.id}`}>
                                <Button className="gap-2 shadow-sm">
                                    <Search className="w-4 h-4" />
                                    احجز حصة الآن
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
