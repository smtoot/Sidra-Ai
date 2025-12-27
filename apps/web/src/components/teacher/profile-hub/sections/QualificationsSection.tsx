'use client';

import { Gender } from '@sidra/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GenderSelector, QualificationsManager } from '@/components/teacher/shared';
import { Clock } from 'lucide-react';

interface QualificationsSectionProps {
    yearsOfExperience: number;
    gender?: Gender;
    isReadOnly?: boolean;
    onUpdate: (data: {
        yearsOfExperience?: number;
        gender?: Gender;
    }) => void;
}

/**
 * Qualifications section for Profile Hub.
 *
 * IMPORTANT CHANGES:
 * - REMOVED education field (replaced with QualificationsManager)
 * - QualificationsManager is now the SINGLE SOURCE OF TRUTH for academic qualifications
 * - Years of experience and gender remain as separate fields
 * - Uses shared components for consistency with Onboarding
 */
export function QualificationsSection({
    yearsOfExperience,
    gender,
    isReadOnly = false,
    onUpdate,
}: QualificationsSectionProps) {
    return (
        <div className="space-y-6">
            {/* Years of Experience - Standalone field */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    سنوات الخبرة في التدريس
                </Label>
                <div className="flex items-center gap-3">
                    <Input
                        type="number"
                        min={0}
                        max={50}
                        value={yearsOfExperience}
                        onChange={(e) => onUpdate({ yearsOfExperience: Number(e.target.value) })}
                        className="w-24 h-12 text-center text-lg font-bold"
                        disabled={isReadOnly}
                    />
                    <span className="text-text-subtle">سنة</span>
                </div>
            </div>

            {/* Gender - Using shared component */}
            <GenderSelector
                value={gender || null}
                onChange={(g) => onUpdate({ gender: g })}
                disabled={isReadOnly}
            />

            {/* CRITICAL: Academic Qualifications - SINGLE SOURCE OF TRUTH */}
            <div className="border-t pt-6">
                <QualificationsManager
                    disabled={isReadOnly}
                    required={true}
                />
            </div>
        </div>
    );
}
