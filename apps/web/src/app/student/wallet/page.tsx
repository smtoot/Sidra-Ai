'use client';

import { useState, useEffect } from 'react';
import { walletApi, Wallet } from '@/lib/api/wallet';
import { Button } from '@/components/ui/button';
import DepositModal from '@/components/wallet/DepositModal';
import { Wallet as WalletIcon, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentWalletPage() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

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

    useEffect(() => {
        loadWallet();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="flex items-center gap-1 text-success text-sm bg-success/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3" /> مقبول</span>;
            case 'REJECTED':
                return <span className="flex items-center gap-1 text-error text-sm bg-error/10 px-2 py-1 rounded"><XCircle className="w-3 h-3" /> مرفوض</span>;
            default:
                return <span className="flex items-center gap-1 text-warning text-sm bg-warning/10 px-2 py-1 rounded"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
        }
    };

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'DEPOSIT':
                return 'إيداع بنكي';
            case 'PAYMENT_LOCK':
                return 'دفع حجز';
            case 'REFUND':
                return 'استرداد';
            default:
                return type;
        }
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">المحفظة 💳</h1>
                        <p className="text-text-subtle">إدارة رصيدك وعمليات الدفع</p>
                    </div>
                </header>

                {/* Balance Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 border-r-4 border-r-primary-600">
                    <div className="space-y-2 text-center md:text-right">
                        <p className="text-gray-500 text-sm">الرصيد المتاح</p>
                        <h2 className="text-5xl font-bold text-primary-700">{wallet?.balance || '0'} <span className="text-2xl font-normal text-gray-500">SDG</span></h2>
                        {Number(wallet?.pendingBalance) > 0 && (
                            <p className="text-warning-700 text-sm bg-warning-50 px-3 py-1 rounded-full inline-block mt-2">
                                معلق: {wallet?.pendingBalance} SDG
                            </p>
                        )}
                    </div>
                    <Button
                        size="lg"
                        className="gap-2 min-w-[150px]"
                        onClick={() => setIsDepositOpen(true)}
                    >
                        <ArrowUpRight className="w-5 h-5" />
                        إيداع رصيد
                    </Button>
                </div>

                {/* Transactions */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b font-bold text-lg text-primary">آخر العمليات</div>
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-text-subtle">جاري التحميل...</div>
                        ) : wallet?.transactions.length === 0 ? (
                            <div className="p-8 text-center text-text-subtle">لا توجد عمليات سابقة.</div>
                        ) : (
                            wallet?.transactions.map(tx => (
                                <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            tx.type === 'DEPOSIT' ? "bg-green-100 text-green-600" :
                                                tx.type === 'REFUND' ? "bg-blue-100 text-blue-600" :
                                                    "bg-orange-100 text-orange-600"
                                        )}>
                                            {tx.type === 'DEPOSIT' ? <ArrowUpRight className="w-5 h-5" /> : <WalletIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary">
                                                {getTransactionTypeLabel(tx.type)}
                                            </p>
                                            <p className="text-xs text-text-subtle">
                                                {new Date(tx.createdAt).toLocaleDateString('ar-EG')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className={cn(
                                            "font-bold",
                                            tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? "text-green-600" : "text-orange-600"
                                        )}>
                                            {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'}{tx.amount} SDG
                                        </p>
                                        <div className="mt-1">{getStatusBadge(tx.status)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <DepositModal
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                onSuccess={loadWallet}
            />
        </div>
    );
}
