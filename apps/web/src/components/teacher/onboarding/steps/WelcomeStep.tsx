'use client';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, Camera, Briefcase, BookOpen, FileText } from 'lucide-react';

export function WelcomeStep() {
    const { setCurrentStep } = useOnboarding();

    return (
        <div className="text-center space-y-8 py-10 font-tajawal">
            {/* Header with celebration */}
            <div className="space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <span className="text-5xl">🎉</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary">
                    مرحباً بك في عائلة سِدرة!
                </h1>
                <p className="text-lg text-text-subtle max-w-md mx-auto">
                    نحن سعداء بانضمامك كمعلم معنا.
                    <br />
                    ستحتاج من 10 إلى 15 دقيقة فقط لإكمال ملفك وبدء رحلتك معنا.
                </p>
            </div>

            {/* What you'll need */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md mx-auto text-right">
                <h2 className="font-bold text-lg text-primary mb-4">ما الذي ستحتاجه:</h2>
                <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Camera className="w-4 h-4 text-green-600" />
                        </div>
                        <span>صورة شخصية واضحة</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>معلومات عن خبرتك التدريسية</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <span>المواد التي تدرّسها وأسعارك</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-text-subtle">شهاداتك <span className="text-xs font-bold text-amber-700">(مطلوب رفع شهادة واحدة على الأقل)</span></span>
                    </li>
                </ul>
            </div>

            {/* CTA Button */}
            <Button
                size="lg"
                onClick={() => setCurrentStep(1)}
                className="gap-2 px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
                ابدأ الآن
                <ArrowLeft className="w-5 h-5" />
            </Button>
        </div>
    );
}
