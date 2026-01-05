'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { walletApi } from '@/lib/api/wallet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, User, Mail, Phone, Calendar, Shield, Wallet,
    TrendingUp, TrendingDown, Lock, CheckCircle, XCircle, Clock,
    BookOpen, GraduationCap, Briefcase, Edit2, Save, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminUserDetailPage() {
    const params = useParams();
    const userId = params.id as string;
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [wallet, setWallet] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'wallet' | 'bookings'>('details');
    const [isLoading, setIsLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ email: '', phoneNumber: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId]);

    useEffect(() => {
        if (activeTab === 'bookings' && bookings.length === 0) {
            loadBookings();
        }
    }, [activeTab]);

    const loadBookings = async () => {
        setBookingsLoading(true);
        try {
            // Fetch all bookings and filter for this user (as teacher or student/parent)
            const allBookings = await adminApi.getBookings();
            const userBookings = allBookings.filter((b: any) =>
                b.teacherProfile?.userId === userId ||
                b.studentUser?.id === userId ||
                b.bookedByUser?.id === userId
            );
            setBookings(userBookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setBookingsLoading(false);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch wallet data
            const walletData = await walletApi.getUserWallet(userId);
            setWallet(walletData);

            // Fetch user data
            try {
                const userData = await adminApi.getUser(userId);
                setUser(userData);
                setEditForm({
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || ''
                });
            } catch (userError) {
                console.error('Error loading user:', userError);
            }
        } catch (error) {
            console.error('Error loading data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const updatedUser = await adminApi.updateUser(userId, editForm);
            setUser(updatedUser);
            setIsEditOpen(false);
            toast.success('تم تحديث بيانات المستخدم بنجاح');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشل تحديث البيانات');
        } finally {
            setIsSaving(false);
        }
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

    const getRoleBadgeVariant = (role: string): 'success' | 'warning' | 'error' | 'info' => {
        if (role === 'ADMIN') return 'error';
        if (role === 'TEACHER') return 'info';
        if (role === 'PARENT') return 'warning';
        return 'neutral' as any;
    };

    const getTransactionTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            'DEPOSIT': 'إيداع',
            'WITHDRAWAL': 'سحب',
            'PAYMENT_LOCK': 'حجز مبلغ',
            'PAYMENT_RELEASE': 'تحويل للمعلم',
            'REFUND': 'استرجاع',
            'COMMISSION': 'عمولة',
        };
        return labels[type] || type;
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            'PENDING': 'قيد الانتظار',
            'APPROVED': 'معتمد',
            'PAID': 'مدفوع',
            'REJECTED': 'مرفوض',
        };
        return labels[status] || status;
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'PAID') return 'success';
        if (status === 'APPROVED') return 'info';
        if (status === 'PENDING') return 'warning';
        if (status === 'REJECTED') return 'error';
        return 'neutral' as any;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-gray-500">جاري التحميل...</div>
            </div>
        );
    }

    if (!wallet) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-gray-500">لم يتم العثور على المحفظة</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        رجوع
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">تفاصيل المستخدم</h1>
                    <span className="text-gray-400 text-sm font-mono">{userId}</span>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`${activeTab === 'details'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            التفاصيل
                        </button>
                        <button
                            onClick={() => setActiveTab('wallet')}
                            className={`${activeTab === 'wallet'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            فحص المحفظة
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`${activeTab === 'bookings'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            الحجوزات والحصص
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="mt-6">
                    {activeTab === 'details' && (
                        user ? (
                            <div className="space-y-6">
                                {/* User Profile Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>الملف الشخصي</CardTitle>
                                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-2">
                                            <Edit2 className="w-4 h-4" />
                                            تعديل
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-start gap-6">
                                            <Avatar
                                                fallback={user.email}
                                                size="xl"
                                            />
                                            <div className="flex-1 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">البريد الإلكتروني</div>
                                                            <div className="font-medium">{user.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">رقم الهاتف</div>
                                                            <div className="font-medium font-mono" dir="ltr">
                                                                {user.phoneNumber || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Shield className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">الدور</div>
                                                            <StatusBadge variant={getRoleBadgeVariant(user.role)} showDot={false}>
                                                                {getRoleLabel(user.role)}
                                                            </StatusBadge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <div className="text-xs text-gray-500">تاريخ التسجيل</div>
                                                            <div className="font-medium">
                                                                {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ar })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {user.isActive ? (
                                                        <StatusBadge variant="success">حساب نشط</StatusBadge>
                                                    ) : (
                                                        <StatusBadge variant="error">حساب محظور</StatusBadge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Teacher Specific Info */}
                                {user.role === 'TEACHER' && user.teacherProfile && (
                                    <>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5" />
                                                    معلومات المعلم
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">الاسم المعروض</div>
                                                        <div className="font-medium">{user.teacherProfile.displayName || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">حالة الطلب</div>
                                                        <StatusBadge variant={user.teacherProfile.applicationStatus === 'APPROVED' ? 'success' : 'warning'}>
                                                            {user.teacherProfile.applicationStatus}
                                                        </StatusBadge>
                                                    </div>

                                                    {user.teacherProfile.bio && (
                                                        <div className="col-span-2">
                                                            <div className="text-xs text-gray-500 mb-1">النبذة التعريفية</div>
                                                            <div className="text-sm bg-gray-50 p-3 rounded-lg leading-relaxed">
                                                                {user.teacherProfile.bio}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Qualifications */}
                                                    {user.teacherProfile.qualifications && user.teacherProfile.qualifications.length > 0 && (
                                                        <div className="col-span-2">
                                                            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                                                <GraduationCap className="w-4 h-4" />
                                                                المؤهلات العلمية
                                                            </div>
                                                            <div className="space-y-2">
                                                                {user.teacherProfile.qualifications.map((qual: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-md shadow-sm">
                                                                        <div>
                                                                            <div className="font-medium text-sm">{qual.degreeName}</div>
                                                                            <div className="text-xs text-gray-500">{qual.institution}</div>
                                                                        </div>
                                                                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                            {qual.graduationYear || '-'}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Subjects & Curriculums */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Briefcase className="w-5 h-5" />
                                                    المواد والمناهج الدراسية
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {user.teacherProfile.subjects && user.teacherProfile.subjects.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {user.teacherProfile.subjects.map((ts: any) => (
                                                            <div key={ts.id} className="border border-gray-200 rounded-lg p-4">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <h4 className="font-bold text-lg text-primary-700">
                                                                            {ts.subject?.nameAr || ts.subjectId}
                                                                        </h4>
                                                                        <div className="text-sm text-gray-500 font-medium mt-1">
                                                                            {ts.curriculum?.nameAr || ts.curriculumId}
                                                                        </div>
                                                                    </div>
                                                                    <div className="font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                                                        {ts.pricePerHour} SDG/ساعة
                                                                    </div>
                                                                </div>

                                                                {/* Grades */}
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-2">المراحل الدراسية:</div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {ts.grades && ts.grades.length > 0 ? (
                                                                            ts.grades.map((g: any) => (
                                                                                <Badge key={g.gradeLevelId} variant="secondary">
                                                                                    {g.gradeLevel?.nameAr || g.gradeLevelId}
                                                                                </Badge>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-sm text-gray-400 italic">لا توجد مراحل محددة</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-gray-500">
                                                        لا توجد مواد مسجلة
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </>
                                )}

                                {/* Wallet Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Wallet className="w-5 h-5" />
                                            ملخص المحفظة
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">معرف المحفظة</div>
                                                <div className="font-mono text-sm">{wallet.readableId || wallet.id}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">الرصيد المتاح</div>
                                                <div className="font-bold text-lg font-mono">
                                                    {Number(wallet.balance || 0).toLocaleString()} <span className="text-sm font-normal">{wallet.currency || 'SDG'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">الرصيد المحجوز</div>
                                                <div className="font-bold text-lg font-mono text-warning-600">
                                                    {Number(wallet.pendingBalance || 0).toLocaleString()} <span className="text-sm font-normal">{wallet.currency || 'SDG'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center text-gray-500">
                                    <p>لم يتم العثور على بيانات المستخدم</p>
                                    <p className="text-sm mt-2">يمكنك عرض معلومات المحفظة من تبويب "فحص المحفظة"</p>
                                </CardContent>
                            </Card>
                        )
                    )}

                    {activeTab === 'bookings' && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card hover="lift" padding="md">
                                    <div className="text-2xl font-bold font-mono text-gray-900">
                                        {bookings.length}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">إجمالي الحجوزات</div>
                                </Card>
                                <Card hover="lift" padding="md">
                                    <div className="text-2xl font-bold font-mono text-success-600">
                                        {bookings.filter(b => b.status === 'COMPLETED').length}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">مكتملة</div>
                                </Card>
                                <Card hover="lift" padding="md">
                                    <div className="text-2xl font-bold font-mono text-warning-600">
                                        {bookings.filter(b => b.status === 'SCHEDULED').length}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">مجدولة</div>
                                </Card>
                                <Card hover="lift" padding="md">
                                    <div className="text-2xl font-bold font-mono text-error-600">
                                        {bookings.filter(b => b.status.includes('CANCELLED')).length}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">ملغاة</div>
                                </Card>
                            </div>

                            {/* Bookings Table */}
                            <Card padding="none">
                                {bookingsLoading ? (
                                    <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                                        <Clock className="w-5 h-5 animate-spin" />
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
                                                <TableHead>المعرف</TableHead>
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
                                                    <TableCell className="font-mono text-xs text-gray-500">
                                                        {booking.readableId || booking.id.slice(0, 8)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar
                                                                fallback={booking.teacherProfile?.displayName || 'T'}
                                                                size="sm"
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {booking.teacherProfile?.displayName || '-'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar
                                                                fallback={booking.child?.name || booking.studentUser?.email || 'S'}
                                                                size="sm"
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {booking.child?.name || '-'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm">
                                                        {booking.subject?.nameAr || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <div>{format(new Date(booking.startTime), 'dd MMM yyyy', { locale: ar })}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(booking.startTime), 'hh:mm a', { locale: ar })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono font-bold text-primary-600">
                                                        {booking.price} SDG
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            variant={
                                                                booking.status === 'COMPLETED' || booking.status === 'SCHEDULED' ? 'success' :
                                                                    booking.status.includes('CANCELLED') || booking.status === 'REJECTED_BY_TEACHER' ? 'error' :
                                                                        'warning'
                                                            }
                                                        >
                                                            {booking.status === 'COMPLETED' ? 'مكتملة' :
                                                                booking.status === 'SCHEDULED' ? 'مجدولة' :
                                                                    booking.status === 'PENDING_TEACHER_APPROVAL' ? 'قيد الانتظار' :
                                                                        booking.status.includes('CANCELLED') ? 'ملغاة' :
                                                                            booking.status}
                                                        </StatusBadge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="space-y-6">
                            {/* Balance Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card hover="lift" padding="md">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-success-50 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-success-600" />
                                        </div>
                                        <span className="text-sm text-gray-600">إجمالي الرصيد</span>
                                    </div>
                                    <div className="text-3xl font-bold font-mono text-gray-900">
                                        {(Number(wallet.balance || 0) + Number(wallet.pendingBalance || 0)).toLocaleString()}
                                        <span className="text-lg text-gray-500 mr-2">{wallet.currency || 'SDG'}</span>
                                    </div>
                                </Card>

                                <Card hover="lift" padding="md">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-warning-50 rounded-lg">
                                            <Lock className="w-5 h-5 text-warning-600" />
                                        </div>
                                        <span className="text-sm text-gray-600">الرصيد المحجوز</span>
                                    </div>
                                    <div className="text-3xl font-bold font-mono text-gray-900">
                                        {Number(wallet.pendingBalance || 0).toLocaleString()}
                                        <span className="text-lg text-gray-500 mr-2">{wallet.currency || 'SDG'}</span>
                                    </div>
                                </Card>

                                <Card hover="lift" padding="md">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-primary-50 rounded-lg">
                                            <TrendingDown className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <span className="text-sm text-gray-600">الرصيد المتاح</span>
                                    </div>
                                    <div className="text-3xl font-bold font-mono text-gray-900">
                                        {Number(wallet.balance || 0).toLocaleString()}
                                        <span className="text-lg text-gray-500 mr-2">{wallet.currency || 'SDG'}</span>
                                    </div>
                                </Card>
                            </div>

                            {/* Recent Transactions */}
                            <Card padding="none">
                                <CardHeader className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <CardTitle>نشاط المحفظة الأخير</CardTitle>
                                        <span className="text-sm text-gray-500">آخر 50 معاملة لهذه المحفظة</span>
                                    </div>
                                </CardHeader>

                                {wallet.transactions && wallet.transactions.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow hover={false}>
                                                <TableHead>المعرف</TableHead>
                                                <TableHead>الحالة</TableHead>
                                                <TableHead>المبلغ</TableHead>
                                                <TableHead>النوع</TableHead>
                                                <TableHead>التاريخ</TableHead>
                                                <TableHead>ملاحظة</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {wallet.transactions.slice(0, 50).map((tx: any) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-mono text-xs text-gray-500">
                                                        {tx.readableId || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge variant={getStatusVariant(tx.status)}>
                                                            {getStatusLabel(tx.status)}
                                                        </StatusBadge>
                                                    </TableCell>
                                                    <TableCell className="font-bold font-mono tabular-nums">
                                                        <span className={tx.type === 'WITHDRAWAL' || tx.type === 'PAYMENT_LOCK' ? 'text-error-600' : 'text-success-600'}>
                                                            {tx.amount} {wallet.currency || 'SDG'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            variant={
                                                                tx.type === 'DEPOSIT' ? 'success' :
                                                                    tx.type === 'WITHDRAWAL' ? 'warning' :
                                                                        'info'
                                                            }
                                                            showDot={false}
                                                        >
                                                            {getTransactionTypeLabel(tx.type)}
                                                        </StatusBadge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600">
                                                        <div>{format(new Date(tx.createdAt), 'dd MMM yyyy', { locale: ar })}</div>
                                                        <div className="text-xs text-gray-400">
                                                            {format(new Date(tx.createdAt), 'hh:mm a', { locale: ar })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                                                        {tx.note || tx.adminNote || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-12 text-center text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>لا توجد معاملات</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>

                {/* Edit User Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="example@domain.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الهاتف</Label>
                                <Input
                                    id="phone"
                                    value={editForm.phoneNumber}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                    placeholder="123456789"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                                إلغاء
                            </Button>
                            <Button onClick={handleUpdateUser} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        حفظ التغييرات
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
