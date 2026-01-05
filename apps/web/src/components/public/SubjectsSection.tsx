'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Calculator, BookText, Globe, FlaskConical, Atom, Brain, BookOpen, BookOpenCheck } from 'lucide-react';

const SUBJECTS = [
    { name: 'رياضيات', icon: Calculator, color: 'bg-blue-50 text-blue-600' },
    { name: 'علوم', icon: FlaskConical, color: 'bg-green-50 text-green-600' },
    { name: 'فيزياء', icon: Atom, color: 'bg-purple-50 text-purple-600' },
    { name: 'كيمياء', icon: FlaskConical, color: 'bg-orange-50 text-orange-600' },
    { name: 'أحياء', icon: Brain, color: 'bg-pink-50 text-pink-600' },
    { name: 'إنجليزي', icon: Globe, color: 'bg-cyan-50 text-cyan-600' },
    { name: 'عربي', icon: BookText, color: 'bg-amber-50 text-amber-600' },
    { name: 'قرآن', icon: BookOpenCheck, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'تربية إسلامية', icon: BookOpen, color: 'bg-teal-50 text-teal-600' },
];

export function SubjectsSection() {
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
                        المواد الدراسية
                    </h2>
                </div>

                {/* Subjects Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
                    {SUBJECTS.map((subject, index) => {
                        const Icon = subject.icon;

                        return (
                            <Link
                                key={subject.name}
                                href={`/search?subject=${encodeURIComponent(subject.name)}`}
                                className={cn(
                                    "group transition-all duration-500",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                        subject.color
                                    )}>
                                        <Icon className="w-7 h-7" />
                                    </div>

                                    {/* Name */}
                                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                        {subject.name}
                                    </h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
