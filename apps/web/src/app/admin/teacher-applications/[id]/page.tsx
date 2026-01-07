'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
    Eye, Clock, User, FileText, Video, Award, BookOpen, Loader2,
    ArrowRight, Edit2
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

export default function TeacherApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showChangesModal, setShowChangesModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [reason, setReason] = useState('');
    const [interviewSlots, setInterviewSlots] = useState<{ dateTime: string; meetingLink: string }[]>([
        { dateTime: '', meetingLink: '' },
        { dateTime: '', meetingLink: '' }
    ]);
    const [processing, setProcessing] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        displayName: '',
        fullName: '',
        bio: '',
        introVideoUrl: '',
        whatsappNumber: '',
        city: '',
        country: '',
    });

    useEffect(() => {
        loadApplication();
    }, [id]);

    const loadApplication = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getTeacherApplication(id);
            setSelectedApp(data);
        } catch (error) {
            toast.error('فشل تحميل تفاصيل الطلب');
            router.push('/admin/teacher-applications');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setProcessing(true);
        try {
            await adminApi.approveApplication(id);
            toast.success('تم قبول الطلب ✅');
            loadApplication();
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
            await adminApi.rejectApplication(id, reason);
            toast.success('تم رفض الطلب');
            setShowRejectModal(false);
            setReason('');
            loadApplication();
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
            await adminApi.requestChanges(id, reason);
            toast.success('تم إرسال طلب التعديل');
            setShowChangesModal(false);
            setReason('');
            loadApplication();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشلت العملية');
        } finally {
            setProcessing(false);
        }
    };

    const handleProposeInterviewSlots = async () => {
        const validSlots = interviewSlots.filter(slot => slot.dateTime);
        const slotsWithoutDateTime = interviewSlots.filter(slot => !slot.dateTime);

        if (validSlots.length < 2) {
            if (slotsWithoutDateTime.length > 0) {
                toast.error('يجب تحديد التاريخ والوقت لكل خيار مقابلة');
            } else {
                toast.error('يجب تقديم خيارين على الأقل للمعلم');
            }
            return;
        }

        setProcessing(true);
        try {
            await adminApi.proposeInterviewSlots(id, validSlots);
            toast.success('تم إرسال خيارات المقابلة للمعلم ✅');
            setShowInterviewModal(false);
            setInterviewSlots([
                { dateTime: '', meetingLink: '' },
                { dateTime: '', meetingLink: '' }
            ]);
            loadApplication();
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

    const openEditProfile = () => {
        if (!selectedApp) return;
        setEditFormData({
            displayName: selectedApp.displayName || '',
            fullName: selectedApp.fullName || '',
            bio: selectedApp.bio || '',
            introVideoUrl: selectedApp.introVideoUrl || '',
            whatsappNumber: selectedApp.whatsappNumber || '',
            city: selectedApp.city || '',
            country: selectedApp.country || '',
        });
        setShowEditProfileModal(true);
    };

    const handleSaveProfile = async () => {
        setProcessing(true);
        try {
            await adminApi.updateTeacherProfile(id, editFormData);
            toast.success('تم حفظ التعديلات بنجاح ✅');
            setShowEditProfileModal(false);
            loadApplication();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشل حفظ التعديلات');
        } finally {
            setProcessing(false);
        }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!selectedApp) return null;

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header & Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/admin/teacher-applications')}
                            className="text-gray-500 hover:text-gray-900"
                        >
                            <ArrowRight className="w-5 h-5 ml-1" />
                            عودة للقائمة
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">تفاصيل طلب المعلم</h1>
                            <p className="text-sm text-gray-500">#{selectedApp.id.slice(0, 8)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={openEditProfile}>
                            <Edit2 className="w-4 h-4 ml-2" />
                            تعديل الملف
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
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
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <MessageSquare className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-700">{selectedApp.user?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="font-mono text-gray-700" dir="ltr">{selectedApp.user?.phoneNumber || '-'}</span>
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
                                <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed max-h-40 overflow-y-auto">
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
                                            <TableHead>الصفوف</TableHead>
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
                                                <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                                                    {s.grades?.map((g: any) => g.nameAr).join('، ')}
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
                                // Aggregate all documents
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
                                                fileName: `Certificate - ${q.degreeName || q.degree || 'Qualification'} ${idx + 1}`,
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {allDocs.map((doc: any, index: number) => (
                                            <button
                                                key={doc.id || index}
                                                onClick={() => handleViewDocument(doc.fileUrl, doc.fileName)}
                                                className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group text-center gap-3"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                                    {doc.type === 'IDENTITY_VERIFICATION' ? (
                                                        <User className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                                                    ) : doc.type === 'ACADEMIC_CERTIFICATE' ? (
                                                        <Award className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                                                    ) : (
                                                        <FileText className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                                                    )}
                                                </div>
                                                <div className="w-full">
                                                    <p className="text-sm font-medium truncate w-full" title={doc.fileName}>{doc.fileName}</p>
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

                    {/* Actions Card (Sticky Bottom equivalent but as a prominent card) */}
                    <Card className="border-t-4 border-t-primary-500 bg-gray-50">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">اتخاذ إجراء</h3>
                            <div className="flex flex-wrap gap-4">
                                {/* Actions Logic */}
                                {(selectedApp.applicationStatus === 'SUBMITTED' || selectedApp.applicationStatus === 'INTERVIEW_REQUIRED' || selectedApp.applicationStatus === 'INTERVIEW_SCHEDULED') && (
                                    <Button
                                        className="bg-success-600 hover:bg-success-700 min-w-[150px]"
                                        size="lg"
                                        onClick={handleApprove}
                                        disabled={processing}
                                    >
                                        <CheckCircle className="w-5 h-5 ml-2" />
                                        قبول الطلب
                                    </Button>
                                )}

                                {selectedApp.applicationStatus === 'SUBMITTED' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setShowChangesModal(true)}
                                            className="bg-white"
                                        >
                                            <MessageSquare className="w-5 h-5 ml-2" />
                                            طلب تعديل
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setShowInterviewModal(true)}
                                            className="bg-white"
                                        >
                                            <Phone className="w-5 h-5 ml-2" />
                                            طلب مقابلة
                                        </Button>
                                    </>
                                )}

                                {selectedApp.applicationStatus === 'INTERVIEW_REQUIRED' && (
                                    <Button
                                        className="bg-info-600 hover:bg-info-700"
                                        size="lg"
                                        onClick={() => setShowInterviewModal(true)}
                                    >
                                        <Calendar className="w-5 h-5 ml-2" />
                                        جدولة مقابلة
                                    </Button>
                                )}

                                {(selectedApp.applicationStatus !== 'APPROVED' && selectedApp.applicationStatus !== 'REJECTED') && (
                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        onClick={() => setShowRejectModal(true)}
                                    >
                                        <XCircle className="w-5 h-5 ml-2" />
                                        رفض
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            {/* Reject Modal */}
            {showRejectModal && (
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
            {showChangesModal && (
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
            {showInterviewModal && (
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
                                            <label className="block text-sm font-medium mb-1">رابط الاجتماع <span className="text-gray-400 font-normal">(اختياري)</span></label>
                                            <Input
                                                type="url"
                                                placeholder="https://zoom.us/..."
                                                value={slot.meetingLink}
                                                onChange={(e) => updateInterviewSlot(index, 'meetingLink', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addInterviewSlot} className="w-full">
                                + إضافة موعد آخر
                            </Button>
                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                                <Button variant="outline" onClick={() => setShowInterviewModal(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleProposeInterviewSlots} disabled={processing}>
                                    {processing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                    إرسال المقترحات
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditProfileModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-2xl w-full my-8 shadow-xl p-6">
                        <h2 className="text-xl font-bold mb-4">تعديل الملف الشخصي</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">اسم العرض</label>
                                    <Input
                                        value={editFormData.displayName}
                                        onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                                    <Input
                                        value={editFormData.fullName}
                                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">رقم الواتساب</label>
                                <Input
                                    value={editFormData.whatsappNumber}
                                    onChange={(e) => setEditFormData({ ...editFormData, whatsappNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">نبذة تعريفية</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
                                    value={editFormData.bio}
                                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={() => setShowEditProfileModal(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleSaveProfile} disabled={processing}>
                                    حفظ التعديلات
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
