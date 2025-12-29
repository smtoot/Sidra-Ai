
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { marketplaceApi, TeacherPublicProfile } from '@/lib/api/marketplace';
import { teacherApi } from '@/lib/api/teacher';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { TeacherProfileView } from '@/components/teacher/public-profile/TeacherProfileView';

interface TeacherProfilePageClientProps {
    slug: string;
}

export default function TeacherProfilePageClient({ slug }: TeacherProfilePageClientProps) {
    const router = useRouter();
    const { user } = useAuth();

    const [teacher, setTeacher] = useState<TeacherPublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);

    // Fetch own profile ID if logged in as teacher to verify ownership
    useEffect(() => {
        if (user?.role === 'TEACHER') {
            teacherApi.getProfile()
                .then(profile => setCurrentTeacherId(profile.id))
                .catch(err => {
                    // Silently fail - this is just for ownership verification
                    console.error('Failed to get own profile', err);
                });
        }
    }, [user]);

    useEffect(() => {
        if (slug) {
            loadTeacher();
        }
    }, [slug]);

    const loadTeacher = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await marketplaceApi.getTeacherProfile(slug);
            setTeacher(data);
        } catch (err: any) {
            console.error('Failed to load teacher:', err);
            setError(err?.response?.data?.message || 'فشل في تحميل الملف الشخصي');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-text-subtle">جاري تحميل الملف الشخصي...</p>
                </div>
            </div>
        );
    }

    if (error || !teacher) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
                <div className="text-center bg-surface p-8 rounded-xl border border-gray-200">
                    <p className="text-error text-lg mb-4">{error || 'المعلم غير موجود'}</p>
                    <Button onClick={() => router.push('/search')}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للبحث
                    </Button>
                </div>
            </div>
        );
    }

    // Helper for ownership check
    const isOwner = (user?.id === teacher?.userId) || (currentTeacherId === teacher?.id);

    return (
        <TeacherProfileView
            teacher={teacher}
            mode="public"
            onBook={() => { }} // Booking handled internally by view for now
        />
    );
}
