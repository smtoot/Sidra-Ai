import { Button } from '@/components/ui/button';
import { Wallet, Calendar, Heart, Headphones, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
    return (
        <Card className="border-none shadow-md h-full">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
                <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <ActionBtn
                    href="/student/bookings"
                    icon={Calendar}
                    title="حجوزاتي"
                    desc="تابع جدول حصصك"
                    color="blue"
                />
                <ActionBtn
                    href="/student/wallet"
                    icon={Wallet}
                    title="المحفظة"
                    desc="شحن وعرض الرصيد"
                    color="emerald"
                />
                <ActionBtn
                    href="/student/favorites"
                    icon={Heart}
                    title="المفضلة"
                    desc="المعلمين المحفوظين"
                    color="rose"
                />
                <ActionBtn
                    href="/support"
                    icon={Headphones}
                    title="الدعم الفني"
                    desc="تذاكر الدعم والمساعدة"
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
        blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-200",
        emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-200",
        rose: "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-200",
        gray: "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-200",
    };

    return (
        <Link href={href} className="block group">
            <div className={`
                flex items-center gap-4 p-3 rounded-xl border border-transparent transition-all duration-200
                ${colorStyles[color as keyof typeof colorStyles]}
            `}>
                <div className="bg-white/80 p-2 rounded-lg shadow-sm">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-right">
                    <div className="font-bold text-gray-900 group-hover:text-primary-900 transition-colors">
                        {title}
                    </div>
                    <div className="text-xs text-gray-500 font-medium opacity-80">
                        {desc}
                    </div>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-1" />
            </div>
        </Link>
    );
}
