'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['PARENT']}>
            {children}
        </RoleGuard>
    );
}
