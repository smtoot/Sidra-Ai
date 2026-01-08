'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, UserCheck, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
    {
        number: 1,
        icon: Search,
        title: 'ابحث حسب احتياج ابنك',
        description: 'اختر المادة والمرحلة الدراسية والمنهج، ليظهر لك المعلمون الأنسب لمستوى ابنك.',
    },
    {
        number: 2,
        icon: UserCheck,
        title: 'اختر المعلم المناسب بثقة',
        description: 'اطّلع على خبرة المعلم، المناهج التي يدرّسها، وتقييمات أولياء الأمور قبل الاختيار.',
    },
    {
        number: 3,
        icon: PlayCircle,
        title: 'ابدأ درسًا خصوصيًا مخصصًا',
        description: 'احجز حصة فردية أونلاين بتدريس مخصص، تفاعل مباشر، وخصوصية كاملة من بيتكم.',
    },
];

export function HowItWorks() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="how-it-works" className="py-24 bg-[#FFFBF6] relative">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-16 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-5xl font-bold text-[#003366] mb-6 font-tajawal">
                        كيف تعمل سدرة؟
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                        نربطك بمعلمين سودانيين مؤهلين لتقديم دروس خصوصية أونلاين مخصصة لابنك، بخطوات واضحة وسهلة.
                    </p>
                </div>

                {/* Steps - RTL Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10 mb-16">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.number}
                                className={cn(
                                    "relative transition-all duration-700 group flex flex-col items-center h-full",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                {/* Step Card */}
                                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full flex-1 flex flex-col items-center relative">

                                    {/* Number Badge - Absolute Top Right */}
                                    <div className="absolute top-6 right-6 bg-[#D4A056] text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                                        {step.number}
                                    </div>

                                    {/* Icon */}
                                    <div className="w-20 h-20 bg-[#FFFBF6] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <Icon className="w-9 h-9 text-[#003366]" />
                                    </div>

                                    {/* Text */}
                                    <h3 className="font-bold text-2xl text-[#003366] mb-4 font-tajawal">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-500 text-lg leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Button */}
                <div className={cn(
                    "text-center transition-all duration-1000 delay-500",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <Link href="/search">
                        <Button
                            size="lg"
                            className="bg-[#D4A056] hover:bg-[#b88b4a] text-white text-xl px-10 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
                        >
                            ابدأ البحث عن معلم الآن
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
