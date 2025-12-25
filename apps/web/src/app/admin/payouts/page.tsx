'use client';

import { useState, useEffect } from 'react';
import { walletApi, Transaction, TransactionStatus, TransactionType } from '@/lib/api/wallet';
import { cn } from '@/lib/utils';
import { Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Download, Eye, FileText, Upload } from 'lucide-react';

export default function AdminPayoutsPage() {
    const [activeTab, setActiveTab] = useState<TransactionStatus>('PENDING');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, [activeTab]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const res = await walletApi.getTransactions({
                type: 'WITHDRAWAL',
                status: activeTab
            });
            // @ts-ignore
            setTransactions(res.data);
        } catch (error) {
            console.error("Failed to load payouts", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-tajawal rtl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">أرشيف طلبات السحب</h1>
                <p className="text-gray-500">
                    سجل وتفاصيل طلبات سحب الأرباح (Payout Archive)
                </p>
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg mt-3 inline-block">
                    صفحة عرض فقط لمتابعة حالات السحب — لا يمكن تنفيذ أي إجراء من هنا.
                </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 overflow-x-auto">
                <TabButton active={activeTab === 'PENDING'} onClick={() => setActiveTab('PENDING')} icon={<Clock className="w-4 h-4" />} label="قيد الانتظار" count={0} />
                <TabButton active={activeTab === 'APPROVED'} onClick={() => setActiveTab('APPROVED')} icon={<CheckCircle className="w-4 h-4" />} label="تمت الموافقة (جاهز للدفع)" count={0} />
                <TabButton active={activeTab === 'PAID'} onClick={() => setActiveTab('PAID')} icon={<Download className="w-4 h-4" />} label="تم الدفع" count={0} />
                <TabButton active={activeTab === 'REJECTED'} onClick={() => setActiveTab('REJECTED')} icon={<XCircle className="w-4 h-4" />} label="مرفوض" count={0} />
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-gray-400">لا توجد طلبات في هذه القائمة</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 font-medium">المعلم</th>
                                <th className="p-4 font-medium">المبلغ</th>
                                <th className="p-4 font-medium">تاريخ الطلب</th>
                                <th className="p-4 font-medium">الحساب البنكي (Snapshot)</th>
                                <th className="p-4 font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{tx.wallet?.user?.teacherProfile?.displayName || tx.wallet?.user?.email}</div>
                                        <div className="text-xs text-gray-500">{tx.wallet?.user?.email}</div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">{Number(tx.amount).toLocaleString()} SDG</td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(tx.createdAt).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {tx.bankSnapshot ? (
                                            <div className="flex flex-col gap-1 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 w-fit">
                                                <span className="font-bold">{tx.bankSnapshot.bankName}</span>
                                                {tx.bankSnapshot.bankBranch && <span>{tx.bankSnapshot.bankBranch}</span>}
                                                <div className="flex gap-2">
                                                    <span className="text-gray-400">Account:</span>
                                                    <span dir="ltr" className="select-all font-mono">{tx.bankSnapshot.accountNumber || tx.bankSnapshot.accountNumberMasked}</span>
                                                </div>
                                                {tx.bankSnapshot.iban && (
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-400">IBAN:</span>
                                                        <span dir="ltr" className="select-all font-mono">{tx.bankSnapshot.iban}</span>
                                                    </div>
                                                )}
                                                <div className="mt-1 pt-1 border-t border-gray-200">
                                                    {tx.bankSnapshot.accountHolder}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-red-400 text-xs">لا يوجد بيانات</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <a
                                            href={`/admin/payouts/${tx.id}`}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-bold text-sm flex items-center gap-2 w-fit"
                                        >
                                            <Eye className="w-4 h-4" />
                                            عرض التفاصيل
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div >
    );
}

function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
                active ? "border-primary text-primary font-bold" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
        >
            {icon}
            {label}
            {count > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{count}</span>}
        </button>
    );
}


