'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface NameFieldsProps {
    /** Display name (visible to students) */
    displayName: string;
    /** Full legal name (for verification) */
    fullName: string;
    /** Callback when values change */
    onChange: (data: { displayName?: string; fullName?: string }) => void;
    /** Disable interactions */
    disabled?: boolean;
    /** Show only display name (hide full name) */
    displayNameOnly?: boolean;
}

/**
 * Shared name fields component used by Onboarding and Profile Hub.
 * Handles both display name (public) and full name (private).
 */
export function NameFields({
    displayName,
    fullName,
    onChange,
    disabled = false,
    displayNameOnly = false,
}: NameFieldsProps) {
    return (
        <div className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
                <Label className="text-base font-medium">الاسم الظاهر للطلاب</Label>
                <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        value={displayName}
                        onChange={(e) => onChange({ displayName: e.target.value })}
                        placeholder="مثال: أ. محمد أحمد"
                        className="pr-10 h-12 text-base"
                        disabled={disabled}
                    />
                </div>
                <p className="text-xs text-text-subtle">هذا الاسم سيظهر للطلاب وأولياء الأمور</p>
            </div>

            {/* Full Name (Optional) */}
            {!displayNameOnly && (
                <div className="space-y-2">
                    <Label className="text-base font-medium">الاسم الكامل (الاسم القانوني)</Label>
                    <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            value={fullName}
                            onChange={(e) => onChange({ fullName: e.target.value })}
                            placeholder="الاسم الثلاثي أو الرباعي كما في الهوية"
                            className="pr-10 h-12 text-base"
                            disabled={disabled}
                        />
                    </div>
                    <p className="text-xs text-text-subtle">هذا الاسم لأغراض إدارية ولن يظهر للطلاب</p>
                </div>
            )}
        </div>
    );
}
