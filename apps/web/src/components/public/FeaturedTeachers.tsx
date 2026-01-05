'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { searchApi, SearchResult } from '@/lib/api/search';
import { Star, ChevronLeft, ChevronRight, BadgeCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FeaturedTeachers() {
    const [teachers, setTeachers] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);

    // Touch handling for swipe
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const results = await searchApi.searchTeachers({});
                // Filter out results without teacherProfile and sort by rating
                const validResults = results.filter((r) => r.teacherProfile);
                const sorted = validResults.sort((a, b) =>
                    (b.teacherProfile?.averageRating || 0) - (a.teacherProfile?.averageRating || 0)
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

    // Responsive visible count
    const getVisibleCount = useCallback(() => {
        if (typeof window === 'undefined') return 4;
        if (window.innerWidth < 640) return 1;
        if (window.innerWidth < 768) return 2;
        if (window.innerWidth < 1024) return 3;
        return 4;
    }, []);

    const [visibleCount, setVisibleCount] = useState(4);

    useEffect(() => {
        const handleResize = () => {
            setVisibleCount(getVisibleCount());
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [getVisibleCount]);

    const maxIndex = Math.max(0, teachers.length - visibleCount);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    // Touch handlers for swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handlePrev(); // RTL: left swipe goes to previous
        }
        if (isRightSwipe) {
            handleNext(); // RTL: right swipe goes to next
        }
    };

    // Calculate card width percentage based on visible count
    const cardWidth = 100 / visibleCount;
    const gapPercentage = 1.5; // Gap in percentage
    const translateX = currentIndex * (cardWidth + gapPercentage);

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">معلمون مميزون</h2>
                        <p className="text-gray-500 mt-2">نخبة من أفضل المعلمين على منصتنا</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-[4/3] bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (teachers.length === 0) return null;

    return (
        <section ref={sectionRef} className="py-16 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between mb-12 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">معلمون مميزون</h2>
                        <p className="text-gray-500 mt-2">نخبة من أفضل المعلمين على منصتنا</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="rounded-full"
                            aria-label="السابق"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={currentIndex >= maxIndex}
                            className="rounded-full"
                            aria-label="التالي"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Teacher Cards Carousel */}
                <div
                    ref={carouselRef}
                    className={cn(
                        "transition-all duration-700 delay-200",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                            transform: `translateX(${translateX}%)`,
                            gap: `${gapPercentage}%`,
                        }}
                    >
                        {teachers.filter(teacher => teacher && teacher.teacherProfile).map((teacher, index) => (
                            <Link
                                key={teacher.id}
                                href={`/teachers/${teacher.teacherProfile?.slug || teacher.teacherProfile?.id || teacher.id}`}
                                className="group"
                                style={{
                                    flex: `0 0 calc(${cardWidth}% - ${gapPercentage * (visibleCount - 1) / visibleCount}%)`,
                                }}
                            >
                                <div
                                    className={cn(
                                        "bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2",
                                        "transform transition-all duration-500",
                                    )}
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    {/* Image */}
                                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                                        {/* Avatar with gradient background */}
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-3xl font-bold text-primary">
                                                    {teacher.teacherProfile?.displayName?.charAt(0) || 'م'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Verified Badge */}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-600 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                            <BadgeCheck className="w-3 h-3" />
                                            معتمد
                                        </div>

                                        {/* Availability Badge */}
                                        <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            متاح
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-3">
                                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-primary transition-colors">
                                            {teacher.teacherProfile?.displayName || 'معلم'}
                                        </h3>

                                        {/* Bio Preview */}
                                        {teacher.teacherProfile?.bio && (
                                            <p className="text-sm text-gray-500 line-clamp-1">
                                                {teacher.teacherProfile.bio}
                                            </p>
                                        )}

                                        {/* Subject & Curriculum */}
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {teacher.subject.nameAr}
                                            </span>
                                            {teacher.curriculum && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                    {teacher.curriculum.nameAr}
                                                </span>
                                            )}
                                        </div>

                                        {/* Rating & Price */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-medium">{teacher.teacherProfile?.averageRating?.toFixed(1) || '5.0'}</span>
                                                <span className="text-gray-400 text-sm">({teacher.teacherProfile?.totalReviews || 0})</span>
                                            </div>
                                            <div className="text-primary font-bold">
                                                {teacher.pricePerHour} <span className="text-xs font-normal">ج.س/ساعة</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                i === currentIndex ? "bg-primary w-6" : "bg-gray-300 hover:bg-gray-400"
                            )}
                            aria-label={`الانتقال إلى الصفحة ${i + 1}`}
                        />
                    ))}
                </div>

                {/* View All Button */}
                <div className={cn(
                    "text-center mt-10 transition-all duration-700 delay-400",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <Link href="/search">
                        <Button variant="outline" size="lg" className="gap-2">
                            عرض جميع المعلمين
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
