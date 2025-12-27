'use client';

import Link from 'next/link';
import { useSubjects } from '@/hooks/useSubjects';
import { BookOpen, Calculator, Globe, FlaskConical, BookText, Atom, Brain, Music } from 'lucide-react';

// Icon mapping for subjects
const SUBJECT_ICONS: Record<string, any> = {
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
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
];

export function SubjectCategories() {
    const { data: subjects = [], isLoading } = useSubjects();

    if (isLoading) {
        return (
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">تصفح حسب المادة</h2>
                        <p className="text-gray-500 mt-2">اختر المادة التي تريد التعلم فيها</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-gray-200 rounded-2xl h-32 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">تصفح حسب المادة</h2>
                    <p className="text-gray-500 mt-2">اختر المادة التي تريد التعلم فيها</p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {subjects.slice(0, 8).map((subject, index) => {
                        const Icon = SUBJECT_ICONS[subject.nameEn?.toLowerCase()] || SUBJECT_ICONS.default;
                        const colorClass = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

                        return (
                            <Link
                                key={subject.id}
                                href={`/search?subjectId=${subject.id}`}
                                className="group"
                            >
                                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 text-center">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{subject.nameAr}</h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
