'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { ChildrenSelector } from './ChildrenSelector';

interface ParentBookingEmptyStateProps {
    childrenList: any[];
}

export function ParentBookingEmptyState({ childrenList }: ParentBookingEmptyStateProps) {
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    // Auto-select if only 1 child
    if (childrenList.length === 1 && !selectedChildId) {
        setSelectedChildId(childrenList[0].id);
    }

    const selectedChild = childrenList.find(c => c.id === selectedChildId);

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden text-center">
            <CardContent className="p-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-8 h-8 text-gray-400" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حصص قادمة لأبنائك</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    اختر أحد أبنائك ثم احجز حصة مع معلم مناسب لمساعدته في الدراسة
                </p>

                {/* Children Selector */}
                <div className="mb-8">
                    <div className="text-sm font-medium text-gray-700 mb-3 block">اختر الابن لحجز الحصة:</div>
                    <ChildrenSelector
                        children={childrenList}
                        selectedChildId={selectedChildId}
                        onSelect={setSelectedChildId}
                    />
                </div>

                <div className="flex flex-col items-center gap-3">
                    {selectedChildId ? (
                        <Link href={`/search?childId=${selectedChildId}`}>
                            <Button size="lg" className="h-11 px-8 shadow-md">
                                <Search className="w-4 h-4 ml-2" />
                                احجز حصة لـ {selectedChild?.name}
                            </Button>
                        </Link>
                    ) : (
                        <Button disabled size="lg" className="h-11 px-8 opacity-50 cursor-not-allowed">
                            احجز حصة
                        </Button>
                    )}

                    {!selectedChildId && (
                        <p className="text-xs text-amber-600 font-medium animate-pulse">
                            اختر أحد أبنائك للمتابعة
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
