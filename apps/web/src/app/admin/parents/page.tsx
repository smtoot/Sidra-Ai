'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Ban, CheckCircle, User as UserIcon, Heart, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

interface Parent {
    id: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: string;
    firstName?: string;
    lastName?: string;
    _count?: {
        children?: number;
        bookings?: number;
        purchasedPackages?: number;
    };
}

export default function AdminParentsPage() {
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async (query?: string) => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(query);
            // Filter only PARENT role users
            const parentUsers = data.filter((user: any) => user.role === 'PARENT');
            setParents(parentUsers);
        } catch (error) {
            console.error("Failed to load parents", error);
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
        if (!confirm(`هل أنت متأكد من ${action} هذا ولي الأمر؟`)) return;

        setProcessingId(id);
        try {
            await adminApi.toggleBan(id);
            setParents(prev => prev.map(p =>
                p.id === id ? { ...p, isActive: !p.isActive } : p
            ));
        } catch (error) {
            alert("فشل تنفيذ الإجراء");
        } finally {
            setProcessingId(null);
        }
    };

    const getFullName = (parent: Parent): string => {
        if (parent.firstName || parent.lastName) {
            return `${parent.firstName || ''} ${parent.lastName || ''}`.trim();
        }
        return '-';
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-6 h-6 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">إدارة أولياء الأمور</h1>
                    </div>
                    <p className="text-sm text-gray-600">البحث وإدارة حسابات أولياء الأمور</p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {parents.length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي أولياء الأمور</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {parents.filter(p => p.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">نشطون</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {parents.filter(p => !p.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">محظورون</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {parents.reduce((sum, p) => sum + (p._count?.children || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي الأبناء</div>
                    </Card>
                </div>

                {/* Search */}
                <Card padding="md">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="ابحث بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
                                className="pr-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">بحث</Button>
                    </form>
                </Card>

                {/* Parents Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : parents.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد نتائج</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>ولي الأمر</TableHead>
                                    <TableHead>رقم الهاتف</TableHead>
                                    <TableHead>عدد الأبناء</TableHead>
                                    <TableHead>الحجوزات</TableHead>
                                    <TableHead>الباقات</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>تاريخ التسجيل</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parents.map(parent => (
                                    <TableRow key={parent.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={getFullName(parent) || parent.email}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {getFullName(parent)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{parent.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {parent.phoneNumber || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-gray-700">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="font-mono">{parent._count?.children || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {parent._count?.bookings || 0}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {parent._count?.purchasedPackages || 0}
                                        </TableCell>
                                        <TableCell>
                                            {parent.isActive ? (
                                                <StatusBadge variant="success">نشط</StatusBadge>
                                            ) : (
                                                <StatusBadge variant="error">محظور</StatusBadge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">
                                            {new Date(parent.createdAt).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/users/${parent.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        عرض
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant={parent.isActive ? "destructive" : "default"}
                                                    onClick={() => handleToggleBan(parent.id, parent.isActive)}
                                                    disabled={!!processingId}
                                                >
                                                    {parent.isActive ? (
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
