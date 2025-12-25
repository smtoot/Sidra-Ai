'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Ban, CheckCircle, User as UserIcon, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async (query?: string) => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(query);
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData(searchQuery);
    };

    const handleToggleBan = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? "حظر" : "إلغاء حظر";
        if (!confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) return;

        setProcessingId(id);
        try {
            await adminApi.toggleBan(id);
            setUsers(prev => prev.map(u =>
                u.id === id ? { ...u, isActive: !u.isActive } : u
            ));
        } catch (error) {
            alert("فشل تنفيذ الإجراء");
        } finally {
            setProcessingId(null);
        }
    };

    const getRoleBadgeVariant = (role: string): 'success' | 'warning' | 'error' | 'info' => {
        if (role === 'ADMIN') return 'error';
        if (role === 'TEACHER') return 'info';
        if (role === 'PARENT') return 'warning';
        return 'neutral' as any;
    };

    const getRoleLabel = (role: string): string => {
        const labels: Record<string, string> = {
            'ADMIN': 'مسؤول',
            'TEACHER': 'معلم',
            'STUDENT': 'طالب',
            'PARENT': 'ولي أمر',
        };
        return labels[role] || role;
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
                    <p className="text-sm text-gray-600 mt-1">البحث وإدارة حسابات المستخدمين</p>
                </header>

                {/* Search */}
                <Card padding="md">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                                className="pr-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">بحث</Button>
                    </form>
                </Card>

                {/* Users Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد نتائج</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>المستخدم</TableHead>
                                    <TableHead>الدور</TableHead>
                                    <TableHead>رقم الهاتف</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={user.email}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.email}</p>
                                                    {user.teacherProfile?.displayName && (
                                                        <p className="text-sm text-gray-500">{user.teacherProfile.displayName}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getRoleBadgeVariant(user.role)} showDot={false}>
                                                {getRoleLabel(user.role)}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {user.phoneNumber || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <StatusBadge variant="success">نشط</StatusBadge>
                                            ) : (
                                                <StatusBadge variant="error">محظور</StatusBadge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        عرض
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant={user.isActive ? "destructive" : "default"}
                                                    onClick={() => handleToggleBan(user.id, user.isActive)}
                                                    disabled={!!processingId}
                                                >
                                                    {user.isActive ? (
                                                        <>
                                                            <Ban className="w-4 h-4" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>
        </div>
    );
}
