'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Ban, CheckCircle, BookOpen, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface Student {
    id: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: string;
    firstName?: string;
    lastName?: string;
    studentProfile?: {
        grade?: string;
        school?: string;
    };
    _count?: {
        bookings?: number;
        purchasedPackages?: number;
    };
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async (query?: string) => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(query);
            // Filter only STUDENT role users
            const studentUsers = data.filter((user: any) => user.role === 'STUDENT');
            setStudents(studentUsers);
        } catch (error) {
            console.error("Failed to load students", error);
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
        if (!confirm(`هل أنت متأكد من ${action} هذا الطالب؟`)) return;

        setProcessingId(id);
        try {
            await adminApi.toggleBan(id);
            setStudents(prev => prev.map(s =>
                s.id === id ? { ...s, isActive: !s.isActive } : s
            ));
        } catch (error) {
            alert("فشل تنفيذ الإجراء");
        } finally {
            setProcessingId(null);
        }
    };

    const getFullName = (student: Student): string => {
        if (student.firstName || student.lastName) {
            return `${student.firstName || ''} ${student.lastName || ''}`.trim();
        }
        return '-';
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-6 h-6 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h1>
                    </div>
                    <p className="text-sm text-gray-600">البحث وإدارة حسابات الطلاب</p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {students.length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي الطلاب</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {students.filter(s => s.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">نشطون</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {students.filter(s => !s.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">محظورون</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {students.reduce((sum, s) => sum + (s._count?.bookings || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي الحجوزات</div>
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

                {/* Students Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد نتائج</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>رقم الهاتف</TableHead>
                                    <TableHead>المرحلة/الصف</TableHead>
                                    <TableHead>المدرسة</TableHead>
                                    <TableHead>الحجوزات</TableHead>
                                    <TableHead>الباقات</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>تاريخ التسجيل</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={getFullName(student) || student.email}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {getFullName(student)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{student.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {student.phoneNumber || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {student.studentProfile?.grade || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {student.studentProfile?.school || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {student._count?.bookings || 0}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">
                                            {student._count?.purchasedPackages || 0}
                                        </TableCell>
                                        <TableCell>
                                            {student.isActive ? (
                                                <StatusBadge variant="success">نشط</StatusBadge>
                                            ) : (
                                                <StatusBadge variant="error">محظور</StatusBadge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">
                                            {new Date(student.createdAt).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/users/${student.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        عرض
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant={student.isActive ? "destructive" : "default"}
                                                    onClick={() => handleToggleBan(student.id, student.isActive)}
                                                    disabled={!!processingId}
                                                >
                                                    {student.isActive ? (
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
