'use client';

import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Child } from '@/lib/api/auth';

interface Step4DetailsProps {
    userRole: 'PARENT' | 'STUDENT' | null;
    userName: string;
    children: Child[];
    selectedChildId: string;
    onChildSelect: (childId: string) => void;
    bookingNotes: string;
    onNotesChange: (notes: string) => void;
    onAddChild?: () => void;
}

export function Step4Details({
    userRole,
    userName,
    children,
    selectedChildId,
    onChildSelect,
    bookingNotes,
    onNotesChange,
    onAddChild
}: Step4DetailsProps) {
    return (
        <div className="space-y-6">
            {/* Child Selection (Parents only) */}
            {userRole === 'PARENT' && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        هذا الحجز لـ:
                    </h3>

                    {children.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                            <p className="text-gray-600 mb-3">لم تضف أي أطفال بعد</p>
                            {onAddChild && (
                                <button
                                    onClick={onAddChild}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة طفل
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {children.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => onChildSelect(child.id)}
                                    className={cn(
                                        'w-full p-4 rounded-xl border-2 transition-all text-right',
                                        'hover:border-primary hover:shadow-sm',
                                        selectedChildId === child.id
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-gray-200 bg-white'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                                                selectedChildId === child.id
                                                    ? 'border-primary bg-primary'
                                                    : 'border-gray-300'
                                            )}
                                        >
                                            {selectedChildId === child.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className="text-right flex-1">
                                            <p className="font-semibold text-gray-900">
                                                {child.name}
                                            </p>
                                            {child.gradeLevel && (
                                                <p className="text-sm text-gray-500">
                                                    الصف {child.gradeLevel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {onAddChild && (
                                <button
                                    onClick={onAddChild}
                                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة طفل آخر
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Student view */}
            {userRole === 'STUDENT' && (
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-700">
                        هذا الحجز لـ: <span className="font-semibold">{userName}</span>
                    </p>
                </div>
            )}

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات للمعلم (اختياري)
                </label>
                <textarea
                    value={bookingNotes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="مثال: أحتاج مساعدة في حل المعادلات التفاضلية..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                    يمكنك إخبار المعلم بأي احتياجات خاصة أو مواضيع تريد التركيز عليها
                </p>
            </div>
        </div>
    );
}
