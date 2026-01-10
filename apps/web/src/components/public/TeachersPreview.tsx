'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchApi, SearchResult } from '@/lib/api/search';
import { SearchSortBy } from '@sidra/shared';

// Fallback placeholder teachers when no real teachers exist
const PLACEHOLDER_TEACHERS = [
    {
        id: 'placeholder-1',
        name: 'أ. محمد أحمد',
        subject: 'الرياضيات',
        curriculum: 'المنهج السوداني',
        rating: 4.9,
        reviews: 120,
        bio: 'خبرة 10 سنوات في تدريس الرياضيات',
    },
    {
        id: 'placeholder-2',
        name: 'أ. سارة حسن',
        subject: 'اللغة الإنجليزية',
        curriculum: 'المنهج السوداني',
        rating: 4.8,
        reviews: 85,
        bio: 'متخصصة في التأسيس والمحادثة',
    },
    {
        id: 'placeholder-3',
        name: 'أ. عمر الخضر',
        subject: 'الفيزياء',
        curriculum: 'المنهج السوداني',
        rating: 5.0,
        reviews: 95,
        bio: 'تبسيط الفيزياء للشهادة السودانية',
    },
];

// Group search results by teacher to get unique teachers
function getUniqueTeachers(results: SearchResult[]): SearchResult[] {
    const teacherMap = new Map<string, SearchResult>();
    for (const result of results) {
        // Keep first occurrence (highest rated due to sort)
        if (!teacherMap.has(result.teacherProfile.id)) {
            teacherMap.set(result.teacherProfile.id, result);
        }
    }
    return Array.from(teacherMap.values());
}

// Placeholder teacher card component
function PlaceholderTeacherCard({ teacher }: { teacher: typeof PLACEHOLDER_TEACHERS[0] }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col items-center p-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gray-100 mb-5 overflow-hidden border-4 border-white shadow-md">
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                    <span className="text-2xl font-bold text-[#003366]">
                        {teacher.name.charAt(2)}
                    </span>
                </div>
            </div>

            {/* Name */}
            <h3 className="font-bold text-xl text-[#003366] mb-2">
                {teacher.name}
            </h3>

            {/* Subject */}
            <div className="mb-4">
                <span className="inline-block bg-[#F0F7FF] text-[#003366] font-bold px-4 py-1.5 rounded-full text-sm">
                    {teacher.subject}
                </span>
            </div>

            {/* Curriculum */}
            <div className="flex flex-col items-center gap-2 mb-5 w-full">
                <span className="text-xs text-gray-500 font-bold">المنهج</span>
                <div className="flex flex-wrap justify-center gap-2">
                    <span className="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                        {teacher.curriculum}
                    </span>
                </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-5 opacity-90">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-gray-900 text-sm">
                    {teacher.rating.toFixed(1)}
                </span>
                <span className="text-gray-400 text-xs">
                    ({teacher.reviews} تقييم)
                </span>
            </div>

            {/* Bio */}
            <p className="text-gray-500 text-sm font-medium leading-relaxed border-t border-gray-50 pt-4 w-full text-center line-clamp-2">
                {teacher.bio}
            </p>
        </div>
    );
}

export function TeachersPreview() {
    // Fetch top-rated approved teachers
    const { data: searchResults = [], isLoading } = useQuery({
        queryKey: ['featured-teachers'],
        queryFn: () => searchApi.searchTeachers({ sortBy: SearchSortBy.RATING_DESC }),
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    });

    // Get unique teachers (deduplicate by teacher ID) and take top 3
    const featuredTeachers = getUniqueTeachers(searchResults).slice(0, 3);

    // Calculate how many placeholder teachers to show to fill the grid
    const placeholdersNeeded = Math.max(0, 3 - featuredTeachers.length);
    const fillPlaceholders = PLACEHOLDER_TEACHERS.slice(0, placeholdersNeeded);

    return (
        <section className="py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003366] mb-4">
                        اختر معلمك بنفسك
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        نخبة من المعلمين المؤهلين لتدريس أبنائكم، تم اختيارهم بعناية
                    </p>
                </div>

                {/* Teachers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col items-center p-8 animate-pulse">
                                <div className="w-24 h-24 rounded-full bg-gray-200 mb-5" />
                                <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
                                <div className="h-8 bg-gray-200 rounded-full w-24 mb-4" />
                                <div className="h-4 bg-gray-200 rounded w-20 mb-5" />
                                <div className="h-4 bg-gray-200 rounded w-full" />
                            </div>
                        ))
                    ) : (
                        <>
                            {/* Real teachers */}
                            {featuredTeachers.map((result) => {
                                const teacher = result.teacherProfile;
                                const displayName = teacher.displayName || 'معلم';
                                const initial = displayName.charAt(0);
                                const profileLink = teacher.slug
                                    ? `/teachers/${teacher.slug}`
                                    : `/teachers/${teacher.id}`;

                                return (
                                    <Link
                                        key={teacher.id}
                                        href={profileLink}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col items-center p-8"
                                    >
                                        {/* Avatar */}
                                        <div className="w-24 h-24 rounded-full bg-gray-100 mb-5 overflow-hidden border-4 border-white shadow-md">
                                            {teacher.profilePhotoUrl ? (
                                                <img
                                                    src={teacher.profilePhotoUrl}
                                                    alt={displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                                    <span className="text-2xl font-bold text-[#003366]">
                                                        {initial}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <h3 className="font-bold text-xl text-[#003366] mb-2">
                                            {displayName}
                                        </h3>

                                        {/* Subject */}
                                        <div className="mb-4">
                                            <span className="inline-block bg-[#F0F7FF] text-[#003366] font-bold px-4 py-1.5 rounded-full text-sm">
                                                {result.subject.nameAr}
                                            </span>
                                        </div>

                                        {/* Curriculum */}
                                        <div className="flex flex-col items-center gap-2 mb-5 w-full">
                                            <span className="text-xs text-gray-500 font-bold">المنهج</span>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                <span className="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                                                    {result.curriculum.nameAr}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-1.5 mb-5 opacity-90">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="font-bold text-gray-900 text-sm">
                                                {teacher.averageRating.toFixed(1)}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                ({teacher.totalReviews} تقييم)
                                            </span>
                                        </div>

                                        {/* Bio / Experience */}
                                        {teacher.bio && (
                                            <p className="text-gray-500 text-sm font-medium leading-relaxed border-t border-gray-50 pt-4 w-full text-center line-clamp-2">
                                                {teacher.bio}
                                            </p>
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Fill remaining slots with placeholders */}
                            {fillPlaceholders.map((teacher) => (
                                <PlaceholderTeacherCard key={teacher.id} teacher={teacher} />
                            ))}
                        </>
                    )}
                </div>

                <div className="text-center">
                    <Link href="/search">
                        <Button size="lg" className="bg-[#D4A056] hover:bg-[#b88b4a] text-white px-10 py-6 text-lg font-bold rounded-xl transition-all shadow-md hover:shadow-lg">
                            عرض كل المعلمين
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
