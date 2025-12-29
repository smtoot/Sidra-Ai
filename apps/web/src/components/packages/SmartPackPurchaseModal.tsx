'use client';

import { useState, useEffect } from 'react';
import { X, Package, Calendar, Clock, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { packageApi, PackageTier } from '@/lib/api/package';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addWeeks, startOfDay, setHours, setMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SmartPackPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (packageId: string) => void;
    teacherId: string;
    teacherName: string;
    subjectId: string;
    subjectName: string;
    pricePerSession: number;
}

const WEEKDAYS = [
    { value: 0, label: 'الأحد', short: 'أحد' },
    { value: 1, label: 'الإثنين', short: 'إثنين' },
    { value: 2, label: 'الثلاثاء', short: 'ثلاثاء' },
    { value: 3, label: 'الأربعاء', short: 'أربعاء' },
    { value: 4, label: 'الخميس', short: 'خميس' },
    { value: 5, label: 'الجمعة', short: 'جمعة' },
    { value: 6, label: 'السبت', short: 'سبت' },
];

const TIME_SLOTS = [
    { value: '08:00', label: '8:00 ص' },
    { value: '09:00', label: '9:00 ص' },
    { value: '10:00', label: '10:00 ص' },
    { value: '11:00', label: '11:00 ص' },
    { value: '12:00', label: '12:00 م' },
    { value: '13:00', label: '1:00 م' },
    { value: '14:00', label: '2:00 م' },
    { value: '15:00', label: '3:00 م' },
    { value: '16:00', label: '4:00 م' },
    { value: '17:00', label: '5:00 م' },
    { value: '18:00', label: '6:00 م' },
    { value: '19:00', label: '7:00 م' },
    { value: '20:00', label: '8:00 م' },
];

export function SmartPackPurchaseModal({
    isOpen,
    onClose,
    onSuccess,
    teacherId,
    teacherName,
    subjectId,
    subjectName,
    pricePerSession
}: SmartPackPurchaseModalProps) {
    const [step, setStep] = useState<'tier' | 'schedule' | 'confirm'>(

'tier');
    const [tiers, setTiers] = useState<PackageTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Form state
    const [selectedTier, setSelectedTier] = useState<PackageTier | null>(null);
    const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');
    const [firstSessionDate, setFirstSessionDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadTiers();
        }
    }, [isOpen]);

    const loadTiers = async () => {
        setLoading(true);
        try {
            const data = await packageApi.getTiers();
            setTiers(data.filter(t => t.isActive).sort((a, b) => a.displayOrder - b.displayOrder));
        } catch (err) {
            console.error('Failed to load tiers', err);
            toast.error('فشل في تحميل الباقات');
        } finally {
            setLoading(false);
        }
    };

    const handleTierSelect = (tier: PackageTier) => {
        setSelectedTier(tier);
        setStep('schedule');
    };

    const handleCheckAvailability = async () => {
        if (!selectedTier || dayOfWeek === null || !startTime || !firstSessionDate) {
            toast.error('يرجى إكمال جميع الحقول');
            return;
        }

        setCheckingAvailability(true);
        try {
            const [hours, minutes] = startTime.split(':');
            const endTime = `${String(Number(hours) + 1).padStart(2, '0')}:${minutes}`;

            const result = await packageApi.checkRecurringAvailability({
                teacherId,
                subjectId,
                tierId: selectedTier.id,
                dayOfWeek,
                startTime,
                endTime,
                timezone: 'Africa/Khartoum',
                firstSessionDate
            });

            if (result.available) {
                setStep('confirm');
            } else {
                toast.error('الوقت المختار غير متاح. يرجى اختيار وقت آخر.');
            }
        } catch (err: any) {
            console.error('Availability check failed', err);
            toast.error(err?.response?.data?.message || 'فشل في التحقق من التوفر');
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedTier || dayOfWeek === null || !startTime || !firstSessionDate) {
            return;
        }

        setPurchasing(true);
        try {
            const [hours, minutes] = startTime.split(':');
            const endTime = `${String(Number(hours) + 1).padStart(2, '0')}:${minutes}`;

            const pkg = await packageApi.purchaseSmartPack({
                teacherId,
                subjectId,
                tierId: selectedTier.id,
                recurringPattern: {
                    dayOfWeek,
                    startTime,
                    endTime,
                    timezone: 'Africa/Khartoum'
                },
                firstSessionDate
            });

            toast.success('تم شراء الباقة الذكية بنجاح!');
            onSuccess(pkg.id);
            onClose();
        } catch (err: any) {
            console.error('Purchase failed', err);
            toast.error(err?.response?.data?.message || 'فشل في شراء الباقة');
        } finally {
            setPurchasing(false);
        }
    };

    if (!isOpen) return null;

    const recurringCount = selectedTier ? Math.round(selectedTier.sessionCount * selectedTier.recurringRatio) : 0;
    const floatingCount = selectedTier ? selectedTier.sessionCount - recurringCount : 0;
    const discountedPrice = selectedTier ? pricePerSession * (1 - selectedTier.discountPercent / 100) : 0;
    const totalPrice = selectedTier ? discountedPrice * selectedTier.sessionCount : 0;
    const totalSavings = selectedTier ? (pricePerSession - discountedPrice) * selectedTier.sessionCount : 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">شراء باقة ذكية</h2>
                            <p className="text-sm text-gray-500">{teacherName} - {subjectName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Tier Selection */}
                    {step === 'tier' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                    1
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">اختر الباقة المناسبة</h3>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tiers.map((tier) => {
                                        const tierRecurringCount = Math.round(tier.sessionCount * tier.recurringRatio);
                                        const tierFloatingCount = tier.sessionCount - tierRecurringCount;
                                        const tierDiscountedPrice = pricePerSession * (1 - tier.discountPercent / 100);
                                        const tierTotalPrice = tierDiscountedPrice * tier.sessionCount;
                                        const tierSavings = (pricePerSession - tierDiscountedPrice) * tier.sessionCount;

                                        return (
                                            <button
                                                key={tier.id}
                                                onClick={() => handleTierSelect(tier)}
                                                className={cn(
                                                    "w-full p-5 rounded-xl border-2 transition-all text-right relative overflow-hidden",
                                                    tier.isFeatured
                                                        ? "border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg"
                                                        : "border-gray-200 bg-white hover:border-purple-200 hover:shadow-md"
                                                )}
                                            >
                                                {tier.isFeatured && (
                                                    <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        الأكثر شعبية
                                                    </div>
                                                )}
                                                {tier.badge && (
                                                    <div className="absolute top-3 left-3 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                                                        {tier.badge}
                                                    </div>
                                                )}

                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-lg font-bold text-gray-800">
                                                                {tier.nameAr || `باقة ${tier.sessionCount} حصص`}
                                                            </h4>
                                                            <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                                                خصم {tier.discountPercent}%
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-3">
                                                            {tierRecurringCount} حصة تلقائية + {tierFloatingCount} حصة مرنة
                                                        </p>
                                                        {tier.descriptionAr && (
                                                            <p className="text-xs text-gray-500 mb-2">{tier.descriptionAr}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-2xl font-black text-purple-600">
                                                            {tierTotalPrice.toLocaleString()}
                                                            <span className="text-sm font-medium text-gray-500 mr-1">SDG</span>
                                                        </div>
                                                        {tierSavings > 0 && (
                                                            <div className="text-xs text-green-600 font-bold">
                                                                وفر {tierSavings.toLocaleString()} SDG
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Schedule Selection */}
                    {step === 'schedule' && selectedTier && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                    2
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">حدد موعد الحصص التلقائية</h3>
                            </div>

                            {/* Selected Tier Summary */}
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-800">{selectedTier.nameAr || `باقة ${selectedTier.sessionCount} حصص`}</p>
                                        <p className="text-sm text-gray-600">{recurringCount} حصة تلقائية + {floatingCount} حصة مرنة</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setStep('tier')}>
                                        تغيير
                                    </Button>
                                </div>
                            </div>

                            {/* Day of Week Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline ml-1" />
                                    اليوم الأسبوعي
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {WEEKDAYS.map((day) => (
                                        <button
                                            key={day.value}
                                            onClick={() => setDayOfWeek(day.value)}
                                            className={cn(
                                                "p-3 rounded-lg border-2 font-bold text-sm transition-all",
                                                dayOfWeek === day.value
                                                    ? "border-purple-500 bg-purple-100 text-purple-700"
                                                    : "border-gray-200 text-gray-600 hover:border-purple-200"
                                            )}
                                        >
                                            {day.short}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 inline ml-1" />
                                    وقت البدء
                                </label>
                                <select
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                >
                                    <option value="">اختر الوقت</option>
                                    {TIME_SLOTS.map((slot) => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">مدة الحصة: ساعة واحدة</p>
                            </div>

                            {/* First Session Date */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    تاريخ أول حصة
                                </label>
                                <input
                                    type="date"
                                    value={firstSessionDate}
                                    onChange={(e) => setFirstSessionDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-blue-700 space-y-1">
                                        <p>• سيتم جدولة {recurringCount} حصة تلقائياً كل أسبوع بنفس اليوم والوقت</p>
                                        <p>• الحصص المرنة ({floatingCount} حصة) يمكن حجزها في أي وقت تختاره</p>
                                        <p>• يمكنك إعادة جدولة الحصص حتى {selectedTier.rescheduleLimit} مرات</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('tier')}
                                    className="flex-1"
                                >
                                    رجوع
                                </Button>
                                <Button
                                    onClick={handleCheckAvailability}
                                    disabled={!dayOfWeek || !startTime || !firstSessionDate || checkingAvailability}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    {checkingAvailability ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                            جاري التحقق...
                                        </>
                                    ) : (
                                        'التالي'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 'confirm' && selectedTier && dayOfWeek !== null && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                    3
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">تأكيد الشراء</h3>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                                    <h4 className="font-bold text-gray-800">ملخص الباقة</h4>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">الباقة</span>
                                        <span className="font-bold text-gray-800">
                                            {selectedTier.nameAr || `${selectedTier.sessionCount} حصص`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">حصص تلقائية</span>
                                        <span className="font-bold text-gray-800">{recurringCount} حصة</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">حصص مرنة</span>
                                        <span className="font-bold text-gray-800">{floatingCount} حصة</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">الموعد الأسبوعي</span>
                                        <span className="font-bold text-gray-800">
                                            {WEEKDAYS[dayOfWeek]?.label} - {TIME_SLOTS.find(t => t.value === startTime)?.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">أول حصة</span>
                                        <span className="font-bold text-gray-800">
                                            {format(new Date(firstSessionDate), 'd MMMM yyyy', { locale: ar })}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-purple-200 pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">السعر الأصلي</span>
                                        <span className="text-gray-500 line-through">
                                            {(pricePerSession * selectedTier.sessionCount).toLocaleString()} SDG
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-bold">الخصم ({selectedTier.discountPercent}%)</span>
                                        <span className="text-green-600 font-bold">
                                            -{totalSavings.toLocaleString()} SDG
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black">
                                        <span className="text-gray-800">الإجمالي</span>
                                        <span className="text-purple-600">
                                            {totalPrice.toLocaleString()} SDG
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-700">
                                        <p className="font-bold mb-1">شروط الباقة:</p>
                                        <ul className="space-y-1 mr-4">
                                            <li>• الباقة صالحة لمدة {selectedTier.durationWeeks} أسبوع من تاريخ الشراء</li>
                                            <li>• يمكنك إعادة جدولة الحصص حتى {selectedTier.rescheduleLimit} مرات</li>
                                            <li>• الحصص المرنة غير المستخدمة سيتم استردادها تلقائياً عند انتهاء الباقة</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('schedule')}
                                    className="flex-1"
                                    disabled={purchasing}
                                >
                                    رجوع
                                </Button>
                                <Button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                >
                                    {purchasing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                            جاري الشراء...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 ml-2" />
                                            تأكيد الشراء
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
