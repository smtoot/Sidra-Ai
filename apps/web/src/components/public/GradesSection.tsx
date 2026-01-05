'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const GRADES = [
    {
        title: 'المرحلة الابتدائية',
        description: 'من الصف الأول إلى الصف السادس',
        icon: '📚',
        color: 'from-blue-500 to-blue-600',
        lightColor: 'bg-blue-50',
    },
    {
        title: 'المرحلة المتوسطة',
        description: 'من الصف السابع إلى الصف التاسع',
        icon: '📖',
        color: 'from-green-500 to-green-600',
        lightColor: 'bg-green-50',
    },
    {
        title: 'المرحلة الثانوية',
        description: 'من الصف الأول إلى الصف الثالث الثانوي',
        icon: '🎓',
        color: 'from-purple-500 to-purple-600',
        lightColor: 'bg-purple-50',
    },
];

export function GradesSection() {
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
        <section ref={sectionRef} className="py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-12 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        المراحل الدراسية التي نغطيها
                    </h2>
                </div>

                {/* Grades Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {GRADES.map((grade, index) => (
                        <Link
                            key={index}
                            href={`/search?grade=${encodeURIComponent(grade.title)}`}
                            className={cn(
                                "group transition-all duration-500",
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <div className={cn(
                                "rounded-2xl p-8 text-center transition-all duration-300",
                                "border-2 border-transparent hover:border-primary/20",
                                "hover:shadow-lg group-hover:-translate-y-1",
                                grade.lightColor
                            )}>
                                {/* Icon */}
                                <div className="text-5xl mb-4">
                                    {grade.icon}
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                    {grade.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-500 text-sm">
                                    {grade.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
