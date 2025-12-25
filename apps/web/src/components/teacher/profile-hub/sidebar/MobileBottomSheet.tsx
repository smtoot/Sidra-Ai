'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, ChevronUp, ChevronDown } from 'lucide-react';

interface SidebarItem {
    id: string;
    nameAr: string;
    isComplete: boolean;
    isLocked: boolean;
}

interface MobileBottomSheetProps {
    percentage: number;
    items: SidebarItem[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}

export function MobileBottomSheet({
    percentage,
    items,
    activeSection,
    onSectionClick,
}: MobileBottomSheetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);

    const activeItem = items.find(item => item.id === activeSection);

    // Handle touch drag
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diff = startY - currentY;

        // Drag up = expand, drag down = collapse
        if (diff > 50 && !isExpanded) {
            setIsExpanded(true);
            setIsDragging(false);
        } else if (diff < -50 && isExpanded) {
            setIsExpanded(false);
            setIsDragging(false);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleSectionClick = (id: string) => {
        onSectionClick(id);
        setIsExpanded(false);
    };

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isExpanded) setIsExpanded(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded]);

    return (
        <>
            {/* Overlay when expanded */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsExpanded(false)}
            />

            {/* Bottom Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transform transition-all duration-300 ease-out",
                    isExpanded ? "h-[70vh]" : "h-20"
                )}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Drag Handle */}
                <div
                    className="flex justify-center pt-3 pb-2 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Peek State (Collapsed) */}
                <div
                    className={cn(
                        "flex items-center justify-between px-4 pb-3 transition-opacity",
                        isExpanded ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                    )}
                    onClick={() => setIsExpanded(true)}
                >
                    {/* Mini Progress */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                                <circle
                                    cx="50" cy="50" r="42"
                                    stroke="#10b981"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${percentage * 2.64} 264`}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                {percentage}%
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{activeItem?.nameAr || 'ملفي'}</p>
                            <p className="text-xs text-gray-500">اسحب للأعلى للتنقل</p>
                        </div>
                    </div>
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                </div>

                {/* Expanded Content */}
                <div
                    className={cn(
                        "px-4 pb-6 overflow-y-auto transition-all",
                        isExpanded ? "opacity-100 h-[calc(70vh-60px)]" : "opacity-0 h-0 overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="flex items-center gap-1 text-gray-500"
                        >
                            <ChevronDown className="w-4 h-4" />
                            <span className="text-sm">إغلاق</span>
                        </button>
                        <h2 className="font-bold text-lg">ملفي الشخصي</h2>
                    </div>

                    {/* Progress */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-16 h-16 mb-2">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                                <circle
                                    cx="50" cy="50" r="42"
                                    stroke="url(#progressGradientMobile)"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${percentage * 2.64} 264`}
                                />
                                <defs>
                                    <linearGradient id="progressGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                                {percentage}%
                            </span>
                        </div>
                        <p className="text-sm text-primary font-medium">
                            {percentage === 100 ? '🎉 ملفك مكتمل!' : 'أكمل ملفك، ضاعف فرصك!'}
                        </p>
                    </div>

                    {/* Section List */}
                    <div className="space-y-2">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => !item.isLocked && handleSectionClick(item.id)}
                                disabled={item.isLocked}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl transition-all text-right",
                                    activeSection === item.id
                                        ? "bg-primary/10 border-2 border-primary"
                                        : "bg-gray-50 active:bg-gray-100 border-2 border-transparent",
                                    item.isLocked && "opacity-60"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {item.isLocked ? (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Lock className="w-3 h-3 text-gray-500" />
                                        </div>
                                    ) : item.isComplete ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                    )}
                                    <span className={cn(
                                        "font-medium text-sm",
                                        activeSection === item.id ? "text-primary" : "text-gray-700"
                                    )}>
                                        {item.nameAr}
                                    </span>
                                </div>
                                {activeSection === item.id && (
                                    <span className="text-primary">←</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
