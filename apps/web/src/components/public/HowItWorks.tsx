'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, User, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
    {
        number: 1,
        icon: Search,
        title: 'ابحث واختر المعلم المناسب',
        description: 'المادة – المرحلة – المنهج',
    },
    {
        number: 2,
        icon: User,
        title: 'راجع صفحة المعلم بالتفاصيل',
        description: 'الخبرة – التخصص – المنهج – توفر حصة تجريبية إن وُجدت',
    },
    {
        number: 3,
        icon: Calendar,
        title: 'احجز حصة فردية (واحد لواحد)',
        description: 'وابدأ التعلم أونلاين',
    },
];

export function HowItWorks() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

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

    return (
        <section ref={sectionRef} id="how-it-works" className="py-20 bg-[#F9F5F0]">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-8 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        كيف تعمل سدرة؟
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        في سدرة، ولي الأمر أو الطالب يختار المعلم بنفسه.
                        <br />
                        تتصفح، تقارن، وتقرر بكل راحة.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.number}
                                className={cn(
                                    "relative transition-all duration-700",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 200}ms` }}
                            >
                                {/* Card */}
                                <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
                                    {/* Number Badge */}
                                    <div className="absolute -top-4 right-1/2 translate-x-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                        {step.number}
                                    </div>

                                    {/* Icon */}
                                    <div className="w-20 h-20 bg-[#F9F5F0] rounded-2xl mx-auto mb-4 mt-4 flex items-center justify-center">
                                        <Icon className="w-10 h-10 text-primary" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        {step.description}
                                    </p>

                                    {/* Rating stars for step 2 and 3 */}
                                    {(step.number === 2 || step.number === 3) && (
                                        <div className="flex justify-center gap-1 mt-3">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className="w-4 h-4 fill-amber-400 text-amber-400"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Connector Arrow (except last) */}
                                {index < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -left-4 transform -translate-y-1/2">
                                        <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className={cn(
                    "text-center transition-all duration-700 delay-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <Link href="/search">
                        <Button size="lg" className="px-8">
                            تصفح المعلمين
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
