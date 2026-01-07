'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { teacherApi } from '@/lib/api/teacher';
import { GradeLevel } from '@/lib/api/marketplace';
import { Plus, Trash2, BookOpen, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurriculumHierarchy } from '@/hooks/useCurriculumHierarchy';
import { toast } from 'sonner';

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

interface SubjectsManagerProps {
    isReadOnly?: boolean;
    onSubjectsChange?: (subjects: TeacherSubject[]) => void;
}

export function SubjectsManager({ isReadOnly = false, onSubjectsChange }: SubjectsManagerProps) {
    const [mySubjects, setMySubjects] = useState<TeacherSubject[]>([]);
    const [loading, setLoading] = useState(false);
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
            setSelectedGrades([]);
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
            onSubjectsChange?.(profile.subjects || []);
        } catch (err) {
            console.error('Failed to load profile', err);
            toast.error('فشل في تحميل البيانات');
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

    const toggleStageGrades = (stageId: string, stageGrades: GradeLevel[]) => {
        const allSelected = stageGrades.every(g => selectedGrades.includes(g.id));

        if (allSelected) {
            const toRemove = stageGrades.map(g => g.id);
            setSelectedGrades(prev => prev.filter(id => !toRemove.includes(id)));
        } else {
            const toAdd = stageGrades.map(g => g.id).filter(id => !selectedGrades.includes(id));
            setSelectedGrades(prev => [...prev, ...toAdd]);
        }
    };

    const handleAddSubject = async () => {
        if (!selectedSubject || !selectedCurriculum || price <= 0) {
            toast.error('الرجاء تعبئة جميع الحقول الأساسية وتحديد السعر');
            return;
        }

        if (selectedGrades.length === 0) {
            toast.error('الرجاء اختيار صف دراسي واحد على الأقل');
            return;
        }

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
            toast.success('تم إضافة المادة بنجاح');

        } catch (err: any) {
            console.error('Failed to add subject', err);
            toast.error(err.response?.data?.message || 'فشل في إضافة المادة');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSubject = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

        setLoading(true);
        try {
            await teacherApi.removeSubject(id);
            const updated = mySubjects.filter(s => s.id !== id);
            setMySubjects(updated);
            onSubjectsChange?.(updated);
            toast.success('تم حذف المادة');
        } catch (err) {
            console.error('Failed to remove subject', err);
            toast.error('فشل في حذف المادة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 w-full overflow-hidden">
            {/* Add Subject Form */}
            {!isReadOnly && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        إضافة مادة جديدة
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-sm">المادة</Label>
                            <select
                                className="w-full h-12 rounded-md border border-input bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-primary"
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
                            <Label className="text-sm">المنهج</Label>
                            <select
                                className="w-full h-12 rounded-md border border-input bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-primary"
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
                        <div className="py-2 text-center text-sm text-gray-500">جاري تحميل المراحل...</div>
                    )}

                    {hierarchy && (
                        <div className="space-y-3 border rounded-lg p-3 bg-white">
                            <Label className="block text-sm font-bold text-gray-700">تحديد الصفوف (مطلوب)</Label>

                            {hierarchy.stages.map(stage => (
                                <Collapsible
                                    key={stage.id}
                                    open={openStages.includes(stage.id)}
                                    onOpenChange={() => toggleStage(stage.id)}
                                    className="bg-gray-50 border rounded-md overflow-hidden"
                                >
                                    <div className="flex items-center justify-between p-2 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                                                    {openStages.includes(stage.id) ?
                                                        <ChevronUp className="w-4 h-4 text-gray-500" /> :
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    }
                                                </Button>
                                            </CollapsibleTrigger>
                                            <span className="font-medium text-sm">{stage.nameAr}</span>
                                            <span className="text-xs text-gray-400">({stage.grades.length})</span>
                                        </div>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-[10px] h-auto p-0 text-primary"
                                            onClick={() => toggleStageGrades(stage.id, stage.grades)}
                                        >
                                            {stage.grades.every(g => selectedGrades.includes(g.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                                        </Button>
                                    </div>

                                    <CollapsibleContent>
                                        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {stage.grades.map(grade => {
                                                const isSelected = selectedGrades.includes(grade.id);
                                                return (
                                                    <div
                                                        key={grade.id}
                                                        onClick={() => toggleGrade(grade.id)}
                                                        className={cn(
                                                            "cursor-pointer text-sm border rounded-lg px-3 py-2 min-h-[40px] transition-all flex items-center justify-between",
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

                            <div className="text-xs text-gray-500">
                                تم تحديد {selectedGrades.length} صفوف
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1">
                            <Label className="text-sm">سعر الساعة (SDG)</Label>
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
                        <Button
                            onClick={handleAddSubject}
                            disabled={loading || selectedGrades.length === 0}
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            إضافة المادة
                        </Button>
                    </div>
                </div>
            )}

            {/* Current Subjects */}
            <div className="space-y-3">
                <h3 className="font-bold text-sm">المواد المضافة ({mySubjects.length})</h3>

                {loading && mySubjects.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">جاري التحميل...</p>
                ) : mySubjects.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">لم تقم بإضافة أي مواد بعد</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mySubjects.map(item => (
                            <div
                                key={item.id}
                                className="flex items-start justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm">{item.subject?.nameAr || 'مادة'}</p>
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.curriculum?.nameAr || 'منهج'}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {item.grades?.slice(0, 3).map((g, idx) => (
                                                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                    {g.nameAr}
                                                </span>
                                            ))}
                                            {(item.grades?.length || 0) > 3 && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                    +{(item.grades?.length || 0) - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-left">
                                        <p className="font-bold text-primary text-sm">{item.pricePerHour} SDG</p>
                                        <p className="text-[10px] text-gray-400">/ساعة</p>
                                    </div>
                                    {!isReadOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSubject(item.id)}
                                            className="text-red-500 hover:bg-red-50 h-8 w-8"
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
