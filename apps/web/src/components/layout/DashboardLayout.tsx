'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<'PARENT' | 'TEACHER' | 'ADMIN' | null>(null);
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        // Get user info from localStorage
        const role = localStorage.getItem('userRole') as 'PARENT' | 'TEACHER' | 'ADMIN' | null;
        const name = localStorage.getItem('userName') || '';

        setUserRole(role);
        setUserName(name);
    }, []);

    // Don't show navigation on public pages
    const publicPages = ['/login', '/register', '/'];
    const isPublicPage = publicPages.includes(pathname);

    if (isPublicPage || !userRole) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <Navigation userRole={userRole} userName={userName} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
