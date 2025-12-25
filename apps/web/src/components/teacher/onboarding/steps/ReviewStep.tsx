'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, Loader2, Rocket, Edit2, User, BookOpen, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ReviewStep() {
    const { data, setCurrentStep, submitForReview, saving } = useOnboarding();
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = async () => {
        if (!agreed) {
            toast.error('الرجاء الموافقة على شروط الاستخدام');
            return;
        }

        try {
            await submitForReview();
            toast.success('تم إرسال طلبك بنجاح!');
        } catch (error) {
            toast.error('فشل إرسال الطلب');
        }
    };

    return (
        <div className="space-y-8 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 5: مراجعة وإرسال</h1>
                <p className="text-text-subtle">راجع بياناتك قبل الإرسال</p>
            </div>

            <div className="space-y-4">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            الملف الشخصي
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                            className="text-primary gap-1"
                        >
                            <Edit2 className="w-4 h-4" />
                            تعديل
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        {data.profilePhotoUrl ? (
                            <img
                                src={data.profilePhotoUrl}
                                alt="Profile"
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <div className="font-bold text-lg text-gray-900">{data.displayName || 'غير محدد'}</div>
                            <div className="text-text-subtle">
                                {data.yearsOfExperience} سنة خبرة • {data.education || 'المؤهل غير محدد'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subjects Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            المواد ({data.subjects.length})
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(3)}
                            className="text-primary gap-1"
                        >
                            <Edit2 className="w-4 h-4" />
                            تعديل
                        </Button>
                    </div>
                    {data.subjects.length > 0 ? (
                        <div className="space-y-2">
                            {data.subjects.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <span className="font-medium">{item.subject?.nameAr} ({item.curriculum?.nameAr})</span>
                                    <span className="text-primary font-bold">{item.pricePerHour} SDG</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-subtle">لم تضف أي مواد</p>
                    )}
                </div>

                {/* Documents Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            الوثائق
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(4)}
                            className="text-primary gap-1"
                        >
                            <Edit2 className="w-4 h-4" />
                            تعديل
                        </Button>
                    </div>
                    {data.documents.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {data.documents.map((doc: any) => (
                                <span key={doc.id} className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                                    <Check className="w-4 h-4" />
                                    {doc.type === 'ID' ? 'الهوية' : 'شهادة'}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-subtle text-sm">لم ترفع أي وثائق (اختياري)</p>
                    )}
                </div>
            </div>

            {/* Terms Checkbox */}
            <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                        أوافق على <a href="/terms" className="text-primary underline">شروط الاستخدام</a> و<a href="/privacy" className="text-primary underline">سياسة الخصوصية</a>
                    </span>
                </label>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="gap-2"
                >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={saving || !agreed}
                    size="lg"
                    className="gap-2 px-8 shadow-lg shadow-primary/20"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري الإرسال...
                        </>
                    ) : (
                        <>
                            <Rocket className="w-5 h-5" />
                            إرسال للمراجعة
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
