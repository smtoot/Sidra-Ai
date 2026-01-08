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
    LineChart
} from 'lucide-react';

const FEATURES = [
    {
        icon: Users,
        title: 'حصص فردية 100%',
        description: 'دروس أونلاين (واحد لواحد) تركز على مستوى ابنك واحتياجاته التعليمية.',
    },
    {
        icon: GraduationCap,
        title: 'معلمون سودانيون مؤهلون',
        description: 'نخبة من المعلمين ذوي خبرة حقيقية في تبسيط الشرح ومتابعة الطلاب.',
    },
    {
        icon: Eye,
        title: 'اختيار المعلم بثقة',
        description: 'اطّلع على الملف الشخصي، الخبرات، والتقييمات قبل اتخاذ القرار.',
    },
    {
        icon: BookOpen,
        title: 'تدريس حسب المنهج',
        description: 'تعليم مخصص وفق المنهج السوداني أو البريطاني حسب احتياج الطالب.',
    },
    {
        icon: Shield,
        title: 'خصوصية وأمان',
        description: 'بيئة تعليمية آمنة تحافظ على خصوصية الطالب وراحة ولي الأمر.',
    },
    {
        icon: Gift,
        title: 'حصة تجريبية',
        description: 'إمكانية تجربة المعلم قبل الاستمرار، حسب إتاحة المعلم.',
    },
    {
        icon: LineChart,
        title: 'متابعة مستمرة',
        description: 'متابعة تقدم الطالب والتواصل المستمر لضمان أفضل نتائج تعليمية.',
    },
    {
        icon: CreditCard,
        title: 'دفع مرن وسهل',
        description: 'خيارات دفع مريحة تناسب أولياء الأمور مع إضافة فورية للرصيد.',
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
                                    "flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm transition-all duration-500 hover:shadow-md",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="w-12 h-12 bg-[#F0F7FF] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#003366] transition-colors duration-300">
                                    <Icon className="w-6 h-6 text-[#003366] group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-gray-900 font-bold text-lg">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                        {feature.description}
                                    </p>
                                </div>
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
