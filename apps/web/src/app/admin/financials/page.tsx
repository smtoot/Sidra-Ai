'use client';

import { useState, useEffect } from 'react';
import { walletApi, TransactionStatus } from '@/lib/api/wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, ExternalLink } from 'lucide-react';

export default function AdminFinancialsPage() {
    const [transactions, setTransactions] = useState<any[]>([]); // Using any for joined user data
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await walletApi.getPendingTransactions();
            setTransactions(data);
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

        if (!confirm(status === 'APPROVED' ? "هل أنت متأكد من الموافقة وإيداع المبلغ؟" : "هل أنت متأكد من الرفض؟")) return;

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
                    <p className="text-text-subtle">مراجعة الإيصالات وعمليات الإيداع</p>
                </header>

                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-text-subtle font-bold border-b">
                            <tr>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">المستخدم</th>
                                <th className="p-4">المبلغ</th>
                                <th className="p-4">الإيصال</th>
                                <th className="p-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-text-subtle">
                                        لا توجد عمليات معلقة
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50">
                                        <td className="p-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="font-bold">{tx.wallet?.user?.email}</div>
                                            <div className="text-xs text-text-subtle">Wallet: {tx.walletId}</div>
                                        </td>
                                        <td className="p-4 font-bold text-lg text-primary">{tx.amount} SDG</td>
                                        <td className="p-4">
                                            {tx.referenceImage ? (
                                                <a href={tx.referenceImage} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                                                    <ExternalLink className="w-4 h-4" />
                                                    عرض الصورة
                                                </a>
                                            ) : (
                                                <span className="text-text-subtle">لا يوجد</span>
                                            )}
                                        </td>
                                        <td className="p-4 space-y-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-success hover:bg-success/90 text-white w-24"
                                                    onClick={() => handleProcess(tx.id, 'APPROVED')}
                                                    disabled={processingId === tx.id}
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    موافقة
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="w-24"
                                                    onClick={() => handleProcess(tx.id, 'REJECTED')}
                                                    disabled={processingId === tx.id}
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    رفض
                                                </Button>
                                            </div>
                                            {/* Simple input for rejection reason if needed, could be improved UI wise */}
                                            <Input
                                                placeholder="سبب الرفض..."
                                                className="h-8 text-xs"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
