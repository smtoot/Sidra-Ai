'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, ChevronLeft, ChevronRight, User, GraduationCap, BookOpen, Clock, FileCheck, Wallet, Settings } from 'lucide-react';

interface SidebarItem {
    id: string;
    nameAr: string;
    isComplete: boolean;
    isLocked: boolean;
}

interface DesktopSidebarProps {
    percentage: number;
    items: SidebarItem[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}

// Icon mapping for each section
const sectionIcons: Record<string, any> = {
    'profile': User,
    'personal-info': User,  // Personal info section
    'qualifications': GraduationCap,
    'subjects': BookOpen,
    'documents': FileCheck,
    'availability': Clock,
    'bank': Wallet,
    'settings': Settings,
};

export function DesktopSidebar({
    percentage,
    items,
    activeSection,
    onSectionClick,
}: DesktopSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div
            className={cn(
                "bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 transition-all duration-300 overflow-hidden",
                isCollapsed ? "w-[72px] p-2" : "w-72 p-6"
            )}
        >
            {/* Progress Indicator */}
            <div className={cn(
                "flex flex-col items-center text-center transition-all",
                isCollapsed ? "space-y-1 pt-2" : "space-y-2 pt-8"
            )}>
                <div className={cn(
                    "relative transition-all duration-300",
                    isCollapsed ? "w-14 h-14" : "w-24 h-24"
                )}>
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#e5e7eb"
                            strokeWidth={isCollapsed ? 10 : 8}
                            fill="none"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="url(#progressGradientDesktop)"
                            strokeWidth={isCollapsed ? 10 : 8}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${percentage * 2.64} 264`}
                            className="transition-all duration-500 ease-out"
                        />
                        <defs>
                            <linearGradient id="progressGradientDesktop" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn(
                            "font-bold text-gray-900 whitespace-nowrap",
                            isCollapsed ? "text-[11px]" : "text-2xl"
                        )}>
                            {percentage}%
                        </span>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-1">
                        <p className="font-bold text-primary text-sm">
                            {percentage === 100 ? '🎉 ملفك مكتمل!' : 'أكمل ملفك، ضاعف فرصك!'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {percentage === 100 ? 'أنت جاهز للتدريس' : 'اكتمال الملف الشخصي'}
                        </p>
                    </div>
                )}
            </div>

            {/* Collapse Toggle Button - Below progress */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "w-full flex items-center justify-center py-2 my-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors",
                    isCollapsed ? "mt-1" : "mt-3"
                )}
                aria-label={isCollapsed ? 'توسيع' : 'طي'}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <ChevronLeft className="w-4 h-4" />
                        <span>طي القائمة</span>
                    </div>
                )}
            </button>

            {/* Section List */}
            <div className="space-y-2">
                {items.map((item) => {
                    const Icon = sectionIcons[item.id] || User;

                    return (
                        <button
                            key={item.id}
                            onClick={() => !item.isLocked && onSectionClick(item.id)}
                            disabled={item.isLocked}
                            title={isCollapsed ? item.nameAr : undefined}
                            className={cn(
                                "w-full flex items-center gap-3 rounded-xl transition-all text-right",
                                isCollapsed ? "p-2 justify-center" : "p-3",
                                activeSection === item.id
                                    ? "bg-primary/10 border-2 border-primary"
                                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent",
                                item.isLocked && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {/* Status Indicator or Icon */}
                            {isCollapsed ? (
                                <div className="relative">
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        activeSection === item.id ? "text-primary" : "text-gray-500"
                                    )} />
                                    {item.isComplete && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check className="w-2 h-2 text-white" />
                                        </div>
                                    )}
                                    {item.isLocked && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded-full flex items-center justify-center">
                                            <Lock className="w-2 h-2 text-white" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
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
                                        "font-medium text-sm flex-1",
                                        activeSection === item.id ? "text-primary" : "text-gray-700"
                                    )}>
                                        {item.nameAr}
                                    </span>
                                    {activeSection === item.id && (
                                        <span className="text-primary">←</span>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Locked Items Tooltip - Only show when expanded */}
            {!isCollapsed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700 mt-4">
                    <Lock className="w-3 h-3 inline ml-1" />
                    العناصر المقفلة ستفتح بعد موافقة الإدارة
                </div>
            )}
        </div>
    );
}
