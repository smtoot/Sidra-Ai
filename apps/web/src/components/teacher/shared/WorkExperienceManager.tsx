'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    teacherApi,
    TeacherWorkExperience,
    ExperienceType,
} from '@/lib/api/teacher';
import {
    Briefcase,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    X,
    Save,
    Building2,
    Calendar,
    CheckCircle2,
    Globe,
    Home,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkExperienceManagerProps {
    /** Whether the component is in read-only mode */
    disabled?: boolean;
    /** Callback when experiences change */
    onExperiencesChange?: (experiences: TeacherWorkExperience[]) => void;
}

interface ExperienceFormData {
    title: string;
    organization: string;
    experienceType: ExperienceType;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    subjects: string;
}

const emptyFormData: ExperienceFormData = {
    title: '',
    organization: '',
    experienceType: ExperienceType.SCHOOL,
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    subjects: '',
};

// Arabic labels for experience types
const EXPERIENCE_TYPE_LABELS: Record<ExperienceType, string> = {
    [ExperienceType.SCHOOL]: 'مدرسة',
    [ExperienceType.TUTORING_CENTER]: 'مركز تعليمي',
    [ExperienceType.ONLINE_PLATFORM]: 'منصة إلكترونية',
    [ExperienceType.PRIVATE]: 'دروس خصوصية',
    [ExperienceType.OTHER]: 'أخرى',
};

// Icons for experience types
const EXPERIENCE_TYPE_ICONS: Record<ExperienceType, typeof Building2> = {
    [ExperienceType.SCHOOL]: Building2,
    [ExperienceType.TUTORING_CENTER]: Users,
    [ExperienceType.ONLINE_PLATFORM]: Globe,
    [ExperienceType.PRIVATE]: Home,
    [ExperienceType.OTHER]: Briefcase,
};

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear().toString();
}

/**
 * Work Experience Manager - CRUD component for teacher work experiences.
 * Following the same pattern as QualificationsManager.
 */
export function WorkExperienceManager({
    disabled = false,
    onExperiencesChange,
}: WorkExperienceManagerProps) {
    const [experiences, setExperiences] = useState<TeacherWorkExperience[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExperienceFormData>(emptyFormData);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadExperiences();
    }, []);

    const loadExperiences = async () => {
        try {
            const data = await teacherApi.getWorkExperiences();
            setExperiences(data);
            onExperiencesChange?.(data);
        } catch (error) {
            console.error('Failed to load work experiences:', error);
            toast.error('فشل تحميل الخبرات العملية');
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (exp: TeacherWorkExperience) => {
        setEditingId(exp.id);
        setFormData({
            title: exp.title,
            organization: exp.organization,
            experienceType: exp.experienceType,
            startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
            endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
            isCurrent: exp.isCurrent,
            description: exp.description || '',
            subjects: exp.subjects?.join('، ') || '',
        });
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyFormData);
    };

    const handleIsCurrentChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            isCurrent: checked,
            // Auto-clear endDate when "currently working" is checked
            endDate: checked ? '' : prev.endDate,
        }));
    };

    const handleEndDateChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            endDate: value,
            // Auto-uncheck "currently working" when end date is entered
            isCurrent: value ? false : prev.isCurrent,
        }));
    };

    const handleSave = async () => {
        // Validation
        if (!formData.title.trim()) {
            toast.error('الرجاء إدخال عنوان الوظيفة');
            return;
        }

        if (!formData.organization.trim()) {
            toast.error('الرجاء إدخال اسم المؤسسة');
            return;
        }

        // Date validation: endDate without startDate
        if (formData.endDate && !formData.startDate) {
            toast.error('تاريخ البداية مطلوب عند تحديد تاريخ النهاية');
            return;
        }

        // Date validation: startDate > endDate
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start > end) {
                toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
                return;
            }
        }

        // Parse subjects from comma-separated string
        const subjectsArray = formData.subjects
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        setSaving(true);
        try {
            const dto = {
                title: formData.title.trim(),
                organization: formData.organization.trim(),
                experienceType: formData.experienceType,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                isCurrent: formData.isCurrent,
                description: formData.description.trim() || undefined,
                subjects: subjectsArray.length > 0 ? subjectsArray : undefined,
            };

            if (editingId) {
                // Update existing
                await teacherApi.updateWorkExperience(editingId, dto);
                toast.success('تم تحديث الخبرة بنجاح');
            } else {
                // Add new
                await teacherApi.addWorkExperience(dto);
                toast.success('تم إضافة الخبرة بنجاح');
            }

            // Reload and close form
            await loadExperiences();
            handleCancelEdit();
        } catch (error: any) {
            console.error('Failed to save work experience:', error);
            toast.error(error?.response?.data?.message || 'فشل حفظ الخبرة');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخبرة؟')) return;

        setDeleting(id);
        try {
            await teacherApi.removeWorkExperience(id);
            await loadExperiences();
            toast.success('تم حذف الخبرة');
        } catch (error) {
            console.error('Failed to delete work experience:', error);
            toast.error('فشل حذف الخبرة');
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
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold">الخبرات العملية</h3>
                        <p className="text-xs text-text-subtle">
                            شارك تاريخك المهني لبناء الثقة
                        </p>
                    </div>
                </div>
                <span className="text-sm text-gray-500">
                    {experiences.length} خبرة
                </span>
            </div>

            {/* Experiences List */}
            {experiences.length > 0 && (
                <div className="space-y-3">
                    {experiences.map((exp) => {
                        const TypeIcon =
                            EXPERIENCE_TYPE_ICONS[exp.experienceType] || Briefcase;
                        return (
                            <div
                                key={exp.id}
                                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        {/* Title */}
                                        <div className="flex items-center gap-2">
                                            <TypeIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <h4 className="font-bold text-gray-900">
                                                {exp.title}
                                            </h4>
                                            {exp.isCurrent && (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    حاليًا
                                                </span>
                                            )}
                                        </div>

                                        {/* Organization */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>{exp.organization}</span>
                                        </div>

                                        {/* Type and Date */}
                                        <div className="flex items-center gap-3 text-xs flex-wrap">
                                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                {EXPERIENCE_TYPE_LABELS[exp.experienceType]}
                                            </span>
                                            {(exp.startDate || exp.isCurrent) && (
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(exp.startDate)}
                                                    {' - '}
                                                    {exp.isCurrent
                                                        ? 'الآن'
                                                        : formatDate(exp.endDate) || ''}
                                                </span>
                                            )}
                                        </div>

                                        {/* Subjects */}
                                        {exp.subjects && exp.subjects.length > 0 && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">المواد: </span>
                                                {exp.subjects.join('، ')}
                                            </div>
                                        )}

                                        {/* Description */}
                                        {exp.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {!disabled && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStartEdit(exp)}
                                                disabled={saving || deleting === exp.id}
                                                className="text-primary hover:bg-primary/10"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(exp.id)}
                                                disabled={saving || deleting === exp.id}
                                                className="text-red-500 hover:bg-red-50"
                                            >
                                                {deleting === exp.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {experiences.length === 0 && !showForm && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                        لم تضف أي خبرات عملية بعد
                    </p>
                    <p className="text-xs text-gray-500">
                        شارك تاريخك المهني لبناء الثقة
                    </p>
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
                    إضافة خبرة جديدة
                </Button>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="border-2 border-primary/20 rounded-xl p-6 bg-primary/5 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">
                            {editingId ? 'تعديل الخبرة' : 'إضافة خبرة جديدة'}
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

                    {/* Title */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            عنوان الوظيفة <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.title}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            placeholder="مثال: معلم رياضيات"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Organization */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            اسم المؤسسة <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.organization}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    organization: e.target.value,
                                }))
                            }
                            placeholder="مثال: مدرسة الخرطوم الثانوية"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Experience Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            نوع الخبرة <span className="text-red-500">*</span>
                        </Label>
                        <select
                            value={formData.experienceType}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    experienceType: e.target.value as ExperienceType,
                                }))
                            }
                            className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white"
                            disabled={saving}
                        >
                            {Object.entries(EXPERIENCE_TYPE_LABELS).map(
                                ([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Currently Working Checkbox */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isCurrent"
                            checked={formData.isCurrent}
                            onChange={(e) => handleIsCurrentChange(e.target.checked)}
                            disabled={saving}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label
                            htmlFor="isCurrent"
                            className="text-sm font-medium cursor-pointer"
                        >
                            أعمل هنا حاليًا
                        </Label>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">تاريخ البداية</Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        startDate: e.target.value,
                                    }))
                                }
                                className="h-11"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">تاريخ النهاية</Label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                className="h-11"
                                disabled={saving || formData.isCurrent}
                            />
                            {formData.isCurrent && (
                                <p className="text-xs text-gray-500">
                                    معطل لأنك أعمل هنا حاليًا
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            المواد (اختياري)
                        </Label>
                        <Input
                            value={formData.subjects}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    subjects: e.target.value,
                                }))
                            }
                            placeholder="مثال: رياضيات، إحصاء، هندسة"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                        <p className="text-xs text-gray-500">
                            افصل المواد بفاصلة
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            الوصف (اختياري)
                        </Label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="صف مهامك وإنجازاتك في هذا المنصب..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white resize-none h-24"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
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
                                    {editingId ? 'تحديث الخبرة' : 'حفظ الخبرة'}
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
