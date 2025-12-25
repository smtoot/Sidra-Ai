'use client';

import { useAuth } from '@/context/AuthContext';
import { ActionStrip } from '@/components/admin/dashboard/ActionStrip';
import { OperationalSnapshot } from '@/components/admin/dashboard/OperationalSnapshot';
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed';

export default function AdminDashboardPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Page Header */}
                <header className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
                    <p className="text-sm text-gray-500">
                        مرحباً، {user?.displayName || 'المسؤول'} - نظرة شاملة على العمليات
                    </p>
                </header>

                {/* SECTION 1: URGENT ACTION STRIP */}
                <ActionStrip />

                {/* SECTION 2 & 3: Two-column layout for better space usage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Operational Snapshot */}
                    <OperationalSnapshot />

                    {/* Activity Feed */}
                    <ActivityFeed />
                </div>

            </div>
        </div>
    );
}
