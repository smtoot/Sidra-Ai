'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Eye, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type ApplicationStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'CHANGES_REQUESTED'
    | 'INTERVIEW_REQUIRED'
    | 'INTERVIEW_SCHEDULED'
    | 'APPROVED'
    | 'REJECTED';

const STATUS_TABS = [
    { key: 'ALL', label: 'الكل' },
    { key: 'SUBMITTED', label: 'قيد المراجعة' },
    { key: 'INTERVIEW_REQUIRED', label: 'بانتظار مقابلة' },
    { key: 'INTERVIEW_SCHEDULED', label: 'مقابلة محددة' },
    { key: 'APPROVED', label: 'مقبول' },
    { key: 'REJECTED', label: 'مرفوض' },
];

export default function TeacherApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('SUBMITTED');

    useEffect(() => {
        loadApplications();
    }, [activeTab]);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getTeacherApplications(activeTab);
            setApplications(data);
        } catch (error) {
            toast.error('فشل تحميل الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status: ApplicationStatus): 'success' | 'warning' | 'error' | 'info' => {
        if (status === 'APPROVED') return 'success';
        if (status === 'REJECTED') return 'error';
        if (status === 'SUBMITTED' || status === 'INTERVIEW_REQUIRED' || status === 'INTERVIEW_SCHEDULED') return 'warning';
        return 'info';
    };

    const getStatusLabel = (status: ApplicationStatus): string => {
        const labels: Record<ApplicationStatus, string> = {
            DRAFT: 'مسودة',
            SUBMITTED: 'قيد المراجعة',
            CHANGES_REQUESTED: 'تحتاج تعديل',
            INTERVIEW_REQUIRED: 'تحتاج مقابلة',
            INTERVIEW_SCHEDULED: 'مقابلة محددة',
            APPROVED: 'مقبول',
            REJECTED: 'مرفوض',
        };
        return labels[status];
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl font-bold text-gray-900">طلبات المعلمين</h1>
                    <p className="text-sm text-gray-600 mt-1">مراجعة وإدارة طلبات التسجيل</p>
                </header>

                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.key
                                ? 'bg-primary-600 text-white'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Applications Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد طلبات</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>المعلم</TableHead>
                                    <TableHead>رقم الهاتف</TableHead>
                                    <TableHead>تاريخ التقديم</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={app.displayName || app.user?.email || 'T'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{app.displayName || 'لم يحدد'}</p>
                                                    <p className="text-sm text-gray-500">{app.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 font-mono">
                                            {app.user?.phoneNumber || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {app.submittedAt
                                                ? format(new Date(app.submittedAt), 'd MMM yyyy', { locale: ar })
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={getStatusVariant(app.applicationStatus)}>
                                                {getStatusLabel(app.applicationStatus)}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => router.push(`/admin/teacher-applications/${app.id}`)}
                                            >
                                                <Eye className="w-4 h-4 ml-1" />
                                                عرض التفاصيل
                                            </Button>
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
