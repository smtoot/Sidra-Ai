'use client';

import { useState, useEffect, useMemo } from 'react';
import { studentApi, Curriculum, GradeLevel } from '@/lib/api/student';
import { parentApi } from '@/lib/api/parent';
import { Loader2, Edit2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StudentInfoSectionProps {
    // For students
    studentProfile?: {
        gradeLevel?: string | null;
        curriculumId?: string | null;
        curriculum?: { id: string; nameAr: string } | null;
    };
    // For parents - selected child
    selectedChild?: {
        id: string;
        name: string;
        gradeLevel?: string | null;
        curriculumId?: string | null;
        curriculum?: { id: string; nameAr: string } | null;
    };
    // User type
    userRole: 'STUDENT' | 'PARENT';
    // Callback when validation changes
    onValidChange: (isValid: boolean) => void;
    // Callback to refresh data after update
    onUpdate?: () => void;
}

export function StudentInfoSection({
    studentProfile,
    selectedChild,
    userRole,
    onValidChange,
    onUpdate,
}: StudentInfoSectionProps) {
    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [selectedCurriculum, setSelectedCurriculum] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');

    // Determine current values based on user type
    const currentCurriculumId = userRole === 'STUDENT'
        ? studentProfile?.curriculumId
        : selectedChild?.curriculumId;
    const currentCurriculumName = userRole === 'STUDENT'
        ? studentProfile?.curriculum?.nameAr
        : selectedChild?.curriculum?.nameAr;
    const currentGrade = userRole === 'STUDENT'
        ? studentProfile?.gradeLevel
        : selectedChild?.gradeLevel;
    const displayName = userRole === 'STUDENT'
        ? 'أنت'
        : selectedChild?.name || '';

    // Check if info is complete
    const isInfoComplete = !!(currentCurriculumId && currentGrade);

    // Load curricula on mount
    useEffect(() => {
        loadCurricula();
    }, []);

    // Initialize form state from current values
    useEffect(() => {
        setSelectedCurriculum(currentCurriculumId || '');
        setSelectedGrade(currentGrade || '');
    }, [currentCurriculumId, currentGrade, selectedChild?.id]);

    // Notify parent about validation status
    useEffect(() => {
        const isValid = isEditing
            ? !!(selectedCurriculum && selectedGrade)
            : isInfoComplete;
        onValidChange(isValid);
    }, [isEditing, selectedCurriculum, selectedGrade, isInfoComplete, onValidChange]);

    // Auto-enter edit mode if info is missing
    useEffect(() => {
        if (!isInfoComplete && !isLoading) {
            setIsEditing(true);
        }
    }, [isInfoComplete, isLoading]);

    // Dynamic Grades based on selected Curriculum
    const availableGrades = useMemo(() => {
        if (!selectedCurriculum) return [];
        const curriculum = curricula.find(c => c.id === selectedCurriculum);
        if (!curriculum?.stages) return [];

        // Flatten grades from stages
        // Sort stages by sequence first, then map grades
        return curriculum.stages
            .sort((a, b) => a.sequence - b.sequence)
            .flatMap(stage =>
                stage.grades.sort((a, b) => a.sequence - b.sequence)
            );
    }, [selectedCurriculum, curricula]);

    const loadCurricula = async () => {
        try {
            // Both APIs return Curriculum[] with nested stages/grades
            // We use 'any' cast temporarily if Typescript complains about strict types mixing
            const data = userRole === 'STUDENT'
                ? await studentApi.getCurricula()
                : await parentApi.getCurricula();
            setCurricula(data as Curriculum[]);
        } catch (error) {
            console.error('Failed to load curricula', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCurriculum || !selectedGrade) {
            toast.error('يجب تحديد المنهج والصف');
            return;
        }

        setIsSaving(true);
        try {
            if (userRole === 'STUDENT') {
                await studentApi.updateProfile({
                    curriculumId: selectedCurriculum,
                    gradeLevel: selectedGrade,
                });
            } else if (selectedChild) {
                await parentApi.updateChild(selectedChild.id, {
                    curriculumId: selectedCurriculum,
                    gradeLevel: selectedGrade,
                });
            }

            toast.success('تم حفظ البيانات بنجاح');
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to save info', error);
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحميل...</span>
            </div>
        );
    }

    // If parent but no child selected
    if (userRole === 'PARENT' && !selectedChild) {
        return null;
    }

    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                    هذا الحجز لـ: <span className="font-bold text-gray-900">{displayName}</span>
                </p>
                {isInfoComplete && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                        <Edit2 className="w-3 h-3" />
                        تعديل
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    {/* Curriculum Dropdown */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            المنهج الدراسي <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCurriculum}
                            onChange={(e) => {
                                setSelectedCurriculum(e.target.value);
                                setSelectedGrade(''); // Reset grade
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all text-sm"
                        >
                            <option value="">اختر المنهج...</option>
                            {curricula.map((c) => (
                                <option key={c.id} value={c.id}>{c.nameAr}</option>
                            ))}
                        </select>
                    </div>

                    {/* Grade Dropdown */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            الصف الدراسي <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            disabled={!selectedCurriculum}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">اختر الصف...</option>
                            {availableGrades.map((grade) => (
                                <option key={grade.id} value={grade.nameAr}>{grade.nameAr}</option>
                            ))}
                        </select>
                    </div>

                    {/* Warning if missing */}
                    {(!selectedCurriculum || !selectedGrade) && (
                        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                يجب تحديد المنهج والصف للمتابعة مع الحجز
                            </p>
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedCurriculum || !selectedGrade}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                حفظ وإتمام الحجز
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="bg-white px-2 py-1 rounded border">
                        {currentCurriculumName}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="bg-white px-2 py-1 rounded border">
                        {currentGrade}
                    </span>
                </div>
            )}
        </div>
    );
}
