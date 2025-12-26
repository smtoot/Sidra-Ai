'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    PartyPopper,
    ArrowLeft,
    Calendar,
    CreditCard,
    Settings,
    CheckCircle,
    Circle,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NextStep {
    id: string;
    title: string;
    description: string;
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
    /** Whether meeting link is set */
    hasMeetingLink: boolean;
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
    hasMeetingLink,
    onDismiss,
}: NewTeacherWelcomeBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [showConfetti, setShowConfetti] = useState(true);

    // Hide confetti after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const nextSteps: NextStep[] = [
        {
            id: 'availability',
            title: 'حدد أوقات التدريس',
            description: 'اختر الأيام والأوقات التي تناسبك للتدريس',
            href: '/teacher/availability',
            icon: Calendar,
            isComplete: hasAvailability,
        },
        {
            id: 'bank',
            title: 'أضف بيانات الدفع',
            description: 'لتتمكن من استلام أرباحك',
            href: '/teacher/wallet',
            icon: CreditCard,
            isComplete: hasBankInfo,
        },
        {
            id: 'meeting',
            title: 'أضف رابط الاجتماع',
            description: 'رابط Google Meet أو Zoom للحصص',
            href: '/teacher/profile-hub?section=settings',
            icon: Settings,
            isComplete: hasMeetingLink,
        },
    ];

    const completedCount = nextSteps.filter(s => s.isComplete).length;
    const allComplete = completedCount === nextSteps.length;

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white p-6 md:p-8 shadow-lg">
            {/* Confetti Animation */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="confetti-container">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5],
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <PartyPopper className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">
                            🎉 مبروك {displayName}!
                        </h2>
                        <p className="text-green-100">
                            تم قبول طلبك! أنت الآن معلم/ة معتمد/ة في سِدرة
                        </p>
                    </div>
                </div>
                {allComplete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                        إغلاق
                    </Button>
                )}
            </div>

            {/* Next Steps */}
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span>الخطوات التالية</span>
                    <span className="text-sm font-normal text-green-200">
                        ({completedCount}/{nextSteps.length} مكتمل)
                    </span>
                </h3>

                <div className="space-y-3">
                    {nextSteps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <Link
                                key={step.id}
                                href={step.href}
                                className={cn(
                                    "flex items-center gap-4 p-3 rounded-lg transition-all",
                                    step.isComplete
                                        ? "bg-white/5 opacity-70"
                                        : "bg-white/15 hover:bg-white/20"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    step.isComplete ? "bg-green-400" : "bg-white/20"
                                )}>
                                    {step.isComplete ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={cn(
                                        "font-medium",
                                        step.isComplete && "line-through opacity-70"
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className="text-sm text-green-200">{step.description}</p>
                                </div>
                                {!step.isComplete && (
                                    <ChevronRight className="w-5 h-5 text-green-200" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* CTA */}
            {!allComplete && (
                <div className="mt-6 text-center">
                    <p className="text-green-200 text-sm mb-3">
                        أكمل هذه الخطوات لتبدأ في استقبال الحجوزات
                    </p>
                </div>
            )}

            {/* Confetti CSS */}
            <style jsx>{`
                .confetti-container {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    animation: confetti-fall 3s ease-in-out forwards;
                    opacity: 0;
                }
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-100%) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
