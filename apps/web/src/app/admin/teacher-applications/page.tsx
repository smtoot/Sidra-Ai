'use client';

import { useState, useEffect } from 'react';
import { getFileUrl } from '@/lib/api/upload';
import { api } from '@/lib/api';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import {
    CheckCircle, XCircle, MessageSquare, Phone, Calendar,
    Eye, Clock, User, FileText, Video, Award, BookOpen, Loader2
} from 'lucide-react';
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
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('SUBMITTED');
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showChangesModal, setShowChangesModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [reason, setReason] = useState('');
    const [interviewSlots, setInterviewSlots] = useState<{ dateTime: string; meetingLink: string }[]>([
        { dateTime: '', meetingLink: '' },
        { dateTime: '', meetingLink: '' }
    ]);
    const [processing, setProcessing] = useState(false);

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

    const handleApprove = async (id: string) => {
        setProcessing(true);
        try {
            await adminApi.approveApplication(id);
            toast.success('تم قبول الطلب ✅');
            loadApplications();
            setShowDetailModal(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشلت العملية');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.error('يجب تحديد سبب الرفض');
            return;
        }
        setProcessing(true);
        try {
            await adminApi.rejectApplication(selectedApp.id, reason);
            toast.success('تم رفض الطلب');
            setShowRejectModal(false);
            setReason('');
            loadApplications();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشلت العملية');
        } finally {
            setProcessing(false);
        }
    };

    const handleRequestChanges = async () => {
        if (!reason.trim()) {
            toast.error('يجب تحديد التغييرات المطلوبة');
            return;
        }
        setProcessing(true);
        try {
            await adminApi.requestChanges(selectedApp.id, reason);
            toast.success('تم إرسال طلب التعديل');
            setShowChangesModal(false);
            setReason('');
            loadApplications();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشلت العملية');
        } finally {
            setProcessing(false);
        }
    };

    const handleProposeInterviewSlots = async () => {
        // Validate that at least 2 slots are filled
        const validSlots = interviewSlots.filter(slot => slot.dateTime && slot.meetingLink);
        if (validSlots.length < 2) {
            toast.error('يجب تقديم خيارين على الأقل للمعلم');
            return;
        }

        setProcessing(true);
        try {
            await adminApi.proposeInterviewSlots(selectedApp.id, validSlots);
            toast.success('تم إرسال خيارات المقابلة للمعلم ✅');
            setShowInterviewModal(false);
            setInterviewSlots([
                { dateTime: '', meetingLink: '' },
                { dateTime: '', meetingLink: '' }
            ]);
            loadApplications();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشلت العملية');
        } finally {
            setProcessing(false);
        }
    };

    const addInterviewSlot = () => {
        if (interviewSlots.length < 5) {
            setInterviewSlots([...interviewSlots, { dateTime: '', meetingLink: '' }]);
        }
    };

    const removeInterviewSlot = (index: number) => {
        if (interviewSlots.length > 2) {
            setInterviewSlots(interviewSlots.filter((_, i) => i !== index));
        }
    };

    const updateInterviewSlot = (index: number, field: 'dateTime' | 'meetingLink', value: string) => {
        const updated = [...interviewSlots];
        updated[index][field] = value;
        setInterviewSlots(updated);
    };

    const handleViewDocument = async (fileKey: string, fileName: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                toast.error('أنت غير مسجل الدخول');
                return;
            }

            const response = await api.get('/storage/file', {
                params: { key: fileKey },
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error('View error:', error);
            toast.error('فشل عرض الملف - تأكد من صلاحياتك');
        }
    };

    const openDetail = async (app: any) => {
        setSelectedApp(app);
        setShowDetailModal(true);
        try {
            const fullDetails = await adminApi.getTeacherApplication(app.id);
            setSelectedApp(fullDetails);
        } catch (error) {
            toast.error('فشل تحميل التفاصيل الكاملة');
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
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openDetail(app)}
                                                >
                                                    <Eye className="w-4 h-4 ml-1" />
                                                    عرض التفاصيل
                                                </Button>
                                                {app.applicationStatus === 'SUBMITTED' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-success-600 hover:bg-success-700"
                                                            onClick={() => handleApprove(app.id)}
                                                            disabled={processing}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => { setSelectedApp(app); setShowRejectModal(true); }}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {app.applicationStatus === 'INTERVIEW_REQUIRED' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-info-600 hover:bg-info-700"
                                                        onClick={() => { setSelectedApp(app); setShowInterviewModal(true); }}
                                                    >
                                                        <Calendar className="w-4 h-4 ml-1" />
                                                        جدولة
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

            {/* Detail Modal - COMPREHENSIVE TEACHER PROFILE REVIEW */}
            {showDetailModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-4xl w-full my-8 shadow-2xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">مراجعة طلب المعلم</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {/* Profile Header Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-6">
                                        <Avatar
                                            src={selectedApp.profilePhotoUrl ? getFileUrl(selectedApp.profilePhotoUrl) : undefined}
                                            fallback={selectedApp.displayName || 'T'}
                                            size="xl"
                                        />
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">{selectedApp.displayName}</h3>
                                                {selectedApp.fullName && (
                                                    <p className="text-sm text-gray-600 mt-1">الاسم الرسمي: {selectedApp.fullName}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{selectedApp.user?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span className="font-mono text-gray-700" dir="ltr">{selectedApp.user?.phoneNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Award className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{selectedApp.yearsOfExperience} سنوات خبرة</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">
                                                        {selectedApp.submittedAt
                                                            ? format(new Date(selectedApp.submittedAt), 'dd MMM yyyy', { locale: ar })
                                                            : 'تاريخ غير محدد'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <StatusBadge variant={getStatusVariant(selectedApp.applicationStatus)} showDot={true}>
                                                    {getStatusLabel(selectedApp.applicationStatus)}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Intro Video Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Video className="w-5 h-5 text-primary-600" />
                                            الفيديو التعريفي
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedApp.introVideoUrl ? (
                                            <a
                                                href={selectedApp.introVideoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center">
                                                    <Eye className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">مشاهدة الفيديو</p>
                                                    <p className="text-xs">انقر للفتح في نافذة جديدة</p>
                                                </div>
                                            </a>
                                        ) : (
                                            <p className="text-gray-400 text-sm italic py-4">لا يوجد فيديو تعريفي</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Bio Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <User className="w-5 h-5 text-primary-600" />
                                            النبذة التعريفية
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed max-h-32 overflow-y-auto">
                                            {selectedApp.bio || 'لم يتم إضافة نبذة تعريفية'}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Subjects Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary-600" />
                                        المواد التدريسية
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedApp.subjects && selectedApp.subjects.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow hover={false}>
                                                    <TableHead>المادة</TableHead>
                                                    <TableHead>المنهج</TableHead>
                                                    <TableHead>السعر / ساعة</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedApp.subjects.map((s: any) => (
                                                    <TableRow key={s.id}>
                                                        <TableCell className="font-medium">{s.subject?.nameAr}</TableCell>
                                                        <TableCell className="text-gray-600">{s.curriculum?.nameAr}</TableCell>
                                                        <TableCell className="font-mono font-bold text-primary-600">
                                                            {s.pricePerHour} SDG
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="text-gray-400 italic text-sm py-4">لم يتم إضافة مواد تدريسية</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Documents Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary-600" />
                                        المستندات المرفقة
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        // Aggregate all documents from different sources
                                        const allDocs: any[] = [];

                                        // 1. ID Verification Image
                                        if (selectedApp.idImageUrl) {
                                            allDocs.push({
                                                id: 'identity-doc',
                                                fileName: `Identity - ${selectedApp.idType || 'Document'}`,
                                                fileUrl: selectedApp.idImageUrl,
                                                type: 'IDENTITY_VERIFICATION'
                                            });
                                        }

                                        // 2. Qualifications (Certificates)
                                        if (selectedApp.qualifications && selectedApp.qualifications.length > 0) {
                                            selectedApp.qualifications.forEach((q: any, idx: number) => {
                                                if (q.certificateUrl) {
                                                    allDocs.push({
                                                        id: `qual-${q.id}`,
                                                        fileName: `Certificate - ${q.degree || 'Qualification'} ${idx + 1}`,
                                                        fileUrl: q.certificateUrl,
                                                        type: 'ACADEMIC_CERTIFICATE'
                                                    });
                                                }
                                            });
                                        }

                                        // 3. Legacy Documents
                                        if (selectedApp.documents && selectedApp.documents.length > 0) {
                                            allDocs.push(...selectedApp.documents);
                                        }

                                        return allDocs.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {allDocs.map((doc: any, index: number) => (
                                                    <button
                                                        key={doc.id || index}
                                                        onClick={() => handleViewDocument(doc.fileUrl, doc.fileName)}
                                                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group text-right"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
                                                            {doc.type === 'IDENTITY_VERIFICATION' ? (
                                                                <User className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                                                            ) : doc.type === 'ACADEMIC_CERTIFICATE' ? (
                                                                <Award className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                                                            ) : (
                                                                <FileText className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                                                            <p className="text-xs text-gray-500 truncate">{doc.type}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic text-sm py-4">لا توجد مستندات مرفقة</p>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
                            {selectedApp.applicationStatus === 'SUBMITTED' && (
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-success-600 hover:bg-success-700"
                                        onClick={() => handleApprove(selectedApp.id)}
                                        disabled={processing}
                                    >
                                        <CheckCircle className="w-5 h-5 ml-2" />
                                        قبول الطلب
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setShowDetailModal(false); setShowChangesModal(true); }}
                                    >
                                        <MessageSquare className="w-5 h-5 ml-2" />
                                        طلب تعديل
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            setShowInterviewModal(true);
                                        }}
                                    >
                                        <Phone className="w-5 h-5 ml-2" />
                                        طلب مقابلة
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                                    >
                                        <XCircle className="w-5 h-5 ml-2" />
                                        رفض
                                    </Button>
                                </div>
                            )}

                            {(selectedApp.applicationStatus === 'INTERVIEW_REQUIRED' ||
                                selectedApp.applicationStatus === 'INTERVIEW_SCHEDULED') && (
                                    <div className="flex gap-3">
                                        <Button
                                            className="flex-1 bg-success-600 hover:bg-success-700"
                                            onClick={() => handleApprove(selectedApp.id)}
                                            disabled={processing}
                                        >
                                            <CheckCircle className="w-5 h-5 ml-2" />
                                            قبول الطلب
                                        </Button>
                                        {selectedApp.applicationStatus === 'INTERVIEW_REQUIRED' && (
                                            <Button
                                                className="bg-info-600 hover:bg-info-700"
                                                onClick={() => { setShowDetailModal(false); setShowInterviewModal(true); }}
                                            >
                                                <Calendar className="w-5 h-5 ml-2" />
                                                جدولة مقابلة
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                                        >
                                            <XCircle className="w-5 h-5 ml-2" />
                                            رفض
                                        </Button>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="text-error-600">رفض الطلب</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">يرجى تحديد سبب الرفض (سيظهر للمعلم)</p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="مثال: لم يتم تقديم شهادات كافية..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px] focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                                    إلغاء
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={processing}
                                >
                                    {processing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                    تأكيد الرفض
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Request Changes Modal */}
            {showChangesModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle>طلب تعديلات</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">حدد التعديلات المطلوبة (سيتمكن المعلم من التعديل وإعادة الإرسال)</p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="مثال: يرجى إضافة صورة شخصية واضحة..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px] focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowChangesModal(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleRequestChanges} disabled={processing}>
                                    {processing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                    إرسال طلب التعديل
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Propose Interview Slots Modal */}
            {showInterviewModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowInterviewModal(false)}>
                    <Card className="max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                اقتراح مواعيد للمقابلة
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-2">
                                قدم خيارين على الأقل (حتى 5 خيارات) ليختار المعلم الوقت المناسب له
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {interviewSlots.map((slot, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900">الخيار {index + 1}</h4>
                                        {interviewSlots.length > 2 && (
                                            <button
                                                onClick={() => removeInterviewSlot(index)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">التاريخ والوقت</label>
                                            <Input
                                                type="datetime-local"
                                                value={slot.dateTime}
                                                onChange={(e) => updateInterviewSlot(index, 'dateTime', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">رابط الاجتماع</label>
                                            <Input
                                                type="url"
                                                value={slot.meetingLink}
                                                onChange={(e) => updateInterviewSlot(index, 'meetingLink', e.target.value)}
                                                placeholder="https://meet.google.com/..."
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {interviewSlots.length < 5 && (
                                <Button
                                    variant="outline"
                                    onClick={addInterviewSlot}
                                    className="w-full border-dashed"
                                >
                                    <Calendar className="w-4 h-4 ml-2" />
                                    إضافة خيار آخر
                                </Button>
                            )}

                            <div className="flex gap-2 justify-end pt-4 border-t relative z-10">
                                <Button variant="outline" onClick={() => setShowInterviewModal(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleProposeInterviewSlots} disabled={processing} className="relative z-10">
                                    {processing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                    <Calendar className="w-4 h-4 ml-2" />
                                    إرسال الخيارات للمعلم
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
