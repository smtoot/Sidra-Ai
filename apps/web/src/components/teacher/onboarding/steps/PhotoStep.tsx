'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Camera, Upload, User, Loader2 } from 'lucide-react';
import { Gender } from '@sidra/shared';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function PhotoStep() {
    const { data, updateData, setCurrentStep, saveCurrentStep, saving } = useOnboarding();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('الرجاء اختيار صورة صالحة');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
            return;
        }

        setUploading(true);
        try {
            // For now, create a local URL. In production, upload to server.
            const reader = new FileReader();
            reader.onload = (event) => {
                updateData({ profilePhotoUrl: event.target?.result as string });
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error: any) {
            console.error('Failed to upload photo:', error);
            if (error?.response?.status === 413) {
                toast.error('حجم الصورة كبير جداً. حاول استخدام صورة أصغر.');
            } else if (error?.response?.status === 401) {
                toast.error('انتهت الجلسة. يرجى تسجيل الدخول مجدداً.');
            } else {
                toast.error(`فشل رفع الصورة: ${error.message || 'خطأ غير معروف'}`);
            }
            setUploading(false);
        }
    };

    const handleNext = async () => {
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
                {/* Photo Upload Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Photo Preview/Upload */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "w-40 h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden",
                                "flex items-center justify-center",
                                data.profilePhotoUrl
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-300 hover:border-primary hover:bg-primary/5"
                            )}
                        >
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            ) : data.profilePhotoUrl ? (
                                <img
                                    src={data.profilePhotoUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <span className="text-sm text-gray-500">إضافة صورة</span>
                                </div>
                            )}
                        </div>
                        {data.profilePhotoUrl && (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 w-full"
                            >
                                تغيير الصورة
                            </Button>
                        )}
                    </div>

                    {/* Photo Tips */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex-1">
                        <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                            💡 نصائح للصورة
                        </h3>
                        <ul className="text-sm text-amber-700 space-y-1.5">
                            <li>• وجه واضح ومبتسم</li>
                            <li>• إضاءة جيدة</li>
                            <li>• خلفية بسيطة</li>
                        </ul>
                    </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">الاسم الكامل (الاسم القانوني)</Label>
                    <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            value={data.fullName}
                            onChange={(e) => updateData({ fullName: e.target.value })}
                            placeholder="الاسم الثلاثي أو الرباعي كما في الهوية"
                            className="pr-10 h-12 text-base"
                        />
                    </div>
                    <p className="text-xs text-text-subtle">هذا الاسم لأغراض إدارية ولن يظهر للطلاب</p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">الاسم الظاهر للطلاب</Label>
                    <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            value={data.displayName}
                            onChange={(e) => updateData({ displayName: e.target.value })}
                            placeholder="مثال: أ. محمد أحمد"
                            className="pr-10 h-12 text-base"
                        />
                    </div>
                </div>

                {/* Gender */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">الجنس</Label>
                    <div className="flex gap-4">
                        <label
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                data.gender === Gender.MALE
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <input
                                type="radio"
                                name="gender"
                                value={Gender.MALE}
                                checked={data.gender === Gender.MALE}
                                onChange={() => updateData({ gender: Gender.MALE })}
                                className="sr-only"
                            />
                            <span className="font-medium">ذكر</span>
                        </label>
                        <label
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                data.gender === Gender.FEMALE
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <input
                                type="radio"
                                name="gender"
                                value={Gender.FEMALE}
                                checked={data.gender === Gender.FEMALE}
                                onChange={() => updateData({ gender: Gender.FEMALE })}
                                className="sr-only"
                            />
                            <span className="font-medium">أنثى</span>
                        </label>
                    </div>
                </div>
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
