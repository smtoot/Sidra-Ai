import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Calendar, Wallet, LifeBuoy, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export function ParentQuickActions() {
    return (
        <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
                {/* 1. Add Child */}
                <QuickActionButton
                    href="/parent/children"
                    icon={Plus}
                    label="إضافة ابن / ابنة"
                    color="primary"
                    primary
                />

                {/* 2. Book Session */}
                <QuickActionButton
                    href="/search"
                    icon={Search}
                    label="احجز حصة"
                    color="blue"
                />

                {/* 3. Manage Children */}
                <QuickActionButton
                    href="/parent/children"
                    icon={Users}
                    label="إدارة أبنائك"
                    color="purple"
                />

                {/* 4. All Bookings */}
                <QuickActionButton
                    href="/parent/bookings"
                    icon={Calendar}
                    label="جميع الحجوزات"
                    color="orange"
                />

                {/* 5. Wallet */}
                <QuickActionButton
                    href="/parent/wallet"
                    icon={Wallet}
                    label="المحفظة"
                    color="green"
                />

                {/* 6. Support */}
                <QuickActionButton
                    href="/support"
                    icon={LifeBuoy}
                    label="الدعم الفني"
                    color="gray"
                />
            </CardContent>
        </Card>
    );
}

function QuickActionButton({ href, icon: Icon, label, color, primary }: any) {
    const colorClasses: any = {
        primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-100',
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
        orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
        green: 'bg-green-50 text-green-700 hover:bg-green-100',
        gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    };

    return (
        <Link href={href} className="block group">
            <div className={`
                flex items-center justify-between p-3 rounded-lg transition-all border border-transparent
                ${colorClasses[color] || colorClasses.gray}
                ${primary ? 'font-bold shadow-sm' : 'font-medium'}
            `}>
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${primary ? 'stroke-[2.5px]' : ''}`} />
                    <span>{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-current opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
        </Link>
    );
}
