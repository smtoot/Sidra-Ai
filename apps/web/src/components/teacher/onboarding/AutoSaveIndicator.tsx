'use client';

import { useOnboarding } from './OnboardingContext';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Auto-save status indicator with timestamp and success feedback
 * Shows visual feedback when changes are being saved automatically
 */
export function AutoSaveIndicator() {
    const { autoSaving, saving } = useOnboarding();
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const previousAutoSaving = useRef(autoSaving);

    // Track when auto-save completes successfully
    useEffect(() => {
        // Auto-save just finished
        if (previousAutoSaving.current && !autoSaving && !saving) {
            setLastSavedTime(new Date());
            setShowSuccess(true);

            // Hide success checkmark after 2 seconds
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);

            return () => clearTimeout(timer);
        }

        previousAutoSaving.current = autoSaving;
    }, [autoSaving, saving]);

    // Format time ago (e.g., "منذ 5 ثوانٍ")
    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 10) return 'الآن';
        if (seconds < 60) return `منذ ${seconds} ثانية`;

        const minutes = Math.floor(seconds / 60);
        if (minutes === 1) return 'منذ دقيقة';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return 'منذ ساعة';
        return `منذ ${hours} ساعة`;
    };

    // Don't show when manually saving
    if (saving) {
        return null;
    }

    // Auto-save in progress
    if (autoSaving) {
        return (
            <div className={cn(
                "flex items-center gap-2 text-xs",
                "text-blue-600"
            )}>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>جاري الحفظ...</span>
            </div>
        );
    }

    // Success state (shows for 2 seconds after save)
    if (showSuccess && lastSavedTime) {
        return (
            <div className={cn(
                "flex items-center gap-2 text-xs",
                "text-green-600 transition-opacity duration-300"
            )}>
                <Check className="w-3.5 h-3.5" />
                <span>تم الحفظ</span>
            </div>
        );
    }

    // Saved state with timestamp
    if (lastSavedTime) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Check className="w-3 h-3" />
                <span>حُفظ {getTimeAgo(lastSavedTime)}</span>
            </div>
        );
    }

    // Default state (no saves yet)
    return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
            <Check className="w-3 h-3" />
            <span>الحفظ التلقائي مُفعّل</span>
        </div>
    );
}
