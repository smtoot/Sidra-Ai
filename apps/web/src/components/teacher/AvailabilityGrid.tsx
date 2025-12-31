'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { DayOfWeek } from '@sidra/shared';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AvailabilityToolbar, TimePreset } from './AvailabilityToolbar';
import { formatTimeAr } from '@/lib/utils/availability-format';

// -- Constants --

const HOURS_PER_DAY = 24;
const SLOTS_PER_HOUR = 2;
const TOTAL_SLOTS = HOURS_PER_DAY * SLOTS_PER_HOUR; // 48 slots

const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: DayOfWeek.SATURDAY, label: 'السبت' },
    { key: DayOfWeek.SUNDAY, label: 'الأحد' },
    { key: DayOfWeek.MONDAY, label: 'الاثنين' },
    { key: DayOfWeek.TUESDAY, label: 'الثلاثاء' },
    { key: DayOfWeek.WEDNESDAY, label: 'الأربعاء' },
    { key: DayOfWeek.THURSDAY, label: 'الخميس' },
    { key: DayOfWeek.FRIDAY, label: 'الجمعة' },
];

const ALL_TIME_SLOTS = generateAllTimeSlots();

function generateAllTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 0; hour <= 23; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
}

// -- Helpers --

// Map preset to slot range [start, end] (inclusive indices)
const getPresetRange = (preset: TimePreset): [number, number] => {
    switch (preset) {
        case 'MORNING': return [12, 23];   // 06:00 - 11:30 (Ends 12:00)
        case 'AFTERNOON': return [24, 33]; // 12:00 - 16:30 (Ends 17:00)
        case 'EVENING': return [34, 47];   // 17:00 - 23:30 (Ends 24:00)
        case 'FULL': return [0, 47];       // 00:00 - 23:30 (Ends 24:00)
    }
};

// -- Types --

interface AvailabilitySlot {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}

interface AvailabilityGridProps {
    availability: AvailabilitySlot[];
    onSave: (slots: AvailabilitySlot[]) => Promise<void>;
    loading?: boolean;
    onScrollToExceptions?: () => void;
}

// -- Memoized Cell --
const GridCell = memo(({
    isActive,
    isHalfHour,
    isSelected,
    isInRectPreview,
    dayIndex,
    slotIndex
}: {
    isActive: boolean;
    isHalfHour: boolean;
    isSelected: boolean;
    isInRectPreview: boolean;
    dayIndex: number;
    slotIndex: number;
}) => {
    // Note: We removed direct event handlers here. Parent container handles standard pointer events via capture/target or elementFromPoint
    // Actually, simple pointerDown allows starting interaction.
    // But to fix the "Paint" bug, we rely on the CONTAINER's pointerMove + elementFromPoint.
    // However, we still need pointerDown on the cell to START the gesture optimally.
    // data-day and data-slot are CRITICAL for elementFromPoint.
    return (
        <div
            data-day={dayIndex}
            data-slot={slotIndex}
            className={cn(
                'relative h-10 border-l border-gray-100 last:border-0 transition-colors',
                'cursor-pointer touch-none',
                isActive ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-transparent hover:bg-gray-50',
                isSelected && !isActive && 'bg-blue-50/50',
                isInRectPreview && 'ring-2 ring-inset ring-primary bg-primary/20 z-10'
            )}
        >
            {isHalfHour && !isActive && (
                <div className="absolute inset-0 border-t border-dashed border-gray-100 pointer-events-none" />
            )}
        </div>
    );
});
GridCell.displayName = 'GridCell';

export default function AvailabilityGrid({ availability, onSave, loading, onScrollToExceptions }: AvailabilityGridProps) {
    // -- State --
    const [gridState, setGridState] = useState<boolean[][]>(() =>
        Array(7).fill(null).map(() => Array(TOTAL_SLOTS).fill(false))
    );

    const [history, setHistory] = useState<boolean[][][]>([]);
    const [activePreset, setActivePreset] = useState<TimePreset>('FULL');
    const [copiedDayIndex, setCopiedDayIndex] = useState<number | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Interaction Refs
    const isPaintingRef = useRef(false);
    const paintActionRef = useRef<boolean>(true);
    const isRectModeRef = useRef(false);
    const rectStartRef = useRef<{ d: number, s: number } | null>(null);
    const lastVisitedRef = useRef<{ d: number, s: number } | null>(null);

    // Container Ref for Capture
    const gridRef = useRef<HTMLDivElement>(null);

    // Rect Visual State
    const [rectSelection, setRectSelection] = useState<{ start: { d: number, s: number }, end: { d: number, s: number } } | null>(null);

    // -- Derived --
    const [startSlotIdx, endSlotIdx] = getPresetRange(activePreset);
    const visibleSlotIndices = Array.from({ length: endSlotIdx - startSlotIdx + 1 }, (_, i) => startSlotIdx + i);

    // -- Effects --
    useEffect(() => {
        const newGrid = Array(7).fill(null).map(() => Array(TOTAL_SLOTS).fill(false));
        const timeToIndex = (t: string) => ALL_TIME_SLOTS.indexOf(t);

        availability.forEach(slot => {
            const dayIndex = DAYS.findIndex(d => d.key === slot.dayOfWeek);
            if (dayIndex === -1) return;
            const sIdx = timeToIndex(slot.startTime);
            const eIdx = timeToIndex(slot.endTime);
            if (sIdx !== -1 && eIdx !== -1) {
                for (let i = sIdx; i < eIdx; i++) {
                    if (i < TOTAL_SLOTS) newGrid[dayIndex][i] = true;
                }
            }
        });
        setGridState(newGrid);
        setHistory([]);
        setHasChanges(false);
    }, [availability]);

    // -- Pointer Handlers (Container Level) --

    // Helper to get cell from event
    const getCellFromEvent = (e: React.PointerEvent | PointerEvent) => {
        // Use elementFromPoint to be robust against capture
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return null;
        const cell = el.closest('[data-day][data-slot]');
        if (!cell) return null;
        const d = parseInt(cell.getAttribute('data-day') || '-1');
        const s = parseInt(cell.getAttribute('data-slot') || '-1');
        if (d === -1 || s === -1) return null;
        return { d, s };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only left click
        if (e.button !== 0) return;

        const cell = getCellFromEvent(e);
        if (!cell) return;
        const { d, s } = cell;

        e.preventDefault();
        // Capture on the CONTAINER, not the cell
        (e.currentTarget as Element).setPointerCapture(e.pointerId);

        if (e.shiftKey) {
            // Rect Mode
            isRectModeRef.current = true;
            rectStartRef.current = { d, s };

            // Determine action
            const startVal = gridState[d][s];
            paintActionRef.current = !startVal;

            setRectSelection({ start: { d, s }, end: { d, s } });
            pushToHistory();
        } else {
            // Paint Mode
            isPaintingRef.current = true;
            const startVal = gridState[d][s];
            const action = !startVal;
            paintActionRef.current = action;

            // Apply immediate
            pushToHistory();
            setGridState(prev => {
                const next = prev.map(row => [...row]);
                next[d][s] = action;
                return next;
            });
            setHasChanges(true);
            lastVisitedRef.current = { d, s };
        }
        // setSelectedDayIndex(d); // Remove auto-select
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        // If not interacting, ignore
        if (!isPaintingRef.current && !isRectModeRef.current) return;

        // Find target under pointer
        const cell = getCellFromEvent(e);
        if (!cell) return;
        const { d, s } = cell;

        if (isRectModeRef.current && rectStartRef.current) {
            setRectSelection({
                start: rectStartRef.current,
                end: { d, s }
            });
            return;
        }

        if (isPaintingRef.current) {
            if (lastVisitedRef.current?.d === d && lastVisitedRef.current?.s === s) return;

            const action = paintActionRef.current;

            setGridState(prev => {
                if (prev[d][s] === action) return prev;
                const next = prev.map(row => [...row]);
                next[d][s] = action;
                return next;
            });
            setHasChanges(true);
            lastVisitedRef.current = { d, s };
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        commitInteraction();
        // Release capture if held
        if (e.currentTarget instanceof Element && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    const commitInteraction = () => {
        const wasRect = isRectModeRef.current;
        isPaintingRef.current = false;
        isRectModeRef.current = false;
        lastVisitedRef.current = null;
        rectStartRef.current = null;

        // Apply Rect changes
        if (wasRect && rectSelection) {
            setGridState(prev => {
                const next = prev.map(d => [...d]);
                const { start, end } = rectSelection;
                const dMin = Math.min(start.d, end.d);
                const dMax = Math.max(start.d, end.d);
                const sMin = Math.min(start.s, end.s);
                const sMax = Math.max(start.s, end.s);
                const action = paintActionRef.current;

                for (let d = dMin; d <= dMax; d++) {
                    for (let s = sMin; s <= sMax; s++) {
                        next[d][s] = action;
                    }
                }
                return next;
            });
            setRectSelection(null);
            setHasChanges(true);
        }
    };

    // -- Actions (Undo/Copy/etc) --
    const pushToHistory = () => {
        setHistory(prev => [...prev.slice(-9), gridState.map(d => [...d])]);
        setHasChanges(true);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        setGridState(history[history.length - 1]);
        setHistory(h => h.slice(0, -1));
        setHasChanges(true);
        toast.info('تم التراجع عن آخر تغيير');
    };

    const handleClearDay = () => {
        if (selectedDayIndex === null) {
            toast.error('الرجاء تحديد يوم أولاً');
            return;
        }
        pushToHistory();
        setGridState(prev => {
            const next = prev.map(d => [...d]);
            const [min, max] = getPresetRange(activePreset);
            for (let i = min; i <= max; i++) {
                next[selectedDayIndex][i] = false;
            }
            return next;
        });
        toast.success(`تم مسح أوقات ${DAYS[selectedDayIndex].label}`);
    };

    const handleFillDay = () => {
        if (selectedDayIndex === null) {
            toast.error('الرجاء تحديد يوم أولاً');
            return;
        }
        pushToHistory();
        setGridState(prev => {
            const next = prev.map(d => [...d]);
            const [min, max] = getPresetRange(activePreset);
            for (let i = min; i <= max; i++) {
                next[selectedDayIndex][i] = true;
            }
            return next;
        });
        toast.success(`تم تعبئة أوقات ${DAYS[selectedDayIndex].label}`);
    };

    const handleCopyDay = () => {
        if (selectedDayIndex === null) {
            toast.error('الرجاء تحديد يوم للنسخ');
            return;
        }
        setCopiedDayIndex(selectedDayIndex);
        toast.success(`تم نسخ ${DAYS[selectedDayIndex].label}`);
    };

    const handlePasteDay = () => {
        if (selectedDayIndex === null || copiedDayIndex === null) return;
        pushToHistory();
        setGridState(prev => {
            const next = prev.map(d => [...d]);
            next[selectedDayIndex] = [...prev[copiedDayIndex]];
            return next;
        });
        setHasChanges(true);
        toast.success('تم لصق الجدول');
    };

    // -- Save --
    const triggerSave = async () => {
        setIsSaving(true);
        try {
            const slots: AvailabilitySlot[] = [];
            gridState.forEach((dayRow, d) => {
                let start: number | null = null;
                dayRow.forEach((active, s) => {
                    if (active && start === null) start = s;
                    else if (!active && start !== null) {
                        slots.push({
                            dayOfWeek: DAYS[d].key,
                            startTime: ALL_TIME_SLOTS[start],
                            endTime: ALL_TIME_SLOTS[s],
                            isRecurring: true
                        });
                        start = null;
                    }
                });
                if (start !== null) {
                    slots.push({
                        dayOfWeek: DAYS[d].key,
                        startTime: ALL_TIME_SLOTS[start],
                        endTime: '23:59', // Robust end of day
                        isRecurring: true
                    });
                }
            });
            await onSave(slots);
            setHasChanges(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // Rect Visual Helper
    const isCellInRect = (d: number, s: number) => {
        if (!rectSelection) return false;
        const { start, end } = rectSelection;
        const dMin = Math.min(start.d, end.d);
        const dMax = Math.max(start.d, end.d);
        const sMin = Math.min(start.s, end.s);
        const sMax = Math.max(start.s, end.s);
        return d >= dMin && d <= dMax && s >= sMin && s <= sMax;
    };

    return (
        <div className="space-y-4 select-none" dir="rtl">
            <AvailabilityToolbar
                activePreset={activePreset}
                onPresetChange={setActivePreset}
                canUndo={history.length > 0}
                onUndo={handleUndo}
                onClearDay={handleClearDay}
                onFillDay={handleFillDay}
                onCopyDay={handleCopyDay}
                onPasteDay={handlePasteDay}
                hasCopiedDay={copiedDayIndex !== null}
                onScrollToExceptions={onScrollToExceptions}
            />

            <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between border border-blue-100">
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>
                        اضغط واسحب <strong>لتلوين</strong> الأوقات المتاحة.
                    </span>
                </span>
                {selectedDayIndex !== null && (
                    <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">
                        {DAYS[selectedDayIndex].label}
                    </span>
                )}
            </div>

            {/* Container for Pointer Events */}
            <div
                ref={gridRef}
                className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                // Important: prevents native touch scroll
                style={{ touchAction: 'none' }}
            >
                {/* Header */}
                <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-300">
                    <div className="p-3 text-sm font-bold text-gray-400 border-l flex items-center justify-center">#</div>
                    {DAYS.map((day, index) => (
                        <button
                            key={day.key}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                // Toggle Selection
                                setSelectedDayIndex(prev => prev === index ? null : index);
                            }}
                            className={cn(
                                'p-3 text-center text-sm font-bold transition-colors hover:bg-gray-100 outline-none',
                                index < 6 && 'border-l border-gray-200',
                                selectedDayIndex === index ? 'bg-primary-50 text-primary ring-inset ring-2 ring-primary border-transparent' : 'text-gray-700'
                            )}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>

                {/* Slots */}
                <div className="overflow-y-auto max-h-[600px] scroll-smooth">
                    {visibleSlotIndices.map((slotIdx) => {
                        const timeLabel = ALL_TIME_SLOTS[slotIdx];
                        const isHalfHour = timeLabel.includes(':30');

                        return (
                            <div key={slotIdx} className={cn(
                                "grid grid-cols-8 border-b border-gray-100 last:border-0",
                                !isHalfHour && "border-t border-gray-200"
                            )}>
                                {/* Time Label */}
                                <div className="p-2 text-xs font-medium text-gray-500 bg-gray-50/50 border-l flex items-center justify-center">
                                    {!isHalfHour && formatTimeAr(timeLabel)}
                                </div>

                                {/* Cells */}
                                {DAYS.map((day, dayIdx) => (
                                    <GridCell
                                        key={`${day.key}-${slotIdx}`}
                                        isActive={gridState[dayIdx][slotIdx]}
                                        isHalfHour={isHalfHour}
                                        isSelected={selectedDayIndex === dayIdx}
                                        isInRectPreview={isCellInRect(dayIdx, slotIdx)}
                                        dayIndex={dayIdx}
                                        slotIndex={slotIdx}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4" dir="rtl">
                    <span className="text-sm font-medium">لديك تغييرات غير محفوظة</span>
                    <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-white text-sm">
                        إلغاء
                    </button>
                    <button
                        onClick={triggerSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary-400 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            )}
        </div>
    );
}
