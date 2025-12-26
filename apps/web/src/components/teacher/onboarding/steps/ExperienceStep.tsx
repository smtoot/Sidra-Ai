'use client';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BioField, ExperienceFields } from '@/components/teacher/shared';

/**
 * Onboarding Step 2: Teaching Experience
 * Uses shared components for consistency with Profile Hub
 */
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
                {/* Experience Fields - Using shared component */}
                <ExperienceFields
                    yearsOfExperience={data.yearsOfExperience}
                    education={data.education}
                    onChange={(updates) => updateData(updates)}
                />

                {/* Bio Field - Using shared component */}
                <BioField
                    value={data.bio}
                    onChange={(bio) => updateData({ bio })}
                    minLength={50}
                    useWordCount={false}
                />
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
