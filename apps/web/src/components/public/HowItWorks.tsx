'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Video, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
    {
        icon: Search,
        title: 'ابحث عن معلم',
        description: 'تصفح قائمة المعلمين المعتمدين وفلتر حسب المادة والمنهج والسعر',
        color: 'from-blue-500 to-blue-600',
        lightColor: 'bg-blue-50',
    },
    {
        icon: Calendar,
        title: 'احجز موعدك',
        description: 'اختر الموعد المناسب من جدول المعلم واحجز جلستك بسهولة',
        color: 'from-green-500 to-green-600',
        lightColor: 'bg-green-50',
    },
    {
        icon: Video,
        title: 'ابدأ التعلم',
        description: 'انضم للحصة عبر الإنترنت وتعلم مع أفضل المعلمين',
        color: 'from-purple-500 to-purple-600',
        lightColor: 'bg-purple-50',
    },
];

export function HowItWorks() {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);

    // Intersection observer for entrance animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleStepClick = (index: number) => {
        if (index === 0) {
            // Scroll to hero search
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (index === 1) {
            router.push('/search');
        } else {
            router.push('/register');
        }
    };

    return (
        <section ref={sectionRef} id="how-it-works" className="py-20 bg-white relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #003366 1px, transparent 0)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative">
                {/* Header */}
                <div className={cn(
                    "text-center mb-16 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">كيف يعمل سدرة؟</h2>
                    <p className="text-gray-500 mt-2">ثلاث خطوات بسيطة للبدء</p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
                    {/* Connector Lines - Desktop only */}
                    <div className="hidden md:block absolute top-12 right-[20%] left-[20%] h-1">
                        <div className={cn(
                            "h-full bg-gradient-to-l from-green-300 via-blue-300 to-purple-300 rounded-full transition-all duration-1000 delay-500",
                            isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                        )} />
                    </div>

                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = activeStep === index;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "relative text-center transition-all duration-700 cursor-pointer group",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 200}ms` }}
                                onClick={() => handleStepClick(index)}
                                onMouseEnter={() => setActiveStep(index)}
                                onMouseLeave={() => setActiveStep(null)}
                            >
                                {/* Step Card */}
                                <div className={cn(
                                    "bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300",
                                    "border border-gray-100 hover:border-transparent",
                                    "group-hover:-translate-y-2",
                                    isActive && step.lightColor
                                )}>
                                    {/* Step Number & Icon Container */}
                                    <div className="relative z-10 mb-6">
                                        <div className={cn(
                                            "w-24 h-24 rounded-3xl bg-gradient-to-br mx-auto flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110",
                                            step.color
                                        )}>
                                            <Icon className="w-10 h-10 text-white" />
                                        </div>

                                        {/* Step Number Badge */}
                                        <div className="absolute -top-2 -right-2 md:right-auto md:-top-3 md:left-1/2 md:-translate-x-1/2 md:translate-x-12 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                                        {step.description}
                                    </p>

                                    {/* Hover Action Hint */}
                                    <div className={cn(
                                        "mt-4 text-primary text-sm font-medium flex items-center justify-center gap-1 transition-all duration-300",
                                        isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                                    )}>
                                        <span>اضغط للبدء</span>
                                        <ArrowLeft className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Mobile Connector */}
                                {index < STEPS.length - 1 && (
                                    <div className="md:hidden flex justify-center my-4">
                                        <div className={cn(
                                            "w-1 h-8 bg-gradient-to-b rounded-full transition-all duration-500",
                                            step.color,
                                            isVisible ? "opacity-100" : "opacity-0"
                                        )}
                                            style={{ transitionDelay: `${index * 200 + 100}ms` }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <div className={cn(
                    "text-center mt-16 transition-all duration-700 delay-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 md:p-12 max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            هل أنت مستعد للبدء؟
                        </h3>
                        <p className="text-gray-600 mb-6">
                            انضم لآلاف الطلاب الذين يتعلمون مع سدرة
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={() => router.push('/search')}
                                className="gap-2 shadow-lg shadow-primary/20"
                            >
                                <Search className="w-5 h-5" />
                                ابحث عن معلم الآن
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => router.push('/register')}
                            >
                                أنشئ حسابك المجاني
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
