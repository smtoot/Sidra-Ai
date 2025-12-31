'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { parentApi } from '@/lib/api/parent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { ArrowRight, Save, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditChildPage() {
    const router = useRouter();
    const params = useParams();
    const childId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [curricula, setCurricula] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        gradeLevel: '',
        schoolName: '',
        curriculumId: '',
    });

    useEffect(() => {
        const loadData = async () => {
            if (!childId) return;
            try {
                const [childData, curriculaData] = await Promise.all([
                    parentApi.getChild(childId),
                    parentApi.getCurricula()
                ]);

                setFormData({
                    name: childData.name || '',
                    gradeLevel: childData.gradeLevel || '',
                    schoolName: childData.schoolName || '',
                    curriculumId: childData.curriculumId || '',
                });
                setCurricula(curriculaData);
            } catch (error) {
                console.error('Failed to load data', error);
                toast.error("خطأ في التحميل", {
                    description: "تعذر تحميل بيانات الابن",
                });
            } finally {
                setInitialLoading(false);
            }
        };
        loadData();
    }, [childId]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Validation: Name, Curriculum, and Grade are mandatory
    const isFormValid = formData.name.trim().length > 0 && formData.curriculumId.length > 0 && formData.gradeLevel.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        try {
            await parentApi.updateChild(childId, formData);

            toast.success("تم الحفظ بنجاح", {
                description: "تم تحديث بيانات الابن بنجاح.",
            });

            router.push(`/parent/children/${childId}`);
            router.refresh(); // Ensure fresh data on profile page

        } catch (error) {
            toast.error("حدث خطأ", {
                description: "تعذر حفظ التعديلات، يرجى المحاولة مرة أخرى.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-2xl mx-auto pt-20 text-center">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans p-4 md:p-8" dir="rtl">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Back Link */}
                <Link href={`/parent/children/${childId}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors gap-2 text-sm font-medium">
                    <ArrowRight className="w-4 h-4" />
                    <span>عودة للملف الشخصي</span>
                </Link>

                <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-white px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg">
                                <UserCog className="w-6 h-6 text-primary-600" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900">تعديل بيانات الابن</CardTitle>
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

                            {/* Grade Level */}
                            <div className="space-y-2">
                                <Label htmlFor="gradeLevel" className="text-base font-semibold text-gray-900">
                                    المرحلة الدراسية <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.gradeLevel}
                                    onChange={(e) => handleChange('gradeLevel', e.target.value)}
                                    className="h-12 text-right"
                                >
                                    <option value="" disabled>اختر المرحلة...</option>
                                    <option value="KINDERGARTEN">رياض أطفال</option>
                                    <option value="GRADE_1">الصف الأول</option>
                                    <option value="GRADE_2">الصف الثاني</option>
                                    <option value="GRADE_3">الصف الثالث</option>
                                    <option value="GRADE_4">الصف الرابع</option>
                                    <option value="GRADE_5">الصف الخامس</option>
                                    <option value="GRADE_6">الصف السادس</option>
                                    <option value="GRADE_7">الصف السابع</option>
                                    <option value="GRADE_8">الصف الثامن</option>
                                    <option value="GRADE_9">الصف التاسع</option>
                                    <option value="GRADE_10">الصف العاشر</option>
                                    <option value="GRADE_11">الصف الحادي عشر</option>
                                    <option value="GRADE_12">الصف الثاني عشر</option>
                                </Select>
                            </div>

                            {/* Curriculum */}
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
                                <Link href={`/parent/children/${childId}`}>
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
                                            حفظ التعديلات
                                        </>
                                    )}
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
