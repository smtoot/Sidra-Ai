'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { Calendar, Clock, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Booking {
    id: string;
    status: string;
    startTime: string;
    endTime: string;
    price: string;
    cancelReason?: string;
    createdAt: string;
    teacherProfile?: {
        displayName?: string;
        user?: { email: string };
    };
    bookedByUser?: { email: string };
    studentUser?: { email: string };
    child?: { name: string };
    subject?: { nameAr: string; nameEn: string };
}

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'الكل' },
    { value: 'PENDING_TEACHER_APPROVAL', label: 'قيد الانتظار' },
    { value: 'WAITING_FOR_PAYMENT', label: 'في انتظار الدفع' },
    { value: 'PAYMENT_REVIEW', label: 'مراجعة الدفع' },
    { value: 'SCHEDULED', label: 'مجدولة' },
    { value: 'COMPLETED', label: 'مكتملة' },
    { value: 'REJECTED_BY_TEACHER', label: 'مرفوضة' },
    { value: 'CANCELLED_BY_PARENT', label: 'ملغاة من الوالد' },
    { value: 'CANCELLED_BY_ADMIN', label: 'ملغاة من الإدارة' },
    { value: 'EXPIRED', label: 'منتهية' },
];

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getBookings(statusFilter);
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [statusFilter]);

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'COMPLETED' || status === 'SCHEDULED') return 'success';
        if (status === 'PENDING_TEACHER_APPROVAL' || status === 'WAITING_FOR_PAYMENT' || status === 'PAYMENT_REVIEW') return 'warning';
        if (status.includes('CANCELLED') || status === 'REJECTED_BY_TEACHER' || status === 'EXPIRED') return 'error';
        return 'info';
    };

    const getStatusLabel = (status: string): string => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status);
        return option?.label || status;
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">إدارة الحجوزات</h1>
                        <p className="text-sm text-gray-600 mt-1">عرض وإدارة جميع حجوزات الحصص</p>
                    </div>

                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Select>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {bookings.filter(b => b.status === 'SCHEDULED').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">مجدولة</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {bookings.filter(b => b.status === 'PENDING_TEACHER_APPROVAL').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">قيد الانتظار</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">
                            {bookings.filter(b => b.status === 'COMPLETED').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">مكتملة</div>
                    </Card>
                    <Card hover="lift" padding="md">
                        <div className="text-2xl font-bold font-mono text-gray-900">{bookings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">الإجمالي</div>
                    </Card>
                </div>

                {/* Bookings Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد حجوزات</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>المعلم</TableHead>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>الوقت</TableHead>
                                    <TableHead>السعر</TableHead>
                                    <TableHead>الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={booking.teacherProfile?.displayName || booking.teacherProfile?.user?.email || 'T'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {booking.teacherProfile?.displayName || '-'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {booking.teacherProfile?.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={booking.child?.name || booking.studentUser?.email || booking.bookedByUser?.email || 'S'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {booking.child?.name || '-'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {booking.studentUser?.email || booking.bookedByUser?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {booking.subject?.nameAr || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <div>{format(new Date(booking.startTime), 'dd MMM yyyy', { locale: ar })}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(booking.startTime), 'hh:mm a', { locale: ar })}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-primary-600">
                                            {booking.price} SDG
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getStatusVariant(booking.status)}>
                                                {getStatusLabel(booking.status)}
                                            </StatusBadge>
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
