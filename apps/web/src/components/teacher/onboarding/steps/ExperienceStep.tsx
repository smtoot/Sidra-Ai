'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Loader2, Lightbulb, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { BioField, QualificationsManager } from '@/components/teacher/shared';
import { teacherApi, TeacherQualification } from '@/lib/api/teacher';

/**
 * Onboarding Step 2: Teaching Experience & Qualifications
 *
 * IMPORTANT CHANGES:
 * - REMOVED education dropdown (replaced with QualificationsManager)
 * - QualificationsManager is now the SINGLE SOURCE OF TRUTH for academic qualifications
 * - At least ONE qualification with certificate is REQUIRED before proceeding
 * - yearsOfExperience remains as a separate field
 */
export function ExperienceStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();
    const [qualifications, setQualifications] = useState<TeacherQualification[]>([]);

    useEffect(() => {
        // Load qualifications on mount
        teacherApi.getQualifications()
            .then(setQualifications)
            .catch(console.error);
    }, []);

    const handleNext = async () => {
        // Validate years of experience
        if (data.yearsOfExperience === undefined || data.yearsOfExperience === null) {
            toast.error('الرجاء إدخال سنوات الخبرة');
            return;
        }

        // CRITICAL: Validate qualifications (replaced education field)
        if (qualifications.length === 0) {
            toast.error('يجب إضافة مؤهل أكاديمي واحد على الأقل مع الشهادة');
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
                {/* Years of Experience - Standalone field */}
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        سنوات الخبرة في التدريس <span className="text-red-500">*</span>
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

                {/* Bio Field - Using shared component */}
                <BioField
                    value={data.bio}
                    onChange={(bio) => updateData({ bio })}
                    minLength={80}
                    useWordCount={false}
                />

                {/* CRITICAL: Academic Qualifications - SINGLE SOURCE OF TRUTH */}
                <div className="border-t pt-6">
                    <QualificationsManager
                        onQualificationsChange={setQualifications}
                        required={true}
                    />
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
