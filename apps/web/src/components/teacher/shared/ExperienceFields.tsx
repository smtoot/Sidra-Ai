'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, GraduationCap } from 'lucide-react';

interface ExperienceFieldsProps {
    /** Years of teaching experience */
    yearsOfExperience: number;
    /** Education/qualification string */
    education: string;
    /** Callback when values change */
    onChange: (data: { yearsOfExperience?: number; education?: string }) => void;
    /** Disable interactions */
    disabled?: boolean;
}

/**
 * Shared experience fields component for years of experience and education.
 * Used by both Onboarding and Profile Hub.
 */
export function ExperienceFields({
    yearsOfExperience,
    education,
    onChange,
    disabled = false,
}: ExperienceFieldsProps) {
    return (
        <div className="space-y-6">
            {/* Years of Experience */}
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
                        onChange={(e) => onChange({ yearsOfExperience: Number(e.target.value) })}
                        className="w-24 h-12 text-center text-lg font-bold"
                        disabled={disabled}
                    />
                    <span className="text-text-subtle">سنة</span>
                </div>
            </div>

            {/* Education */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    المؤهل العلمي
                </Label>
                <Input
                    value={education}
                    onChange={(e) => onChange({ education: e.target.value })}
                    placeholder="مثال: بكالوريوس تربية - جامعة الخرطوم"
                    className="h-12"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
