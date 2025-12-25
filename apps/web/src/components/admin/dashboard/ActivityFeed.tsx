'use client';

import { adminApi } from '@/lib/api/admin';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLog {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    actor: {
        email: string;
        role: string;
    };
}

export function ActivityFeed() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getAuditLogs({ limit: 10 })
            .then((res: any) => {
                const data = Array.isArray(res) ? res : (res.data || []);
                setLogs(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const formatAction = (action: string) => {
        const map: Record<string, string> = {
            'LOGIN': 'تسجيل دخول',
            'REGISTER': 'تسجيل مستخدم جديد',
            'DEPOSIT_APPROVED': 'إيداع معتمد',
            'WITHDRAWAL_APPROVED': 'سحب معتمد',
            'DISPUTE_RESOLVED': 'حل نزاع',
        };
        return map[action] || action;
    };

    if (loading) {
        return (
            <Card padding="none" className="h-64 animate-pulse bg-gray-100" />
        );
    }

    return (
        <Card padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-sm text-gray-900">سجل النشاط الحديث</h3>
            </div>

            {/* Table */}
            <div className="max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow hover={false}>
                            <TableHead>الوقت</TableHead>
                            <TableHead>الحدث</TableHead>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>رابط</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow hover={false}>
                                <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                    لا يوجد نشاط حديث في النظام
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-xs">
                                                {formatDistanceToNow(new Date(log.createdAt), {
                                                    addSuffix: true,
                                                    locale: ar
                                                })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900">
                                        {formatAction(log.action)}
                                    </TableCell>
                                    <TableCell className="text-gray-600 text-sm truncate max-w-[200px]" title={log.actor.email}>
                                        {log.actor.email}
                                    </TableCell>
                                    <TableCell>
                                        <button className="text-sm text-primary-600 hover:underline">
                                            تفاصيل ←
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
