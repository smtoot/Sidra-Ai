'use client';

import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
    id: string;
    title: string;
    isLocked?: boolean;
    isSaving?: boolean;
    onSave?: () => void;
    children: ReactNode;
}

export function ProfileSection({
    id,
    title,
    isLocked = false,
    isSaving = false,
    onSave,
    children,
}: ProfileSectionProps) {
    return (
        <div
            id={id}
            className={cn(
                "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
                isLocked && "relative"
            )}
        >
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                    {isLocked && <Lock className="w-4 h-4 text-yellow-500" />}
                    {title}
                </h2>
                {onSave && !isLocked && (
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        size="sm"
                        className="gap-2"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {isLocked ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">هذا القسم مقفل</h3>
                            <p className="text-sm text-gray-500">
                                سيتم فتح هذا القسم بعد موافقة الإدارة على ملفك الشخصي
                            </p>
                        </div>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
