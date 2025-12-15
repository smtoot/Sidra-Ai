'use client';

import { useState, useEffect } from 'react';
import { DayOfWeek } from '@sidra/shared';
import { cn } from '@/lib/utils';

interface AvailabilitySlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}

interface AvailabilityGridProps {
    availability: AvailabilitySlot[];
    onSave: (slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[]) => Promise<void>;
    loading?: boolean;
}

// Days of week in order (Sat -> Fri for Arabic week)
const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: DayOfWeek.SATURDAY, label: 'السبت' },
    { key: DayOfWeek.SUNDAY, label: 'الأحد' },
    { key: DayOfWeek.MONDAY, label: 'الاثنين' },
    { key: DayOfWeek.TUESDAY, label: 'الثلاثاء' },
    { key: DayOfWeek.WEDNESDAY, label: 'الأربعاء' },
    { key: DayOfWeek.THURSDAY, label: 'الخميس' },
    { key: DayOfWeek.FRIDAY, label: 'الجمعة' },
];

// Generate 30-min time slots from 6 AM to 11 PM (34 slots total)
const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 6; hour <= 23; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 23) {
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Helper functions
const dayOfWeekToIndex = (day: DayOfWeek): number => {
    return DAYS.findIndex(d => d.key === day);
};

const timeToSlotIndex = (time: string): number => {
    return TIME_SLOTS.indexOf(time);
};

const slotIndexToTime = (index: number): string => {
    return TIME_SLOTS[index] || '00:00';
};

const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'م' : 'ص';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
};

export default function AvailabilityGrid({ availability, onSave, loading }: AvailabilityGridProps) {
    // Grid state: [dayIndex][slotIndex] = boolean
    const [gridState, setGridState] = useState<boolean[][]>(() =>
        Array(7).fill(null).map(() => Array(TIME_SLOTS.length).fill(false))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ day: number; slot: number } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{ day: number; slot: number } | null>(null);
    const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Parse API availability into grid state
    useEffect(() => {
        const newGrid = Array(7).fill(null).map(() => Array(TIME_SLOTS.length).fill(false));

        availability.forEach(slot => {
            const dayIndex = dayOfWeekToIndex(slot.dayOfWeek);
            if (dayIndex === -1) return;

            const startIndex = timeToSlotIndex(slot.startTime);
            const endIndex = timeToSlotIndex(slot.endTime);

            if (startIndex !== -1 && endIndex !== -1) {
                for (let i = startIndex; i < endIndex; i++) {
                    if (i < TIME_SLOTS.length) {
                        newGrid[dayIndex][i] = true;
                    }
                }
            }
        });

        setGridState(newGrid);
        setHasChanges(false);
    }, [availability]);

    // Global pointer up listener
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDragging) {
                handlePointerUp();
            }
        };

        window.addEventListener('pointerup', handleGlobalPointerUp);
        window.addEventListener('pointermove', handlePointerMove);

        return () => {
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, [isDragging, dragStart, dragCurrent, dragMode]);

    // Get all cells in drag selection
    const getDraggedCells = (): { day: number; slot: number }[] => {
        if (!dragStart || !dragCurrent) return [];

        const minDay = Math.min(dragStart.day, dragCurrent.day);
        const maxDay = Math.max(dragStart.day, dragCurrent.day);
        const minSlot = Math.min(dragStart.slot, dragCurrent.slot);
        const maxSlot = Math.max(dragStart.slot, dragCurrent.slot);

        const cells: { day: number; slot: number }[] = [];
        for (let d = minDay; d <= maxDay; d++) {
            for (let s = minSlot; s <= maxSlot; s++) {
                cells.push({ day: d, slot: s });
            }
        }
        return cells;
    };

    // Check if a cell is in the current drag selection
    const isCellInDragSelection = (dayIndex: number, slotIndex: number): boolean => {
        if (!isDragging || !dragStart || !dragCurrent) return false;

        const minDay = Math.min(dragStart.day, dragCurrent.day);
        const maxDay = Math.max(dragStart.day, dragCurrent.day);
        const minSlot = Math.min(dragStart.slot, dragCurrent.slot);
        const maxSlot = Math.max(dragStart.slot, dragCurrent.slot);

        return dayIndex >= minDay && dayIndex <= maxDay &&
            slotIndex >= minSlot && slotIndex <= maxSlot;
    };

    // Pointer event handlers
    const handlePointerDown = (dayIndex: number, slotIndex: number) => {
        setIsDragging(true);
        setDragStart({ day: dayIndex, slot: slotIndex });
        setDragCurrent({ day: dayIndex, slot: slotIndex });

        // Determine mode based on starting cell state
        setDragMode(gridState[dayIndex][slotIndex] ? 'remove' : 'add');
    };

    const handlePointerEnter = (dayIndex: number, slotIndex: number) => {
        if (!isDragging) return;
        setDragCurrent({ day: dayIndex, slot: slotIndex });
    };

    const handlePointerMove = (e: PointerEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        applyDragSelection();
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    // Apply drag selection to grid
    const applyDragSelection = () => {
        const cells = getDraggedCells();

        setGridState(prev => {
            const newGrid = prev.map(day => [...day]);

            cells.forEach(({ day, slot }) => {
                // Apply mode: add = true, remove = false
                newGrid[day][slot] = dragMode === 'add';
            });

            return newGrid;
        });

        setHasChanges(true);
    };

    // Format drag range for tooltip
    const formatDragRange = (): string => {
        if (!dragStart || !dragCurrent) return '';

        const cells = getDraggedCells();
        if (cells.length === 0) return '';

        const days = [...new Set(cells.map(c => DAYS[c.day].label))];
        const minSlot = Math.min(...cells.map(c => c.slot));
        const maxSlot = Math.max(...cells.map(c => c.slot));

        const startTime = formatTime(TIME_SLOTS[minSlot]);
        const endTime = formatTime(TIME_SLOTS[Math.min(maxSlot + 1, TIME_SLOTS.length - 1)]);

        return `${days.join('، ')} | ${startTime} - ${endTime}`;
    };

    // Convert grid state to availability slots
    const gridToSlots = (): { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[] => {
        const slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[] = [];

        gridState.forEach((daySlots, dayIndex) => {
            let blockStart: number | null = null;

            daySlots.forEach((isAvailable, slotIndex) => {
                if (isAvailable && blockStart === null) {
                    blockStart = slotIndex; // Start of continuous block
                } else if (!isAvailable && blockStart !== null) {
                    // End of block detected
                    slots.push({
                        dayOfWeek: DAYS[dayIndex].key,
                        startTime: slotIndexToTime(blockStart),
                        endTime: slotIndexToTime(slotIndex),
                        isRecurring: true
                    });
                    blockStart = null;
                }
            });

            // Handle block extending to end of day
            if (blockStart !== null) {
                slots.push({
                    dayOfWeek: DAYS[dayIndex].key,
                    startTime: slotIndexToTime(blockStart),
                    endTime: slotIndexToTime(daySlots.length),
                    isRecurring: true
                });
            }
        });

        return slots;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const slots = gridToSlots();
            await onSave(slots);
            setHasChanges(false);
        } catch (err) {
            console.error('Failed to save availability:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 select-none">
            {/* Header with save button */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary">جدولك الأسبوعي</h3>
                    <p className="text-sm text-text-subtle">
                        {isDragging
                            ? '↗️ اسحب لتحديد عدة خلايا'
                            : 'اضغط واسحب لتحديد الأوقات المتاحة'
                        }
                    </p>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving || loading}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                )}
            </div>

            {/* Grid Container */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full" dir="rtl">
                        {/* Header Row with Day Names */}
                        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <div className="p-3 text-sm font-bold text-text-subtle border-l border-gray-200">
                                الوقت
                            </div>
                            {DAYS.map((day, index) => (
                                <div
                                    key={day.key}
                                    className={cn(
                                        'p-3 text-center text-sm font-bold text-primary',
                                        index < DAYS.length - 1 && 'border-l border-gray-200'
                                    )}
                                >
                                    {day.label}
                                </div>
                            ))}
                        </div>

                        {/* Time Slots Grid */}
                        <div className="max-h-[600px] overflow-y-auto">
                            {TIME_SLOTS.map((time, slotIndex) => (
                                <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
                                    {/* Time Label */}
                                    <div className="p-2 text-xs text-text-subtle bg-gray-50 border-l border-gray-200 flex items-center">
                                        {formatTime(time)}
                                    </div>

                                    {/* Day Cells */}
                                    {DAYS.map((day, dayIndex) => (
                                        <button
                                            key={`${day.key}-${slotIndex}`}
                                            onPointerDown={() => handlePointerDown(dayIndex, slotIndex)}
                                            onPointerEnter={() => handlePointerEnter(dayIndex, slotIndex)}
                                            disabled={loading}
                                            className={cn(
                                                'h-12 transition-all border-l border-gray-100 last:border-l-0',
                                                'active:scale-95 disabled:cursor-not-allowed',
                                                isDragging ? 'cursor-grabbing' : 'cursor-pointer',
                                                gridState[dayIndex][slotIndex]
                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                    : 'bg-white hover:bg-gray-100',
                                                isCellInDragSelection(dayIndex, slotIndex) &&
                                                'ring-2 ring-inset ring-primary opacity-70'
                                            )}
                                            aria-label={`${day.label} ${formatTime(time)}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Tooltip */}
            {isDragging && dragStart && dragCurrent && (
                <div
                    className="fixed z-50 bg-black text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none"
                    style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y + 10}px`
                    }}
                >
                    {formatDragRange()}
                    <div className="text-[10px] opacity-70 mt-0.5">
                        {dragMode === 'add' ? '✅ تحديد' : '❌ إلغاء'}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded border border-emerald-600"></div>
                    <span className="text-text-subtle">متاح</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded border border-gray-200"></div>
                    <span className="text-text-subtle">غير متاح</span>
                </div>
            </div>
        </div>
    );
}
