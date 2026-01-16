import { Button } from '@/components/ui/button';
import { Search, Heart, Calendar, Headphones, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-2 md:py-3 px-3 md:px-4">
                <CardTitle className="text-sm md:text-base font-bold">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-3 space-y-1.5 md:space-y-2">
                {/* Primary Action - Book a Session */}
                <Link href="/search" className="block group">
                    <div className="flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-primary-50 border border-primary-100 transition-all duration-200 hover:bg-primary-100">
                        <div className="bg-primary-500 p-2 rounded-lg shadow-sm">
                            <Search className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-right">
                            <div className="font-bold text-primary-900 text-sm md:text-base">
                                احجز حصة
                            </div>
                            <div className="text-xs text-primary-600 font-medium">
                                ابحث عن معلم واحجز الآن
                            </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-primary-400 group-hover:text-primary-600 transition-all transform group-hover:-translate-x-1" />
                    </div>
                </Link>

                {/* Secondary Actions */}
                <ActionBtn
                    href="/student/favorites"
                    icon={Heart}
                    title="المفضلة"
                    desc="المعلمين المحفوظين"
                    color="rose"
                />
                <ActionBtn
                    href="/student/bookings"
                    icon={Calendar}
                    title="حجوزاتي"
                    desc="تابع جدول حصصك"
                    color="blue"
                />
                <ActionBtn
                    href="/support"
                    icon={Headphones}
                    title="الدعم"
                    desc="المساعدة"
                    color="gray"
                />
            </CardContent>
        </Card>
    );
}

function ActionBtn({ href, icon: Icon, title, desc, color }: {
    href: string;
    icon: any;
    title: string;
    desc: string;
    color: string;
}) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
        rose: "bg-rose-50 text-rose-600 hover:bg-rose-100",
        gray: "bg-gray-50 text-gray-600 hover:bg-gray-100",
    };

    return (
        <Link href={href} className="block group">
            <div className={`
                flex items-center gap-3 p-2 md:p-2.5 rounded-lg transition-all duration-200
                ${colorStyles[color as keyof typeof colorStyles]}
            `}>
                <div className="bg-white/80 p-1.5 rounded-md shadow-sm">
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-right">
                    <div className="font-semibold text-gray-900 text-sm">
                        {title}
                    </div>
                    <div className="text-[11px] text-gray-500 hidden md:block">
                        {desc}
                    </div>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-1" />
            </div>
        </Link>
    );
}

