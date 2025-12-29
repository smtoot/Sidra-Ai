'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingStep } from './types';

interface ProgressIndicatorProps {
    steps: BookingStep[];
    currentStep: number;
    completedSteps: number[];
    variant?: 'desktop' | 'mobile';
}

export function ProgressIndicator({
    steps,
    currentStep,
    completedSteps,
    variant = 'desktop'
}: ProgressIndicatorProps) {
    if (variant === 'mobile') {
        return (
            <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                    الخطوة {currentStep + 1} من {steps.length}
                </p>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {steps[currentStep].label}
                </h3>
                <div className="flex gap-1 justify-center">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                'h-1 flex-1 rounded-full transition-colors',
                                idx <= currentStep ? 'bg-primary' : 'bg-gray-200'
                            )}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Desktop variant - horizontal stepper
    return (
        <div className="flex items-center justify-between mb-6">
            {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1">
                    <div
                        className={cn(
                            'flex items-center gap-2 transition-colors',
                            completedSteps.includes(idx) && 'text-green-600',
                            idx === currentStep && 'text-primary',
                            idx > currentStep && !completedSteps.includes(idx) && 'text-gray-400'
                        )}
                    >
                        <div
                            className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                                completedSteps.includes(idx) && 'bg-green-600 text-white',
                                idx === currentStep && 'bg-primary text-white ring-4 ring-primary/20',
                                idx > currentStep && !completedSteps.includes(idx) && 'bg-gray-200 text-gray-400'
                            )}
                        >
                            {completedSteps.includes(idx) ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <span className="text-sm font-medium">{idx + 1}</span>
                            )}
                        </div>
                        <span className="text-sm font-medium hidden md:inline">
                            {step.shortLabel}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div
                            className={cn(
                                'h-0.5 flex-1 mx-2 transition-colors',
                                completedSteps.includes(idx) ? 'bg-green-600' : 'bg-gray-200'
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
