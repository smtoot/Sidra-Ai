'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';

export function HeroSection() {
    const router = useRouter();
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedCurriculum, setSelectedCurriculum] = useState('');

    const { data: subjects = [] } = useSubjects();
    const { data: curricula = [] } = useCurricula();

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (selectedSubject) params.set('subjectId', selectedSubject);
        if (selectedCurriculum) params.set('curriculumId', selectedCurriculum);
        router.push(`/search?${params.toString()}`);
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-16 md:py-24 relative">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        منصة التعليم الأولى في السودان
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                        اكتشف أفضل المعلمين
                        <span className="text-primary block mt-2">لأبنائك</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        دروس خصوصية عبر الإنترنت مع نخبة من المعلمين المعتمدين.
                        احجز جلستك الأولى اليوم وانطلق في رحلة التفوق.
                    </p>

                    {/* Search Box */}
                    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Subject Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block text-right">
                                    المادة
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">جميع المواد</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.nameAr}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Curriculum Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block text-right">
                                    المنهج
                                </label>
                                <select
                                    value={selectedCurriculum}
                                    onChange={(e) => setSelectedCurriculum(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">جميع المناهج</option>
                                    {curricula.map((curriculum) => (
                                        <option key={curriculum.id} value={curriculum.id}>
                                            {curriculum.nameAr}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end">
                                <Button
                                    onClick={handleSearch}
                                    className="w-full h-12 text-lg gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Search className="w-5 h-5" />
                                    ابحث الآن
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary">+100</div>
                            <div className="text-gray-500 text-sm">معلم معتمد</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary">+500</div>
                            <div className="text-gray-500 text-sm">طالب مسجل</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary">+1000</div>
                            <div className="text-gray-500 text-sm">حصة منجزة</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
