'use client';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    PhotoUploadField,
    NameFields,
    GenderSelector,
} from '@/components/teacher/shared';

/**
 * Onboarding Step 1: Photo, Names, and Gender
 * Uses shared components for consistency with Profile Hub
 */
export function PhotoStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();

    const handleNext = async () => {
        // Validation
        if (!data.profilePhotoUrl) {
            toast.error('الرجاء إضافة صورة شخصية');
            return;
        }
        if (!data.fullName?.trim()) {
            toast.error('الرجاء إدخال اسمك الكامل');
            return;
        }
        if (!data.displayName.trim()) {
            toast.error('الرجاء إدخال اسمك');
            return;
        }
        if (!data.gender) {
            toast.error('الرجاء تحديد الجنس');
            return;
        }

        try {
            await saveCurrentStep();
            setCurrentStep(2);
        } catch (error) {
            toast.error('فشل حفظ البيانات');
        }
    };

    return (
        <div className="space-y-8 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 1: صورتك الشخصية</h1>
                <p className="text-text-subtle">الصورة تساعد الطلاب وأولياء الأمور على التعرف عليك</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
                {/* Photo Upload - Using shared component */}
                <PhotoUploadField
                    value={data.profilePhotoUrl}
                    onChange={(url) => updateData({ profilePhotoUrl: url })}
                    showTips={true}
                    size="lg"
                />

                {/* Name Fields - Using shared component */}
                <NameFields
                    displayName={data.displayName}
                    fullName={data.fullName}
                    onChange={(updates) => updateData(updates)}
                />

                {/* Gender - Using shared component */}
                <GenderSelector
                    value={data.gender}
                    onChange={(gender) => updateData({ gender })}
                />
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
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
