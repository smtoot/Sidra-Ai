'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { teacherApi } from '@/lib/api/teacher';
import { GradeLevel } from '@/lib/api/marketplace';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, Save, Trash2, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Gender } from '@sidra/shared';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurriculumHierarchy } from '@/hooks/useCurriculumHierarchy';
import { useTeacherApplicationStatus } from '@/hooks/useTeacherApplicationStatus';
import { AlertCircle, Lock } from 'lucide-react';

export default function TeacherProfileWizard() {
    const { user } = useAuth();
    const { status: appStatus, isApproved, isChangesRequested, loading: loadingStatus } = useTeacherApplicationStatus();

    // Read-only if NOT approved AND NOT changes requested (AND not DRAFT, but DRAFT should be in onboarding)
    // Actually, "DRAFT" users are redirected to onboarding usually.
    // So for this page, we assume mostly SUBMITTED, INTERVIEW_*, APPROVED, REJECTED.
    // We allow editing only if APPROVED or CHANGES_REQUESTED.
    const isReadOnly = !loadingStatus && !isApproved && !isChangesRequested;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Step 1 State
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
    // REMOVED: education state
    const [gender, setGender] = useState<Gender | undefined>(undefined);

    // Step 2 State
    const [mySubjects, setMySubjects] = useState<any[]>([]); // TeacherSubject[]

    // Add Subject Form
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
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
            if (profile) {
                setDisplayName(profile.displayName || '');
                setBio(profile.bio || '');
                setYearsOfExperience(profile.yearsOfExperience || 0);
                // REMOVED: education field
                setGender(profile.gender as Gender);
                setMySubjects(profile.subjects || []);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStep1 = async () => {
        setLoading(true);
        try {
            await teacherApi.updateProfile({
                displayName,
                bio,
                yearsOfExperience: Number(yearsOfExperience),
                // REMOVED: education field
                gender
            });
            setStep(2);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("حدث خطأ أثناء الحفظ");
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
            alert("الرجاء تعبئة جميع الحقول");
            return;
        }
        if (selectedGrades.length === 0) {
            alert("الرجاء اختيار صف دراسي على الأقل");
            return;
        }

        setLoading(true);
        try {
            const newSubject = await teacherApi.addSubject({
                subjectId: selectedSubject,
                curriculumId: selectedCurriculum,
                pricePerHour: Number(price),
                gradeLevelIds: selectedGrades
            });
            await loadProfile();
            setSelectedSubject('');
            setSelectedCurriculum(''); // Reset curriculum to force hierarchy reload if needed for next
            setPrice(0);
            setSelectedGrades([]);
        } catch (error) {
            console.error("Failed to add subject", error);
            alert("فشل إضافة المادة");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSubject = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) return;
        setLoading(true);
        try {
            await teacherApi.removeSubject(id);
            setMySubjects(mySubjects.filter(s => s.id !== id));
        } catch (error) {
            console.error("Failed to remove subject", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 font-tajawal" dir="rtl">
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-primary">إعداد الملف الشخصي</h1>
                <p className="text-text-subtle">أكمل بياناتك لتظهر للطلاب وأولياء الأمور</p>
            </header>

            {/* Read Only Banner */}
            {isReadOnly && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-yellow-800">الملف الشخصي للقراءة فقط</h3>
                        <p className="text-sm text-yellow-700">
                            لا يمكنك تعديل بياناتك حالياً لأن طلبك {appStatus?.applicationStatus === 'SUBMITTED' ? 'قيد المراجعة' : 'بانتظار الإجراء'}.
                            سيتم فتح التعديل عند الموافقة أو طلب تغييرات.
                        </p>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 rtl">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm p-8 border border-gray-100">
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-primary border-b pb-4">البيانات الأساسية</h2>

                        <div className="space-y-2">
                            <Label>الاسم المعروض (سيظهر للطلاب)</Label>
                            <Input
                                placeholder="الاسم الكامل أو اسم الشهرة"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>النبذة التعريفية</Label>
                            <Textarea
                                placeholder="تحدث عن نفسك، خبراتك، وأسلوبك في التدريس..."
                                rows={5}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                disabled={isReadOnly}
                            />
                            <p className="text-xs text-text-subtle">اكتب بأسلوب ودود ومهني (50 كلمة على الأقل).</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>سنوات الخبرة</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={yearsOfExperience}
                                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                                    disabled={isReadOnly}
                                />
                            </div>
                            {/* REMOVED: Education field - replaced by QualificationsManager */}
                        </div>

                        <div className="space-y-2">
                            <Label>الجنس</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={Gender.MALE}
                                        checked={gender === Gender.MALE}
                                        onChange={() => setGender(Gender.MALE)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span>ذكر</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={Gender.FEMALE}
                                        checked={gender === Gender.FEMALE}
                                        onChange={() => setGender(Gender.FEMALE)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span>أنثى</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveStep1} disabled={loading || isReadOnly} className="gap-2">
                                {loading ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-bold text-primary">المواد الدراسية</h2>
                            <span className="text-sm text-text-subtle">أضف المواد التي تدرسها وسعرك لكل ساعة</span>
                        </div>

                        {/* Read Only overlay for Subjects step specifically if needed, but inputs are disabled */}



                        {/* Add Subject Form */}
                        <div className="bg-background p-4 rounded-lg border border-gray-200 space-y-4">
                            <h3 className="font-bold text-sm">إضافة مادة جديدة</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>المنهج</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={selectedCurriculum}
                                        onChange={(e) => setSelectedCurriculum(e.target.value)}
                                        disabled={isReadOnly}
                                    >
                                        <option value="">اختر المنهج</option>
                                        {isMounted && curricula.map(c => (
                                            <option key={c.id} value={c.id}>{c.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>المادة</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        disabled={isReadOnly}
                                    >
                                        <option value="">اختر المادة</option>
                                        {isMounted && subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>سعر الساعة (SDG)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>

                            {/* Hierarchy / Grade Selection */}
                            <div className="md:col-span-3">
                                {loadingHierarchy && (
                                    <div className="py-2 text-center text-sm text-gray-500">جاري تحميل المراحل...</div>
                                )}
                                {hierarchy && (
                                    <div className="mb-4 space-y-3 border rounded-lg p-3 bg-gray-50/50">
                                        <Label className="block mb-2 font-bold text-gray-700 text-sm">تحديد الصفوف (مطلوب)</Label>
                                        {hierarchy.stages.map(stage => (
                                            <Collapsible
                                                key={stage.id}
                                                open={openStages.includes(stage.id)}
                                                onOpenChange={() => toggleStage(stage.id)}
                                                className="bg-white border rounded-md overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors">
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
                                                    {!isReadOnly && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="text-[10px] h-auto p-0 text-primary"
                                                            onClick={() => toggleStageGrades(stage.id, stage.grades)}
                                                        >
                                                            {stage.grades.every(g => selectedGrades.includes(g.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                                                        </Button>
                                                    )}
                                                </div>

                                                <CollapsibleContent>
                                                    <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {stage.grades.map(grade => {
                                                            const isSelected = selectedGrades.includes(grade.id);
                                                            return (
                                                                <div
                                                                    key={grade.id}
                                                                    onClick={() => !isReadOnly && toggleGrade(grade.id)}
                                                                    className={cn(
                                                                        "cursor-pointer text-xs border rounded px-2 py-1.5 transition-all flex items-center justify-between",
                                                                        isSelected
                                                                            ? "bg-primary/10 border-primary text-primary font-medium"
                                                                            : "bg-white border-gray-200 hover:border-gray-300 text-gray-600",
                                                                        isReadOnly && "cursor-not-allowed opacity-70"
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
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleAddSubject} size="sm" className="gap-2" disabled={loading || isReadOnly}>
                                    <Plus className="w-4 h-4" />
                                    إضافة
                                </Button>
                            </div>
                        </div>

                        {/* Subjects List */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm">المواد المضافة</h3>
                            {mySubjects.length === 0 ? (
                                <p className="text-center text-text-subtle py-4">لم تقم بإضافة أي مواد بعد.</p>
                            ) : (
                                <div className="space-y-3">
                                    {mySubjects.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                            <div className="flex gap-4">
                                                <span className="font-bold text-primary">{item.subject?.nameAr || 'مادة'}</span>
                                                <span className="text-text-subtle text-sm">({item.curriculum?.nameAr || 'منهج'})</span>
                                                <span className="font-bold text-accent">{item.pricePerHour} SDG/ساعة</span>
                                            </div>
                                            {!isReadOnly && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(item.id)} className="text-error hover:bg-error/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-6 border-t mt-6">
                            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                                <ChevronRight className="w-4 h-4" />
                                السابق
                            </Button>
                            <Button onClick={() => setStep(3)} disabled={mySubjects.length === 0} className="gap-2">
                                التالي
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-10 space-y-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl">⏳</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-primary mb-2">تم إرسال ملفك للمراجعة!</h2>
                            <p className="text-text-subtle">سيقوم فريقنا بمراجعة بياناتك والموافقة عليها</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-right">
                            <p className="text-sm text-blue-800 mb-2">⏱️ <strong>الوقت المتوقع:</strong> 2-3 أيام عمل</p>
                            <p className="text-sm text-blue-700">سنرسل لك إشعار عند الموافقة على ملفك</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-right space-y-2">
                            <h3 className="font-bold text-sm text-primary">ملخص ملفك:</h3>
                            <p className="text-sm">📝 الاسم: {displayName || 'غير محدد'}</p>
                            <p className="text-sm">📚 المواد: {mySubjects.length} مادة</p>
                        </div>

                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                                <ChevronRight className="w-4 h-4" />
                                تعديل المواد
                            </Button>
                            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                                تعديل البيانات
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
