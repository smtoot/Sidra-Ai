'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';
import { useAuth } from '@/context/AuthContext';
import { PublicNavbar, Footer } from '@/components/public';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();

    // 1. Auth Pages: No Navigation, No Footer
    const authPages = ['/login', '/register'];
    const isAuthPage = authPages.includes(pathname);

    if (isLoading) return <>{children}</>;

    if (isAuthPage) {
        return <>{children}</>;
    }

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

    // 2. Dashboard Pages: Sidebar Navigation
    // We determine this based on the path prefix AND if the user has a role (is logged in)
    // Common public paths that shouldn't show dashboard nav even if logged in:
    const isDashboardRoute =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/teacher') ||
        pathname.startsWith('/student') ||
        pathname.startsWith('/parent') ||
        pathname.startsWith('/support');

    // Exception: /teachers is likely public profile listing, not the /teacher dashboard
    // But currently /teacher is the dashboard route.
    // If we have a route like /teachers/[id], it starts with /teachers != /teacher.
    // Need to be careful with prefixes. 
    // /teacher (singular) is dashboard. /teachers (plural) is usually public listing.
    // Let's stick to the exact prefixes used for dashboards.

    if (userRole && isDashboardRoute) {
        return (
            <div className="flex min-h-screen">
                <Navigation userRole={userRole} userName={userName} />
                {/* pt-16 adds padding for the fixed mobile header, md:pt-0 removes it on desktop */}
                <main className="flex-1 bg-gray-50/50 pt-16 md:pt-0">
                    {children}
                </main>
            </div>
        );
    }

    // 3. Public Pages (Home, About, Contact, etc.): PublicNavbar + Footer
    // This applies to:
    // - "/" (Home)
    // - "/about", "/contact", "/faq", "/how-it-works/*"
    // . "/search", "/teachers/*" (if they exist)
    // - Any logged-in user visiting a public page
    return (
        <div className="min-h-screen bg-white font-tajawal rtl flex flex-col">
            <PublicNavbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
