'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    GraduationCap,
    Users,
    BookOpen,
    Eye,
    Gift,
    Shield,
    CreditCard,
    CheckCircle
} from 'lucide-react';

const FEATURES = [
    {
        icon: GraduationCap,
        text: 'معلمين سودانيين مؤهلين وخبرة في تبسيط الشرح',
    },
    {
        icon: Users,
        text: 'حصص فردية 100% (واحد لواحد)',
    },
    {
        icon: BookOpen,
        text: 'تدريس حسب المنهج السوداني أو البريطاني',
    },
    {
        icon: Eye,
        text: 'اختيار المعلم بكل شفافية من خلال الملف الشخصي',
    },
    {
        icon: Gift,
        text: 'حصة تجريبية مجانية (حسب إتاحة المعلم)',
    },
    {
        icon: Shield,
        text: 'خصوصية وأمان من بيتكم',
    },
    {
        icon: CreditCard,
        text: 'الدفع عبر التحويل البنكي (بنك الخرطوم – بنكك) مع إضافة فوري وكاشي قريبًا',
    },
];

export function WhySidra() {
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
        <section ref={sectionRef} className="py-20 bg-[#F9F5F0]">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-12 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        لماذا تختار سدرة؟
                    </h2>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-12">
                    {FEATURES.map((feature, index) => {
                        const Icon = feature.icon;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm transition-all duration-500",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-gray-700 leading-relaxed pt-2">
                                    {feature.text}
                                </p>
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
