'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Calculator, BookText, Globe, FlaskConical, Atom, Brain, BookOpen, BookOpenCheck, LayoutGrid, LucideIcon, GraduationCap } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';

// Icon mapping based on subject code or Arabic name
const SUBJECT_ICONS: Record<string, LucideIcon> = {
    // By code
    'MATH': Calculator,
    'SCIENCE': FlaskConical,
    'PHYSICS': Atom,
    'CHEMISTRY': FlaskConical,
    'BIOLOGY': Brain,
    'ENGLISH': Globe,
    'ARABIC': BookText,
    'QURAN': BookOpenCheck,
    'ISLAMIC': BookOpen,
    // By Arabic name (fallback)
    'رياضيات': Calculator,
    'علوم': FlaskConical,
    'فيزياء': Atom,
    'كيمياء': FlaskConical,
    'أحياء': Brain,
    'إنجليزي': Globe,
    'لغة إنجليزية': Globe,
    'عربي': BookText,
    'لغة عربية': BookText,
    'قرآن': BookOpenCheck,
    'القرآن الكريم': BookOpenCheck,
    'تربية إسلامية': BookOpen,
};

function getSubjectIcon(code: string, nameAr: string): LucideIcon {
    return SUBJECT_ICONS[code] || SUBJECT_ICONS[nameAr] || GraduationCap;
}

export function SubjectsSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const { data: subjects = [], isLoading } = useSubjects();

    // Filter to only show active subjects
    const activeSubjects = subjects.filter(s => s.isActive);

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
                    {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 10 }).map((_, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 text-center shadow-sm animate-pulse"
                            >
                                <div className="w-14 h-14 rounded-xl mx-auto mb-3 bg-gray-200" />
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                            </div>
                        ))
                    ) : (
                        <>
                            {activeSubjects.slice(0, 9).map((subject, index) => {
                                const Icon = getSubjectIcon(subject.code, subject.nameAr);

                                return (
                                    <Link
                                        key={subject.id}
                                        href={`/search?subjectId=${subject.id}`}
                                        className={cn(
                                            "group transition-all duration-500",
                                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                        )}
                                        style={{ transitionDelay: `${index * 50}ms` }}
                                    >
                                        <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 h-full flex flex-col items-center justify-center">
                                            {/* Icon */}
                                            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-[#F0F7FF] text-[#003366] group-hover:bg-[#003366] group-hover:text-white">
                                                <Icon className="w-7 h-7" />
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                                {subject.nameAr}
                                            </h3>
                                        </div>
                                    </Link>
                                );
                            })}
                            {/* View All Subjects action card */}
                            <Link
                                href="/search"
                                className={cn(
                                    "group transition-all duration-500",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${activeSubjects.length * 50}ms` }}
                            >
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 h-full flex flex-col items-center justify-center">
                                    {/* Icon */}
                                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-[#FFF9F0] text-[#D4A056] group-hover:bg-[#D4A056] group-hover:text-white">
                                        <LayoutGrid className="w-7 h-7" />
                                    </div>

                                    {/* Name */}
                                    <h3 className="font-semibold text-[#D4A056] group-hover:text-primary transition-colors">
                                        عرض جميع المواد
                                    </h3>
                                </div>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
