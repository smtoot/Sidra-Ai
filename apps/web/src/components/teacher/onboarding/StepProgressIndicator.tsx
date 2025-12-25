'use client';

import { cn } from '@/lib/utils';
import { Check, Camera, Briefcase, BookOpen, FileText, CheckCircle } from 'lucide-react';

interface Step {
    id: number;
    label: string;
    icon: React.ElementType;
}

const STEPS: Step[] = [
    { id: 1, label: 'الصورة', icon: Camera },
    { id: 2, label: 'الخبرة', icon: Briefcase },
    { id: 3, label: 'المواد', icon: BookOpen },
    { id: 4, label: 'الوثائق', icon: FileText },
    { id: 5, label: 'المراجعة', icon: CheckCircle },
];

interface StepProgressIndicatorProps {
    currentStep: number;
    className?: string;
}

export function StepProgressIndicator({ currentStep, className }: StepProgressIndicatorProps) {
    return (
        <div className={cn("w-full py-4", className)} dir="rtl">
            <div className="flex items-center justify-center gap-0 max-w-2xl mx-auto px-4">
                {STEPS.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    const isUpcoming = currentStep < step.id;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isCompleted && "bg-green-500 text-white",
                                        isCurrent && "bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20",
                                        isUpcoming && "bg-gray-200 text-gray-400"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "mt-2 text-xs font-medium transition-colors",
                                        isCompleted && "text-green-600",
                                        isCurrent && "text-primary font-bold",
                                        isUpcoming && "text-gray-400"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line (not for last item) */}
                            {index < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-1 mx-2 rounded-full transition-colors",
                                        currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
