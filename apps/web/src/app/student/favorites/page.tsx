
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TeacherCard } from '@/components/teacher/TeacherCard'; // Assuming this exists or similar
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
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/student/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                        My Saved Teachers
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Quick access to teachers you're interested in
                    </p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No saved teachers yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Browse teachers and click the heart icon to save them here.
                    </p>
                    <Link href="/teachers">
                        <Button>Browse Teachers</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav) => (
                        <div key={fav.id} className="relative group">
                            {/* We use the FavoriteButton inside specific context or overlay it here */}
                            {/* Assuming TeacherCard takes teacher data. We construct a partial teacher object */}
                            {/* Since TeacherCard might handle layout, we wrap it or verify its props */}
                            <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                                            {fav.teacher.profilePhotoUrl ? (
                                                <img src={fav.teacher.profilePhotoUrl} alt={fav.teacher.displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                                    {fav.teacher.displayName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{fav.teacher.displayName}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {fav.teacher.subjects?.map((s: any) => s.subject.nameEn).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link href={`/teachers/${fav.teacher.slug || fav.teacher.id}`}>
                                        <Button size="sm" variant="outline">View Profile</Button>
                                    </Link>
                                </div>
                                {/* Unfavorite Action */}
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                                    onClick={async () => {
                                        await api.post(`/favorites/${fav.teacher.id}`);
                                        handleUnfavorite(fav.teacher.id);
                                    }}
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                    Remove from Favorites
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
