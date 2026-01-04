'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BioFieldProps {
    /** Current bio text */
    value: string;
    /** Callback when bio changes */
    onChange: (value: string) => void;
    /** Disable interactions */
    disabled?: boolean;
    /** Minimum character count (for validation indicator) */
    minLength?: number;
    /** Use word count instead of character count */
    useWordCount?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Number of rows */
    rows?: number;
}

/**
 * Shared bio/description field with character/word counter and validation indicator.
 * Used by both Onboarding and Profile Hub.
 */
export function BioField({
    value,
    onChange,
    disabled = false,
    minLength = 50,
    useWordCount = false,
    placeholder = 'اكتب نبذة تعريفية عن نفسك وشغفك بالتعليم...',
    rows = 5,
}: BioFieldProps) {
    const count = useWordCount
        ? value?.trim().split(/\s+/).filter(Boolean).length || 0
        : value?.length || 0;

    const isValid = count >= minLength;
    const label = useWordCount ? 'كلمة' : 'حرف';

    return (
        <div className="space-y-2">
            <Label className="text-base font-medium">عن نفسك (سيظهر للطلاب وأولياء الأمور)</Label>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="resize-none text-base"
                disabled={disabled}
            />
            <div className="flex justify-between text-sm">
                <p className="text-amber-600 flex items-center gap-1">
                    💡 تحدث عن نفسك وشغفك بالتعليم، واجعل الطلاب وأولياء الأمور يتشوقون للدراسة معك
                </p>
                <span className={cn(
                    "font-medium",
                    isValid ? 'text-green-600' : 'text-text-subtle'
                )}>
                    {count} / {minLength} {label} (الحد الأدنى)
                </span>
            </div>
        </div>
    );
}
