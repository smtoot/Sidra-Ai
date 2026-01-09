'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Loader2 } from 'lucide-react';
import { ApplicationStatus } from '@sidra/shared';
import Link from 'next/link';
import { SearchFilter } from '@/components/admin/SearchFilter';

/**
 * Get Arabic label for application status
 */
function getStatusLabel(status: ApplicationStatus | undefined): string {
    if (!status) return 'تسجيل جديد';
    const labels: Record<ApplicationStatus, string> = {
        DRAFT: 'مسودة',
        SUBMITTED: 'قيد المراجعة',
        CHANGES_REQUESTED: 'تحتاج تعديل',
        INTERVIEW_REQUIRED: 'تحتاج مقابلة',
        INTERVIEW_SCHEDULED: 'مقابلة محددة',
        APPROVED: 'نشط',
        REJECTED: 'مرفوض',
    };
    return labels[status] || status;
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Get badge variant for application status
 */
function getStatusVariant(status: ApplicationStatus | undefined): BadgeVariant {
    if (!status) return 'neutral';
    const variants: Record<ApplicationStatus, BadgeVariant> = {
        DRAFT: 'neutral',
        SUBMITTED: 'warning',
        CHANGES_REQUESTED: 'warning',
        INTERVIEW_REQUIRED: 'info',
        INTERVIEW_SCHEDULED: 'info',
        APPROVED: 'success',
        REJECTED: 'error',
    };
    return variants[status] || 'neutral';
}

export default function AdminTeachersPage() {
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch applications to ensure consistency with "Teacher Applications" page
            // Logic: getTeacherApplications returns Profile -> User
            // We need User -> Profile
            const applications = await adminApi.getTeacherApplications('ALL');

            const teachersOnly = applications.map((app: any) => ({
                ...app.user,
                // App itself is the profile, but it has user nested. 
                // We flip it: User is base, Profile is nested.
                teacherProfile: app
            }));

            setAllTeachers(teachersOnly);
            setFilteredTeachers(teachersOnly);
        } catch (error) {
            console.error("Failed to load teachers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handle filtering
    useEffect(() => {
        let result = allTeachers;

        // 1. Status Filter
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'NEW') {
                result = result.filter(t => !t.teacherProfile || t.teacherProfile.applicationStatus === 'DRAFT');
            } else if (statusFilter === 'PENDING') {
                result = result.filter(t => t.teacherProfile?.applicationStatus === 'SUBMITTED' || t.teacherProfile?.applicationStatus === 'CHANGES_REQUESTED');
            } else if (statusFilter === 'ACTIVE') {
                result = result.filter(t => t.teacherProfile?.applicationStatus === 'APPROVED');
            } else if (statusFilter === 'REJECTED') {
                result = result.filter(t => t.teacherProfile?.applicationStatus === 'REJECTED' || t.teacherProfile?.applicationStatus?.includes('INTERVIEW'));
            }
        }

        // 2. Text Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.email.toLowerCase().includes(query) ||
                (t.teacherProfile?.displayName && t.teacherProfile.displayName.toLowerCase().includes(query)) ||
                (t.teacherProfile?.fullName && t.teacherProfile.fullName.toLowerCase().includes(query)) ||
                (t.firstName && t.firstName.toLowerCase().includes(query)) ||
                (t.lastName && t.lastName.toLowerCase().includes(query))
            );
        }

        setFilteredTeachers(result);
    }, [allTeachers, searchQuery, statusFilter]);

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">المعلمون</h1>
                        <p className="text-sm text-gray-600 mt-1">إدارة واعتماد ملفات المعلمين</p>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    {/* Status Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto w-full md:w-auto text-sm">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            الكل ({allTeachers.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('PENDING')}
                            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${statusFilter === 'PENDING' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            قيد المراجعة
                        </button>
                        <button
                            onClick={() => setStatusFilter('NEW')}
                            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${statusFilter === 'NEW' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            تسجيل جديد
                        </button>
                        <button
                            onClick={() => setStatusFilter('ACTIVE')}
                            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${statusFilter === 'ACTIVE' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            نشط
                        </button>
                    </div>

                    {/* Search */}
                    <div className="w-full md:w-72">
                        <SearchFilter
                            onSearchChange={setSearchQuery}
                            placeholder="بحث بالاسم أو البريد الإلكتروني..."
                        />
                    </div>
                </div>

                {/* Teachers Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                            <p>جاري تحميل بيانات المعلمين...</p>
                        </div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="py-20 text-center text-gray-500">
                            <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-gray-900">لا توجد نتائج</h3>
                            <p className="text-sm text-gray-500 mt-1">لا يوجد معلمون يطابقون خيارات البحث الحالية</p>
                            {(searchQuery || statusFilter !== 'ALL') && (
                                <Button
                                    variant="link"
                                    onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
                                    className="mt-2"
                                >
                                    مسح جميع المرشحات
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow hover={false} className="bg-gray-50/50">
                                        <TableHead className="w-[300px]">المعلم</TableHead>
                                        <TableHead>معلومات الاتصال</TableHead>
                                        <TableHead className="hidden md:table-cell">الموقع</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead className="hidden lg:table-cell">تاريخ الانضمام</TableHead>
                                        <TableHead className="text-left">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTeachers.map(teacher => {
                                        const profile = teacher.teacherProfile;
                                        const displayName = profile?.displayName || profile?.fullName;
                                        const whatsapp = profile?.whatsappNumber || teacher.phoneNumber; // Fallback to user phone

                                        return (
                                            <TableRow key={teacher.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            fallback={displayName || teacher.email}
                                                            src={profile?.profilePhotoUrl}
                                                            size="sm"
                                                            className="border border-gray-100"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">
                                                                {displayName || 'بدون اسم (حساب جديد)'}
                                                            </span>
                                                            <span className="text-xs text-gray-500 font-mono">
                                                                {teacher.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {whatsapp ? (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dir-ltr">
                                                            <a
                                                                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:text-green-600 transition-colors flex items-center gap-1 group"
                                                                title="فتح في واتساب"
                                                            >
                                                                <span className="font-mono text-xs">{whatsapp}</span>
                                                                <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c.93.509 1.638.834 3.804.834 3.182 0 5.768-2.587 5.769-5.766.001-3.181-2.584-5.768-5.767-5.768zm0 9.778c-1.572 0-2.316-.316-2.909-.643l-1.376 1.157.37-1.346c-.524-.816-.788-1.514-.787-2.18.001-2.207 1.796-4 4-4s4 1.794 4 4-1.795 4-4 4z" /></svg>
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">غير متوفر</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {profile?.city || profile?.country ? (
                                                        <div className="text-sm text-gray-700">
                                                            {profile.city && <span>{profile.city}</span>}
                                                            {profile.city && profile.country && <span className="mx-1 text-gray-300">|</span>}
                                                            {profile.country && <span className="text-gray-500">{profile.country}</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        variant={getStatusVariant(profile?.applicationStatus)}
                                                    >
                                                        {getStatusLabel(profile?.applicationStatus)}
                                                    </StatusBadge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {new Date(teacher.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <Link href={`/admin/users/${teacher.id}`}>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">التفاصيل</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left text-gray-400 hover:text-primary"><path d="m15 18-6-6 6-6" /></svg>
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
