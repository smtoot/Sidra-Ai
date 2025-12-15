'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { teacherApi } from '@/lib/api/teacher';
import { marketplaceApi } from '@/lib/api/marketplace';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, Save, Trash2, Plus } from 'lucide-react';
import { Gender } from '@sidra/shared';

export default function TeacherProfileWizard() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Step 1 State
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
    const [education, setEducation] = useState('');
    const [gender, setGender] = useState<Gender | undefined>(undefined);

    // Step 2 State
    const [mySubjects, setMySubjects] = useState<any[]>([]); // TeacherSubject[]
    const [curricula, setCurricula] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Add Subject Form
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [price, setPrice] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        loadProfile();
        loadMarketplace();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const profile = await teacherApi.getProfile();
            if (profile) {
                setDisplayName(profile.displayName || '');
                setBio(profile.bio || '');
                setYearsOfExperience(profile.yearsOfExperience || 0);
                setEducation(profile.education || '');
                setGender(profile.gender as Gender);
                setMySubjects(profile.subjects || []);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMarketplace = async () => {
        try {
            const [currData, subjData] = await Promise.all([
                marketplaceApi.getCurricula(),
                marketplaceApi.getSubjects()
            ]);
            setCurricula(currData);
            setSubjects(subjData);
        } catch (error) {
            console.error("Failed to load marketplace data", error);
        }
    };

    const handleSaveStep1 = async () => {
        setLoading(true);
        try {
            await teacherApi.updateProfile({
                displayName,
                bio,
                yearsOfExperience: Number(yearsOfExperience),
                education,
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

    const handleAddSubject = async () => {
        if (!selectedSubject || !selectedCurriculum || price <= 0) {
            alert("الرجاء تعبئة جميع الحقول");
            return;
        }
        setLoading(true);
        try {
            const newSubject = await teacherApi.addSubject({
                subjectId: selectedSubject,
                curriculumId: selectedCurriculum,
                pricePerHour: Number(price),
                gradeLevels: ['All'] // Default for MVP
            });
            await loadProfile();
            setSelectedSubject('');
            setPrice(0);
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
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>النبذة التعريفية</Label>
                            <Textarea
                                placeholder="تحدث عن نفسك، خبراتك، وأسلوبك في التدريس..."
                                rows={5}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>المؤهل العلمي</Label>
                                <Input
                                    value={education}
                                    onChange={(e) => setEducation(e.target.value)}
                                    placeholder="مثال: بكالوريوس تربية - جامعة الخرطوم"
                                />
                            </div>
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
                            <Button onClick={handleSaveStep1} disabled={loading} className="gap-2">
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
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleAddSubject} size="sm" className="gap-2" disabled={loading}>
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
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(item.id)} className="text-error hover:bg-error/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
