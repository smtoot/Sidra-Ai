'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parentApi } from '@/lib/api/parent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { ArrowRight, Save, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AddChildPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [curricula, setCurricula] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        gradeLevel: '',
        schoolName: '',
        curriculumId: '',
    });

    const [availableGrades, setAvailableGrades] = useState<any[]>([]);

    useEffect(() => {
        const loadCurricula = async () => {
            try {
                const data = await parentApi.getCurricula();
                setCurricula(data);
            } catch (error) {
                console.error('Failed to load curricula', error);
            }
        };
        loadCurricula();
    }, []);

    // Update available grades when curriculum changes
    useEffect(() => {
        if (!formData.curriculumId) {
            setAvailableGrades([]);
            return;
        }

        const curriculum = curricula.find(c => c.id === formData.curriculumId);
        if (curriculum?.stages) {
            const grades = curriculum.stages
                .sort((a: any, b: any) => a.sequence - b.sequence)
                .flatMap((stage: any) =>
                    stage.grades.sort((a: any, b: any) => a.sequence - b.sequence)
                );
            setAvailableGrades(grades);
        } else {
            setAvailableGrades([]);
        }
    }, [formData.curriculumId, curricula]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => {
            // Reset grade if curriculum changes
            if (field === 'curriculumId') {
                return { ...prev, [field]: value, gradeLevel: '' };
            }
            return { ...prev, [field]: value };
        });
    };

    // Validation: Name, Curriculum, and Grade are mandatory
    const isFormValid = formData.name.trim().length > 0 && formData.curriculumId.length > 0 && formData.gradeLevel.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        try {
            const newChild = await parentApi.addChild(formData);

            toast.success(`تمت إضافة ${formData.name} بنجاح`, {
                description: "يمكنك الآن حجز الحصص ومتابعة التقدم.",
            });

            router.push(`/parent/children/${newChild.id}`);

        } catch (error) {
            toast.error("حدث خطأ", {
                description: "تعذر إضافة الابن، يرجى المحاولة مرة أخرى.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans p-4 md:p-8" dir="rtl">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Back Link */}
                <Link href="/parent/children" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors gap-2 text-sm font-medium">
                    <ArrowRight className="w-4 h-4" />
                    <span>عودة لقائمة الأبناء</span>
                </Link>

                <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-white px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg">
                                <UserPlus className="w-6 h-6 text-primary-600" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900">إضافة ابن / ابنة</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base font-semibold text-gray-900">
                                    اسم الابن / الابنة <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="مثال: محمد أحمد"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="h-12 text-lg"
                                />
                            </div>

                            {/* Curriculum First */}
                            <div className="space-y-2">
                                <Label htmlFor="curriculum" className="text-base font-semibold text-gray-900">
                                    المنهج الدراسي <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.curriculumId}
                                    onChange={(e) => handleChange('curriculumId', e.target.value)}
                                    className="h-12 text-right"
                                >
                                    <option value="" disabled>اختر المنهج...</option>
                                    {curricula.map((curr) => (
                                        <option key={curr.id} value={curr.id}>
                                            {curr.nameAr}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* Grade Level - Dependent on Curriculum */}
                            <div className="space-y-2">
                                <Label htmlFor="gradeLevel" className="text-base font-semibold text-gray-900">
                                    المرحلة الدراسية <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.gradeLevel}
                                    onChange={(e) => handleChange('gradeLevel', e.target.value)}
                                    disabled={!formData.curriculumId}
                                    className="h-12 text-right disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="" disabled>اختر المرحلة...</option>
                                    {availableGrades.map((grade) => (
                                        <option key={grade.id} value={grade.nameAr}>
                                            {grade.nameAr}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* School Name */}
                            <div className="space-y-2">
                                <Label htmlFor="schoolName" className="text-base font-semibold text-gray-900">
                                    اسم المدرسة <span className="text-sm font-normal text-gray-500">(اختياري)</span>
                                </Label>
                                <Input
                                    id="schoolName"
                                    placeholder="مثال: مدرسة الخرطوم النموذجية"
                                    value={formData.schoolName}
                                    onChange={(e) => handleChange('schoolName', e.target.value)}
                                    className="h-12"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-6 flex items-center justify-end gap-3 border-t mt-4">
                                <Link href="/parent/children">
                                    <Button type="button" variant="outline" size="lg" className="px-8">
                                        إلغاء
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={!isFormValid || loading}
                                    className="gap-2 px-8"
                                >
                                    {loading ? 'جاري الحفظ...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            حفظ
                                        </>
                                    )}
                                </Button>
                            </div>

                            {!isFormValid && (
                                <p className="text-sm text-gray-500 text-center">
                                    يرجى تعبئة جميع الحقول المطلوبة (الاسم، المنهج، المرحلة)
                                </p>
                            )}

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
