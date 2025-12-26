'use client';

import { Gender } from '@sidra/shared';
import { ExperienceFields, GenderSelector, CertificatesSection } from '@/components/teacher/shared';

interface QualificationsSectionProps {
    education: string;
    yearsOfExperience: number;
    gender?: Gender;
    isReadOnly?: boolean;
    onUpdate: (data: {
        education?: string;
        yearsOfExperience?: number;
        gender?: Gender;
    }) => void;
}

/**
 * Qualifications section for Profile Hub.
 * Uses shared ExperienceFields, GenderSelector, and CertificatesSection components
 * for consistency with Onboarding.
 */
export function QualificationsSection({
    education,
    yearsOfExperience,
    gender,
    isReadOnly = false,
    onUpdate,
}: QualificationsSectionProps) {
    return (
        <div className="space-y-6">
            {/* Experience Fields - Using shared component */}
            <ExperienceFields
                yearsOfExperience={yearsOfExperience}
                education={education}
                onChange={(updates) => onUpdate(updates)}
                disabled={isReadOnly}
            />

            {/* Gender - Using shared component */}
            <GenderSelector
                value={gender || null}
                onChange={(g) => onUpdate({ gender: g })}
                disabled={isReadOnly}
            />

            {/* Certificates Section - Same as in Onboarding */}
            <CertificatesSection disabled={isReadOnly} />
        </div>
    );
}
