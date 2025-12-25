'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { teacherApi } from '@/lib/api/teacher';
import { GradeLevel } from '@/lib/api/marketplace';
import { Plus, Trash2, BookOpen, DollarSign, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurriculumHierarchy } from '@/hooks/useCurriculumHierarchy';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';

interface TeacherSubject {
    id: string;
    subjectId: string;
    curriculumId: string;
    pricePerHour: number;
    subject?: { nameAr: string };
    curriculum?: { nameAr: string };
    grades?: Array<{
        nameAr: string;
        code: string;
        stageNameAr?: string
    }>;
}

interface Curriculum {
    id: string;
    nameAr: string;
}

interface Subject {
    id: string;
    nameAr: string;
}

export default function TeacherSubjectsPage() {
    const [mySubjects, setMySubjects] = useState<TeacherSubject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    // Form state
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const [price, setPrice] = useState(0);
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
    const [openStages, setOpenStages] = useState<string[]>([]);

    // React Query hooks for cached data
    const { data: curricula = [] } = useCurricula();
    const { data: subjects = [] } = useSubjects();
    const { data: hierarchy, isLoading: loadingHierarchy } = useCurriculumHierarchy(selectedCurriculum || null);

    // Open all stages when hierarchy loads
    useEffect(() => {
        if (hierarchy?.stages) {
            setOpenStages(hierarchy.stages.map(s => s.id));
            setSelectedGrades([]); // Reset grades on curriculum change
        }
    }, [hierarchy]);

    useEffect(() => {
        setIsMounted(true);
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const profile = await teacherApi.getProfile();
            setMySubjects(profile.subjects || []);
        } catch (err) {
            console.error('Failed to load profile', err);
            setError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const toggleGrade = (gradeId: string) => {
        setSelectedGrades(prev =>
            prev.includes(gradeId)
                ? prev.filter(id => id !== gradeId)
                : [...prev, gradeId]
        );
    };

    const toggleStage = (stageId: string) => {
        setOpenStages(prev =>
            prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    };

    // Helper to select all grades in a stage
    const toggleStageGrades = (stageId: string, stageGrades: GradeLevel[]) => {
        const allSelected = stageGrades.every(g => selectedGrades.includes(g.id));

        if (allSelected) {
            // Deselect all
            const toRemove = stageGrades.map(g => g.id);
            setSelectedGrades(prev => prev.filter(id => !toRemove.includes(id)));
        } else {
            // Select all
            const toAdd = stageGrades.map(g => g.id).filter(id => !selectedGrades.includes(id));
            setSelectedGrades(prev => [...prev, ...toAdd]);
        }
    };

    const handleAddSubject = async () => {
        if (!selectedSubject || !selectedCurriculum || price <= 0) {
            setError('الرجاء تعبئة جميع الحقول الأساسية وتحديد السعر');
            return;
        }

        if (selectedGrades.length === 0) {
            setError('الرجاء اختيار صف دراسي واحد على الأقل');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await teacherApi.addSubject({
                subjectId: selectedSubject,
                curriculumId: selectedCurriculum,
                pricePerHour: Number(price),
                gradeLevelIds: selectedGrades
            });
            await loadProfile();

            // Reset form
            setSelectedSubject('');
            setSelectedCurriculum('');
            setPrice(0);
            setSelectedGrades([]);

        } catch (err: any) {
            console.error('Failed to add subject', err);
            // Show backend validation message if available
            setError(err.response?.data?.message || 'فشل في إضافة المادة، يرجى المحاولة مرة أخرى');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSubject = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

        setLoading(true);
        try {
            await teacherApi.removeSubject(id);
            setMySubjects(mySubjects.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to remove subject', err);
            setError('فشل في حذف المادة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TeacherApprovalGuard>
            <div className="max-w-3xl mx-auto py-8 px-4 font-tajawal" dir="rtl">
                <header className="mb-8">
                    {/* ... header content ... */}
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <BookOpen className="w-6 h-6" />
                        المواد والأسعار
                    </h1>
                    <p className="text-text-subtle mt-1">أضف المواد التي تدرّسها، حدد المراحل، وضع سعرك لكل ساعة</p>
                </header>

                {/* Add Subject Form */}
                <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                    <h2 className="font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        إضافة مادة جديدة
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <Label>المادة</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                <option value="">اختر المادة</option>
                                {isMounted && subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label>المنهج</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={selectedCurriculum}
                                onChange={(e) => setSelectedCurriculum(e.target.value)}
                            >
                                <option value="">اختر المنهج</option>
                                {isMounted && curricula.map(c => (
                                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Hierarchy / Grade Selection */}
                    {loadingHierarchy && (
                        <div className="py-4 text-center text-sm text-gray-500">جاري تحميل المراحل الدراسية...</div>
                    )}

                    {hierarchy && (
                        <div className="mb-6 space-y-4 border rounded-lg p-4 bg-gray-50/50">
                            <Label className="block mb-2 font-bold text-gray-700">تحديد الصفوف الدراسية (مطلوب)</Label>

                            {hierarchy.stages.map(stage => (
                                <Collapsible
                                    key={stage.id}
                                    open={openStages.includes(stage.id)}
                                    onOpenChange={() => toggleStage(stage.id)}
                                    className="bg-white border rounded-md overflow-hidden"
                                >
                                    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                                                    {openStages.includes(stage.id) ?
                                                        <ChevronUp className="w-4 h-4 text-gray-500" /> :
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    }
                                                </Button>
                                            </CollapsibleTrigger>
                                            <span className="font-medium text-sm">{stage.nameAr}</span>
                                            <span className="text-xs text-gray-400">({stage.grades.length} صفوف)</span>
                                        </div>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-xs h-auto p-0 text-primary"
                                            onClick={() => toggleStageGrades(stage.id, stage.grades)}
                                        >
                                            {stage.grades.every(g => selectedGrades.includes(g.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                                        </Button>
                                    </div>

                                    <CollapsibleContent>
                                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {stage.grades.map(grade => {
                                                const isSelected = selectedGrades.includes(grade.id);
                                                return (
                                                    <div
                                                        key={grade.id}
                                                        onClick={() => toggleGrade(grade.id)}
                                                        className={cn(
                                                            "cursor-pointer text-sm border rounded px-3 py-2 transition-all flex items-center justify-between",
                                                            isSelected
                                                                ? "bg-primary/10 border-primary text-primary font-medium"
                                                                : "bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                                                        )}
                                                    >
                                                        <span>{grade.nameAr}</span>
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}

                            <div className="pt-2 flex justify-between items-center text-sm">
                                <span className="text-gray-500">تم تحديد {selectedGrades.length} صفوف</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1">
                            <Label>سعر الساعة (SDG)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                placeholder="مثال: 5000"
                                className="text-left"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <Button
                                onClick={handleAddSubject}
                                disabled={loading || selectedGrades.length === 0}
                                className="w-full gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                حفظ المادة
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Current Subjects */}
                <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="font-bold mb-4">المواد المضافة</h2>

                    {loading && mySubjects.length === 0 ? (
                        <p className="text-center text-text-subtle py-8">جاري التحميل...</p>
                    ) : mySubjects.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-text-subtle mb-2">لم تقم بإضافة أي مواد بعد</p>
                            <p className="text-sm text-gray-400">أضف المواد التي تدرّسها ليتمكن الطلاب من العثور عليك</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mySubjects.map(item => (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-4 bg-gray-50 border border-gray-100 rounded-lg gap-4 transition-all hover:bg-white hover:shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900">{item.subject?.nameAr || 'مادة'}</p>
                                                <Badge variant="outline" className="text-[10px] text-gray-500 font-normal">
                                                    {item.curriculum?.nameAr || 'منهج'}
                                                </Badge>
                                            </div>

                                            {/* Grades Display */}
                                            <div className="flex flex-wrap gap-1">
                                                {item.grades && item.grades.length > 0 ? (
                                                    item.grades.map((g, idx) => (
                                                        <span key={idx} className="text-xs bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                            {g.nameAr}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded">
                                                        ربما البيانات قديمة - يرجى التحديث
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-1">
                                        <div className="text-left">
                                            <p className="font-bold text-accent flex items-center gap-1 text-lg">
                                                <span className="text-sm text-gray-400 font-normal">SDG</span>
                                                {item.pricePerHour}
                                            </p>
                                            <p className="text-[10px] text-text-subtle text-right">/ ساعة</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSubject(item.id)}
                                            className="text-red-500 hover:bg-red-50 hover:text-red-700 -ml-2"
                                            disabled={loading}
                                            title="حذف المادة"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TeacherApprovalGuard>
    );
}
