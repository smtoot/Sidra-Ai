'use client';

import { useState, useEffect } from 'react';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurricula } from '@/hooks/useCurricula';
import { useCurriculumHierarchy } from '@/hooks/useCurriculumHierarchy';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, X, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchSortBy } from '@sidra/shared';

interface SearchFiltersProps {
    // State
    subjectId: string;
    setSubjectId: (val: string) => void;
    curriculumId: string;
    setCurriculumId: (val: string) => void;
    gradeLevelId: string;
    setGradeLevelId: (val: string) => void;

    // Advanced Filters
    minPrice: number;
    maxPrice: number;
    setPriceRange: (min: number, max: number) => void;
    gender: 'MALE' | 'FEMALE' | '';
    setGender: (val: 'MALE' | 'FEMALE' | '') => void;
    sortBy: SearchSortBy;
    setSortBy: (val: SearchSortBy) => void;

    // Actions
    onSearch: () => void;
    onReset: () => void;
    loading: boolean;

    // Layout
    className?: string; // For sticky positioning
}

export function SearchFilters({
    subjectId, setSubjectId,
    curriculumId, setCurriculumId,
    gradeLevelId, setGradeLevelId,
    minPrice, maxPrice, setPriceRange,
    gender, setGender,
    sortBy, setSortBy,
    onSearch, onReset, loading,
    className
}: SearchFiltersProps) {
    const { data: config } = usePlatformConfig();
    const { data: subjects = [] } = useSubjects();
    const { data: curricula = [] } = useCurricula();
    const { data: hierarchy, isLoading: loadingHierarchy } = useCurriculumHierarchy(curriculumId || null);

    // Initial max price suggestion
    const PLATFORM_MAX_PRICE = 50000;

    // Hierarchy Logic
    const grades = hierarchy?.stages?.flatMap(s =>
        s.grades.map(g => ({ ...g, stageName: s.nameAr }))
    ) || [];

    // Reset grade when curriculum changes
    useEffect(() => {
        if (!curriculumId) setGradeLevelId('');
    }, [curriculumId, setGradeLevelId]);

    const activeFiltersCount = [
        subjectId, curriculumId, gradeLevelId,
        minPrice > 0, maxPrice < PLATFORM_MAX_PRICE,
        gender
    ].filter(Boolean).length;

    const FilterContent = () => (
        <div className="space-y-6">
            {/* Sort Order */}
            <div className="space-y-2">
                <Label>ترتيب حسب</Label>
                <select
                    className="w-full h-12 rounded-md border border-input bg-surface px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-primary"
                    value={sortBy || ''}
                    onChange={(e) => setSortBy(e.target.value as SearchSortBy || undefined)}
                >
                    <option value="">(الافتراضي) الأعلى تقييماً</option>
                    <option value={SearchSortBy.PRICE_ASC}>السعر: من الأقل للأعلى</option>
                    <option value={SearchSortBy.PRICE_DESC}>السعر: من الأعلى للأقل</option>
                    <option value={SearchSortBy.RATING_DESC}>التقييم: الأعلى أولاً</option>
                </select>
            </div>

            {/* Subject (Moved before Curriculum) */}
            <div className="space-y-2">
                <Label>المادة</Label>
                <select
                    className="w-full h-12 rounded-md border border-input bg-surface px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-primary"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                >
                    <option value="">الكل</option>
                    {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label>المنهج</Label>
                <select
                    className="w-full h-12 rounded-md border border-input bg-surface px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-primary"
                    value={curriculumId}
                    onChange={(e) => setCurriculumId(e.target.value)}
                >
                    <option value="">الكل</option>
                    {curricula.map(c => (
                        <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label className={!curriculumId ? "text-gray-400" : ""}>
                    الصف الدراسي {curriculumId && "(اختياري)"}
                </Label>
                <select
                    className="w-full h-12 rounded-md border border-input bg-surface px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400"
                    value={gradeLevelId}
                    onChange={(e) => setGradeLevelId(e.target.value)}
                    disabled={!curriculumId || loadingHierarchy}
                >
                    <option value="">
                        {!curriculumId
                            ? "اختر المنهج أولاً"
                            : loadingHierarchy
                                ? "جاري التحميل..."
                                : "الكل (بحث عام)"
                        }
                    </option>
                    {grades.map(g => (
                        <option key={g.id} value={g.id}>
                            {g.stageName ? `${g.stageName} - ${g.nameAr}` : g.nameAr}
                        </option>
                    ))}
                </select>
            </div>

            {/* Dynamic Filters */}
            {config?.searchConfig?.enablePriceFilter !== false && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                        <Label>نطاق السعر</Label>
                        {/* Price Range Label */}
                    </div>
                    <Slider
                        defaultValue={[0, PLATFORM_MAX_PRICE]}
                        value={[minPrice, maxPrice]}
                        max={PLATFORM_MAX_PRICE}
                        step={500}
                        minStepsBetweenThumbs={1}
                        onValueChange={(vals) => setPriceRange(vals[0], vals[1])}
                        className="py-4 dir-ltr" // Slider handles LTR internally usually, but force LTR for logic if needed, actually radix slider is usually direction agnostic but numbers run L-R. Let's rely on standard behavior but fix labels.
                    />
                    <div className="flex justify-between text-xs text-text-subtle font-english">
                        <span>{minPrice.toLocaleString()} SDG</span>
                        <span>{maxPrice === PLATFORM_MAX_PRICE ? 'MAX' : `${maxPrice.toLocaleString()} SDG`}</span>
                    </div>
                </div>
            )}

            {config?.searchConfig?.enableGenderFilter !== false && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <Label>جنس المعلم (اختياري)</Label>
                    <div className="flex gap-2">
                        <Button
                            variant={gender === 'MALE' ? 'default' : 'outline'}
                            onClick={() => setGender(gender === 'MALE' ? '' : 'MALE')}
                            className={cn("flex-1", gender === 'MALE' ? "bg-primary text-white border-primary" : "text-gray-600")}
                            size="sm"
                        >
                            معلم
                        </Button>
                        <Button
                            variant={gender === 'FEMALE' ? 'default' : 'outline'}
                            onClick={() => setGender(gender === 'FEMALE' ? '' : 'FEMALE')}
                            className={cn("flex-1", gender === 'FEMALE' ? "bg-primary text-white border-primary" : "text-gray-600")}
                            size="sm"
                        >
                            معلمة
                        </Button>
                    </div>
                </div>
            )}

            <div className="pt-6 flex gap-3 sticky bottom-0 bg-white pb-2 sm:static sm:bg-transparent sm:pb-0 border-t sm:border-t-0 border-gray-100 sm:border-transparent mt-auto">
                <Button onClick={onSearch} className="flex-1 gap-2 shadow-lg sm:shadow-none" disabled={loading}>
                    <Filter className="w-4 h-4" />
                    {loading ? 'جاري البحث...' : 'تطبيق الفلتر'}
                </Button>
                {activeFiltersCount > 0 && (
                    <Button onClick={onReset} variant="outline" className="px-3" title="إعادة ضبط">
                        إعادة ضبط
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={cn("hidden lg:block w-1/4 space-y-6", className)}>
                <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                    <div className="flex items-center gap-2 text-primary font-bold border-b pb-4">
                        <Filter className="w-5 h-5" />
                        تصفية النتائج
                    </div>
                    <FilterContent />
                </div>
            </aside>

            {/* Mobile Sheet */}
            <Sheet>
                <SheetTrigger asChild>
                    <button className="lg:hidden fixed bottom-6 left-6 bg-primary text-white rounded-full p-4 shadow-lg z-40 flex items-center gap-2 animate-in fade-in zoom-in hover:scale-105 transition-transform">
                        <Filter className="w-5 h-5" />
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                        <span className="font-bold">تصفية ({activeFiltersCount})</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl h-[85vh]">
                    <SheetHeader className="text-right pb-4 border-b">
                        <SheetTitle>تصفية النتائج</SheetTitle>
                        <SheetDescription>
                            حدد خيارات البحث المناسبة لك
                        </SheetDescription>
                    </SheetHeader>
                    <div className="overflow-y-auto h-full pb-20 pt-4 px-1">
                        <FilterContent />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
