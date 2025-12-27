'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Lock, Check, Loader2 } from 'lucide-react';
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
    const [showSaved, setShowSaved] = useState(false);
    const [wasSaving, setWasSaving] = useState(false);

    // Track when saving transitions from true to false (save completed)
    useEffect(() => {
        if (wasSaving && !isSaving) {
            // Save just completed
            setShowSaved(true);
            const timer = setTimeout(() => {
                setShowSaved(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
        setWasSaving(isSaving);
    }, [isSaving, wasSaving]);

    const getButtonContent = () => {
        if (isSaving) {
            return (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                </>
            );
        }
        if (showSaved) {
            return (
                <>
                    <Check className="w-4 h-4" />
                    تم الحفظ
                </>
            );
        }
        return 'حفظ التغييرات';
    };

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
                        disabled={isSaving || showSaved}
                        size="sm"
                        className={cn(
                            "gap-2 transition-all duration-200",
                            showSaved && "bg-green-500 hover:bg-green-500"
                        )}
                    >
                        {getButtonContent()}
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

