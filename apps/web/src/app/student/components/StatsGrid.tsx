import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Wallet, CheckCircle, Clock, Video, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface StatsGridProps {
    balance: number;
    upcomingClasses: any[];
    totalClasses: number;
}

export function StatsGrid({ balance, upcomingClasses, totalClasses }: StatsGridProps) {
    const nextClass = upcomingClasses && upcomingClasses.length > 0 ? upcomingClasses[0] : null;
    const isUrgent = nextClass && differenceInHours(new Date(nextClass.startTime), new Date()) < 24;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Upcoming Session (Priority) */}
            <Card className={cn(
                "h-full border-none shadow-md transition-shadow hover:shadow-lg relative overflow-hidden group",
                isUrgent ? "ring-2 ring-primary-500/20" : ""
            )}>
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-primary-600 font-medium">
                        <Calendar className="w-5 h-5" />
                        <span>الحصة القادمة</span>
                    </div>

                    {nextClass ? (
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {nextClass.subject?.nameAr || 'مادة دراسية'}
                                </h3>
                                <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {isToday(new Date(nextClass.startTime)) ? 'اليوم' :
                                        isTomorrow(new Date(nextClass.startTime)) ? 'غداً' :
                                            format(new Date(nextClass.startTime), 'EEEE d MMMM', { locale: ar })}
                                    {' • '}
                                    {format(new Date(nextClass.startTime), 'h:mm a', { locale: ar })}
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg mb-4">
                                    <Avatar
                                        src={nextClass.teacherProfile?.user?.photoUrl}
                                        fallback={nextClass.teacherProfile?.user?.displayName?.[0] || 'م'}
                                        size="sm"
                                    />
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{nextClass.teacherProfile?.user?.displayName}</div>
                                        <div className="text-xs text-gray-500">معلم</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <Link href={`/student/bookings/${nextClass.id}`}>
                                    <Button className="w-full gap-2" variant={isUrgent ? "default" : "outline"}>
                                        {isUrgent ? <Video className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                        {isUrgent ? 'انضم الآن' : 'عرض التفاصيل'}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                            <div className="bg-gray-100 p-3 rounded-full mb-3">
                                <Calendar className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm mb-4">لا توجد حصص قادمة</p>
                            <Link href="/search" className="w-full">
                                <Button variant="outline" className="w-full">احجز حصة</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card 2: Wallet Balance */}
            <Card className="h-full border-none shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600 font-medium">
                        <Wallet className="w-5 h-5" />
                        <span>رصيد المحفظة</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center mb-4">
                        <div className="text-4xl font-bold text-gray-900 mb-1" style={{ direction: 'ltr' }}>
                            {balance.toLocaleString()} <span className="text-xl text-gray-500 font-normal">SDG</span>
                        </div>
                        <p className="text-sm text-gray-500">رصيدك الحالي المتاح</p>
                    </div>

                    <div className="mt-auto">
                        <Link href="/student/wallet">
                            <Button variant="outline" className="w-full text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200">
                                شحن المحفظة
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Sessions Summary */}
            <Card className="h-full border-none shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-6 text-blue-600 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span>ملخص الحصص</span>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-gray-600">مكتملة</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{totalClasses}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-gray-600">قادمة</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{upcomingClasses?.length || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
