'use client';

import { adminApi } from '@/lib/api/admin';
import { useEffect, useState } from 'react';
import { Wallet, Users, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function OperationalSnapshot() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getDashboardStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Card padding="none" className="h-48 animate-pulse bg-gray-100" />
        );
    }

    if (!stats) return null;

    const { counts, financials } = stats;

    const rows = [
        {
            label: 'إجمالي ودائع العملاء',
            value: `${financials.totalVolume.toLocaleString()} SDG`,
            sub: 'User Liability - رصيد المحافظ الحالي',
            icon: Wallet,
        },
        {
            label: 'إجمالي المستخدمين',
            value: counts.users.toLocaleString(),
            sub: `${counts.teachers} معلم / ${counts.students} طالب`,
            icon: Users,
        },
        {
            label: 'الحجوزات النشطة',
            value: counts.bookings.toLocaleString(),
            sub: `${counts.pendingBookings} قيد الانتظار`,
            icon: Calendar,
        }
    ];

    return (
        <Card padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">نظرة عامة</h3>
                <span className="text-xs text-gray-500">لحظي</span>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow hover={false}>
                        <TableHead>المقياس</TableHead>
                        <TableHead>القيمة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <row.icon className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">{row.label}</div>
                                        <div className="text-xs text-gray-500">{row.sub}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-left">
                                <div className="font-bold text-lg font-mono text-gray-900 tabular-nums">
                                    {row.value}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
