'use client';

import { useState, useEffect } from 'react';
import { walletApi } from '@/lib/api/wallet';
import { adminApi } from '@/lib/api/admin';
import { AlertCircle, ArrowRight, Banknote, FileText, UserCheck, Wallet } from 'lucide-react';
import Link from 'next/link';

export function ActionCenter() {
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
                // Parallel fetching for efficiency
                const [depositsRes, withdrawalsStats, disputesRes, teachersRes] = await Promise.all([
                    walletApi.getTransactions({ status: 'PENDING', type: 'DEPOSIT' }),
                    walletApi.getAdminStats(),
                    adminApi.getDisputes('PENDING'),
                    adminApi.getPendingTeachers() // Assumes this endpoint exists or similar
                ]);

                // Calculate counts
                // @ts-ignore
                const pendingDeposits = depositsRes.data?.length || 0;
                const pendingWithdrawals = withdrawalsStats.pendingPayouts?.count || 0;
                // @ts-ignore
                const openDisputes = disputesRes.length || 0; // Check if getDisputes returns array directly or { data: [] }
                // @ts-ignore
                const pendingTeachers = teachersRes.length || 0;

                setCounts({
                    deposits: pendingDeposits,
                    withdrawals: pendingWithdrawals,
                    disputes: openDisputes,
                    teachers: pendingTeachers
                });
            } catch (error) {
                console.error("Failed to load Action Center counts", error);
            } finally {
                setLoading(false);
            }
        };

        loadCounts();
    }, []);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse h-32">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="h-12 bg-gray-100 rounded"></div>
                    <div className="h-12 bg-gray-100 rounded"></div>
                    <div className="h-12 bg-gray-100 rounded"></div>
                    <div className="h-12 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    const items = [
        {
            label: 'إيداعات معلقة',
            count: counts.deposits,
            href: '/admin/financials',
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100'
        },
        {
            label: 'سحوبات بانتظار الموافقة',
            count: counts.withdrawals,
            href: '/admin/financials',
            icon: Banknote,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100'
        },
        {
            label: 'شكاوى مفتوحة',
            count: counts.disputes,
            href: '/admin/disputes',
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100'
        },
        {
            label: 'طلبات معلمين',
            count: counts.teachers,
            href: '/admin/teacher-applications',
            icon: UserCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        }
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                مركز الإجراءات (Action Center)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, idx) => (
                    <Link
                        key={idx}
                        href={item.href}
                        className={`block p-4 rounded-xl border ${item.border} ${item.bg} hover:shadow-md transition-all group`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-lg bg-white ${item.color}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            {item.count > 0 && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                    {item.count}
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {item.count}
                            </div>
                            <div className="text-sm font-medium text-gray-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                {item.label}
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
