'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, X, Menu } from 'lucide-react';

interface SidebarItem {
    id: string;
    nameAr: string;
    isComplete: boolean;
    isLocked: boolean;
}

interface TabletSlideDrawerProps {
    percentage: number;
    items: SidebarItem[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}

export function TabletSlideDrawer({
    percentage,
    items,
    activeSection,
    onSectionClick,
}: TabletSlideDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close drawer when clicking outside
    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setIsOpen(false);
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    const handleSectionClick = (id: string) => {
        onSectionClick(id);
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-24 right-4 z-40 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
                aria-label="فتح القائمة"
            >
                <Menu className="w-5 h-5" />
                {/* Progress badge */}
                <span className="absolute -top-1 -left-1 w-6 h-6 bg-green-500 rounded-full text-xs font-bold flex items-center justify-center">
                    {percentage}
                </span>
            </button>

            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Slide Drawer (from right for RTL) */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                    <h2 className="font-bold text-lg">ملفي الشخصي</h2>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-64px)]">
                    {/* Progress Indicator */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="#e5e7eb"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="url(#progressGradientTablet)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${percentage * 2.64} 264`}
                                    className="transition-all duration-500 ease-out"
                                />
                                <defs>
                                    <linearGradient id="progressGradientTablet" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">{percentage}%</span>
                            </div>
                        </div>
                        <p className="font-bold text-primary text-sm">
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
                                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent",
                                    item.isLocked && "opacity-60 cursor-not-allowed"
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

                    {/* Locked Items Tooltip */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                        <Lock className="w-3 h-3 inline ml-1" />
                        العناصر المقفلة ستفتح بعد موافقة الإدارة
                    </div>
                </div>
            </div>
        </>
    );
}
