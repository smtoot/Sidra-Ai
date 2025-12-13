'use client';

import { useState, useEffect } from 'react';
import { marketplaceApi } from '@/lib/api/marketplace';
import { searchApi, SearchResult } from '@/lib/api/search';
import TeacherCard from '@/components/marketplace/TeacherCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import { CreateBookingModal } from '@/components/booking/CreateBookingModal';

export default function SearchPage() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [subjectId, setSubjectId] = useState('');
    const [curriculumId, setCurriculumId] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Booking Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<SearchResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Data for dropdowns
    const [subjects, setSubjects] = useState<any[]>([]);
    const [curricula, setCurricula] = useState<any[]>([]);

    useEffect(() => {
        loadFilters();
        handleSearch();
    }, []);

    const loadFilters = async () => {
        try {
            const [subj, curr] = await Promise.all([
                marketplaceApi.getSubjects(),
                marketplaceApi.getCurricula()
            ]);
            setSubjects(subj);
            setCurricula(curr);
        } catch (e) {
            console.error("Failed to load filters", e);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await searchApi.searchTeachers({
                subjectId,
                curriculumId,
                maxPrice: maxPrice ? Number(maxPrice) : undefined
            });
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

                            <Button onClick={handleSearch} className="w-full gap-2">
                                <Search className="w-4 h-4" />
                                بحث
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
                />
            )}
        </div>
    );
}
