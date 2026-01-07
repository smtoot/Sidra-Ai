'use client';

import { useState, useEffect } from 'react';
import { walletApi, Wallet } from '@/lib/api/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DepositModal from '@/components/wallet/DepositModal';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, Loader2, CreditCard, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ParentWalletPage() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const loadWallet = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await walletApi.getMyBalance();
            setWallet(data);
        } catch (err) {
            console.error("Failed to load wallet", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWallet();
    }, []);

    const getStatusBadge = (status: string) => {
        const config = {
            'APPROVED': { bg: 'bg-success-100', text: 'text-success-700', label: 'مقبول', icon: CheckCircle },
            'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', label: 'مرفوض', icon: XCircle },
            'PENDING': { bg: 'bg-warning-100', text: 'text-warning-700', label: 'قيد المراجعة', icon: Clock },
        };
        const badge = config[status as keyof typeof config] || config.PENDING;
        const Icon = badge.icon;
        return (
            <span className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", badge.bg, badge.text)}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return 'إيداع رصيد';
            case 'PAYMENT_LOCK': return 'دفع حجز';
            case 'REFUND': return 'استرداد';
            case 'PACKAGE_PURCHASE': return 'شراء باقة';
            case 'PACKAGE_RELEASE': return 'إكمال حصة باقة';
            default: return type;
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return <ArrowDownLeft className="w-5 h-5 text-success-600" />;
            case 'REFUND': return <TrendingUp className="w-5 h-5 text-blue-600" />;
            case 'PAYMENT_LOCK': return <CreditCard className="w-5 h-5 text-orange-600" />;
            case 'PACKAGE_PURCHASE': return <CreditCard className="w-5 h-5 text-purple-600" />;
            default: return <WalletIcon className="w-5 h-5 text-gray-600" />;
        }
    };

    const formatCurrency = (amount: string | number) => {
        return `${Number(amount).toLocaleString()} SDG`;
    };

    // Calculate pending deposits count
    const pendingDepositsCount = wallet?.transactions.filter(
        tx => tx.type === 'DEPOSIT' && tx.status === 'PENDING'
    ).length || 0;

    // Calculate total spent (approved payment locks)
    const totalSpent = wallet?.transactions
        .filter(tx => tx.type === 'PAYMENT_LOCK' && tx.status === 'APPROVED')
        .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-tajawal p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <header className="mb-2">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">المحفظة</h1>
                        {wallet?.readableId && (
                            <span className="bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 text-xs px-3 py-1 rounded-lg font-mono border border-gray-200 shadow-sm" dir="ltr">
                                {wallet.readableId}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 flex items-center gap-2">
                        <WalletIcon className="w-5 h-5" />
                        <span>إدارة رصيدك وعمليات الدفع</span>
                    </p>
                </header>

                {loading ? (
                    <Card className="border-none shadow-md">
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                            <p className="text-gray-500">جاري التحميل...</p>
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100 border-r-4 border-r-red-500">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                            <p className="text-red-700 font-semibold">حدث خطأ في تحميل المحفظة</p>
                            <Button variant="outline" className="mt-4" onClick={loadWallet}>
                                إعادة المحاولة
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Balance Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Available Balance - Main Card */}
                            <Card className="md:col-span-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden shadow-md">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-primary-100/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-gray-600 mb-2 text-sm">الرصيد المتاح</p>
                                            <h2 className="text-4xl md:text-5xl font-bold text-primary-700 mb-2">
                                                {formatCurrency(wallet?.balance || 0)}
                                            </h2>
                                            <div className="flex items-center gap-1.5 text-success-600 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>متاح للاستخدام</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="lg"
                                            className="gap-2 min-w-[150px] bg-primary-700 hover:bg-primary-800 shadow-lg"
                                            onClick={() => setIsDepositOpen(true)}
                                        >
                                            <ArrowUpRight className="w-5 h-5" />
                                            إيداع رصيد
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pending Balance Card */}
                            <Card className="border-none shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-600 text-sm font-medium">الرصيد المعلق</p>
                                        <div className="p-2 bg-gray-200 rounded-lg">
                                            <Clock className="w-5 h-5 text-gray-600" />
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-700 mb-2">
                                        {formatCurrency(wallet?.pendingBalance || 0)}
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        مبالغ محجوزة للحجوزات النشطة
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Pending Deposits Alert */}
                            {pendingDepositsCount > 0 && (
                                <Card className="border-warning-200 bg-gradient-to-br from-warning-50 to-orange-50 border-r-4 border-r-warning-500">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-warning-600" />
                                        </div>
                                        <div>
                                            <p className="text-warning-800 font-bold text-lg">{pendingDepositsCount}</p>
                                            <p className="text-warning-700 text-sm">إيداعات قيد المراجعة</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Total Spent */}
                            {totalSpent > 0 && (
                                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-blue-800 font-bold text-lg">{formatCurrency(totalSpent)}</p>
                                            <p className="text-blue-700 text-sm">إجمالي المدفوعات</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Transaction History */}
                        <Card className="border-none shadow-md">
                            <CardHeader className="border-b bg-gray-50/50">
                                <CardTitle className="text-lg font-bold">آخر العمليات</CardTitle>
                            </CardHeader>

                            {wallet?.transactions.length === 0 ? (
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <WalletIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 mb-2">لا توجد عمليات سابقة</p>
                                    <p className="text-gray-400 text-sm">ابدأ بإيداع رصيد لحجز جلسات أبنائك</p>
                                </CardContent>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {wallet?.transactions.map(tx => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                                    tx.type === 'DEPOSIT' ? "bg-success-100" :
                                                        tx.type === 'REFUND' ? "bg-blue-100" :
                                                            tx.type === 'PACKAGE_PURCHASE' ? "bg-purple-100" :
                                                                "bg-orange-100"
                                                )}>
                                                    {getTransactionIcon(tx.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {getTransactionTypeLabel(tx.type)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                                                            day: 'numeric', month: 'short', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                    {tx.readableId && (
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">
                                                            #{tx.readableId}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className={cn(
                                                    "font-bold text-lg mb-1",
                                                    tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? "text-success-600" : "text-orange-600"
                                                )}>
                                                    {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'}
                                                    {formatCurrency(tx.amount)}
                                                </p>
                                                {getStatusBadge(tx.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>

            <DepositModal
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                onSuccess={loadWallet}
            />
        </div>
    );
}
