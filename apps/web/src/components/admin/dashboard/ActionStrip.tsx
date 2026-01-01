'use client';

import { useState, useEffect } from 'react';
import { walletApi } from '@/lib/api/wallet';
import { adminApi } from '@/lib/api/admin';
import { getAdminSupportTickets } from '@/lib/api/support-ticket';
import { Headset, Banknote, UserCheck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

interface StripItemProps {
    label: string;
    count: number;
    href: string;
    icon: any;
}

function StripItem({ label, count, href, icon: Icon }: StripItemProps) {
    // Determine badge variant based on count
    const getVariant = () => {
        if (count === 0) return 'success'; // Healthy
        if (count >= 5) return 'error';     // Action required
        return 'warning';                    // Attention needed
    };

    const getStatusText = () => {
        if (count === 0) return 'صحي';
        if (count >= 5) return 'يتطلب إجراء';
        return 'متابعة';
    };

    return (
        <Link
            href={href}
            className="flex-1 px-6 py-4 hover:bg-gray-50 transition-colors border-l border-gray-200 first:border-l-0 last:border-l-0"
        >
            <div className="flex items-center justify-between gap-4">
                {/* Left side: Icon + Label + Status */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">{label}</div>
                        <StatusBadge variant={getVariant()} showDot={true}>
                            {getStatusText()}
                        </StatusBadge>
                    </div>
                </div>

                {/* Right side: Count */}
                <div className="text-3xl font-bold font-mono text-gray-900 tabular-nums">
                    {count}
                </div>
            </div>
        </Link>
    );
}

export function ActionStrip() {
    const [counts, setCounts] = useState({
        deposits: 0,
        withdrawals: 0,
        tickets: 0,
        teachers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCounts = async () => {
            try {
                const [depositsRes, withdrawalsStats, ticketsRes, teachersRes] = await Promise.all([
                    walletApi.getTransactions({ status: 'PENDING', type: 'DEPOSIT' }),
                    walletApi.getAdminStats(),
                    getAdminSupportTickets(),
                    adminApi.getPendingTeachers()
                ]);

                const pendingDeposits = depositsRes.data?.length || 0;
                const pendingWithdrawals = withdrawalsStats.pendingPayouts?.count || 0;
                // Count only OPEN tickets (not resolved/closed)
                const openTickets = Array.isArray(ticketsRes)
                    ? ticketsRes.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
                    : 0;
                const pendingTeachers = Array.isArray(teachersRes) ? teachersRes.length : 0;

                setCounts({
                    deposits: pendingDeposits,
                    withdrawals: pendingWithdrawals,
                    tickets: openTickets,
                    teachers: pendingTeachers
                });
            } catch (error) {
                console.error("Failed to load Action Strip data", error);
            } finally {
                setLoading(false);
            }
        };

        loadCounts();
    }, []);

    if (loading) {
        return (
            <Card padding="none" className="h-24 animate-pulse bg-gray-100" />
        );
    }

    return (
        <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-gray-200">
                <StripItem
                    label="طلبات سحب"
                    count={counts.withdrawals}
                    href="/admin/financials"
                    icon={Banknote}
                />
                <StripItem
                    label="طلبات المساعدة"
                    count={counts.tickets}
                    href="/admin/support-tickets"
                    icon={Headset}
                />
                <StripItem
                    label="طلبات انضمام"
                    count={counts.teachers}
                    href="/admin/teacher-applications"
                    icon={UserCheck}
                />
                <StripItem
                    label="إيداعات بنكية"
                    count={counts.deposits}
                    href="/admin/financials"
                    icon={Wallet}
                />
            </div>
        </Card>
    );
}
