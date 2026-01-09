'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/lib/api/marketplace';

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);
    const [searchParams, setSearchParams] = useState({
        curriculum: '',
        stage: '',
        subject: ''
    });

    // Fetch real data from API
    const { data: curricula = [], isLoading: curriculaLoading } = useCurricula();
    const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();

    // Fetch stages based on selected curriculum
    const { data: curriculumHierarchy } = useQuery({
        queryKey: ['curriculum-hierarchy', searchParams.curriculum],
        queryFn: () => marketplaceApi.getCurriculumHierarchy(searchParams.curriculum),
        enabled: !!searchParams.curriculum,
        staleTime: 10 * 60 * 1000,
    });

    // Extract stages from hierarchy
    const stages = curriculumHierarchy?.stages || [];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Reset stage when curriculum changes
    useEffect(() => {
        setSearchParams(prev => ({ ...prev, stage: '' }));
    }, [searchParams.curriculum]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchParams.curriculum) params.append('curriculumId', searchParams.curriculum);
        // For stage, we pass the first grade of the stage as gradeLevelId for better filtering
        if (searchParams.stage) {
            const selectedStage = stages.find(s => s.id === searchParams.stage);
            if (selectedStage?.grades?.[0]?.id) {
                params.append('gradeLevelId', selectedStage.grades[0].id);
            }
        }
        if (searchParams.subject) params.append('subjectId', searchParams.subject);

        window.location.href = `/search?${params.toString()}`;
    };

    // Filter to only show active items
    const activeCurricula = curricula.filter(c => c.isActive);
    const activeSubjects = subjects.filter(s => s.isActive);

    return (
        <section className="relative bg-[#003366] min-h-[650px] flex items-center overflow-hidden dir-rtl">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/grid-pattern.svg')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
            </div>

            <div className="container mx-auto px-4 py-8 lg:py-20 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Content Side */}
                    <div className={cn(
                        "text-white space-y-10 transition-all duration-1000",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}>
                        <div className="space-y-3">
                            <h1
                                className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight !text-white drop-shadow-md"
                                style={{ color: '#FFFFFF' }}
                            >
                                أفضل المعلمين السودانيين لأبنائك
                            </h1>
                            <p
                                className="text-lg md:text-xl text-[#E6E6E6] font-medium leading-loose max-w-xl"
                                style={{ color: '#E6E6E6' }}
                            >
                                دروس خصوصية أونلاين مخصصة حسب المنهج والمرحلة، بخصوصية وأمان من بيتكم.
                            </p>
                        </div>

                        {/* Search Box */}
                        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-2xl max-w-xl border-4 border-white/10 backdrop-blur-sm">
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 px-1">المنهج</label>
                                        <Select
                                            value={searchParams.curriculum}
                                            onValueChange={(v) => setSearchParams({ ...searchParams, curriculum: v })}
                                            disabled={curriculaLoading}
                                        >
                                            <SelectTrigger className="w-full text-right h-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#D4A056]/50 focus:border-[#D4A056] text-gray-900 font-medium rounded-lg transition-all shadow-sm">
                                                <SelectValue placeholder={curriculaLoading ? "جاري التحميل..." : "اختر المنهج"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border text-gray-900 border-gray-100 shadow-lg p-1">
                                                {activeCurricula.map((curriculum) => (
                                                    <SelectItem
                                                        key={curriculum.id}
                                                        value={curriculum.id}
                                                        className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer"
                                                    >
                                                        {curriculum.nameAr}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 px-1">المرحلة</label>
                                        <Select
                                            value={searchParams.stage}
                                            onValueChange={(v) => setSearchParams({ ...searchParams, stage: v })}
                                            disabled={!searchParams.curriculum || stages.length === 0}
                                        >
                                            <SelectTrigger className="w-full text-right h-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#D4A056]/50 focus:border-[#D4A056] text-gray-900 font-medium rounded-lg transition-all shadow-sm">
                                                <SelectValue placeholder={!searchParams.curriculum ? "اختر المنهج أولاً" : "اختر المرحلة"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border text-gray-900 border-gray-100 shadow-lg p-1">
                                                {stages.map((stage) => (
                                                    <SelectItem
                                                        key={stage.id}
                                                        value={stage.id}
                                                        className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer"
                                                    >
                                                        {stage.nameAr}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 px-1">المادة</label>
                                        <Select
                                            value={searchParams.subject}
                                            onValueChange={(v) => setSearchParams({ ...searchParams, subject: v })}
                                            disabled={subjectsLoading}
                                        >
                                            <SelectTrigger className="w-full text-right h-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#D4A056]/50 focus:border-[#D4A056] text-gray-900 font-medium rounded-lg transition-all shadow-sm">
                                                <SelectValue placeholder={subjectsLoading ? "جاري التحميل..." : "اختر المادة"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border text-gray-900 border-gray-100 shadow-lg p-1">
                                                {activeSubjects.map((subject) => (
                                                    <SelectItem
                                                        key={subject.id}
                                                        value={subject.id}
                                                        className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer"
                                                    >
                                                        {subject.nameAr}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSearch}
                                    className="w-full bg-[#D4A056] hover:bg-[#C29046] text-white font-bold text-lg h-12 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Search className="w-5 h-5" />
                                    ابدأ البحث الآن
                                </Button>
                            </div>
                        </div>

                        {/* Trust Badges - Improved Contrast */}
                        <div className="flex flex-wrap items-center gap-6 lg:gap-8 pt-2">
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                <span className="font-bold text-2xl text-white">+100</span>
                                <span className="text-white/80 text-sm font-medium">معلم مؤهل</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                <span className="font-bold text-2xl text-white">+500</span>
                                <span className="text-white/80 text-sm font-medium">طالب</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                <span className="font-bold text-2xl text-white">+1000</span>
                                <span className="text-white/80 text-sm font-medium">حصة ناجحة</span>
                            </div>
                        </div>
                    </div>

                    {/* Illustration Side - UNTOUCHED as requested */}
                    <div className={cn(
                        "hidden lg:flex justify-end transition-all duration-1000 delay-300",
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                    )}>
                        <div className="relative w-full max-w-xl">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                                <img
                                    src="/images/hero-illustration.png"
                                    alt="Sudanese Teacher Online"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/40 to-transparent" />
                            </div>
                            <div className="absolute -z-10 -bottom-6 -left-6 w-full h-full bg-[#D4A056]/20 rounded-2xl" />
                            <div className="absolute -z-20 -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
