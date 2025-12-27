'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, ArrowRight, Loader2, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import {
    PhotoUploadField,
    GenderSelector,
} from '@/components/teacher/shared';
import { HelpTooltip } from '../HelpTooltip';

/**
 * Onboarding Step 1: Photo, Display Name, and Gender
 * 
 * - firstName/lastName are pre-filled from registration (shown as reference)
 * - displayName is what students see (teacher's "stage name")
 * - fullName on TeacherProfile is auto-constructed from User's firstName + lastName
 */
export function PhotoStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();
    const { user } = useAuth();

    // Pre-fill fullName from user's firstName + lastName on initial load
    useEffect(() => {
        if (user && !data.fullName && (user.firstName || user.lastName)) {
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
            updateData({ fullName });
        }
    }, [user, data.fullName, updateData]);

    // Suggest display name based on firstName if not set
    useEffect(() => {
        if (user?.firstName && !data.displayName) {
            // Suggest a simple format like "أ. محمد"
            updateData({ displayName: `أ. ${user.firstName}` });
        }
    }, [user?.firstName, data.displayName, updateData]);

    const handleNext = async () => {
        // Validation
        if (!data.profilePhotoUrl) {
            toast.error('الرجاء إضافة صورة شخصية');
            return;
        }
        if (!data.displayName.trim()) {
            toast.error('الرجاء إدخال الاسم الظاهر للطلاب');
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

    // Constructed full name from registration
    const registrationName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'غير محدد';

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

                {/* Name Section */}
                <div className="space-y-6">
                    {/* Registration Name (Read-only reference) */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">الاسم من التسجيل</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{registrationName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            هذا الاسم للأغراض الإدارية ولن يظهر للطلاب
                        </p>
                    </div>

                    {/* Display Name (Editable - student-facing) */}
                    <div className="space-y-2">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            الاسم الظاهر للطلاب <span className="text-red-500">*</span>
                            <HelpTooltip
                                content="اختر اسماً مهنياً وواضحاً يسهل على الطلاب تذكره. مثال: أ. محمد، أستاذة سارة، د. أحمد"
                                position="top"
                            />
                        </Label>
                        <Input
                            value={data.displayName}
                            onChange={(e) => updateData({ displayName: e.target.value })}
                            placeholder="مثال: أ. محمد أحمد"
                            className="h-12 text-base"
                            dir="rtl"
                        />
                        <p className="text-xs text-text-subtle">
                            هذا الاسم سيظهر للطلاب وأولياء الأمور في صفحة ملفك الشخصي
                        </p>
                    </div>
                </div>

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
