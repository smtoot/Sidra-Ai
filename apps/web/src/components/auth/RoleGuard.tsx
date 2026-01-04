'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only run check when loading is complete
        if (!isLoading) {
            if (!user) {
                // If not logged in, redirect to login with return URL
                // We use window.location.pathname safe check because we are client-side
                const returnUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '';
                router.push(returnUrl ? `/login?returnUrl=${returnUrl}` : '/login');
            } else if (!allowedRoles.includes(user.role)) {
                // If logged in but wrong role, redirect to appropriate dashboard
                console.warn(`[RoleGuard] Access denied for role ${user.role}. Redirecting...`);

                if (user.role === 'PARENT') {
                    router.push('/parent');
                } else if (user.role === 'TEACHER') {
                    router.push('/teacher');
                } else if (user.role === 'STUDENT') {
                    router.push('/student');
                } else if (['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'].includes(user.role)) {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            }
        }
    }, [user, isLoading, allowedRoles, router]);

    // Show loader while checking auth state
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500 font-medium">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    // Don't render content if not authorized
    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
