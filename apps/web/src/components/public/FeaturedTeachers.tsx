'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { searchApi, SearchResult } from '@/lib/api/search';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeaturedTeachers() {
    const [teachers, setTeachers] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const results = await searchApi.searchTeachers({});
                // Sort by rating and take top 8
                const sorted = results.sort((a, b) =>
                    (b.teacherProfile.averageRating || 0) - (a.teacherProfile.averageRating || 0)
                );
                setTeachers(sorted.slice(0, 8));
            } catch (err) {
                console.error('Failed to fetch teachers', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    const visibleCount = 4;
    const maxIndex = Math.max(0, teachers.length - visibleCount);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">معلمون مميزون</h2>
                        <p className="text-gray-500 mt-2">نخبة من أفضل المعلمين على منصتنا</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (teachers.length === 0) return null;

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">معلمون مميزون</h2>
                        <p className="text-gray-500 mt-2">نخبة من أفضل المعلمين على منصتنا</p>
                    </div>
                    <div className="hidden md:flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={currentIndex === maxIndex}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Teacher Cards */}
                <div className="overflow-hidden">
                    <div
                        className="flex gap-6 transition-transform duration-300"
                        style={{ transform: `translateX(${currentIndex * (100 / visibleCount + 6)}%)` }}
                    >
                        {teachers.map((teacher) => (
                            <Link
                                key={teacher.id}
                                href={`/teachers/${teacher.teacherProfile.slug || teacher.teacherProfile.id}`}
                                className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] group"
                            >
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                    {/* Image */}
                                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                            <span className="text-4xl font-bold text-primary/40">
                                                {teacher.teacherProfile.displayName?.charAt(0) || 'م'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-3">
                                        <h3 className="font-bold text-lg text-gray-900 truncate">
                                            {teacher.teacherProfile.displayName}
                                        </h3>

                                        {/* Subject */}
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {teacher.subject.nameAr}
                                            </span>
                                        </div>

                                        {/* Rating & Price */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-medium">{teacher.teacherProfile.averageRating?.toFixed(1) || '5.0'}</span>
                                                <span className="text-gray-400 text-sm">({teacher.teacherProfile.totalReviews || 0})</span>
                                            </div>
                                            <div className="text-primary font-bold">
                                                {teacher.pricePerHour} SDG
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* View All Button */}
                <div className="text-center mt-10">
                    <Link href="/search">
                        <Button variant="outline" size="lg">
                            عرض جميع المعلمين
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
