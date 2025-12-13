'use client';

import { useState, useEffect } from 'react';
import { walletApi, Wallet, Transaction } from '@/lib/api/wallet';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherWalletPage() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWallet();
    }, []);

    const loadWallet = async () => {
        setLoading(true);
        try {
            const data = await walletApi.getMyBalance();
            setWallet(data);
        } catch (error) {
            console.error("Failed to load wallet", error);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
            case 'WITHDRAWAL': return <ArrowUpRight className="w-5 h-5 text-red-600" />;
            case 'PAYMENT_RELEASE': return <TrendingUp className="w-5 h-5 text-green-600" />;
            case 'PAYMENT_LOCK': return <Clock className="w-5 h-5 text-orange-600" />;
            default: return <WalletIcon className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return 'إيداع';
            case 'WITHDRAWAL': return 'سحب';
            case 'PAYMENT_RELEASE': return 'أرباح حصة';
            case 'PAYMENT_LOCK': return 'حجز مبلغ';
            case 'REFUND': return 'استرداد';
            default: return type;
        }
    };

    const formatCurrency = (amount: string | number) => {
        return `${Number(amount).toLocaleString()} SDG`;
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">المحفظة</h1>
                    <p className="text-text-subtle">إدارة الأرصدة والمعاملات المالية</p>
                </header>

                {loading ? (
                    <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                ) : !wallet ? (
                    <div className="bg-surface p-8 rounded-xl border border-error/20 text-center text-error">
                        حدث خطأ في تحميل المحفظة
                    </div>
                ) : (
                    <>
                        {/* Balance Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                <div className="relative z-10">
                                    <p className="text-text-subtle mb-1">الرصيد الحالي</p>
                                    <h2 className="text-4xl font-bold text-primary">{formatCurrency(wallet.balance)}</h2>
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        متاح للسحب
                                    </p>
                                </div>
                            </div>

                            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-text-subtle mb-1">الرصيد المعلق</p>
                                <h2 className="text-4xl font-bold text-gray-400">{formatCurrency(wallet.pendingBalance)}</h2>
                                <p className="text-sm text-text-subtle mt-2 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    أرباح قيد المعالجة
                                </p>
                            </div>
                        </div>

                        {/* Withdraw Action */}
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <WalletIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">سحب الأرباح</h3>
                                    <p className="text-sm text-gray-600">يمكنك طلب سحب أرباحك إلى حسابك البنكي</p>
                                </div>
                            </div>
                            <button
                                onClick={() => alert('ميزة سحب الأرباح ستتوفر قريباً')}
                                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-hover transition-colors"
                            >
                                طلب سحب
                            </button>
                        </div>

                        {/* Data Visualization / Transaction History */}
                        <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-lg">آخر المعاملات</h3>
                            </div>

                            {wallet.transactions.length === 0 ? (
                                <div className="p-12 text-center text-text-subtle">
                                    لا توجد معاملات سابقة
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {wallet.transactions.map((tx) => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-gray-50",
                                                    tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RELEASE' ? 'bg-green-50' :
                                                        tx.type === 'WITHDRAWAL' ? 'bg-red-50' : 'bg-gray-50'
                                                )}>
                                                    {getTransactionIcon(tx.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{getTransactionLabel(tx.type)}</p>
                                                    <p className="text-xs text-text-subtle">
                                                        {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                                                            day: 'numeric', month: 'short', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn("font-bold",
                                                    tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RELEASE' ? 'text-green-600' :
                                                        tx.type === 'WITHDRAWAL' ? 'text-red-600' : 'text-gray-900'
                                                )}>
                                                    {tx.type === 'WITHDRAWAL' || tx.type === 'PAYMENT_LOCK' ? '-' : '+'}
                                                    {formatCurrency(tx.amount)}
                                                </p>
                                                <span className={cn("text-xs px-2 py-0.5 rounded-full",
                                                    tx.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                )}>
                                                    {tx.status === 'APPROVED' ? 'مكتمل' :
                                                        tx.status === 'PENDING' ? 'قيد المعالجة' : 'مرفوض'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
        </svg>
    )
}
