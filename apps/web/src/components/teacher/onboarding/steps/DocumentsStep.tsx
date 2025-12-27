'use client';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { IdVerificationSection } from '@/components/teacher/shared';

/**
 * Onboarding Step 4: ID Verification (formerly Documents)
 * Now focused only on ID verification - Certificates moved to Experience step.
 */
export function DocumentsStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();

    const handleNext = async () => {
        // Validate ID fields
        if (!data.idType) {
            toast.error('الرجاء اختيار نوع الهوية');
            return;
        }
        if (!data.idNumber?.trim()) {
            toast.error('الرجاء إدخال رقم الهوية');
            return;
        }
        if (!data.idImageUrl) {
            toast.error('الرجاء رفع صورة الهوية');
            return;
        }

        try {
            await saveCurrentStep();
            setCurrentStep(5);
        } catch (error) {
            toast.error('فشل حفظ البيانات');
        }
    };

    return (
        <div className="space-y-8 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 4: تأكيد الهوية</h1>
                <p className="text-text-subtle">نحتاج للتحقق من هويتك لحماية الطلاب وأولياء الأمور</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-right">
                <p className="text-blue-800 font-medium">
                    🔒 بياناتك محمية ولن تُشارك مع أي طرف. سيتم التحقق منها فقط بواسطة فريق الإدارة.
                </p>
            </div>

            {/* Required Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-right">
                <p className="text-amber-800 font-medium">
                    ⚠️ <strong>مطلوب:</strong> تأكيد الهوية إلزامي لإكمال عملية التسجيل
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                {/* ID Verification Section - Using shared component */}
                <IdVerificationSection
                    idType={data.idType}
                    idNumber={data.idNumber || ''}
                    idImageUrl={data.idImageUrl}
                    onChange={(updates) => updateData(updates)}
                />
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
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
