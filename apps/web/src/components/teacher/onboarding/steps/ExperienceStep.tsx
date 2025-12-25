'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Loader2, GraduationCap, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function ExperienceStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();

    const handleNext = async () => {
        if (data.yearsOfExperience < 0) {
            toast.error('الرجاء إدخال سنوات خبرة صالحة');
            return;
        }
        if (!data.bio.trim() || data.bio.length < 50) {
            toast.error('الرجاء كتابة نبذة تعريفية لا تقل عن 50 حرف');
            return;
        }

        try {
            await saveCurrentStep();
            setCurrentStep(3);
        } catch (error) {
            toast.error('فشل حفظ البيانات');
        }
    };

    return (
        <div className="space-y-8 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 2: خبراتك التدريسية</h1>
                <p className="text-text-subtle">أخبرنا عن نفسك وخبرتك في مجال التدريس</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                {/* Years of Experience */}
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        سنوات الخبرة في التدريس
                    </Label>
                    <div className="flex items-center gap-3">
                        <Input
                            type="number"
                            min={0}
                            max={50}
                            value={data.yearsOfExperience}
                            onChange={(e) => updateData({ yearsOfExperience: Number(e.target.value) })}
                            className="w-24 h-12 text-center text-lg font-bold"
                        />
                        <span className="text-text-subtle">سنة</span>
                    </div>
                </div>

                {/* Education */}
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        المؤهل العلمي
                    </Label>
                    <Input
                        value={data.education}
                        onChange={(e) => updateData({ education: e.target.value })}
                        placeholder="مثال: بكالوريوس تربية - جامعة الخرطوم"
                        className="h-12"
                    />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">عن نفسك (سيظهر للطلاب وأولياء الأمور)</Label>
                    <Textarea
                        value={data.bio}
                        onChange={(e) => updateData({ bio: e.target.value })}
                        placeholder="اكتب نبذة تعريفية عن نفسك وأسلوبك في التدريس..."
                        rows={5}
                        className="resize-none"
                    />
                    <div className="flex justify-between text-sm">
                        <p className="text-amber-600 flex items-center gap-1">
                            💡 اذكر أسلوبك في التدريس وإنجازاتك مع الطلاب
                        </p>
                        <span className={data.bio.length >= 50 ? 'text-green-600' : 'text-text-subtle'}>
                            {data.bio.length} / 50 حرف (الحد الأدنى)
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="gap-2"
                >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={saving}
                    className="gap-2 px-6"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : (
                        <>
                            التالي
                            <ArrowLeft className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
