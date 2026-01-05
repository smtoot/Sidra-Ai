import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Wallet, Users, PlayCircle, ArrowRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface ParentStatsGridProps {
    balance: number;
    upcomingClasses: any[];
    childrenCount: number;
}

export function ParentStatsGrid({ balance, upcomingClasses, childrenCount }: ParentStatsGridProps) {
    const nextClass = upcomingClasses?.find((c: any) => c.isNextGlobalSession) || upcomingClasses?.[0];
    const hasMoreClasses = upcomingClasses && upcomingClasses.length > 1;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* 1. Next Session Card (Priority) */}
            <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-white">
                <CardContent className="p-4 md:p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3 md:mb-4 text-indigo-700 font-medium">
                        <PlayCircle className="w-4 md:w-5 h-4 md:h-5" />
                        <span className="text-sm md:text-base">الحصة القادمة</span>
                    </div>

                    {nextClass ? (
                        <div className="flex-1 flex flex-col">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 leading-tight">
                                الحصة القادمة لـ {nextClass.child?.name || 'ابنك'}
                            </h3>
                            <div className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                                {nextClass.teacherProfile?.user?.displayName || 'المعلم'} • {nextClass.subject?.nameAr}
                            </div>

                            <div className="flex items-center gap-2 text-indigo-600 font-medium mb-3 md:mb-4 mt-auto text-sm md:text-base">
                                {isToday(new Date(nextClass.startTime)) ? 'اليوم' :
                                    isTomorrow(new Date(nextClass.startTime)) ? 'غداً' :
                                        format(new Date(nextClass.startTime), 'EEEE d MMMM', { locale: ar })}
                                {' • '}
                                {format(new Date(nextClass.startTime), 'h:mm a', { locale: ar }).replace('AM', 'ص').replace('PM', 'م')}
                            </div>

                            <Link href={`/parent/bookings/${nextClass.id}`} className="block mt-2">
                                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm md:h-10">
                                    عرض التفاصيل
                                </Button>
                            </Link>

                            {hasMoreClasses && (
                                <Link href="/parent/bookings" className="text-[10px] md:text-xs text-center text-gray-500 hover:text-indigo-600 mt-2 md:mt-3 block">
                                    لديك حصص أخرى لأبنائك • عرض الكل
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <p className="text-gray-500 font-medium mb-3 md:mb-4 text-sm md:text-base">لا توجد حصص قادمة لأبنائك</p>
                            <Link href="/search" className="w-full">
                                <Button size="sm" variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 md:h-10">
                                    احجز حصة لابنك
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Wallet Card */}
            <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3 md:mb-4 text-emerald-600 font-medium">
                        <Wallet className="w-4 md:w-5 h-4 md:h-5" />
                        <span className="text-sm md:text-base">رصيد المحفظة</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center mb-3 md:mb-4">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1" style={{ direction: 'ltr' }}>
                            {balance.toLocaleString()} <span className="text-lg md:text-xl text-gray-500 font-normal">SDG</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">رصيدك الحالي</p>
                    </div>

                    <div className="mt-auto">
                        <Link href="/parent/wallet">
                            <Button size="sm" variant="outline" className="w-full text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 md:h-10">
                                شحن المحفظة
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Children Summary Card */}
            <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3 md:mb-4 text-blue-600 font-medium">
                        <Users className="w-4 md:w-5 h-4 md:h-5" />
                        <span className="text-sm md:text-base">ملخص أبنائك</span>
                    </div>

                    <div className="space-y-3 md:space-y-4 flex-1">
                        <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-gray-50">
                            <span className="text-gray-600 text-sm md:text-base">عدد الأبناء</span>
                            <span className="text-xl md:text-2xl font-bold text-gray-900">{childrenCount}</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-gray-50">
                            <span className="text-gray-600 text-sm md:text-base">حصص قادمة</span>
                            <span className="text-xl md:text-2xl font-bold text-gray-900">{upcomingClasses?.length || 0}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-3 md:pt-4">
                        <Link href="/parent/children">
                            <Button size="sm" variant="ghost" className="w-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 md:h-10">
                                إدارة أبنائك
                                <ArrowRight className="w-3.5 md:w-4 h-3.5 md:h-4 mr-2" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
