import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Calendar, Wallet, LifeBuoy, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export function ParentQuickActions() {
    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-2 md:py-3 px-3 md:px-4">
                <CardTitle className="text-sm md:text-lg font-bold">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4 space-y-1.5 md:space-y-2">
                {/* 1. Book Session - PRIMARY */}
                <Link href="/search" className="block group">
                    <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-primary-50 border border-primary-100 transition-all hover:bg-primary-100">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary-500 p-1.5 rounded-lg shadow-sm">
                                <Search className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-primary-900 text-sm md:text-base">احجز حصة</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-primary-400 group-hover:text-primary-600 transition-all" />
                    </div>
                </Link>

                {/* 2. Add Child */}
                <QuickActionButton
                    href="/parent/children/new"
                    icon={Plus}
                    label="إضافة ابن / ابنة"
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
                    label="الدعم"
                    color="gray"
                />
            </CardContent>
        </Card>
    );
}

function QuickActionButton({ href, icon: Icon, label, color }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
        orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
        green: 'bg-green-50 text-green-700 hover:bg-green-100',
        gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    };

    return (
        <Link href={href} className="block group">
            <div className={`
                flex items-center justify-between p-2 md:p-2.5 rounded-lg transition-all
                ${colorClasses[color] || colorClasses.gray}
            `}>
                <div className="flex items-center gap-2.5">
                    <div className="bg-white/80 p-1.5 rounded-md shadow-sm">
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </Link>
    );
}

