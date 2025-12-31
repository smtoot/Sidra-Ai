'use client';

import { Button } from '@/components/ui/button';
import {
    Undo2,
    Copy,
    Eraser,
    PaintBucket,
    Clock,
    Sun,
    Moon,
    Sunset,
    CalendarOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export type TimePreset = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL';

interface AvailabilityToolbarProps {
    activePreset: TimePreset;
    onPresetChange: (preset: TimePreset) => void;
    canUndo: boolean;
    onUndo: () => void;
    onClearDay: () => void;
    onFillDay: () => void;
    onCopyDay: () => void;
    onPasteDay: () => void;
    hasCopiedDay: boolean;
    onScrollToExceptions?: () => void;
}

export function AvailabilityToolbar({
    activePreset,
    onPresetChange,
    canUndo,
    onUndo,
    onClearDay,
    onFillDay,
    onCopyDay,
    onPasteDay,
    hasCopiedDay,
    onScrollToExceptions,
}: AvailabilityToolbarProps) {
    return (
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 sticky top-4 z-40 shadow-sm">

            {/* Time Presets */}
            <div className="flex items-center gap-2 w-full xl:w-auto">
                <div className="flex items-center bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => onPresetChange('MORNING')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            activePreset === 'MORNING'
                                ? "bg-white text-orange-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                        )}
                    >
                        <Sun className={cn("w-4 h-4", activePreset === 'MORNING' ? "text-orange-500" : "text-gray-400")} />
                        <span>صباح</span>
                    </button>

                    <button
                        onClick={() => onPresetChange('AFTERNOON')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            activePreset === 'AFTERNOON'
                                ? "bg-white text-yellow-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                        )}
                    >
                        <Sun className={cn("w-4 h-4", activePreset === 'AFTERNOON' ? "text-yellow-500" : "text-gray-400")} />
                        <span>بعد الظهر (١٢ - ٥)</span>
                    </button>

                    <button
                        onClick={() => onPresetChange('EVENING')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            activePreset === 'EVENING'
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                        )}
                    >
                        <Moon className={cn("w-4 h-4", activePreset === 'EVENING' ? "text-indigo-500" : "text-gray-400")} />
                        <span>مساء (٥ - ١٢)</span>
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <button
                        onClick={() => onPresetChange('FULL')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            activePreset === 'FULL'
                                ? "bg-white text-purple-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                        )}
                    >
                        <Sunset className={cn("w-4 h-4", activePreset === 'FULL' ? "text-purple-500" : "text-gray-400")} />
                        <span>الكل</span>
                    </button>
                </div>
            </div>

            {/* Editing Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onUndo}
                                disabled={!canUndo}
                                className="h-9 px-3 gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                <span className="hidden sm:inline">تراجع</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>تراجع عن آخر تغيير</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                {/* Fill / Clear */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onFillDay}
                                className="h-9 px-3 gap-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                                <PaintBucket className="w-4 h-4" />
                                <span className="hidden sm:inline">تعبئة اليوم</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>تحويل كل أوقات اليوم الظاهرة إلى "متاح"</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearDay}
                                className="h-9 px-3 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <Eraser className="w-4 h-4" />
                                <span className="hidden sm:inline">تفريغ اليوم</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>مسح جميع الأوقات الظاهرة لليوم المحدد</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                {/* Copy / Paste */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCopyDay}
                                className="h-9 px-3 gap-2 text-gray-600"
                            >
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">نسخ</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>نسخ جدول اليوم المحدد</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onPasteDay}
                                disabled={!hasCopiedDay}
                                className="h-9 px-3 gap-2 text-gray-600"
                            >
                                <Copy className="w-4 h-4 rotate-180" />
                                <span className="hidden sm:inline">لصق</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>تطبيق النسخ على اليوم المحدد</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {onScrollToExceptions && (
                    <>
                        <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onScrollToExceptions}
                                        className="h-9 px-3 gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    >
                                        <CalendarOff className="w-4 h-4" />
                                        <span className="hidden sm:inline">استثناءات</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>الانتقال إلى إدارة الاستثناءات والإجازات</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </>
                )}
            </div>
        </div>
    );
}
