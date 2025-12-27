'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, Video, CheckCircle, Clock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

export default function InterviewsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [showSlotsModal, setShowSlotsModal] = useState(false);
    const [interviewSlots, setInterviewSlots] = useState<any[]>([]);

    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        setLoading(true);
        try {
            // Get applications that need interviews or have interviews scheduled
            const pending = await adminApi.getTeacherApplications('INTERVIEW_REQUIRED');
            const scheduled = await adminApi.getTeacherApplications('INTERVIEW_SCHEDULED');
            setApplications([...pending, ...scheduled]);
        } catch (error) {
            toast.error('فشل تحميل المقابلات');
        } finally {
            setLoading(false);
        }
    };

    const viewTimeSlots = async (app: any) => {
        try {
            setSelectedApp(app);
            const slots = await adminApi.getInterviewTimeSlots(app.id);
            setInterviewSlots(slots);
            setShowSlotsModal(true);
        } catch (error) {
            toast.error('فشل تحميل خيارات المقابلة');
        }
    };

    const getStatusInfo = (status: string) => {
        if (status === 'INTERVIEW_REQUIRED') {
            return {
                variant: 'warning' as const,
                label: 'في انتظار اختيار المعلم',
                icon: <Clock className="w-4 h-4" />
            };
        }
        return {
            variant: 'success' as const,
            label: 'مجدولة',
            icon: <CheckCircle className="w-4 h-4" />
        };
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Video className="w-7 h-7 text-primary" />
                        إدارة المقابلات
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">متابعة مقابلات المعلمين المقترحة والمجدولة</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-warning-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">في انتظار الاختيار</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {applications.filter(a => a.applicationStatus === 'INTERVIEW_REQUIRED').length}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-success-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">مقابلات مجدولة</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {applications.filter(a => a.applicationStatus === 'INTERVIEW_SCHEDULED').length}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">إجمالي المعلمين</p>
                                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Interviews Table */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا توجد مقابلات مقترحة حالياً</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>المعلم</TableHead>
                                    <TableHead>البريد الإلكتروني</TableHead>
                                    <TableHead>رقم الهاتف</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>موعد المقابلة</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => {
                                    const statusInfo = getStatusInfo(app.applicationStatus);
                                    return (
                                        <TableRow key={app.id}>
                                            <TableCell>
                                                <div className="font-semibold text-gray-900">
                                                    {app.displayName || 'لم يحدد'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {app.user?.email}
                                            </TableCell>
                                            <TableCell className="font-mono text-gray-600">
                                                {app.user?.phoneNumber}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge variant={statusInfo.variant}>
                                                    <span className="flex items-center gap-1">
                                                        {statusInfo.icon}
                                                        {statusInfo.label}
                                                    </span>
                                                </StatusBadge>
                                            </TableCell>
                                            <TableCell>
                                                {app.interviewScheduledAt ? (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm">
                                                            {format(new Date(app.interviewScheduledAt), 'd MMM yyyy - h:mm a', { locale: ar })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">لم يتم التحديد بعد</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => viewTimeSlots(app)}
                                                    >
                                                        <Calendar className="w-4 h-4 ml-1" />
                                                        عرض الخيارات
                                                    </Button>
                                                    <Link href={`/admin/teacher-applications`}>
                                                        <Button size="sm" variant="outline">
                                                            التفاصيل
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

            {/* Time Slots Modal */}
            {showSlotsModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSlotsModal(false)}>
                    <Card className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">خيارات المقابلة - {selectedApp.displayName}</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {interviewSlots.length > 0
                                    ? `تم اقتراح ${interviewSlots.length} خيارات للمعلم`
                                    : 'لم يتم اقتراح خيارات بعد'}
                            </p>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {interviewSlots.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>لم يتم اقتراح خيارات للمقابلة بعد</p>
                                </div>
                            ) : (
                                interviewSlots.map((slot, index) => (
                                    <div
                                        key={slot.id}
                                        className={`p-4 rounded-lg border-2 ${
                                            slot.isSelected
                                                ? 'border-success-500 bg-success-50'
                                                : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-gray-900">الخيار {index + 1}</span>
                                                    {slot.isSelected && (
                                                        <StatusBadge variant="success">
                                                            <CheckCircle className="w-3 h-3 ml-1" />
                                                            تم الاختيار
                                                        </StatusBadge>
                                                    )}
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Calendar className="w-4 h-4" />
                                                        {format(new Date(slot.proposedDateTime), 'EEEE، d MMMM yyyy - h:mm a', { locale: ar })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Video className="w-4 h-4" />
                                                        <a
                                                            href={slot.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary-600 hover:underline"
                                                            dir="ltr"
                                                        >
                                                            {slot.meetingLink}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 relative z-10">
                            <Button onClick={() => setShowSlotsModal(false)} className="w-full relative z-10">
                                إغلاق
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
