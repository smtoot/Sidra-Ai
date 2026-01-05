'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, CheckCircle, Sparkles, Star, DollarSign, Clock, Users, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

const BENEFITS = [
    {
        icon: Clock,
        text: 'حدد جدولك ومواعيدك بنفسك',
    },
    {
        icon: DollarSign,
        text: 'تلقى مدفوعاتك بشكل آمن',
    },
    {
        icon: Users,
        text: 'انضم لمجتمع من المعلمين المتميزين',
    },
    {
        icon: CheckCircle,
        text: 'احصل على دعم فني مستمر',
    },
];

const TEACHER_TESTIMONIAL = {
    name: 'أستاذ محمد عبدالله',
    subject: 'معلم رياضيات',
    content: 'منذ انضمامي لسدرة، استطعت الوصول لطلاب من مختلف أنحاء السودان. المنصة سهلة الاستخدام والدفعات تصل في موعدها.',
    rating: 5,
    students: 45,
    earnings: '50,000',
};

const STATS = [
    { value: '150+', label: 'معلم نشط' },
    { value: '50,000', label: 'متوسط الدخل الشهري (ج.س)' },
    { value: '95%', label: 'معدل الرضا' },
];

// Fixed positions for decorative dots
const DOT_POSITIONS = [
    { top: 10, left: 5, opacity: 0.3, size: 'w-2 h-2' },
    { top: 20, left: 85, opacity: 0.4, size: 'w-3 h-3' },
    { top: 35, left: 15, opacity: 0.25, size: 'w-2 h-2' },
    { top: 45, left: 75, opacity: 0.35, size: 'w-4 h-4' },
    { top: 60, left: 25, opacity: 0.4, size: 'w-2 h-2' },
    { top: 70, left: 90, opacity: 0.3, size: 'w-3 h-3' },
    { top: 80, left: 45, opacity: 0.25, size: 'w-2 h-2' },
    { top: 15, left: 55, opacity: 0.35, size: 'w-2 h-2' },
    { top: 55, left: 65, opacity: 0.3, size: 'w-4 h-4' },
    { top: 85, left: 35, opacity: 0.4, size: 'w-2 h-2' },
];

export function TeacherCTA() {
    const [isVisible, setIsVisible] = useState(false);
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

    return (
        <section ref={sectionRef} className="py-20 bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0">
                {DOT_POSITIONS.map((dot, i) => (
                    <div
                        key={i}
                        className={cn("absolute bg-white rounded-full", dot.size)}
                        style={{
                            top: `${dot.top}%`,
                            left: `${dot.left}%`,
                            opacity: dot.opacity * 0.15,
                        }}
                    />
                ))}
                {/* Large decorative circles */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content Side */}
                    <div className={cn(
                        "space-y-8 transition-all duration-700",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}>
                        {/* Icon */}
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                            <GraduationCap className="w-10 h-10" />
                        </div>

                        {/* Headline */}
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                                هل أنت معلم؟
                            </h2>
                            <p className="text-xl md:text-2xl text-white/80 mt-2">
                                انضم لمنصة سدرة وابدأ رحلة النجاح
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            {STATS.map((stat, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center transition-all duration-500",
                                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    )}
                                    style={{ transitionDelay: `${index * 100 + 200}ms` }}
                                >
                                    <div className="text-2xl md:text-3xl font-bold text-accent">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs md:text-sm text-white/70 mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Benefits */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {BENEFITS.map((benefit, index) => {
                                const Icon = benefit.icon;
                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl transition-all duration-500",
                                            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                                        )}
                                        style={{ transitionDelay: `${index * 100 + 400}ms` }}
                                    >
                                        <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 text-accent" />
                                        </div>
                                        <span className="text-sm">{benefit.text}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA */}
                        <div className={cn(
                            "flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-700",
                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        )}>
                            <Link href="/join-as-teacher">
                                <Button
                                    size="lg"
                                    className="bg-white text-primary hover:bg-gray-100 shadow-xl text-lg px-8 gap-2 w-full sm:w-auto"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    سجّل كمعلم الآن
                                </Button>
                            </Link>
                            <Link href="/how-teachers-work">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                                >
                                    تعرف على المزيد
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Testimonial Side */}
                    <div className={cn(
                        "transition-all duration-700 delay-300",
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                    )}>
                        <div className="bg-white rounded-3xl p-6 md:p-8 text-gray-900 shadow-2xl relative">
                            {/* Quote Icon */}
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg">
                                <Quote className="w-6 h-6 text-white" />
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(TEACHER_TESTIMONIAL.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                                "{TEACHER_TESTIMONIAL.content}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-xl font-bold text-primary">
                                        {TEACHER_TESTIMONIAL.name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">
                                        {TEACHER_TESTIMONIAL.name}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {TEACHER_TESTIMONIAL.subject}
                                    </p>
                                </div>
                            </div>

                            {/* Teacher Stats */}
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-center gap-1 text-primary font-bold text-lg">
                                        <Users className="w-4 h-4" />
                                        {TEACHER_TESTIMONIAL.students}
                                    </div>
                                    <div className="text-xs text-gray-500">طالب نشط</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-lg">
                                        <DollarSign className="w-4 h-4" />
                                        {TEACHER_TESTIMONIAL.earnings}
                                    </div>
                                    <div className="text-xs text-gray-500">ج.س شهرياً</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-4 left-8 bg-accent text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hidden lg:flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            تسجيل مجاني 100%
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
