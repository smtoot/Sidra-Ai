'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    teacherApi,
    TeacherSkill,
    SkillCategory,
    SkillProficiency,
} from '@/lib/api/teacher';
import {
    Award,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    X,
    Save,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface SkillsManagerProps {
    /** Whether the component is in read-only mode */
    disabled?: boolean;
    /** Callback when skills change */
    onSkillsChange?: (skills: TeacherSkill[]) => void;
}

interface SkillFormData {
    name: string;
    category?: SkillCategory;
    proficiency: SkillProficiency;
}

const emptyFormData: SkillFormData = {
    name: '',
    category: undefined,
    proficiency: SkillProficiency.INTERMEDIATE,
};

// Arabic labels for enums
const CATEGORY_LABELS: Record<SkillCategory, string> = {
    [SkillCategory.TEACHING_METHOD]: 'طرق التدريس',
    [SkillCategory.TECHNOLOGY]: 'التقنيات',
    [SkillCategory.SOFT_SKILL]: 'المهارات الشخصية',
    [SkillCategory.SUBJECT_SPECIFIC]: 'تخصصية',
};

const PROFICIENCY_LABELS: Record<SkillProficiency, string> = {
    [SkillProficiency.BEGINNER]: 'مبتدئ',
    [SkillProficiency.INTERMEDIATE]: 'متوسط',
    [SkillProficiency.ADVANCED]: 'متقدم',
    [SkillProficiency.EXPERT]: 'خبير',
};

const PROFICIENCY_COLORS: Record<SkillProficiency, string> = {
    [SkillProficiency.BEGINNER]: 'bg-gray-100 text-gray-700',
    [SkillProficiency.INTERMEDIATE]: 'bg-blue-100 text-blue-700',
    [SkillProficiency.ADVANCED]: 'bg-purple-100 text-purple-700',
    [SkillProficiency.EXPERT]: 'bg-green-100 text-green-700',
};

/**
 * Skills Manager - CRUD component for teacher skills.
 * Following the same pattern as QualificationsManager.
 */
export function SkillsManager({
    disabled = false,
    onSkillsChange,
}: SkillsManagerProps) {
    const [skills, setSkills] = useState<TeacherSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SkillFormData>(emptyFormData);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const data = await teacherApi.getSkills();
            setSkills(data);
            onSkillsChange?.(data);
        } catch (error) {
            console.error('Failed to load skills:', error);
            toast.error('فشل تحميل المهارات');
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (skill: TeacherSkill) => {
        setEditingId(skill.id);
        setFormData({
            name: skill.name,
            category: skill.category,
            proficiency: skill.proficiency,
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
        if (!formData.name.trim()) {
            toast.error('الرجاء إدخال اسم المهارة');
            return;
        }

        if (formData.name.trim().length < 2) {
            toast.error('اسم المهارة يجب أن يكون حرفين على الأقل');
            return;
        }

        setSaving(true);
        try {
            const dto = {
                name: formData.name.trim(),
                category: formData.category,
                proficiency: formData.proficiency,
            };

            if (editingId) {
                // Update existing
                await teacherApi.updateSkill(editingId, dto);
                toast.success('تم تحديث المهارة بنجاح');
            } else {
                // Add new
                await teacherApi.addSkill(dto);
                toast.success('تم إضافة المهارة بنجاح');
            }

            // Reload and close form
            await loadSkills();
            handleCancelEdit();
        } catch (error: any) {
            console.error('Failed to save skill:', error);
            toast.error(error?.response?.data?.message || 'فشل حفظ المهارة');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المهارة؟')) return;

        setDeleting(id);
        try {
            await teacherApi.removeSkill(id);
            await loadSkills();
            toast.success('تم حذف المهارة');
        } catch (error) {
            console.error('Failed to delete skill:', error);
            toast.error('فشل حذف المهارة');
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
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold">المهارات</h3>
                        <p className="text-xs text-text-subtle">
                            أضف مهاراتك لتبرز قدراتك
                        </p>
                    </div>
                </div>
                <span className="text-sm text-gray-500">
                    {skills.length} مهارة
                </span>
            </div>

            {/* Skills List */}
            {skills.length > 0 && (
                <div className="space-y-3">
                    {skills.map((skill) => (
                        <div
                            key={skill.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                    {/* Skill Name */}
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <h4 className="font-bold text-gray-900">
                                            {skill.name}
                                        </h4>
                                    </div>

                                    {/* Category and Proficiency */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {skill.category && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                {CATEGORY_LABELS[skill.category]}
                                            </span>
                                        )}
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${PROFICIENCY_COLORS[skill.proficiency]}`}
                                        >
                                            {PROFICIENCY_LABELS[skill.proficiency]}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!disabled && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEdit(skill)}
                                            disabled={saving || deleting === skill.id}
                                            className="text-primary hover:bg-primary/10"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(skill.id)}
                                            disabled={saving || deleting === skill.id}
                                            className="text-red-500 hover:bg-red-50"
                                        >
                                            {deleting === skill.id ? (
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
            {skills.length === 0 && !showForm && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                        لم تضف أي مهارات بعد
                    </p>
                    <p className="text-xs text-gray-500">
                        المهارات تساعد أولياء الأمور على فهم قدراتك
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
                    إضافة مهارة جديدة
                </Button>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="border-2 border-primary/20 rounded-xl p-6 bg-primary/5 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">
                            {editingId ? 'تعديل المهارة' : 'إضافة مهارة جديدة'}
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

                    {/* Skill Name */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            اسم المهارة <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="مثال: إدارة الفصل الدراسي"
                            className="h-11"
                            dir="rtl"
                            disabled={saving}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            التصنيف (اختياري)
                        </Label>
                        <select
                            value={formData.category || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    category: e.target.value
                                        ? (e.target.value as SkillCategory)
                                        : undefined,
                                }))
                            }
                            className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white"
                            disabled={saving}
                        >
                            <option value="">اختر التصنيف</option>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Proficiency */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">مستوى الإتقان</Label>
                        <select
                            value={formData.proficiency}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    proficiency: e.target.value as SkillProficiency,
                                }))
                            }
                            className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white"
                            disabled={saving}
                        >
                            {Object.entries(PROFICIENCY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
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
                                    {editingId ? 'تحديث المهارة' : 'حفظ المهارة'}
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
