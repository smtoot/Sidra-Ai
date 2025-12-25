'use client';
import { useState, useEffect } from 'react';
import { walletApi, Wallet, Transaction } from '@/lib/api/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft, Building2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import { BankInfoForm } from '@/components/teacher/wallet/BankInfoForm';
import { WithdrawalRequestModal } from '@/components/teacher/wallet/WithdrawalRequestModal';

const TRANSACTIONS_PER_PAGE = 10;

export default function TeacherWalletPage() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBankForm, setShowBankForm] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

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

    const hasActiveWithdrawal = wallet?.transactions.some(
        tx => tx.type === 'WITHDRAWAL' && (tx.status === 'PENDING' || tx.status === 'APPROVED')
    );

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return <ArrowDownLeft className="w-5 h-5 text-success-600" />;
            case 'WITHDRAWAL': return <ArrowUpRight className="w-5 h-5 text-red-600" />;
            case 'PAYMENT_RELEASE': return <TrendingUp className="w-5 h-5 text-success-600" />;
            case 'PAYMENT_LOCK': return <Clock className="w-5 h-5 text-warning-600" />;
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

    const getStatusBadge = (status: string) => {
        const config = {
            'APPROVED': { bg: 'bg-success-100', text: 'text-success-700', label: 'تمت الموافقة' },
            'PAID': { bg: 'bg-green-100', text: 'text-green-700', label: 'تم الدفع' },
            'PENDING': { bg: 'bg-warning-100', text: 'text-warning-700', label: 'قيد المعالجة' },
            'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', label: 'مرفوض' },
        };
        const badge = config[status as keyof typeof config] || config.PENDING;
        return (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badge.bg, badge.text)}>
                {badge.label}
            </span>
        );
    };

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8" dir="rtl">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">المحفظة</h1>
                                {wallet?.readableId && (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono border border-gray-200" dir="ltr">
                                        {wallet.readableId}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm md:text-base text-gray-600">إدارة الأرصدة والمعاملات المالية</p>
                        </div>
                    </header>

                    {loading ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                                <p className="text-gray-500">جاري التحميل...</p>
                            </CardContent>
                        </Card>
                    ) : !wallet ? (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-8 text-center text-red-700">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                                حدث خطأ في تحميل المحفظة
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Balance Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary-100/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                    <CardContent className="p-6 relative z-10">
                                        <p className="text-gray-600 mb-2 text-sm">الرصيد الحالي</p>
                                        <h2 className="text-4xl font-bold text-primary-700 mb-3">{formatCurrency(wallet.balance)}</h2>
                                        <div className="flex items-center gap-1.5 text-success-600 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>متاح للسحب</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-gray-200">
                                    <CardContent className="p-6">
                                        <p className="text-gray-600 mb-2 text-sm">الرصيد المعلق</p>
                                        <h2 className="text-4xl font-bold text-gray-400 mb-3">{formatCurrency(wallet.pendingBalance)}</h2>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>أرباح قيد المعالجة</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Bank Info Section */}
                            {showBankForm ? (
                                <BankInfoForm onSuccess={() => { setShowBankForm(false); loadWallet(); }} onCancel={() => setShowBankForm(false)} />
                            ) : (
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center",
                                                    wallet.bankInfo ? "bg-success-100 text-success-600" : "bg-gray-100 text-gray-400")}>
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 mb-1">بيانات الحساب البنكي</h3>
                                                    {wallet.bankInfo ? (
                                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                                            <span>{wallet.bankInfo.bankName}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span dir="ltr">{wallet.bankInfo.accountNumberMasked}</span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">لم يتم إضافة حساب بنكي بعد</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setShowBankForm(true)}
                                                variant="outline"
                                                className="border-primary-200 text-primary-700 hover:bg-primary-50"
                                            >
                                                {wallet.bankInfo ? 'تحديث البيانات' : 'إضافة حساب بنكي'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Withdraw Action */}
                            <Card className="border-blue-200 bg-blue-50/50">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <WalletIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-1">سحب الأرباح</h3>
                                                <p className="text-sm text-gray-600">يمكنك طلب سحب أرباحك إلى حسابك البنكي</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Button
                                                onClick={() => setShowWithdrawModal(true)}
                                                disabled={!wallet.bankInfo || hasActiveWithdrawal || Number(wallet.balance) <= 0}
                                                className="bg-primary-700 hover:bg-primary-800"
                                            >
                                                طلب سحب جديد
                                            </Button>
                                            {/* Warnings / Status Messages */}
                                            {!wallet.bankInfo && (
                                                <span className="text-xs text-warning-600 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    يجب إضافة حساب بنكي أولاً
                                                </span>
                                            )}
                                            {hasActiveWithdrawal && (
                                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    لديك طلب سحب قيد المعالجة
                                                </span>
                                            )}
                                            {wallet.bankInfo && !hasActiveWithdrawal && Number(wallet.balance) < 500 && (
                                                <span className="text-xs text-gray-500">
                                                    الحد الأدنى للسحب 500 SDG
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Transaction History */}
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle>آخر المعاملات</CardTitle>
                                </CardHeader>

                                {wallet.transactions.length === 0 ? (
                                    <CardContent className="p-12 text-center text-gray-500">
                                        <WalletIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>لا توجد معاملات سابقة</p>
                                    </CardContent>
                                ) : (
                                    <>
                                        <div className="divide-y divide-gray-100">
                                            {(() => {
                                                // Pagination logic
                                                const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
                                                const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
                                                const paginatedTransactions = wallet.transactions.slice(startIndex, endIndex);

                                                return paginatedTransactions.map((tx) => (
                                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center",
                                                                tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RELEASE' ? 'bg-success-100' :
                                                                    tx.type === 'WITHDRAWAL' ? 'bg-red-100' : 'bg-gray-100'
                                                            )}>
                                                                {getTransactionIcon(tx.type)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{getTransactionLabel(tx.type)}</p>
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
                                                        <div className="text-right">
                                                            <p className={cn("font-bold text-lg mb-1",
                                                                tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RELEASE' ? 'text-success-600' :
                                                                    tx.type === 'WITHDRAWAL' ? 'text-red-600' : 'text-gray-900'
                                                            )}>
                                                                {tx.type === 'WITHDRAWAL' || tx.type === 'PAYMENT_LOCK' ? '-' : '+'}
                                                                {formatCurrency(tx.amount)}
                                                            </p>
                                                            {getStatusBadge(tx.status)}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>

                                        {/* Pagination */}
                                        {wallet.transactions.length > TRANSACTIONS_PER_PAGE && (
                                            <div className="p-4 border-t">
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={Math.ceil(wallet.transactions.length / TRANSACTIONS_PER_PAGE)}
                                                    onPageChange={(page) => {
                                                        setCurrentPage(page);
                                                        // Scroll to transactions section
                                                        document.querySelector('[class*="آخر المعاملات"]')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </Card>
                        </>
                    )}
                </div>
                {/* Modals */}
                {wallet && wallet.bankInfo && (
                    <WithdrawalRequestModal
                        isOpen={showWithdrawModal}
                        onClose={() => setShowWithdrawModal(false)}
                        onSuccess={() => { loadWallet(); }}
                        maxAmount={Number(wallet.balance)}
                        bankInfo={wallet.bankInfo}
                    />
                )}
            </div>
        </TeacherApprovalGuard>
    );
}
