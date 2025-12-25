'use client';

import { useState, useEffect, useMemo } from 'react';
import { searchApi, SearchResult } from '@/lib/api/search';
import TeacherCard from '@/components/marketplace/TeacherCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import { CreateBookingModal } from '@/components/booking/CreateBookingModal';
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurriculumHierarchy } from '@/hooks/useCurriculumHierarchy';

export default function SearchPage() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [subjectId, setSubjectId] = useState('');
    const [curriculumId, setCurriculumId] = useState('');
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Booking Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<SearchResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // React Query hooks for cached data
    const { data: subjects = [] } = useSubjects();
    const { data: curricula = [] } = useCurricula();
    const { data: hierarchy, isLoading: loadingHierarchy } = useCurriculumHierarchy(curriculumId || null);

    // Flatten hierarchy grades for dropdown
    const grades = useMemo(() => {
        if (!hierarchy?.stages) return [];
        return hierarchy.stages.flatMap(s =>
            s.grades.map(g => ({
                ...g,
                stageName: s.nameAr
            }))
        );
    }, [hierarchy]);

    // Reset grade when curriculum changes
    useEffect(() => {
        setGradeLevelId('');
    }, [curriculumId]);

    // Initial search on mount
    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const filters: any = {
                subjectId,
                curriculumId,
                maxPrice: maxPrice ? Number(maxPrice) : undefined
            };

            // Only add gradeLevelId if selected (Strict Mode)
            if (gradeLevelId) {
                filters.gradeLevelId = gradeLevelId;
            }

            const data = await searchApi.searchTeachers(filters);
            setResults(data);
        } catch (e) {
            console.error("Failed to search", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (teacher: SearchResult) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background font-tajawal text-text-primary" dir="rtl">
            {/* Header */}
            <div className="bg-surface shadow-sm border-b border-gray-100 py-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-primary mb-2">ابحث عن أفضل المعلمين</h1>
                    <p className="text-text-subtle">نخبة من المعلمين المتميزين لجميع المراحل والمناهج</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="w-full lg:w-1/4 space-y-6">
                    <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 sticky top-8">
                        <div className="flex items-center gap-2 text-primary font-bold border-b pb-4">
                            <Filter className="w-5 h-5" />
                            تصفية النتائج
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>المنهج</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={curriculumId}
                                    onChange={(e) => setCurriculumId(e.target.value)}
                                >
                                    <option value="">الكل</option>
                                    {curricula.map(c => (
                                        <option key={c.id} value={c.id}>{c.nameAr}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Grade Filter - Dependent on Curriculum */}
                            <div className="space-y-2">
                                <Label className={!curriculumId ? "text-gray-400" : ""}>
                                    الصف الدراسي {curriculumId && "(اختياري)"}
                                </Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400"
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

                            <div className="space-y-2">
                                <Label>المادة</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                                <Label>الحد الأقصى للسعر (SDG)</Label>
                                <Input
                                    type="number"
                                    placeholder="مثال: 5000"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>

                            <Button onClick={handleSearch} className="w-full gap-2" disabled={loading}>
                                <Search className="w-4 h-4" />
                                {loading ? 'جاري البحث...' : 'بحث'}
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Results Grid */}
                <main className="w-full lg:w-3/4 space-y-6">
                    {loading ? (
                        <div className="text-center py-20 text-text-subtle">
                            جاري البحث...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-20 bg-surface rounded-xl border border-dashed border-gray-300">
                            <p className="text-lg font-bold text-text-muted">لا توجد نتائج</p>
                            <p className="text-text-subtle">جرب تغيير خيارات البحث</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-text-subtle">تم العثور على {results.length} معلم</p>
                            {results.map(result => (
                                <TeacherCard
                                    key={result.id}
                                    result={result}
                                    onBook={handleBook}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Booking Modal */}
            {selectedTeacher && (
                <CreateBookingModal
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
                    userRole="PARENT"  // Default to PARENT for search page
                />
            )}
        </div>
    );
}
