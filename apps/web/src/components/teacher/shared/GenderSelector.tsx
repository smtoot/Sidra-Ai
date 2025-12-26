'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Gender } from '@sidra/shared';

interface GenderSelectorProps {
    /** Current gender value */
    value: Gender | null;
    /** Callback when gender changes */
    onChange: (gender: Gender) => void;
    /** Disable interactions */
    disabled?: boolean;
}

/**
 * Shared gender selector with radio button cards.
 * Used by both Onboarding and Profile Hub.
 */
export function GenderSelector({
    value,
    onChange,
    disabled = false,
}: GenderSelectorProps) {
    return (
        <div className="space-y-3">
            <Label className="text-base font-medium">الجنس</Label>
            <div className="flex gap-4">
                <label
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                        value === Gender.MALE
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 hover:border-gray-300",
                        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                    )}
                >
                    <input
                        type="radio"
                        name="gender"
                        value={Gender.MALE}
                        checked={value === Gender.MALE}
                        onChange={() => onChange(Gender.MALE)}
                        className="sr-only"
                        disabled={disabled}
                    />
                    <span className="font-medium">ذكر</span>
                </label>
                <label
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                        value === Gender.FEMALE
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 hover:border-gray-300",
                        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                    )}
                >
                    <input
                        type="radio"
                        name="gender"
                        value={Gender.FEMALE}
                        checked={value === Gender.FEMALE}
                        onChange={() => onChange(Gender.FEMALE)}
                        className="sr-only"
                        disabled={disabled}
                    />
                    <span className="font-medium">أنثى</span>
                </label>
            </div>
        </div>
    );
}
