'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi, TransactionType, TransactionStatus } from '@/lib/api/wallet';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export default function AdminTransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({
        status: '' as TransactionStatus | '',
        type: '' as TransactionType | '',
        userId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadTransactions();
    }, [filters, meta.page]);

    const loadTransactions = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page: meta.page,
                limit: meta.limit
            };

            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;
            if (filters.userId) params.userId = filters.userId;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const res = await walletApi.getTransactions(params);
            setTransactions(res.data);
            setMeta(res.meta);
        } catch (error) {
            console.error('Failed to load transactions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setMeta(prev => ({ ...prev, page: 1 }));
    };

    const getTypeVariant = (type: TransactionType): 'success' | 'warning' | 'info' | 'neutral' => {
        if (type === 'DEPOSIT') return 'success';
        if (type === 'WITHDRAWAL') return 'warning';
        return 'info';
    };

    const getStatusVariant = (status: TransactionStatus): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'PAID') return 'success';
        if (status === 'APPROVED') return 'info';
        if (status === 'PENDING') return 'warning';
        if (status === 'REJECTED') return 'error';
        return 'neutral' as any;
    };

    const getTypeLabel = (type: TransactionType): string => {
        const labels: Record<TransactionType, string> = {
            'DEPOSIT': 'طلب إيداع',
            'WITHDRAWAL': 'طلب سحب',
            'PAYMENT_LOCK': 'حجز مبلغ',
            'PAYMENT_RELEASE': 'تحويل للمعلم',
            'REFUND': 'استرجاع',
            'CANCELLATION_COMPENSATION': 'تعويض إلغاء',
            'PACKAGE_PURCHASE': 'شراء باقة',
            'PACKAGE_RELEASE': 'دفعة من باقة',
            'ESCROW_RELEASE': 'تسوية نزاع',
            'WITHDRAWAL_COMPLETED': 'سحب مكتمل',
            'WITHDRAWAL_REFUNDED': 'إلغاء سحب',
            'DEPOSIT_APPROVED': 'إيداع مكتمل',
        };
        return labels[type] || type;
    };

    const getStatusLabel = (status: TransactionStatus): string => {
        const labels: Record<TransactionStatus, string> = {
            'PENDING': 'قيد الانتظار',
            'APPROVED': 'موافق عليه',
            'REJECTED': 'مرفوض',
            'PAID': 'مدفوع',
        };
        return labels[status] || status;
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900">سجل المعاملات</h1>
                    <p className="text-sm text-gray-600">جميع العمليات المالية في النظام</p>
                </header>

                {/* Filters */}
                <Card padding="md">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">الحالة</label>
                            <Select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">جميع الحالات</option>
                                <option value="PENDING">قيد الانتظار</option>
                                <option value="APPROVED">معتمد</option>
                                <option value="PAID">مدفوع</option>
                                <option value="REJECTED">مرفوض</option>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">النوع</label>
                            <Select
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                            >
                                <option value="">جميع الأنواع</option>
                                <option value="DEPOSIT">طلب إيداع</option>
                                <option value="DEPOSIT_APPROVED">إيداع مكتمل</option>
                                <option value="WITHDRAWAL">طلب سحب</option>
                                <option value="WITHDRAWAL_COMPLETED">سحب مكتمل</option>
                                <option value="WITHDRAWAL_REFUNDED">إلغاء سحب</option>
                                <option value="PAYMENT_LOCK">حجز مبلغ</option>
                                <option value="PAYMENT_RELEASE">تحويل للمعلم</option>
                                <option value="REFUND">استرجاع</option>
                                <option value="CANCELLATION_COMPENSATION">تعويض إلغاء</option>
                                <option value="PACKAGE_PURCHASE">شراء باقة</option>
                                <option value="PACKAGE_RELEASE">دفعة من باقة</option>
                                <option value="ESCROW_RELEASE">تسوية نزاع</option>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">معرف المستخدم</label>
                            <Input
                                type="text"
                                placeholder="أدخل UUID المستخدم"
                                value={filters.userId}
                                onChange={(e) => handleFilterChange('userId', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">إجراء</label>
                            <Button
                                variant="outline"
                                onClick={() => setFilters({ status: '', type: '', userId: '', startDate: '', endDate: '' })}
                                className="w-full"
                            >
                                إعادة تعيين
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <Card padding="none">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500">جاري التحميل...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">لا توجد معاملات</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>المستخدم</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>المبلغ</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>ملاحظة</TableHead>
                                    <TableHead>إجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-sm text-gray-600">
                                            <div className="space-y-1">
                                                <div>{new Date(tx.createdAt).toLocaleDateString('ar-SA')}</div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(tx.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={tx.wallet?.user?.teacherProfile?.displayName || tx.wallet?.user?.email || 'U'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900">
                                                        {tx.wallet?.user?.teacherProfile?.displayName || tx.wallet?.user?.email || 'Unknown'}
                                                    </div>
                                                    <Link
                                                        href={`/admin/users/${tx.wallet?.userId}`}
                                                        className="text-xs text-primary-600 hover:underline"
                                                    >
                                                        {tx.wallet?.user?.email}
                                                    </Link>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getTypeVariant(tx.type)} showDot={false}>
                                                {getTypeLabel(tx.type)}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="font-bold font-mono tabular-nums text-gray-900">
                                            {Number(tx.amount).toLocaleString()} SDG
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getStatusVariant(tx.status)}>
                                                {getStatusLabel(tx.status)}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-gray-600" title={tx.adminNote}>
                                            {tx.adminNote || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/admin/transactions/${tx.id}`}
                                                className="text-gray-400 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {/* Pagination */}
                <Card padding="md">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-700">
                            صفحة {meta.page} من {meta.totalPages} ({meta.total} نتيجة)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.page <= 1}
                                onClick={() => setMeta(p => ({ ...p, page: p.page - 1 }))}
                            >
                                السابق
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.page >= meta.totalPages}
                                onClick={() => setMeta(p => ({ ...p, page: p.page + 1 }))}
                            >
                                التالي
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
