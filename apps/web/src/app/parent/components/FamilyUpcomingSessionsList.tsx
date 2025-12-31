import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FamilyUpcomingSessionsListProps {
    bookings: any[];
}

export function FamilyUpcomingSessionsList({ bookings }: FamilyUpcomingSessionsListProps) {
    return (
        <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="border-b bg-white px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    جميع الحصص القادمة
                </CardTitle>
                <Link href="/parent/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <span>عرض الكل</span>
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                    {bookings.map((booking: any) => (
                        <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors group">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <Avatar
                                        src={booking.teacherProfile?.user?.photoUrl}
                                        fallback={booking.teacherProfile?.user?.displayName?.[0] || 'م'}
                                        className="w-12 h-12 ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <div className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                                            {booking.teacherProfile?.user?.displayName || 'المعلم'}
                                        </div>
                                        <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                            <span>{booking.subject?.nameAr}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="text-indigo-600 font-medium">لـ {booking.child?.name || 'ابنك'}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {booking.startTime && format(new Date(booking.startTime), 'd MMMM • h:mm a', { locale: ar })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {booking.status === 'SCHEDULED' ? (
                                        <Button size="sm" className="w-full sm:w-auto gap-2 shadow-sm">
                                            <ExternalLink className="w-3 h-3" />
                                            دخول
                                        </Button>
                                    ) : (
                                        <span className={`
                                            text-xs px-3 py-1.5 rounded-full font-bold
                                            ${booking.status === 'PENDING_TEACHER_APPROVAL'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-gray-100 text-gray-700'}
                                        `}>
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
    );
}
