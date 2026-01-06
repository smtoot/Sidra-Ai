'use client';

import { SkillsManager } from '@/components/teacher/shared/SkillsManager';
import { WorkExperienceManager } from '@/components/teacher/shared/WorkExperienceManager';

interface SkillsExperienceSectionProps {
    isReadOnly?: boolean;
}

/**
 * Skills & Work Experience Section for Profile Hub.
 *
 * IMPORTANT:
 * - This section is OPTIONAL and does NOT affect profile completion percentage
 * - Skills and Work Experiences are managed independently via their own CRUD APIs
 * - Both managers handle their own loading, saving, and error states
 */
export function SkillsExperienceSection({
    isReadOnly = false,
}: SkillsExperienceSectionProps) {
    return (
        <div className="space-y-8 w-full overflow-hidden">
            {/* Skills Manager */}
            <SkillsManager disabled={isReadOnly} />

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Work Experience Manager */}
            <WorkExperienceManager disabled={isReadOnly} />
        </div>
    );
}
