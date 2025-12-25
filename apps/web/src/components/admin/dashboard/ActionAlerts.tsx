'use client';

import { useState, useEffect } from 'react';
import { walletApi } from '@/lib/api/wallet';
import { adminApi } from '@/lib/api/admin';
import { AlertCircle, Banknote, UserCheck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AlertTileProps {
    title: string;
    count: number;
    href: string;
    isCritical: boolean;
    icon: any;
}

function AlertTile({ title, count, href, isCritical, icon: Icon }: AlertTileProps) {
    // Color logic:
    // - count === 0 -> Green (healthy)
    // - count > 0 + critical -> Red (urgent)
    // - count > 0 + !critical -> Yellow (pending)

    const isHealthy = count === 0;
    const isUrgent = count > 0 && isCritical;
    const isPending = count > 0 && !isCritical;

    const bgColor = isHealthy ? 'bg-green-50' : isUrgent ? 'bg-red-50' : 'bg-amber-50';
    const borderColor = isHealthy ? 'border-green-200' : isUrgent ? 'border-red-200' : 'border-amber-200';
    const textColor = isHealthy ? 'text-green-900' : isUrgent ? 'text-red-900' : 'text-amber-900';
    const iconColor = isHealthy ? 'text-green-600' : isUrgent ? 'text-red-600' : 'text-amber-600';

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center justify-between p-3 rounded-md border transition-all hover:shadow-md",
                bgColor,
                borderColor,
                textColor
            )}
        >
            <div className="flex items-center gap-3 flex-1">
                <div className={cn("p-2 rounded-md bg-white/50", iconColor)}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-semibold opacity-90">{title}</h3>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono tracking-tight">{count}</span>
                <span className="text-xs font-bold opacity-75 hover:opacity-100 transition-opacity">
                    مراجعة ←
                </span>
            </div>
        </Link>
    );
}

export function ActionAlerts() {
    const [counts, setCounts] = useState({
        deposits: 0,
        withdrawals: 0,
        disputes: 0,
        teachers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCounts = async () => {
            try {
                const [depositsRes, withdrawalsStats, disputesRes, teachersRes] = await Promise.all([
                    walletApi.getTransactions({ status: 'PENDING', type: 'DEPOSIT' }),
                    walletApi.getAdminStats(),
                    adminApi.getDisputes('PENDING'),
                    adminApi.getPendingTeachers()
                ]);

                // @ts-ignore
                const pendingDeposits = depositsRes.data?.length || 0;
                const pendingWithdrawals = withdrawalsStats.pendingPayouts?.count || 0;
                // @ts-ignore
                const openDisputes = disputesRes.length || 0;
                // @ts-ignore
                const pendingTeachers = teachersRes.length || 0;

                setCounts({
                    deposits: pendingDeposits,
                    withdrawals: pendingWithdrawals,
                    disputes: openDisputes,
                    teachers: pendingTeachers
                });
            } catch (error) {
                console.error("Failed to load Action Alerts", error);
            } finally {
                setLoading(false);
            }
        };

        loadCounts();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="animate-pulse flex gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded flex-1"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="space-y-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                إجراءات عاجلة (Urgent Actions)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* ALWAYS visible - Priority 1: Withdrawals (Money Out) */}
                <AlertTile
                    title="طلبات سحب"
                    count={counts.withdrawals}
                    href="/admin/financials"
                    isCritical={true}
                    icon={Banknote}
                />

                {/* ALWAYS visible - Priority 2: Disputes (User Risk) */}
                <AlertTile
                    title="شكاوى مفتوحة"
                    count={counts.disputes}
                    href="/admin/disputes"
                    isCritical={true}
                    icon={AlertCircle}
                />

                {/* ALWAYS visible - Priority 3: Teachers (Onboarding) */}
                <AlertTile
                    title="طلبات انضمام"
                    count={counts.teachers}
                    href="/admin/teacher-applications"
                    isCritical={false}
                    icon={UserCheck}
                />

                {/* ALWAYS visible - Priority 4: Deposits (Money In) */}
                <AlertTile
                    title="إيداعات بنكية"
                    count={counts.deposits}
                    href="/admin/financials"
                    isCritical={false}
                    icon={Wallet}
                />
            </div>
        </section>
    );
}
