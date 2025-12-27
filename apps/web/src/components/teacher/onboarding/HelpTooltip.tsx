'use client';

import { HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

/**
 * Contextual help tooltip component for onboarding
 * Shows helpful tips when users hover or click on the help icon
 */
export function HelpTooltip({ content, position = 'top', className }: HelpTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Close tooltip when clicking outside
    useEffect(() => {
        if (!isVisible) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isVisible]);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
    };

    return (
        <div className={cn("relative inline-block", className)} ref={tooltipRef}>
            {/* Help Icon */}
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors"
                aria-label="مساعدة"
            >
                <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Tooltip */}
            {isVisible && (
                <div
                    className={cn(
                        "absolute z-50 w-64 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg",
                        positionClasses[position]
                    )}
                    style={{ direction: 'rtl' }}
                >
                    {content}

                    {/* Arrow */}
                    <div
                        className={cn(
                            "absolute w-0 h-0 border-4",
                            arrowClasses[position]
                        )}
                    />
                </div>
            )}
        </div>
    );
}
