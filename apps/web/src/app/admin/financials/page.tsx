'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { walletApi, TransactionStatus } from '@/lib/api/wallet';
import { getFileUrl, getAuthenticatedFileUrl } from '@/lib/api/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Check, X, ExternalLink, Info, Wallet, TrendingDown, AlertCircle } from 'lucide-react';

export default function AdminFinancialsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isAuthorized = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'].includes(user?.role || '');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState<{
        totalRevenue: number;
        pendingPayouts: { amount: number; count: number };
        totalPayouts: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectItem, setRejectItem] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Payment Modal State
    const [showPayModal, setShowPayModal] = useState(false);
    const [payItem, setPayItem] = useState<any>(null);
    const [proofId, setProofId] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [pendingRes, approvedRes, statsData] = await Promise.all([
                walletApi.getTransactions({ status: 'PENDING' }),
                walletApi.getTransactions({ status: 'APPROVED' }),
                walletApi.getAdminStats()
            ]);

            const pendingData = pendingRes.data || [];
            const approvedData = approvedRes.data || [];
            const combined = [...pendingData, ...approvedData].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const filtered = combined.filter(tx => {
                if (tx.type === 'DEPOSIT') return tx.status === 'PENDING';
                if (tx.type === 'WITHDRAWAL') return tx.status === 'PENDING' || tx.status === 'APPROVED';
                return false;
            });

            setTransactions(filtered);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load transactions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApproveRequest = async (tx: any) => {
        const isDeposit = tx.type === 'DEPOSIT';
        const msg = isDeposit
            ? "هل أنت متأكد من تأكيد استلام الإيداع؟ (سيتم إضافة الرصيد للمستخدم)"
            : "هل أنت متأكد من الموافقة على طلب السحب؟ (سيتم تعليق الرصيد بانتظار الدفع)";

        if (!confirm(msg)) return;

        setProcessingId(tx.id);
        try {
            await walletApi.processTransaction(tx.id, { status: 'APPROVED' });
            await loadData();
        } catch (error) {
            console.error("Failed to approve", error);
            alert("فشل الإجراء");
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (tx: any) => {
        setRejectItem(tx);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectItem || !rejectionReason) return;
        setProcessingId(rejectItem.id);
        try {
            await walletApi.processTransaction(rejectItem.id, {
                status: 'REJECTED',
                adminNote: rejectionReason
            });
            setShowRejectModal(false);
            setRejectItem(null);
            await loadData();
        } catch (error) {
            console.error("Failed to reject", error);
            alert("فشل الرفض");
        } finally {
            setProcessingId(null);
        }
    };

    const openPayModal = (tx: any) => {
        setPayItem(tx);
        setProofId('');
        setShowPayModal(true);
    };

    const handleConfirmPay = async () => {
        if (!payItem || !proofId) return;
        setProcessingId(payItem.id);
        try {
            await walletApi.processTransaction(payItem.id, {
                status: 'PAID',
                referenceId: proofId,
            });
            setShowPayModal(false);
            setPayItem(null);
            await loadData();
        } catch (error) {
            console.error("Failed to pay", error);
            alert("فشل تسجيل الدفع");
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewReceipt = async (referenceImage: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // If already a full URL, use directly
            if (referenceImage.startsWith('http://') || referenceImage.startsWith('https://')) {
                window.open(referenceImage, '_blank');
                return;
            }
            // Otherwise, fetch authenticated URL
            const url = await getAuthenticatedFileUrl(referenceImage);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Failed to get receipt URL:', error);
        }
    };

    const getStatusVariant = (status: TransactionStatus): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'PENDING') return 'warning';
        if (status === 'APPROVED') return 'info';
        if (status === 'PAID') return 'success';
        if (status === 'REJECTED') return 'error';
        return 'neutral' as any;
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">لوحة المهام المالية</h1>
                    <p className="text-sm text-gray-600">
                        متابعة الإيداعات والسحوبات (Financial Task Board)
                    </p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-primary-50 rounded-lg">
                                <Wallet className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">إجمالي الإيداعات (Liability)</span>
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold font-mono text-gray-900 tabular-nums">
                            {stats?.totalRevenue.toLocaleString() || '0'}
                            <span className="text-lg text-gray-500 mr-2">SDG</span>
                        </div>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-success-50 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-success-600" />
                            </div>
                            <span className="text-sm text-gray-600">السحوبات المكتملة</span>
                        </div>
                        <div className="text-3xl font-bold font-mono text-gray-900 tabular-nums">
                            {stats?.totalPayouts.toLocaleString() || '0'}
                            <span className="text-lg text-gray-500 mr-2">SDG</span>
                        </div>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-warning-50 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-warning-600" />
                            </div>
                            <span className="text-sm text-gray-600">سحوبات معلقة</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold font-mono text-gray-900 tabular-nums">
                                {stats?.pendingPayouts.amount.toLocaleString() || '0'}
                                <span className="text-lg text-gray-500 mr-2">SDG</span>
                            </div>
                            <span className="text-sm text-gray-500">
                                ({stats?.pendingPayouts.count || 0} طلب)
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Transactions Table */}
                <Card padding="none">
                    <CardHeader className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">قائمة المهام (إيداعات وسحوبات)</CardTitle>
                            <span className="text-sm text-gray-500">يظهر الطلبات المعلقة والتي بانتظار الدفع فقط</span>
                        </div>
                    </CardHeader>

                    {loading ? (
                        <div className="p-12 text-center text-gray-500">جاري التحميل...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">لا توجد مهام معلقة</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>المستخدم</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>المبلغ</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>تفاصيل</TableHead>
                                    {isAuthorized && <TableHead>الإجراء</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow
                                        key={tx.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={tx.wallet?.user?.teacherProfile?.displayName || tx.wallet?.user?.email || 'U'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900">
                                                        {tx.wallet?.user?.teacherProfile?.displayName || tx.wallet?.user?.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {tx.wallet?.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={tx.type === 'DEPOSIT' ? 'success' : 'warning'} showDot={false}>
                                                {tx.type === 'DEPOSIT' ? 'إيداع' : 'سحب'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getStatusVariant(tx.status)}>
                                                {tx.status === 'PENDING' ? 'قيد المراجعة' :
                                                    tx.status === 'APPROVED' ? 'بانتظار الدفع' : tx.status}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="font-bold font-mono tabular-nums text-gray-900">
                                            {tx.amount} SDG
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell className="text-sm" onClick={(e) => e.stopPropagation()}>
                                            {tx.type === 'DEPOSIT' && tx.referenceImage && (
                                                <button
                                                    onClick={(e) => handleViewReceipt(tx.referenceImage, e)}
                                                    className="text-primary-600 hover:underline flex items-center gap-1 text-xs cursor-pointer"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> إيصال
                                                </button>
                                            )}
                                            {tx.type === 'WITHDRAWAL' && (
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    {tx.bankSnapshot ? (
                                                        <>
                                                            <div className="font-semibold text-gray-700">{tx.bankSnapshot.bankName}</div>
                                                            <div className="font-mono text-gray-600">{tx.bankSnapshot.accountNumber}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-red-600">No Bank Info</span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        {isAuthorized && (
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    {tx.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApproveRequest(tx)}
                                                                disabled={!!processingId}
                                                                className="h-8"
                                                            >
                                                                <Check className="w-3 h-3 ml-1" />
                                                                {tx.type === 'DEPOSIT' ? 'تأكيد' : 'موافقة'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => openRejectModal(tx)}
                                                                disabled={!!processingId}
                                                                className="h-8"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    {tx.status === 'APPROVED' && tx.type === 'WITHDRAWAL' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openPayModal(tx)}
                                                            disabled={!!processingId}
                                                            className="bg-success-600 hover:bg-success-700 h-8"
                                                        >
                                                            تسجيل الدفع
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md" padding="md">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-error-600">رفض العملية</h3>
                            <p className="text-sm text-gray-600">يرجى كتابة سبب الرفض (سيظهر للمستخدم).</p>
                            <Input
                                placeholder="سبب الرفض..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => setShowRejectModal(false)}>إلغاء</Button>
                                <Button variant="destructive" onClick={handleConfirmReject}>تأكيد الرفض</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Pay Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md" padding="md">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-success-600">تسجيل الدفع (سحب)</h3>
                            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                                <p><span className="font-semibold">المبلغ:</span> {payItem?.amount} SDG</p>
                                <p><span className="font-semibold">البنك:</span> {payItem?.wallet?.user?.teacherProfile?.bankInfo?.bankName}</p>
                                <p><span className="font-semibold">الحساب:</span> {payItem?.wallet?.user?.teacherProfile?.bankInfo?.accountNumber}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">رقم الإيصال / المرجع (Proof ID)</label>
                                <Input
                                    placeholder="مثال: 123456"
                                    value={proofId}
                                    onChange={(e) => setProofId(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => setShowPayModal(false)}>إلغاء</Button>
                                <Button
                                    className="bg-success-600 hover:bg-success-700"
                                    onClick={handleConfirmPay}
                                    disabled={!proofId}
                                >
                                    تأكيد الدفع
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
