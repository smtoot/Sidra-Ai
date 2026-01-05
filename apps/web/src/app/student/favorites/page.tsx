'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getFileUrl } from '@/lib/api/upload';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SavedTeacher {
    id: string; // SavedTeacherID
    teacher: any; // We'll infer type from API response
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<SavedTeacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const response = await api.get('/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.error('Failed to load favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfavorite = (teacherId: string) => {
        setFavorites(prev => prev.filter(f => f.teacher.id !== teacherId));
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center" dir="rtl">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                    <Link href="/student">
                        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
                            <Heart className="h-6 w-6 md:h-8 md:w-8 text-red-500 fill-red-500" />
                            المعلمين المفضلين
                        </h1>
                        <p className="text-muted-foreground mt-0.5 md:mt-1 text-sm md:text-base">
                            وصول سريع للمعلمين الذين تفضلهم
                        </p>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-12 md:py-16 bg-white rounded-xl md:rounded-2xl border border-dashed shadow-sm">
                        <Heart className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">لا يوجد معلمين محفوظين بعد</h3>
                        <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base px-4">
                            تصفح المعلمين وانقر على أيقونة القلب لحفظهم هنا
                        </p>
                        <Link href="/search">
                            <Button size="default">تصفح المعلمين</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {favorites.filter(fav => fav && fav.teacher).map((fav) => (
                            <div key={fav.id} className="relative group">
                                <div className="border rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
                                    <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                                        <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                {fav.teacher.profilePhotoUrl ? (
                                                    <img src={getFileUrl(fav.teacher.profilePhotoUrl)} alt={fav.teacher.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg md:text-xl">
                                                        {fav.teacher.displayName?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-sm md:text-base truncate">{fav.teacher.displayName}</h4>
                                                <p className="text-xs md:text-sm text-muted-foreground truncate">
                                                    {fav.teacher.subjects?.map((s: any) => s.subject.nameAr || s.subject.nameEn).join('، ')}
                                                </p>
                                            </div>
                                        </div>
                                        <Link href={`/teachers/${fav.teacher.slug || fav.teacher.id}`} className="flex-shrink-0">
                                            <Button size="sm" variant="outline" className="text-xs md:text-sm h-8 md:h-9 px-2.5 md:px-3">عرض الملف</Button>
                                        </Link>
                                    </div>
                                    {/* Unfavorite Action */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5 md:gap-2 h-8 md:h-9 text-xs md:text-sm"
                                        onClick={async () => {
                                            await api.post(`/favorites/${fav.teacher.id}`);
                                            handleUnfavorite(fav.teacher.id);
                                        }}
                                    >
                                        <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                                        إزالة من المفضلة
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
