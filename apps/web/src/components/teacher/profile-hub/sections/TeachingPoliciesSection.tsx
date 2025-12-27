'use client';

import { DemoSettings } from '@/components/teacher/settings/DemoSettings';
import { PackageSettings } from '@/components/teacher/settings/PackageSettings';
import { TimezoneSettings } from '@/components/teacher/settings/TimezoneSettings';
import { CancellationPolicySettings } from '@/components/teacher/settings/CancellationPolicySettings';

interface TeachingPoliciesSectionProps {
    isReadOnly?: boolean;
}

export function TeachingPoliciesSection({ isReadOnly = false }: TeachingPoliciesSectionProps) {
    return (
        <div className="space-y-6">
            <DemoSettings isReadOnly={isReadOnly} />
            <PackageSettings isReadOnly={isReadOnly} />
            <TimezoneSettings isReadOnly={isReadOnly} />
            <CancellationPolicySettings isReadOnly={isReadOnly} />
        </div>
    );
}
