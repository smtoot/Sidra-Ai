'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Calendar, Clock, User, AlertTriangle, CheckCircle, XCircle, Eye, Loader2, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Dispute {
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    resolvedAt?: string;
    resolution?: string;
    teacherPayout?: number;
    studentRefund?: number;
    booking: {
        id: string;
        price: number;
        startTime: string;
        subject?: { nameAr: string };
        teacherProfile: { displayName?: string; user: { email: string } };
        bookedByUser: { email: string };
    };
    raisedByUser: { email: string };
    resolvedByAdmin?: { email: string };
}

const disputeTypeLabels: Record<string, string> = {
    TEACHER_NO_SHOW: 'المعلم لم يحضر',
    SESSION_TOO_SHORT: 'الحصة أقصر من المحدد',
    QUALITY_ISSUE: 'مشكلة في الجودة',
    TECHNICAL_ISSUE: 'مشكلة تقنية',
    OTHER: 'أخرى'
};

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [resolutionType, setResolutionType] = useState<string>('');
    const [resolutionNote, setResolutionNote] = useState('');
    const [splitPercentage, setSplitPercentage] = useState(50);
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const loadDisputes = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getDisputes(statusFilter);
            setDisputes(data);
        } catch (error) {
            console.error('Failed to load disputes', error);
            toast.error('فشل في تحميل الشكاوى');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDisputes();
    }, [statusFilter]);

    const handleResolve = async () => {
        if (!selectedDispute || !resolutionType || !resolutionNote.trim()) {
            toast.error('يرجى ملء جميع الحقول');
            return;
        }

        setSubmitting(true);
        try {
            await adminApi.resolveDispute(
                selectedDispute.id,
                resolutionType as any,
                resolutionNote.trim(),
                resolutionType === 'SPLIT' ? splitPercentage : undefined
            );
            toast.success('تم حل الشكوى بنجاح');
            setSelectedDispute(null);
            setResolutionType('');
            setResolutionNote('');
            loadDisputes();
        } catch (error) {
            console.error('Failed to resolve dispute', error);
            toast.error('فشل في حل الشكوى');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkUnderReview = async (disputeId: string) => {
        try {
            await adminApi.markDisputeUnderReview(disputeId);
            toast.success('تم تحديث الحالة');
            loadDisputes();
        } catch (error) {
            toast.error('فشل في تحديث الحالة');
        }
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        if (status.startsWith('RESOLVED') || status === 'DISMISSED') return 'success';
        if (status === 'UNDER_REVIEW') return 'info';
        return 'warning';
    };

    // Bulk selection handlers
    const pendingDisputes = disputes.filter(d => d.status === 'PENDING' || d.status === 'UNDER_REVIEW');

    const toggleSelectAll = () => {
        if (selectedIds.size === pendingDisputes.length && pendingDisputes.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingDisputes.map(d => d.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkMarkUnderReview = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`هل أنت متأكد من بدء مراجعة ${selectedIds.size} شكوى؟`)) return;

        setIsBulkProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            const dispute = disputes.find(d => d.id === id);
            if (dispute?.status === 'PENDING') {
                try {
                    await adminApi.markDisputeUnderReview(id);
                    successCount++;
                } catch {
                    failCount++;
                }
            }
        }

        setSelectedIds(new Set());
        setIsBulkProcessing(false);
        loadDisputes();

        if (successCount > 0) toast.success(`تم بدء مراجعة ${successCount} شكوى`);
        if (failCount > 0) toast.error(`فشل بدء مراجعة ${failCount} شكوى`);
    };

    const handleBulkDismiss = async () => {
        if (selectedIds.size === 0) return;
        const reason = prompt('أدخل سبب رفض الشكاوى المحددة:');
        if (!reason || reason.trim().length < 5) {
            toast.error('يرجى إدخال سبب صالح (5 أحرف على الأقل)');
            return;
        }

        setIsBulkProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                await adminApi.resolveDispute(id, 'DISMISSED', reason.trim());
                successCount++;
            } catch {
                failCount++;
            }
        }

        setSelectedIds(new Set());
        setIsBulkProcessing(false);
        loadDisputes();

        if (successCount > 0) toast.success(`تم رفض ${successCount} شكوى`);
        if (failCount > 0) toast.error(`فشل رفض ${failCount} شكوى`);
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            إدارة الشكاوى
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">مراجعة وحل شكاوى الطلاب</p>
                    </div>

                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">جميع الشكاوى</option>
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="UNDER_REVIEW">تحت المراجعة</option>
                        <option value="RESOLVED_TEACHER_WINS">لصالح المعلم</option>
                        <option value="RESOLVED_STUDENT_WINS">لصالح الطالب</option>
                        <option value="RESOLVED_SPLIT">تسوية جزئية</option>
                        <option value="DISMISSED">مرفوضة</option>
                    </Select>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card hover="lift" padding="md">
                        <div className="text-3xl font-bold font-mono text-warning-600">
                            {disputes.filter(d => d.status === 'PENDING').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">قيد الانتظار</div>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="text-3xl font-bold font-mono text-info-600">
                            {disputes.filter(d => d.status === 'UNDER_REVIEW').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">تحت المراجعة</div>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="text-3xl font-bold font-mono text-success-600">
                            {disputes.filter(d => d.status.startsWith('RESOLVED') || d.status === 'DISMISSED').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">تم الحل</div>
                    </Card>

                    <Card hover="lift" padding="md">
                        <div className="text-3xl font-bold font-mono text-gray-900">{disputes.length}</div>
                        <div className="text-sm text-gray-600 mt-1">إجمالي الشكاوى</div>
                    </Card>
                </div>

                {/* Bulk Actions Bar */}
                {pendingDisputes.length > 0 && (
                    <Card padding="md" className={selectedIds.size > 0 ? "bg-primary-50 border-primary-200" : ""}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleSelectAll}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="تحديد الكل"
                                >
                                    {selectedIds.size === pendingDisputes.length ? (
                                        <CheckSquare className="w-5 h-5 text-primary-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                <span className="text-sm text-gray-600">
                                    {selectedIds.size > 0 ? (
                                        <span className="font-medium text-primary-700">تم تحديد {selectedIds.size} شكوى</span>
                                    ) : (
                                        `${pendingDisputes.length} شكوى قابلة للتحديد`
                                    )}
                                </span>
                            </div>
                            {selectedIds.size > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleBulkMarkUnderReview}
                                        disabled={isBulkProcessing}
                                    >
                                        {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
                                        بدء المراجعة
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleBulkDismiss}
                                        disabled={isBulkProcessing}
                                    >
                                        {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <XCircle className="w-4 h-4 ml-2" />}
                                        رفض المحددة
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedIds(new Set())}
                                        disabled={isBulkProcessing}
                                    >
                                        إلغاء التحديد
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Disputes List */}
                {loading ? (
                    <Card padding="md">
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    </Card>
                ) : disputes.length === 0 ? (
                    <Card padding="md">
                        <div className="py-12 text-center">
                            <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد شكاوى</h3>
                            <p className="text-gray-600">لا توجد شكاوى تطابق الفلتر المحدد</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((dispute) => (
                            <Card key={dispute.id} padding="md" className={selectedIds.has(dispute.id) ? "ring-2 ring-primary-500" : ""}>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {(dispute.status === 'PENDING' || dispute.status === 'UNDER_REVIEW') && (
                                                    <button
                                                        onClick={() => toggleSelect(dispute.id)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                    >
                                                        {selectedIds.has(dispute.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-primary-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </button>
                                                )}
                                                <div className="w-10 h-10 bg-error-50 rounded-full flex items-center justify-center">
                                                    <AlertTriangle className="w-5 h-5 text-error-600" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900">
                                                        {disputeTypeLabels[dispute.type] || dispute.type}
                                                    </span>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(dispute.createdAt).toLocaleDateString('ar-SA')}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge variant={getStatusVariant(dispute.status)}>
                                                {dispute.status === 'PENDING' ? 'قيد الانتظار' :
                                                    dispute.status === 'UNDER_REVIEW' ? 'تحت المراجعة' :
                                                        dispute.status === 'RESOLVED_TEACHER_WINS' ? 'لصالح المعلم' :
                                                            dispute.status === 'RESOLVED_STUDENT_WINS' ? 'لصالح الطالب' :
                                                                dispute.status === 'RESOLVED_SPLIT' ? 'تسوية جزئية' :
                                                                    dispute.status === 'DISMISSED' ? 'مرفوضة' : dispute.status}
                                            </StatusBadge>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-sm text-gray-700">{dispute.description}</p>
                                        </div>

                                        {/* Booking Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={dispute.booking.teacherProfile.displayName || dispute.booking.teacherProfile.user.email}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="text-xs text-gray-500">المعلم</div>
                                                    <div className="font-medium text-gray-900 truncate">
                                                        {dispute.booking.teacherProfile.displayName || dispute.booking.teacherProfile.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fallback={dispute.booking.bookedByUser.email}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="text-xs text-gray-500">الطالب</div>
                                                    <div className="font-medium text-gray-900 truncate">
                                                        {dispute.booking.bookedByUser.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(dispute.booking.startTime).toLocaleDateString('ar-SA')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{dispute.booking.price} SDG</span>
                                            </div>
                                        </div>

                                        {/* Resolution Info */}
                                        {dispute.resolution && (
                                            <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                                                <p className="text-sm font-bold text-success-800">القرار:</p>
                                                <p className="text-sm text-success-700">{dispute.resolution}</p>
                                                {dispute.teacherPayout !== undefined && dispute.teacherPayout > 0 && (
                                                    <p className="text-xs text-success-600 mt-1">المعلم: {dispute.teacherPayout} SDG</p>
                                                )}
                                                {dispute.studentRefund !== undefined && dispute.studentRefund > 0 && (
                                                    <p className="text-xs text-success-600">الطالب: {dispute.studentRefund} SDG (استرداد)</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {(dispute.status === 'PENDING' || dispute.status === 'UNDER_REVIEW') && (
                                        <div className="flex flex-col gap-2">
                                            {dispute.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkUnderReview(dispute.id)}
                                                >
                                                    بدء المراجعة
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                className="bg-success-600 hover:bg-success-700"
                                                onClick={() => {
                                                    setSelectedDispute(dispute);
                                                    setResolutionType('');
                                                    setResolutionNote('');
                                                    setSplitPercentage(50);
                                                }}
                                            >
                                                حل الشكوى
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Resolution Modal */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>حل الشكوى</CardTitle>
                        </CardHeader>
                        <div className="p-6 space-y-4">
                            {/* Dispute Summary */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm font-bold text-gray-800">{disputeTypeLabels[selectedDispute.type]}</p>
                                <p className="text-sm text-gray-600">{selectedDispute.description}</p>
                                <p className="text-sm text-gray-500 mt-2">المبلغ: {selectedDispute.booking.price} SDG</p>
                            </div>

                            {/* Resolution Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">نوع القرار</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setResolutionType('TEACHER_WINS')}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-colors",
                                            resolutionType === 'TEACHER_WINS'
                                                ? "bg-success-100 border-success-500 text-success-700"
                                                : "border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        ✅ لصالح المعلم
                                        <p className="text-xs text-gray-500 mt-1">المعلم يستلم كامل المبلغ</p>
                                    </button>
                                    <button
                                        onClick={() => setResolutionType('STUDENT_WINS')}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-colors",
                                            resolutionType === 'STUDENT_WINS'
                                                ? "bg-success-100 border-success-500 text-success-700"
                                                : "border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        💰 لصالح الطالب
                                        <p className="text-xs text-gray-500 mt-1">استرداد كامل للطالب</p>
                                    </button>
                                    <button
                                        onClick={() => setResolutionType('SPLIT')}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-colors",
                                            resolutionType === 'SPLIT'
                                                ? "bg-warning-100 border-warning-500 text-warning-700"
                                                : "border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        ⚖️ تقسيم المبلغ
                                        <p className="text-xs text-gray-500 mt-1">تسوية جزئية</p>
                                    </button>
                                    <button
                                        onClick={() => setResolutionType('DISMISSED')}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-colors",
                                            resolutionType === 'DISMISSED'
                                                ? "bg-gray-200 border-gray-500 text-gray-700"
                                                : "border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        ❌ رفض الشكوى
                                        <p className="text-xs text-gray-500 mt-1">شكوى غير مبررة</p>
                                    </button>
                                </div>
                            </div>

                            {/* Split Percentage */}
                            {resolutionType === 'SPLIT' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        نسبة استرداد الطالب: {splitPercentage}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={splitPercentage}
                                        onChange={(e) => setSplitPercentage(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>الطالب: {Math.round(selectedDispute.booking.price * splitPercentage / 100)} SDG</span>
                                        <span>المعلم: {Math.round(selectedDispute.booking.price * (100 - splitPercentage) / 100)} SDG</span>
                                    </div>
                                </div>
                            )}

                            {/* Resolution Note */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات القرار</label>
                                <textarea
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    placeholder="اشرح سبب القرار..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleResolve}
                                    disabled={submitting || !resolutionType || !resolutionNote.trim()}
                                    className="flex-1 bg-success-600 hover:bg-success-700"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                    {submitting ? 'جاري الحفظ...' : 'تأكيد القرار'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedDispute(null)}
                                    className="flex-1"
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
