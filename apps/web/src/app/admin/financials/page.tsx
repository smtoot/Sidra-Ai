'use client';

import { useState, useEffect } from 'react';
import { walletApi, TransactionStatus } from '@/lib/api/wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, ExternalLink } from 'lucide-react';

export default function AdminFinancialsPage() {
    const [transactions, setTransactions] = useState<any[]>([]); // Using any for joined user data
    const [stats, setStats] = useState<{
        totalRevenue: number;
        pendingPayouts: { amount: number; count: number };
        totalPayouts: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pendingData, statsData] = await Promise.all([
                walletApi.getPendingTransactions(),
                walletApi.getAdminStats()
            ]);
            setTransactions(pendingData);
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

    const handleProcess = async (id: string, status: TransactionStatus) => {
        if (status === 'REJECTED' && !rejectionReason) {
            alert("يرجى كتابة سبب الرفض");
            return;
        }

        if (!confirm(status === 'APPROVED' ? "هل أنت متأكد من الموافقة؟" : "هل أنت متأكد من الرفض؟")) return;

        setProcessingId(id);
        try {
            await walletApi.processTransaction(id, {
                status,
                adminNote: status === 'REJECTED' ? rejectionReason : undefined
            });
            await loadData(); // Reload list
            setRejectionReason('');
        } catch (error) {
            console.error("Failed to process", error);
            alert("فشل الإجراء");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">الإدارة المالية</h1>
                    <p className="text-text-subtle">متابعة الإيرادات والمدفوعات</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-text-subtle text-sm font-medium">إجمالي الإيداعات</h3>
                        <p className="text-2xl font-bold text-primary mt-2">
                            {stats?.totalRevenue.toLocaleString() || '0'} SDG
                        </p>
                    </div>
                    <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-text-subtle text-sm font-medium">المدفوعات المكتملة</h3>
                        <p className="text-2xl font-bold text-success mt-2">
                            {stats?.totalPayouts.toLocaleString() || '0'} SDG
                        </p>
                    </div>
                    <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-text-subtle text-sm font-medium">طلبات معلقة</h3>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-2xl font-bold text-warning">
                                {stats?.pendingPayouts.amount.toLocaleString() || '0'} SDG
                            </p>
                            <span className="text-sm text-text-subtle mb-1">
                                ({stats?.pendingPayouts.count || 0} طلب)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-primary">العمليات المعلقة</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-text-subtle">لا توجد عمليات معلقة</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-right">
                                    <tr>
                                        <th className="p-4 text-sm font-medium text-text-subtle">المستخدم</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">النوع</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">المبلغ</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">المرفق</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">التاريخ</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="font-medium text-primary">
                                                    {tx.wallet?.user?.email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'DEPOSIT'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' ? 'إيداع بنكي' : 'طلب سحب'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-primary">
                                                {tx.amount} SDG
                                            </td>
                                            <td className="p-4 text-sm text-primary">
                                                {tx.referenceImage ? (
                                                    <a href={tx.referenceImage} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        <ExternalLink className="w-3 h-3" />
                                                        عرض
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-text-subtle">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-success text-white hover:bg-success/90 h-8"
                                                        onClick={() => handleProcess(tx.id, 'APPROVED')}
                                                        disabled={!!processingId}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </Button>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="سبب الرفض"
                                                            className="h-8 text-xs w-32"
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8"
                                                            onClick={() => handleProcess(tx.id, 'REJECTED')}
                                                            disabled={!!processingId}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
