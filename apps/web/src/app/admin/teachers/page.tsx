'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Loader2 } from 'lucide-react';

import Link from 'next/link';

export default function AdminTeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all users and filter for teachers
            const allUsers = await adminApi.getUsers('');
            const teachersOnly = allUsers.filter((u: any) => u.role === 'TEACHER');
            setTeachers(teachersOnly);
        } catch (error) {
            console.error("Failed to load teachers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl font-bold text-gray-900">المعلمون</h1>
                    <p className="text-sm text-gray-600 mt-1">جميع المعلمين المسجلين في المنصة</p>
                </header>

                {/* Teachers Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : teachers.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد معلمون</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>المعلم</TableHead>
                                    <TableHead>المواد</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>تاريخ الانضمام</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map(teacher => (
                                    <TableRow key={teacher.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={teacher.teacherProfile?.displayName || teacher.email}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {teacher.teacherProfile?.displayName || 'بدون اسم'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{teacher.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {teacher.teacherProfile?.qualifications || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                variant={teacher.teacherProfile?.applicationStatus === 'APPROVED' ? 'success' : 'warning'}
                                            >
                                                {teacher.teacherProfile?.applicationStatus === 'APPROVED' ? 'مفعل' : 'قيد المراجعة'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {new Date(teacher.createdAt).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin/users/${teacher.id}`}>
                                                <Button size="sm" variant="outline">
                                                    عرض التفاصيل
                                                </Button>
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
