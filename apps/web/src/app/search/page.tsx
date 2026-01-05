'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchApi, SearchResult } from '@/lib/api/search';
import { marketplaceApi } from '@/lib/api/marketplace';
import { TeacherPowerCard } from '@/components/marketplace/TeacherPowerCard';
import { SearchFilters } from '@/components/marketplace/SearchFilters';
import { MultiStepBookingModal } from '@/components/booking/MultiStepBookingModal';
import { Button } from '@/components/ui/button';
import { SearchSortBy } from '@sidra/shared';
import { Badge } from '@/components/ui/badge';
import { SearchX, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurricula } from '@/hooks/useCurricula';

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // Metadata for active filters
    const { data: subjects = [] } = useSubjects();
    const { data: curricula = [] } = useCurricula();

    // Results State
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialSearchDone, setInitialSearchDone] = useState(false);

    // Get dashboard link based on user role
    const getDashboardLink = () => {
        switch (user?.role) {
            case 'TEACHER': return '/teacher/sessions';
            case 'PARENT': return '/parent';
            case 'STUDENT': return '/student';
            case 'ADMIN': return '/admin/financials';
            default: return null;
        }
    };

    const dashboardLink = getDashboardLink();

    // Filter State
    const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '');
    const [curriculumId, setCurriculumId] = useState(searchParams.get('curriculumId') || '');
    const [gradeLevelId, setGradeLevelId] = useState(searchParams.get('gradeLevelId') || '');
    const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 50000);
    const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 0);
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>((searchParams.get('gender') as 'MALE' | 'FEMALE') || '');
    const [sortBy, setSortBy] = useState<SearchSortBy>((searchParams.get('sortBy') as SearchSortBy) || SearchSortBy.RATING_DESC);

    // Booking Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<SearchResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initial Search: trigger only once on mount if not triggered by params logic
    useEffect(() => {
        if (!initialSearchDone) {
            handleSearch();
            setInitialSearchDone(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        updateUrl();
        try {
            const filters: any = {
                subjectId,
                curriculumId,
                gradeLevelId: gradeLevelId || undefined,
                maxPrice: maxPrice < 50000 ? maxPrice : undefined,
                minPrice: minPrice > 0 ? minPrice : undefined,
                gender: gender || undefined,
                sortBy: sortBy || undefined
            };

            const data = await searchApi.searchTeachers(filters);

            // Fetch availability for each teacher (non-blocking)
            // Note: Parallel request limit might be an issue if results are large. 
            // For MVP (10-20 results) it's fine.
            const resultsWithAvailability = await Promise.all(
                data.map(async (result) => {
                    const nextSlot = await marketplaceApi.getNextAvailableSlot(result.teacherProfile.id);
                    return {
                        ...result,
                        nextAvailableSlot: nextSlot
                    };
                })
            );

            setResults(resultsWithAvailability);
        } catch (e) {
            console.error("Failed to search", e);
        } finally {
            setLoading(false);
        }
    };

    const updateUrl = () => {
        const params = new URLSearchParams();
        if (subjectId) params.set('subjectId', subjectId);
        if (curriculumId) params.set('curriculumId', curriculumId);
        if (gradeLevelId) params.set('gradeLevelId', gradeLevelId);
        if (maxPrice < 50000) params.set('maxPrice', maxPrice.toString());
        if (minPrice > 0) params.set('minPrice', minPrice.toString());
        if (gender) params.set('gender', gender);
        if (sortBy) params.set('sortBy', sortBy);

        router.push(`/search?${params.toString()}`, { scroll: false });
    };

    const handleReset = () => {
        setSubjectId('');
        setCurriculumId('');
        setGradeLevelId('');
        setMaxPrice(50000);
        setMinPrice(0);
        setGender('');
        setSortBy(SearchSortBy.RATING_DESC);
        // We'll trigger search manually or let user click search
        // Suggestion: Let user click search to avoid accidental refreshes
    };

    const handleBook = (teacher: SearchResult) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background font-tajawal text-text-primary mb-20" dir="rtl">


            {/* Header */}
            <div className="bg-surface shadow-sm border-b border-gray-100 py-8 sm:py-10">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2 sm:mb-3">ابحث عن معلمك الخصوصي</h1>
                    <p className="text-text-subtle text-base sm:text-lg max-w-2xl">نخبة من المعلمين المتميزين لجميع المراحل الدراسية والمناهج، متاحون لتدريس أبنائك في الوقت المناسب.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <SearchFilters
                    subjectId={subjectId} setSubjectId={setSubjectId}
                    curriculumId={curriculumId} setCurriculumId={setCurriculumId}
                    gradeLevelId={gradeLevelId} setGradeLevelId={setGradeLevelId}
                    minPrice={minPrice} maxPrice={maxPrice} setPriceRange={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
                    gender={gender} setGender={setGender}
                    sortBy={sortBy} setSortBy={setSortBy}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    loading={loading}
                    className="w-full lg:w-1/4"
                />

                {/* Results Grid */}
                <main className="w-full lg:w-3/4 space-y-6">
                    {/* Active Filters & Count */}
                    {!loading && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-gray-700 ml-2">
                                    تم العثور على {results.length} معلم
                                </span>
                                {subjectId && (
                                    <Badge variant="secondary" className="gap-1 pl-1 pr-2 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                                        {subjects?.find(s => s.id === subjectId)?.nameAr || 'المادة'}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSubjectId('')} />
                                    </Badge>
                                )}
                                {curriculumId && (
                                    <Badge variant="secondary" className="gap-1 pl-1 pr-2 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                                        {curricula?.find(c => c.id === curriculumId)?.nameAr || 'المنهج'}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => setCurriculumId('')} />
                                    </Badge>
                                )}
                                {/* Complex logic for grade name would require hierarchy here, skipping for simplicity or fetching raw grades list if available. 
                                    For now, we just show "الصف الدراسي" or try hierarchy hook if easy. */}
                                {(maxPrice < 50000 || minPrice > 0) && (
                                    <Badge variant="secondary" className="gap-1 pl-1 pr-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 font-english">
                                        {minPrice.toLocaleString()} - {maxPrice === 50000 ? 'MAX' : maxPrice.toLocaleString()} SDG
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => { setMinPrice(0); setMaxPrice(50000); }} />
                                    </Badge>
                                )}
                                {gender && (
                                    <Badge variant="secondary" className="gap-1 pl-1 pr-2 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                                        {gender === 'MALE' ? 'معلم' : 'معلمة'}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => setGender('')} />
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-6">
                            {/* Realistic Skeletons to match Card Height */}
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-[220px] bg-white rounded-xl border border-gray-100 p-4 flex gap-4 animate-pulse">
                                    <div className="w-[220px] bg-gray-100 rounded-lg shrink-0 hidden sm:block" />
                                    <div className="flex-1 space-y-4 py-2">
                                        <div className="flex justify-between">
                                            <div className="w-1/3 h-6 bg-gray-100 rounded" />
                                            <div className="w-16 h-6 bg-gray-100 rounded" />
                                        </div>
                                        <div className="w-1/4 h-4 bg-gray-50 rounded" />
                                        <div className="w-full h-12 bg-gray-50 rounded mt-4" />
                                        <div className="flex gap-2 mt-auto pt-4">
                                            <div className="w-24 h-10 bg-gray-100 rounded" />
                                            <div className="w-24 h-10 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-dashed border-gray-300">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <SearchX className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد نتائج مطابقة</h3>
                            <p className="text-text-subtle text-center max-w-md">
                                لم نتمكن من العثور على معلمين بهذه المواصفات. جرب تقليل الفلاتر أو البحث عن مادة أخرى.
                            </p>
                            <Button variant="link" onClick={handleReset} className="mt-4 text-primary">
                                إعادة تعيين البحث
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {results.filter(result => result && result.teacherProfile).map(result => (
                                <TeacherPowerCard
                                    key={result.id}
                                    teacher={result}
                                    onBook={handleBook}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Booking Modal */}
            {selectedTeacher && (
                <MultiStepBookingModal
                    isOpen={isModalOpen && selectedTeacher !== null}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTeacher(null);
                    }}
                    teacherId={selectedTeacher.teacherProfile.id}
                    teacherName={selectedTeacher.teacherProfile.displayName || 'معلم سدرة'}
                    teacherSubjects={[
                        {
                            id: selectedTeacher.subject.id,
                            name: selectedTeacher.subject.nameAr,
                            price: Number(selectedTeacher.pricePerHour)
                        }
                    ]}
                    initialSubjectId={selectedTeacher.subject.id}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
