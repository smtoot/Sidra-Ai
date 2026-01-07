'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSubjects } from '@/hooks/useSubjects';
import { BookOpen, Calculator, Globe, FlaskConical, BookText, Atom, Brain, Music, Users, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Icon mapping for subjects
const SUBJECT_ICONS: Record<string, React.ElementType> = {
    'math': Calculator,
    'arabic': BookText,
    'english': Globe,
    'physics': Atom,
    'chemistry': FlaskConical,
    'biology': Brain,
    'music': Music,
    'default': BookOpen,
};

// Color mapping for subjects
const SUBJECT_COLORS = [
    { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'from-green-500 to-green-600', light: 'bg-green-50', text: 'text-green-600' },
    { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', text: 'text-purple-600' },
    { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', text: 'text-orange-600' },
    { bg: 'from-pink-500 to-pink-600', light: 'bg-pink-50', text: 'text-pink-600' },
    { bg: 'from-cyan-500 to-cyan-600', light: 'bg-cyan-50', text: 'text-cyan-600' },
    { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50', text: 'text-amber-600' },
    { bg: 'from-rose-500 to-rose-600', light: 'bg-rose-50', text: 'text-rose-600' },
];

// Mock teacher counts - in production, this would come from the API
const MOCK_TEACHER_COUNTS: Record<string, number> = {
    'math': 45,
    'arabic': 32,
    'english': 28,
    'physics': 22,
    'chemistry': 18,
    'biology': 15,
    'music': 8,
};

export function SubjectCategories() {
    const { data: subjects = [], isLoading } = useSubjects();
    const [isVisible, setIsVisible] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    // Intersection observer for entrance animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const displayedSubjects = showAll ? subjects : subjects.slice(0, 8);
    const hasMore = subjects.length > 8;

    if (isLoading) {
        return (
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">تصفح حسب المادة</h2>
                        <p className="text-gray-500 mt-2">اختر المادة التي تريد التعلم فيها</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4" />
                                <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section ref={sectionRef} className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-12 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">تصفح حسب المادة</h2>
                    <p className="text-gray-500 mt-2">اختر المادة التي تريد التعلم فيها</p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {displayedSubjects.map((subject, index) => {
                        const Icon = SUBJECT_ICONS[subject.nameEn?.toLowerCase()] || SUBJECT_ICONS.default;
                        const colors = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
                        // eslint-disable-next-line react-hooks/purity
                        const teacherCount = MOCK_TEACHER_COUNTS[subject.nameEn?.toLowerCase()] || Math.floor(Math.random() * 30) + 10;

                        return (
                            <Link
                                key={subject.id}
                                href={`/search?subjectId=${subject.id}`}
                                className={cn(
                                    "group transition-all duration-500",
                                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                )}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 text-center relative overflow-hidden">
                                    {/* Hover background effect */}
                                    <div className={cn(
                                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                        colors.light
                                    )} />

                                    {/* Content */}
                                    <div className="relative">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl bg-gradient-to-br mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300",
                                            colors.bg
                                        )}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>

                                        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                            {subject.nameAr}
                                        </h3>

                                        {/* Teacher count */}
                                        <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                                            <Users className="w-4 h-4" />
                                            <span>{teacherCount} معلم</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* View All Button */}
                {hasMore && (
                    <div className={cn(
                        "text-center mt-10 transition-all duration-700 delay-500",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setShowAll(!showAll)}
                            className="gap-2"
                        >
                            {showAll ? 'عرض أقل' : `عرض جميع المواد (${subjects.length})`}
                            <ChevronLeft className={cn(
                                "w-4 h-4 transition-transform",
                                showAll && "rotate-90"
                            )} />
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
