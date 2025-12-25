'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Shield, Search, ChevronLeft, ChevronRight, Eye, Loader2 } from 'lucide-react';

const AUDIT_ACTIONS = [
    'SETTINGS_UPDATE', 'USER_BAN', 'USER_UNBAN', 'USER_VERIFY', 'USER_REJECT',
    'DISPUTE_RESOLVE', 'DISPUTE_DISMISS', 'PAYOUT_PROCESS', 'BOOKING_CANCEL', 'REFUND_PROCESS'
];

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [actionFilter, setActionFilter] = useState('');
    const [actorIdFilter, setActorIdFilter] = useState('');

    useEffect(() => {
        loadLogs();
    }, [page, actionFilter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAuditLogs({
                page, limit: 20,
                action: actionFilter || undefined,
                actorId: actorIdFilter || undefined
            });
            setLogs(data.items);
            setTotalPages(data.meta.pages);
        } catch (error) {
            console.error("Failed to load logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadLogs();
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-6 h-6 text-primary-600" />
                        <h1 className="text-2xl font-bold text-gray-900">سجل العمليات</h1>
                    </div>
                    <p className="text-sm text-gray-600">تتبع جميع الإجراءات الحساسة في النظام</p>
                </header>

                {/* Filters */}
                <Card padding="md">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-2">نوع العملية</label>
                            <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
                                <option value="">الكل</option>
                                {AUDIT_ACTIONS.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <form onSubmit={handleSearch} className="flex gap-2 items-end">
                                <div className="w-full">
                                    <label className="block text-sm font-medium mb-2">معرف المستخدم</label>
                                    <Input
                                        placeholder="بحث بـ ID المستخدم..."
                                        value={actorIdFilter}
                                        onChange={(e) => setActorIdFilter(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="secondary">
                                    <Search className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد سجلات</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>الوقت</TableHead>
                                    <TableHead>المسؤول</TableHead>
                                    <TableHead>العملية</TableHead>
                                    <TableHead>الهدف</TableHead>
                                    <TableHead>التفاصيل</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm font-mono" dir="ltr">
                                            {new Date(log.createdAt).toLocaleString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">
                                                {log.actor?.email || log.actorId.slice(0, 8)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {log.actor?.role}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant="info" showDot={false}>
                                                {log.action}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 font-mono">
                                            {log.targetId ? log.targetId.slice(0, 8) + '...' : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log.payload ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                                >
                                                    <Eye className="w-4 h-4 ml-1" />
                                                    عرض
                                                </Button>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronRight className="w-4 h-4 ml-2" />
                            السابق
                        </Button>
                        <span className="text-sm text-gray-600">
                            صفحة {page} من {totalPages}
                        </span>
                        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                            التالي
                            <ChevronLeft className="w-4 h-4 mr-2" />
                        </Button>
                    </div>
                </Card>

                {/* Payload Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                        <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 space-y-4">
                                <h3 className="text-lg font-bold">تفاصيل العملية</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">العملية:</span>
                                        <span className="mr-2 font-bold">{selectedLog.action}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">التاريخ:</span>
                                        <span className="mr-2 font-mono" dir="ltr">{new Date(selectedLog.createdAt).toISOString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">المسؤول:</span>
                                        <span className="mr-2">{selectedLog.actor?.email}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">الهدف:</span>
                                        <span className="mr-2 font-mono">{selectedLog.targetId}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-900 text-gray-50 p-4 rounded-lg overflow-x-auto text-xs font-mono" dir="ltr">
                                    <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
