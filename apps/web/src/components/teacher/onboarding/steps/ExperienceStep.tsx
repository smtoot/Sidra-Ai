'use client';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { BioField, ExperienceFields, CertificatesSection } from '@/components/teacher/shared';

/**
 * Onboarding Step 2: Teaching Experience & Qualifications
 * Uses shared components for consistency with Profile Hub.
 * Now includes Certificates section (moved from Documents step).
 */
export function ExperienceStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();

    const handleNext = async () => {
        // Validate years of experience
        if (data.yearsOfExperience === undefined || data.yearsOfExperience === null) {
            toast.error('الرجاء إدخال سنوات الخبرة');
            return;
        }

        // Validate education
        if (!data.education?.trim()) {
            toast.error('الرجاء اختيار المؤهل التعليمي');
            return;
        }

        // Validate bio (minimum 50 characters, recommended 80)
        if (!data.bio.trim() || data.bio.length < 50) {
            toast.error('الرجاء كتابة نبذة تعريفية لا تقل عن 50 حرف');
            return;
        }

        // Soft warning for bio < 80 characters (but allow submission)
        if (data.bio.length < 80) {
            toast.warning('ننصح بكتابة نبذة أطول (80 حرف على الأقل) لزيادة فرص الحجز');
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
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 2: الخبرة والمؤهلات</h1>
                <p className="text-text-subtle">أخبرنا عن خبرتك ومؤهلاتك في مجال التدريس</p>
            </div>

            {/* Tips Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-sm text-blue-800">
                        <p className="font-medium">نصائح لكتابة نبذة جذابة:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                            <li>اذكر تخصصك وخبرتك بوضوح</li>
                            <li>أضف إنجازاتك المميزة (مثل: نسبة نجاح طلابك)</li>
                            <li>وضّح أسلوبك في التدريس وما يميزك</li>
                        </ul>
                    </div>
                </div>
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
                    minLength={80}
                    useWordCount={false}
                />

                {/* Certificates Section - Moved from Documents step */}
                <CertificatesSection />
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
