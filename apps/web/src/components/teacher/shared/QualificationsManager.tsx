'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teacherApi, TeacherQualification } from '@/lib/api/teacher';
import { QualificationStatus, CreateQualificationDto } from '@sidra/shared';
import { uploadFile } from '@/lib/api/upload';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';
import {
    GraduationCap,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Upload,
    X,
    Save,
    Building2,
    Calendar,
    Award
} from 'lucide-react';
import { toast } from 'sonner';

interface QualificationsManagerProps {
    /** Whether the component is in read-only mode */
    disabled?: boolean;
    /** Callback when qualifications change */
    onQualificationsChange?: (qualifications: TeacherQualification[]) => void;
    /** Whether to show the "required" indicator */
    required?: boolean;
}

interface QualificationFormData {
    degreeName: string;
    institution: string;
    fieldOfStudy: string;
    status: QualificationStatus;
    startDate: string;
    endDate: string;
    graduationYear: string;
    certificateUrl: string;
}

const emptyFormData: QualificationFormData = {
    degreeName: '',
    institution: '',
    fieldOfStudy: '',
    status: QualificationStatus.GRADUATED,
    startDate: '',
    endDate: '',
    graduationYear: '',
    certificateUrl: '',
};

/**
 * Qualifications Manager - Single source of truth for academic qualifications.
 * Used in both Onboarding (ExperienceStep) and Profile Hub (QualificationsSection).
 *
 * IMPORTANT: This is the ONLY place where academic qualification data is managed.
 * Certificate upload is REQUIRED for each qualification.
 */
export function QualificationsManager({
    disabled = false,
    onQualificationsChange,
    required = false
}: QualificationsManagerProps) {
    const [qualifications, setQualifications] = useState<TeacherQualification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<QualificationFormData>(emptyFormData);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [uploadingCert, setUploadingCert] = useState(false);

    useEffect(() => {
        loadQualifications();
    }, []);

    const loadQualifications = async () => {
        try {
            const quals = await teacherApi.getQualifications();
            setQualifications(quals);
            onQualificationsChange?.(quals);
        } catch (error) {
            console.error('Failed to load qualifications:', error);
            toast.error('فشل تحميل المؤهلات');
        } finally {
            setLoading(false);
        }
    };

    const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCert(true);
        try {
            const fileKey = await uploadFile(file, 'teacher-docs');
            setFormData(prev => ({ ...prev, certificateUrl: fileKey }));
            toast.success('تم رفع الشهادة بنجاح ✅');
        } catch (error: any) {
            console.error('Failed to upload certificate:', error);
            toast.error(error?.message || 'فشل رفع الشهادة');
        } finally {
            setUploadingCert(false);
            e.target.value = '';
        }
    };

    const handleStartEdit = (qual: TeacherQualification) => {
        setEditingId(qual.id);
        setFormData({
            degreeName: qual.degreeName,
            institution: qual.institution,
            fieldOfStudy: qual.fieldOfStudy || '',
            status: qual.status,
            startDate: qual.startDate ? qual.startDate.split('T')[0] : '',
            endDate: qual.endDate ? qual.endDate.split('T')[0] : '',
            graduationYear: qual.graduationYear?.toString() || '',
            certificateUrl: qual.certificateUrl,
        });
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyFormData);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.degreeName.trim()) {
            toast.error('الرجاء إدخال اسم المؤهل');
            return;
        }
        if (!formData.institution.trim()) {
            toast.error('الرجاء إدخال اسم المؤسسة');
            return;
        }
        if (!formData.certificateUrl) {
            toast.error('الرجاء رفع صورة الشهادة - إلزامي');
            return;
        }

        setSaving(true);
        try {
            const dto: CreateQualificationDto = {
                degreeName: formData.degreeName.trim(),
                institution: formData.institution.trim(),
                fieldOfStudy: formData.fieldOfStudy.trim() || undefined,
                status: formData.status,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
                certificateUrl: formData.certificateUrl,
            };

            if (editingId) {
                // Update existing
                await teacherApi.updateQualification(editingId, dto);
                toast.success('تم تحديث المؤهل بنجاح');
            } else {
                // Add new
                await teacherApi.addQualification(dto);
                toast.success('تم إضافة المؤهل بنجاح ✅');
            }

            // Reload and close form
            await loadQualifications();
            handleCancelEdit();
        } catch (error: any) {
            console.error('Failed to save qualification:', error);
            toast.error(error?.response?.data?.message || 'فشل حفظ المؤهل');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المؤهل؟')) return;

        setDeleting(id);
        try {
            await teacherApi.removeQualification(id);
            await loadQualifications();
            toast.success('تم حذف المؤهل');
        } catch (error) {
            console.error('Failed to delete qualification:', error);
            toast.error('فشل حذف المؤهل');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold flex items-center gap-2">
                            المؤهلات الأكاديمية
                            {required && <span className="text-red-500 text-sm">*</span>}
                        </h3>
                        <p className="text-xs text-text-subtle">
                            يجب إضافة مؤهل واحد على الأقل مع الشهادة
                        </p>
                    </div>
                </div>
                <span className="text-sm text-gray-500">{qualifications.length} مؤهل</span>
            </div>

            {/* Qualifications List */}
            {qualifications.length > 0 && (
                <div className="space-y-3">
                    {qualifications.map((qual) => (
                        <div
                            key={qual.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                    {/* Degree Name */}
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                        <h4 className="font-bold text-gray-900">{qual.degreeName}</h4>
                                        {qual.verified && (
                                            <span title="موثّق">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            </span>
                                        )}
                                    </div>

                                    {/* Institution */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{qual.institution}</span>
                                    </div>

                                    {/* Field of Study */}
                                    {qual.fieldOfStudy && (
                                        <div className="text-sm text-gray-600">
                                            التخصص: {qual.fieldOfStudy}
                                        </div>
                                    )}

                                    {/* Status and Year */}
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className={`
                                            px-2 py-1 rounded-full font-medium
                                            ${qual.status === 'GRADUATED' ? 'bg-green-100 text-green-700' :
                                              qual.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-700'}
                                        `}>
                                            {qual.status === 'GRADUATED' ? 'متخرج' :
                                             qual.status === 'IN_PROGRESS' ? 'قيد الدراسة' :
                                             'لم يكتمل'}
                                        </span>
                                        {qual.graduationYear && (
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {qual.graduationYear}
                                            </span>
                                        )}
                                    </div>

                                    {/* Certificate Preview */}
                                    <div className="mt-2">
                                        <AuthenticatedImage
                                            fileKey={qual.certificateUrl}
                                            alt="شهادة"
                                            className="h-20 w-32 rounded-lg border border-gray-200"
                                            enableFullView={true}
                                        />
                                    </div>

                                    {/* Re-verification Warning */}
                                    {qual.verified && (
                                        <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800">
                                                تعديل المؤهل سيتطلب إعادة التوثيق من قبل الإدارة
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {!disabled && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEdit(qual)}
                                            disabled={saving || deleting === qual.id}
                                            className="text-primary hover:bg-primary/10"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(qual.id)}
                                            disabled={saving || deleting === qual.id}
                                            className="text-red-500 hover:bg-red-50"
                                        >
                                            {deleting === qual.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {qualifications.length === 0 && !showForm && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">لم تقم بإضافة أي مؤهلات بعد</p>
                    <p className="text-xs text-gray-500">يجب إضافة مؤهل واحد على الأقل للمتابعة</p>
                </div>
            )}

            {/* Add New Button */}
            {!disabled && !showForm && (
                <Button
                    onClick={() => setShowForm(true)}
                    variant="outline"
                    className="w-full gap-2 border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
                >
                    <Plus className="w-4 h-4" />
                    إضافة مؤهل أكاديمي
                </Button>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="border-2 border-primary/20 rounded-xl p-6 bg-primary/5 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">
                            {editingId ? 'تعديل المؤهل' : 'إضافة مؤهل جديد'}
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={saving}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Degree Name */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            اسم المؤهل <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.degreeName}
                            onChange={(e) => setFormData(prev => ({ ...prev, degreeName: e.target.value }))}
                            placeholder="مثال: بكالوريوس علوم الحاسوب"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Institution */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            المؤسسة / الجامعة <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.institution}
                            onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                            placeholder="مثال: جامعة الخرطوم"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Field of Study */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">التخصص (اختياري)</Label>
                        <Input
                            value={formData.fieldOfStudy}
                            onChange={(e) => setFormData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                            placeholder="مثال: هندسة البرمجيات"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            الحالة <span className="text-red-500">*</span>
                        </Label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as QualificationStatus }))}
                            className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white"
                            disabled={saving}
                        >
                            <option value={QualificationStatus.GRADUATED}>متخرج</option>
                            <option value={QualificationStatus.IN_PROGRESS}>قيد الدراسة</option>
                            <option value={QualificationStatus.NOT_COMPLETED}>لم يكتمل</option>
                        </select>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">تاريخ البداية</Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="h-11"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">تاريخ النهاية</Label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                className="h-11"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Graduation Year */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">سنة التخرج</Label>
                        <Input
                            type="number"
                            min={1900}
                            max={2100}
                            value={formData.graduationYear}
                            onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                            placeholder="مثال: 2020"
                            className="h-11"
                            disabled={saving}
                        />
                    </div>

                    {/* Certificate Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            صورة الشهادة <span className="text-red-500">*</span>
                        </Label>
                        {formData.certificateUrl ? (
                            <div className="space-y-2">
                                <AuthenticatedImage
                                    fileKey={formData.certificateUrl}
                                    alt="شهادة"
                                    className="h-32 w-full rounded-lg border border-gray-200"
                                    enableFullView={true}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, certificateUrl: '' }))}
                                    disabled={saving}
                                    className="w-full"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    حذف الشهادة
                                </Button>
                            </div>
                        ) : (
                            <label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,application/pdf"
                                    onChange={handleCertificateUpload}
                                    disabled={uploadingCert || saving}
                                    className="hidden"
                                />
                                <div className={`
                                    flex items-center justify-center gap-2 px-4 py-8 rounded-lg
                                    cursor-pointer transition-colors border-2 border-dashed
                                    ${uploadingCert || saving
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                                        : 'bg-white text-primary border-primary/30 hover:bg-primary/5'
                                    }
                                `}>
                                    {uploadingCert ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            جاري الرفع...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            انقر لرفع صورة الشهادة (إلزامي)
                                        </>
                                    )}
                                </div>
                            </label>
                        )}
                        <p className="text-xs text-gray-500">
                            صيغ مقبولة: JPG, PNG, PDF • حجم أقصى: 5 ميجابايت
                        </p>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving || uploadingCert}
                            className="flex-1 gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {editingId ? 'تحديث المؤهل' : 'حفظ المؤهل'}
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="flex-1"
                        >
                            إلغاء
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
