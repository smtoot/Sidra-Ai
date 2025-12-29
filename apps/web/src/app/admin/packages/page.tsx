'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, Calendar, Clock, User, Loader2, ExternalLink, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface StudentPackage {
    id: string;
    readableId: string;
    status: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    totalPrice: string;
    discountPercent: number;
    startDate: string;
    expiryDate: string;
    createdAt: string;

    payer?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };

    student?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };

    teacher?: {
        id: string;
        displayName?: string;
        user?: {
            email: string;
        };
    };

    packageTier?: {
        sessionCount: number;
        discountPercent: number;
        nameAr?: string;
        nameEn?: string;
    };
}

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'الكل' },
    { value: 'ACTIVE', label: 'نشطة' },
    { value: 'EXPIRED', label: 'منتهية' },
    { value: 'COMPLETED', label: 'مكتملة' },
    { value: 'REFUNDED', label: 'مستردة' },
    { value: 'CANCELLED', label: 'ملغاة' },
];

export default function AdminPackagesPage() {
    const [packages, setPackages] = useState<StudentPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const loadPackages = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getStudentPackages(statusFilter);
            setPackages(data);
        } catch (error) {
            console.error('Failed to load packages', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPackages();
    }, [statusFilter]);

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'ACTIVE') return 'success';
        if (status === 'EXPIRED' || status === 'CANCELLED') return 'error';
        if (status === 'COMPLETED') return 'info';
        if (status === 'REFUNDED') return 'warning';
        return 'info';
    };

    const getStatusLabel = (status: string): string => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status);
        return option?.label || status;
    };

    const getProgressColor = (used: number, total: number): string => {
        const percentage = (used / total) * 100;
        if (percentage >= 80) return 'bg-red-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getFullName = (user: any): string => {
        if (user?.firstName || user?.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        return user?.email || '-';
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-6 h-6 text-primary" />
                            <h1 className="text-2xl font-bold text-gray-900">إدارة الباقات المباعة</h1>
                        </div>
                        <p className="text-sm text-gray-600">عرض وإدارة جميع باقات الطلاب النشطة والمنتهية</p>
                    </div>

                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Select>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {packages.length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي الباقات</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-green-600">
                            {packages.filter(p => p.status === 'ACTIVE').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">نشطة</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-blue-600">
                            {packages.filter(p => p.status === 'COMPLETED').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">مكتملة</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-red-600">
                            {packages.filter(p => p.status === 'EXPIRED').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">منتهية</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-primary">
                            {packages.reduce((sum, p) => sum + parseFloat(p.totalPrice || '0'), 0).toFixed(2)} SDG
                        </div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي القيمة</div>
                    </Card>
                </div>

                {/* Packages Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد باقات</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>رقم الباقة</TableHead>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>المعلم</TableHead>
                                    <TableHead>الباقة</TableHead>
                                    <TableHead>الجلسات</TableHead>
                                    <TableHead>الانتهاء</TableHead>
                                    <TableHead>القيمة</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {packages.map(pkg => (
                                    <TableRow key={pkg.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-primary" />
                                                <span className="font-mono font-semibold text-gray-900">
                                                    {pkg.readableId}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={getFullName(pkg.student)}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">
                                                        {getFullName(pkg.student)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{pkg.student?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={pkg.teacher?.displayName || pkg.teacher?.user?.email || 'T'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">
                                                        {pkg.teacher?.displayName || '-'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{pkg.teacher?.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {pkg.packageTier?.nameAr || `${pkg.totalSessions} حصة`}
                                                </p>
                                                {pkg.discountPercent > 0 && (
                                                    <p className="text-xs text-green-600">
                                                        خصم {pkg.discountPercent}%
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-mono text-gray-900">
                                                        {pkg.usedSessions} / {pkg.totalSessions}
                                                    </span>
                                                    {pkg.remainingSessions === 0 ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : pkg.remainingSessions <= 2 ? (
                                                        <AlertCircle className="w-4 h-4 text-orange-600" />
                                                    ) : null}
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all ${getProgressColor(pkg.usedSessions, pkg.totalSessions)}`}
                                                        style={{ width: `${(pkg.usedSessions / pkg.totalSessions) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="text-gray-900">
                                                    {format(new Date(pkg.expiryDate), 'dd MMM yyyy', { locale: ar })}
                                                </p>
                                                {new Date(pkg.expiryDate) < new Date() ? (
                                                    <p className="text-xs text-red-600">منتهية</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">
                                                        {Math.ceil((new Date(pkg.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} يوم متبقي
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-primary">
                                            {pkg.totalPrice} SDG
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getStatusVariant(pkg.status)}>
                                                {getStatusLabel(pkg.status)}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin/packages/${pkg.id}`}>
                                                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span>التفاصيل</span>
                                                </button>
                                            </Link>
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
