'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { DayOfWeek } from '@sidra/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Trash2, CalendarX, Loader2, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AvailabilityGrid from '@/components/teacher/AvailabilityGrid';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';

interface AvailabilitySlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}

interface AvailabilityException {
    id: string;
    startDate: string;
    endDate: string;
    type: 'ALL_DAY' | 'PARTIAL_DAY';
    startTime?: string;
    endTime?: string;
    reason?: string;
    createdAt: string;
    updatedAt: string;
}

export default function TeacherAvailabilityPage() {
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
    const [loading, setLoading] = useState(true);

    // Exception modal state
    const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
    const [exceptionStart, setExceptionStart] = useState('');
    const [exceptionEnd, setExceptionEnd] = useState('');
    const [exceptionReason, setExceptionReason] = useState('');
    const [exceptionType, setExceptionType] = useState<'ALL_DAY' | 'PARTIAL_DAY'>('ALL_DAY');
    const [isSingleDay, setIsSingleDay] = useState(true);

    // For PARTIAL_DAY: array of time slots
    const [timeSlots, setTimeSlots] = useState<{ startTime: string; endTime: string }[]>([
        { startTime: '09:00', endTime: '17:00' }
    ]);

    // Video tutorial state
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profile, exceptionsData] = await Promise.all([
                teacherApi.getProfile(),
                teacherApi.getExceptions()
            ]);
            setAvailability(profile.availability || []);
            setExceptions(exceptionsData || []);
        } catch (err) {
            console.error('Failed to load data', err);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[]) => {
        try {
            await teacherApi.setBulkAvailability(slots);
            toast.success('تم حفظ المواعيد بنجاح');
            const profile = await teacherApi.getProfile();
            setAvailability(profile.availability || []);
        } catch (err) {
            console.error('Failed to save availability', err);
            toast.error('فشل في حفظ المواعيد');
            throw err;
        }
    };

    const handleAddException = async () => {
        if (!exceptionStart || !exceptionEnd) {
            toast.error('يرجى اختيار نطاق زمني');
            return;
        }

        if (new Date(exceptionEnd) < new Date(exceptionStart)) {
            toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
            return;
        }

        try {
            const finalEndDate = isSingleDay ? exceptionStart : exceptionEnd;

            if (exceptionType === 'PARTIAL_DAY') {
                // Create one exception per time slot
                const promises = timeSlots.map(slot =>
                    teacherApi.addException({
                        startDate: exceptionStart,
                        endDate: finalEndDate,
                        reason: exceptionReason || undefined,
                        type: 'PARTIAL_DAY',
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    })
                );
                await Promise.all(promises);
            } else {
                // Single ALL_DAY exception
                await teacherApi.addException({
                    startDate: exceptionStart,
                    endDate: finalEndDate,
                    reason: exceptionReason || undefined,
                    type: 'ALL_DAY'
                });
            }

            toast.success('تم إضافة الاستثناء بنجاح');
            setExceptionModalOpen(false);
            setExceptionStart('');
            setExceptionEnd('');
            setExceptionReason('');
            setExceptionType('ALL_DAY');
            setIsSingleDay(true);
            setTimeSlots([{ startTime: '09:00', endTime: '17:00' }]);

            // Reload exceptions
            const exceptionsData = await teacherApi.getExceptions();
            setExceptions(exceptionsData || []);
        } catch (err) {
            console.error('Failed to add exception', err);
            toast.error('فشل في إضافة الاستثناء');
        }
    };

    const handleDeleteException = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الاستثناء؟')) return;

        try {
            await teacherApi.removeException(id);
            toast.success('تم حذف الاستثناء');

            // Reload exceptions
            const exceptionsData = await teacherApi.getExceptions();
            setExceptions(exceptionsData || []);
        } catch (err) {
            console.error('Failed to delete exception', err);
            toast.error('فشل في حذف الاستثناء');
        }
    };

    const formatDateRange = (exception: AvailabilityException): string => {
        const start = new Date(exception.startDate);
        const end = new Date(exception.endDate);

        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const startStr = start.toLocaleDateString('ar-SA', options);
        const endStr = end.toLocaleDateString('ar-SA', options);

        let dateRange = exception.startDate === exception.endDate ? startStr : `${startStr} → ${endStr}`;

        // Add time range for partial day exceptions
        if (exception.type === 'PARTIAL_DAY' && exception.startTime && exception.endTime) {
            const timeRange = `(${formatTime(exception.startTime)} - ${formatTime(exception.endTime)})`;
            dateRange = `${dateRange} ${timeRange}`;
        }

        return dateRange;
    };

    const formatTime = (time: string): string => {
        const [hour, minute] = time.split(':');
        const hourNum = parseInt(hour);
        const period = hourNum >= 12 ? 'م' : 'ص';
        const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
        return `${displayHour}:${minute} ${period}`;
    };

    // Get today's date in YYYY-MM-DD format for min attribute
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    return (
        <TeacherApprovalGuard>
            <div className="max-w-7xl mx-auto py-8 px-4 font-tajawal" dir="rtl">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Clock className="w-6 h-6" />
                        مواعيد التوافر
                    </h1>
                    <p className="text-text-subtle mt-1">حدد الأوقات التي تكون متاحاً فيها للتدريس</p>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-text-subtle">جاري تحميل جدولك...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Help Section - Video Tutorial Only */}
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <button
                                onClick={() => setShowTutorial(!showTutorial)}
                                className="w-full flex items-center justify-between text-primary hover:text-primary-hover transition-colors font-medium"
                            >
                                <span className="flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5" />
                                    <span>كيف تستخدم الجدول؟ 💡</span>
                                </span>
                                {showTutorial ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>

                            {/* Video Tutorial */}
                            {showTutorial && (
                                <div className="mt-4 rounded-lg overflow-hidden border border-blue-300">
                                    <img
                                        src="/tutorials/availability-tutorial.webp"
                                        alt="شرح كيفية استخدام جدول المواعيد"
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>

                        <AvailabilityGrid
                            availability={availability}
                            onSave={handleSave}
                            loading={loading}
                        />

                        {/* Exception Management Section */}
                        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                        <CalendarX className="w-5 h-5" />
                                        الاستثناءات والإجازات
                                    </h3>
                                    <p className="text-sm text-text-subtle mt-1">احجز أيام محددة غير متاحة للحجز</p>
                                </div>
                                <Button
                                    onClick={() => setExceptionModalOpen(true)}
                                    className="bg-primary hover:bg-primary-hover"
                                >
                                    + إضافة استثناء
                                </Button>
                            </div>

                            {exceptions.length === 0 ? (
                                <div className="text-center py-8 text-text-subtle">
                                    <CalendarX className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">لا توجد استثناءات حالياً</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {exceptions.map(exception => (
                                        <div
                                            key={exception.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-primary">
                                                    {formatDateRange(exception)}
                                                </div>
                                                {exception.reason && (
                                                    <div className="text-sm text-text-subtle mt-1">
                                                        {exception.reason}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteException(exception.id)}
                                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Block Dates Modal */}
                <Dialog open={exceptionModalOpen} onOpenChange={setExceptionModalOpen}>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>حجز أيام غير متاحة</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {/* Single Day Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="singleDay"
                                    checked={isSingleDay}
                                    onChange={(e) => {
                                        setIsSingleDay(e.target.checked);
                                        if (e.target.checked) {
                                            setExceptionEnd(exceptionStart);
                                        }
                                    }}
                                    className="w-4 h-4 text-primary rounded"
                                />
                                <Label htmlFor="singleDay" className="text-sm cursor-pointer">
                                    يوم واحد فقط
                                </Label>
                            </div>

                            {/* Date Range Picker */}
                            <div>
                                <Label className="text-sm font-medium mb-2">اختر التاريخ</Label>
                                <div className={`grid ${isSingleDay ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mt-2`}>
                                    <div>
                                        <Label className="text-xs text-text-subtle">
                                            {isSingleDay ? 'التاريخ' : 'من'}
                                        </Label>
                                        <Input
                                            type="date"
                                            value={exceptionStart}
                                            onChange={(e) => {
                                                setExceptionStart(e.target.value);
                                                if (isSingleDay) {
                                                    setExceptionEnd(e.target.value);
                                                }
                                            }}
                                            min={getTodayDate()}
                                            className="mt-1"
                                        />
                                    </div>
                                    {!isSingleDay && (
                                        <div>
                                            <Label className="text-xs text-text-subtle">إلى</Label>
                                            <Input
                                                type="date"
                                                value={exceptionEnd}
                                                onChange={(e) => setExceptionEnd(e.target.value)}
                                                min={exceptionStart || getTodayDate()}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Exception Type Selector */}
                            <div>
                                <Label className="text-sm font-medium mb-2">نوع الاستثناء</Label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exceptionType"
                                            value="ALL_DAY"
                                            checked={exceptionType === 'ALL_DAY'}
                                            onChange={(e) => setExceptionType(e.target.value as 'ALL_DAY')}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-sm">اليوم كامل</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exceptionType"
                                            value="PARTIAL_DAY"
                                            checked={exceptionType === 'PARTIAL_DAY'}
                                            onChange={(e) => setExceptionType(e.target.value as 'PARTIAL_DAY')}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-sm">أوقات محددة</span>
                                    </label>
                                </div>
                            </div>

                            {/* Time Range Picker (only for PARTIAL_DAY) */}
                            {exceptionType === 'PARTIAL_DAY' && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">الأوقات</Label>
                                        <button
                                            type="button"
                                            onClick={() => setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '17:00' }])}
                                            className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                                        >
                                            <span>+</span>
                                            <span>إضافة وقت آخر</span>
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {timeSlots.map((slot, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-xs text-text-subtle">من الساعة</Label>
                                                        <Input
                                                            type="time"
                                                            value={slot.startTime}
                                                            onChange={(e) => {
                                                                const newSlots = [...timeSlots];
                                                                newSlots[index].startTime = e.target.value;
                                                                setTimeSlots(newSlots);
                                                            }}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-text-subtle">إلى الساعة</Label>
                                                        <Input
                                                            type="time"
                                                            value={slot.endTime}
                                                            onChange={(e) => {
                                                                const newSlots = [...timeSlots];
                                                                newSlots[index].endTime = e.target.value;
                                                                setTimeSlots(newSlots);
                                                            }}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                {timeSlots.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
                                                        className="mt-5 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {/* Reason (Optional) */}
                            <div>
                                <Label className="text-sm font-medium">السبب (اختياري)</Label>
                                <select
                                    value={exceptionReason}
                                    onChange={(e) => setExceptionReason(e.target.value)}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">اختر السبب...</option>
                                    <option value="إجازة">إجازة</option>
                                    <option value="عطلة">عطلة</option>
                                    <option value="موعد طبي">موعد طبي</option>
                                    <option value="ظرف عائلي">ظرف عائلي</option>
                                    <option value="أخرى">أخرى</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setExceptionModalOpen(false);
                                        setExceptionStart('');
                                        setExceptionEnd('');
                                        setExceptionReason('');
                                        setExceptionType('ALL_DAY');
                                        setIsSingleDay(true);
                                        setTimeSlots([{ startTime: '09:00', endTime: '17:00' }]);
                                    }}
                                    className="flex-1"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handleAddException}
                                    disabled={!exceptionStart || (!isSingleDay && !exceptionEnd)}
                                    className="flex-1 bg-primary hover:bg-primary-hover"
                                >
                                    حجز الأيام
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TeacherApprovalGuard>
    );
}
