'use client';

import { useRouter } from 'next/navigation';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { MyPackages } from '@/components/packages/MyPackages';

export default function StudentPackagesPage() {
    const router = useRouter();
    const { packagesEnabled, isLoading: configLoading } = useSystemConfig();

    useEffect(() => {
        if (!configLoading && !packagesEnabled) {
            router.replace('/student');
        }
    }, [configLoading, packagesEnabled, router]);

    if (configLoading || (!packagesEnabled && !configLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <MyPackages userRole="STUDENT" />
            </div>
        </div>
    );
}
