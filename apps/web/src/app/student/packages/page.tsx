'use client';

import { MyPackages } from '@/components/packages/MyPackages';

export default function StudentPackagesPage() {
    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <MyPackages userRole="STUDENT" />
            </div>
        </div>
    );
}
