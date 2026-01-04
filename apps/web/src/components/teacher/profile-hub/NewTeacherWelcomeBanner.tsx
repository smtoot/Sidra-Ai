'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Calendar,
    CreditCard,
    CheckCircle,
    X,
    ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NextStep {
    id: string;
    title: string;
    href: string;
    icon: React.ElementType;
    isComplete: boolean;
}

interface NewTeacherWelcomeBannerProps {
    /** Teacher's display name */
    displayName?: string;
    /** Whether availability is set */
    hasAvailability: boolean;
    /** Whether bank info is added */
    hasBankInfo: boolean;
    /** Callback when dismissed */
    onDismiss?: () => void;
}

/**
 * Welcome banner for newly approved teachers.
 * Shows celebration message and next steps to complete their profile.
 * Displayed in Profile Hub after approval.
 */
export function NewTeacherWelcomeBanner({
    displayName = 'معلم/ة',
    hasAvailability,
    hasBankInfo,
    onDismiss,
}: NewTeacherWelcomeBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true); // Show steps by default

    const nextSteps: NextStep[] = [
        {
            id: 'availability',
            title: 'أوقات التدريس',
            href: '/teacher/availability',
            icon: Calendar,
            isComplete: hasAvailability,
        },
        {
            id: 'bank',
            title: 'بيانات الدفع',
            href: '/teacher/wallet',
            icon: CreditCard,
            isComplete: hasBankInfo,
        },
        // Note: Meeting link removed - now handled per-session
    ];

    const completedCount = nextSteps.filter(s => s.isComplete).length;
    const allComplete = completedCount === nextSteps.length;
    const incompleteSteps = nextSteps.filter(s => !s.isComplete);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Main Banner - Compact */}
            <div className="px-4 py-3 flex items-center justify-between gap-4">
                {/* Left: Icon + Message */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                            🎉 مبروك {displayName}!
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                            تم قبول طلبك - أكمل الخطوات المتبقية للبدء
                        </p>
                    </div>
                </div>

                {/* Right: Progress + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Progress Pills */}
                    <div className="hidden sm:flex items-center gap-1">
                        {nextSteps.map((step) => (
                            <div
                                key={step.id}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-colors",
                                    step.isComplete ? "bg-green-500" : "bg-gray-200"
                                )}
                                title={step.title}
                            />
                        ))}
                    </div>

                    {/* Expand/Collapse Button */}
                    {!allComplete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="gap-1 text-primary border-primary/30 hover:bg-primary/5"
                        >
                            <span className="hidden sm:inline">
                                {completedCount}/{nextSteps.length} مكتمل
                            </span>
                            <ChevronLeft className={cn(
                                "w-4 h-4 transition-transform",
                                isExpanded && "rotate-90"
                            )} />
                        </Button>
                    )}

                    {/* Dismiss Button */}
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="إغلاق"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded Steps */}
            {isExpanded && !allComplete && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                    <div className="flex flex-wrap gap-2">
                        {incompleteSteps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <Link
                                    key={step.id}
                                    href={step.href}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all group"
                                >
                                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                                        {step.title}
                                    </span>
                                    <ChevronLeft className="w-3 h-3 text-gray-300 group-hover:text-primary transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* All Complete State */}
            {allComplete && (
                <div className="border-t border-gray-100 px-4 py-2 bg-green-50/50">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>أنت جاهز لاستقبال الحجوزات!</span>
                    </div>
                </div>
            )}
        </div>
    );
}
