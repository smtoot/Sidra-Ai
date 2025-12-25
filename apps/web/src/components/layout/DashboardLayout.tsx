'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';
import { useAuth } from '@/context/AuthContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();

    // Don't show navigation on specific public pages
    // For '/', show only if NOT logged in
    const hideNavPages = ['/login', '/register'];
    const isPublicPage = hideNavPages.includes(pathname);
    const isHome = pathname === '/';

    if (isLoading) return <>{children}</>;

    const userRole = user?.role as 'PARENT' | 'TEACHER' | 'ADMIN' | 'STUDENT' | undefined;

    // Get display name with proper Arabic fallbacks based on role
    const getRoleFallback = (role: string | undefined) => {
        switch (role) {
            case 'PARENT': return 'ولي الأمر';
            case 'STUDENT': return 'الطالب';
            case 'TEACHER': return 'المعلم';
            case 'ADMIN': return 'المسؤول';
            default: return 'مستخدم';
        }
    };
    const userName = (user as any)?.displayName || (user as any)?.firstName || getRoleFallback(user?.role);

    // Check if we should render navigation
    if (isPublicPage || (isHome && !userRole) || !userRole) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <Navigation userRole={userRole} userName={userName} />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
