'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Plus, Trash2, Loader2, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { teacherApi } from '@/lib/api/teacher';
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurriculumHierarchy } from '@/hooks/useCurriculumHierarchy';

interface AddSubjectModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function AddSubjectModal({ open, onClose, onSuccess }: AddSubjectModalProps) {
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [price, setPrice] = useState(0);
    const [saving, setSaving] = useState(false);

    const { data: curricula = [] } = useCurricula();
    const { data: subjects = [] } = useSubjects();
    const { data: hierarchy, isLoading: loadingHierarchy } = useCurriculumHierarchy(selectedCurriculum || null);

    // Reset when curriculum changes
    useEffect(() => {
        setSelectedStages([]);
    }, [selectedCurriculum]);

    const toggleStage = (stageId: string) => {
        setSelectedStages(prev =>
            prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    };

    const handleAdd = async () => {
        if (!selectedCurriculum) {
            toast.error('الرجاء اختيار المنهج');
            return;
        }
        if (!selectedSubject) {
            toast.error('الرجاء اختيار المادة');
            return;
        }
        if (selectedStages.length === 0) {
            toast.error('الرجاء اختيار مرحلة واحدة على الأقل');
            return;
        }
        if (price <= 0) {
            toast.error('الرجاء إدخال سعر صالح');
            return;
        }

        // Get all grade IDs for selected stages
        const gradeIds: string[] = [];
        hierarchy?.stages.forEach(stage => {
            if (selectedStages.includes(stage.id)) {
                stage.grades.forEach(g => gradeIds.push(g.id));
            }
        });

        setSaving(true);
        try {
            await teacherApi.addSubject({
                subjectId: selectedSubject,
                curriculumId: selectedCurriculum,
                pricePerHour: price,
                gradeLevelIds: gradeIds,
            });
            toast.success('تم إضافة المادة بنجاح');
            onSuccess();
            onClose();
            // Reset form
            setSelectedCurriculum('');
            setSelectedSubject('');
            setSelectedStages([]);
            setPrice(0);
        } catch (error) {
            console.error('Failed to add subject', error);
            toast.error('فشل إضافة المادة');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5"
                onClick={e => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">إضافة مادة جديدة</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Curriculum */}
                <div className="space-y-2">
                    <Label>1. اختر المنهج</Label>
                    <select
                        value={selectedCurriculum}
                        onChange={(e) => setSelectedCurriculum(e.target.value)}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="">اختر المنهج</option>
                        {curricula.map(c => (
                            <option key={c.id} value={c.id}>{c.nameAr}</option>
                        ))}
                    </select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                    <Label>2. اختر المادة</Label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="">اختر المادة</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.nameAr}</option>
                        ))}
                    </select>
                </div>

                {/* Stages */}
                <div className="space-y-2">
                    <Label>3. اختر المراحل</Label>
                    {loadingHierarchy ? (
                        <div className="text-center py-4 text-text-subtle text-sm">جاري التحميل...</div>
                    ) : hierarchy?.stages.length ? (
                        <div className="flex flex-wrap gap-2">
                            {hierarchy.stages.map(stage => (
                                <button
                                    key={stage.id}
                                    type="button"
                                    onClick={() => toggleStage(stage.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                                        selectedStages.includes(stage.id)
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    {stage.nameAr}
                                    <span className="text-xs text-gray-400 mr-1">({stage.grades.length})</span>
                                </button>
                            ))}
                        </div>
                    ) : selectedCurriculum ? (
                        <div className="text-center py-4 text-text-subtle text-sm">لا توجد مراحل</div>
                    ) : (
                        <div className="text-center py-4 text-text-subtle text-sm">اختر المنهج أولاً</div>
                    )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <Label>4. السعر</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="flex-1 h-11"
                            placeholder="0"
                        />
                        <span className="text-text-subtle font-medium">SDG / ساعة</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button onClick={handleAdd} disabled={saving} className="flex-1 gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        إضافة
                    </Button>
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        إلغاء
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function SubjectsStep() {
    const { data, updateData, setCurrentStep, loadProfile } = useOnboarding();
    const [showModal, setShowModal] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleRemoveSubject = async (id: string) => {
        setRemovingId(id);
        try {
            await teacherApi.removeSubject(id);
            await loadProfile();
            toast.success('تم حذف المادة');
        } catch (error) {
            console.error('Failed to remove subject', error);
            toast.error('فشل حذف المادة');
        } finally {
            setRemovingId(null);
        }
    };

    const handleSubjectAdded = async () => {
        await loadProfile();
    };

    const handleNext = () => {
        if (data.subjects.length === 0) {
            toast.error('الرجاء إضافة مادة واحدة على الأقل');
            return;
        }
        setCurrentStep(4);
    };

    return (
        <div className="space-y-8 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 3: المواد والتسعير</h1>
                <p className="text-text-subtle">أضف المواد التي تدرّسها وحدد سعرك لكل ساعة</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                {/* Added Subjects */}
                {data.subjects.length > 0 && (
                    <div className="space-y-3">
                        <Label className="text-base font-medium">المواد المضافة ({data.subjects.length})</Label>
                        <div className="space-y-3">
                            {data.subjects.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">
                                                {item.subject?.nameAr || 'مادة'}
                                            </div>
                                            <div className="text-sm text-text-subtle">
                                                {item.curriculum?.nameAr || 'منهج'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-left">
                                            <div className="font-bold text-primary">{item.pricePerHour} SDG</div>
                                            <div className="text-xs text-text-subtle">الساعة</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSubject(item.id)}
                                            disabled={removingId === item.id}
                                            className="text-red-500 hover:bg-red-50"
                                        >
                                            {removingId === item.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {data.subjects.length === 0 && (
                    <div className="text-center py-8 text-text-subtle">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>لم تضف أي مواد بعد</p>
                    </div>
                )}

                {/* Add Button */}
                <Button
                    variant="outline"
                    onClick={() => setShowModal(true)}
                    className="w-full h-12 gap-2 border-dashed border-2"
                >
                    <Plus className="w-5 h-5" />
                    إضافة مادة جديدة
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="gap-2"
                >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                </Button>
                <Button
                    onClick={handleNext}
                    className="gap-2 px-6"
                >
                    التالي
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            </div>

            {/* Modal */}
            <AddSubjectModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSubjectAdded}
            />
        </div>
    );
}
