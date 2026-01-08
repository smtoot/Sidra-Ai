'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Calculator, BookText, Globe, FlaskConical, Atom, Brain, BookOpen, BookOpenCheck, LayoutGrid } from 'lucide-react';

const SUBJECTS = [
    { name: 'رياضيات', icon: Calculator },
    { name: 'علوم', icon: FlaskConical },
    { name: 'فيزياء', icon: Atom },
    { name: 'كيمياء', icon: FlaskConical },
    { name: 'أحياء', icon: Brain },
    { name: 'إنجليزي', icon: Globe },
    { name: 'عربي', icon: BookText },
    { name: 'قرآن', icon: BookOpenCheck },
    { name: 'تربية إسلامية', icon: BookOpen },
    { name: 'عرض جميع المواد', icon: LayoutGrid, isAction: true },
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
                        const isAction = (subject as any).isAction;

                        return (
                            <Link
                                key={subject.name}
                                href={isAction ? '/search' : `/search?subject=${encodeURIComponent(subject.name)}`}
                                className={cn(
                                    "group transition-all duration-500",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                <div className={cn(
                                    "bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 h-full flex flex-col items-center justify-center",
                                    isAction && "bg-gray-50 border-2 border-dashed border-gray-200"
                                )}>
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                        "bg-[#F0F7FF] text-[#003366] group-hover:bg-[#003366] group-hover:text-white",
                                        isAction && "bg-[#FFF9F0] text-[#D4A056] group-hover:bg-[#D4A056]"
                                    )}>
                                        <Icon className="w-7 h-7" />
                                    </div>

                                    {/* Name */}
                                    <h3 className={cn(
                                        "font-semibold text-gray-900 group-hover:text-primary transition-colors",
                                        isAction && "text-[#D4A056]"
                                    )}>
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
