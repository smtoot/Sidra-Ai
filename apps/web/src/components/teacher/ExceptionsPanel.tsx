'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarX, Trash2, Filter, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AvailabilityException {
    id: string;
    startDate: string;
    endDate: string;
    type: 'ALL_DAY' | 'PARTIAL_DAY';
    startTime?: string;
    endTime?: string;
    reason?: string;
}

interface ExceptionsPanelProps {
    exceptions: AvailabilityException[];
    onDelete: (id: string) => void;
    onAdd: () => void;
}

export default function ExceptionsPanel({ exceptions, onDelete, onAdd }: ExceptionsPanelProps) {
    const [filter, setFilter] = useState<'ALL' | 'UPCOMING'>('UPCOMING');

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const filteredExceptions = exceptions.filter(ex => {
        if (filter === 'UPCOMING') {
            return ex.endDate >= getTodayDate();
        }
        return true;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format "14:00" to "٢:٠٠ م"
    const formatTimeAr = (time: string): string => {
        if (!time) return '';
        const [h, m] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m);
        return new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric' }).format(date);
    };

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden mt-8">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CalendarX className="w-5 h-5 text-gray-500" />
                            الاستثناءات والإجازات
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            الأوقات التي لا ترغب باستقبال حجوزات فيها (إجازات، ظروف خاصة، ...)
                        </p>
                    </div>
                    <Button onClick={onAdd} className="bg-primary hover:bg-primary-700 shadow-sm">
                        + إضافة استثناء
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Filters */}
                <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-white">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 ml-2">تصفية:</span>
                    <button
                        onClick={() => setFilter('UPCOMING')}
                        className={cn(
                            "px-3 py-1 text-xs font-bold rounded-full transition-colors",
                            filter === 'UPCOMING' ? "bg-primary-50 text-primary" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        القادمة فقط
                    </button>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn(
                            "px-3 py-1 text-xs font-bold rounded-full transition-colors",
                            filter === 'ALL' ? "bg-primary-50 text-primary" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        الكل
                    </button>
                </div>

                {/* List */}
                {filteredExceptions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CalendarX className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-bold">لا توجد استثناءات</h4>
                        <p className="text-sm text-gray-500 mt-1">لم تقم بإضافة أي أيام عطلة أو ساعات محجوبة {filter === 'UPCOMING' ? 'قادمة' : ''}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredExceptions.map((ex) => (
                            <div key={ex.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 text-lg">
                                            {formatDate(ex.startDate)}
                                        </span>
                                        {ex.startDate !== ex.endDate && (
                                            <>
                                                <span className="text-gray-400">←</span>
                                                <span className="font-bold text-gray-900 text-lg">
                                                    {formatDate(ex.endDate)}
                                                </span>
                                            </>
                                        )}

                                        {/* Type Badge */}
                                        {ex.type === 'ALL_DAY' ? (
                                            <Badge variant="secondary" className="mr-2 bg-red-50 text-red-700 hover:bg-red-100 border-none">
                                                يوم كامل
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="mr-2 border-orange-200 text-orange-700 bg-orange-50">
                                                أوقات محددة
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        {ex.type === 'PARTIAL_DAY' && ex.startTime && ex.endTime && (
                                            <div className="flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">
                                                <Clock className="w-3 h-3" />
                                                <span dir="ltr">
                                                    {formatTimeAr(ex.startTime)} - {formatTimeAr(ex.endTime)}
                                                </span>
                                            </div>
                                        )}
                                        {ex.reason && (
                                            <span className="text-gray-500 italic">
                                                "{ex.reason}"
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => onDelete(ex.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
