'use client';

import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';

interface SidebarItem {
    id: string;
    nameAr: string;
    isComplete: boolean;
    isLocked: boolean;
}

interface ProfileHubSidebarProps {
    percentage: number;
    items: SidebarItem[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}

export function ProfileHubSidebar({
    percentage,
    items,
    activeSection,
    onSectionClick,
}: ProfileHubSidebarProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
            {/* Circular Progress Indicator */}
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="url(#progressGradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${percentage * 2.64} 264`}
                            className="transition-all duration-500 ease-out"
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-primary text-sm">
                        {percentage === 100 ? '🎉 ملفك مكتمل!' : 'أكمل ملفك، ضاعف فرصك!'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {percentage === 100 ? 'أنت جاهز للتدريس' : 'اكتمال الملف الشخصي'}
                    </p>
                </div>
            </div>

            {/* Section List */}
            <div className="space-y-2">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => !item.isLocked && onSectionClick(item.id)}
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

            {/* Locked Items Tooltip - Only show if there are locked items */}
            {items.some(item => item.isLocked) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                    <Lock className="w-3 h-3 inline ml-1" />
                    العناصر المقفلة ستفتح بعد موافقة الإدارة
                </div>
            )}
        </div>
    );
}
