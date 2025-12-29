'use client';

import { useState, useEffect } from 'react';
import { Palmtree, ToggleLeft, ToggleRight, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '@/lib/api';

interface VacationModeSettingsProps {
    isReadOnly?: boolean;
}

interface VacationStatus {
    isOnVacation: boolean;
    vacationStartDate: string | null;
    vacationEndDate: string | null;
    vacationReason: string | null;
}

interface VacationSettings {
    maxVacationDays: number;
}

export function VacationModeSettings({ isReadOnly = false }: VacationModeSettingsProps) {
    const [status, setStatus] = useState<VacationStatus | null>(null);
    const [settings, setSettings] = useState<VacationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [returnDate, setReturnDate] = useState('');
    const [showEnableForm, setShowEnableForm] = useState(false);
    const [pendingBookingsError, setPendingBookingsError] = useState<{ message: string; count: number } | null>(null);

    useEffect(() => {
        loadVacationData();
    }, []);

    const loadVacationData = async () => {
        try {
            setLoading(true);
            const [statusRes, settingsRes] = await Promise.all([
                api.get('/teacher/me/vacation-mode'),
                api.get('/teacher/vacation-settings')
            ]);
            setStatus(statusRes.data);
            setSettings(settingsRes.data);
        } catch (err) {
            console.error('Failed to load vacation settings', err);
            toast.error('فشل في تحميل إعدادات الإجازة');
        } finally {
            setLoading(false);
        }
    };

    const handleEnableVacation = async () => {
        if (isReadOnly || !returnDate) {
            toast.error('يرجى تحديد تاريخ العودة');
            return;
        }

        setSaving(true);
        try {
            const response = await api.patch('/teacher/me/vacation-mode', {
                isOnVacation: true,
                returnDate: returnDate
            });

            setStatus({
                isOnVacation: true,
                vacationStartDate: new Date().toISOString(),
                vacationEndDate: returnDate,
                vacationReason: null
            });
            setShowEnableForm(false);

            // Check for warning about confirmed bookings
            if (response.data.warning) {
                toast.warning(response.data.warning.message, {
                    duration: 6000,
                    icon: <AlertTriangle className="w-5 h-5" />
                });
            } else {
                toast.success('تم تفعيل وضع الإجازة');
            }
        } catch (err: any) {
            console.error('Failed to enable vacation mode', err);
            const errorData = err.response?.data;

            // Handle pending bookings block - show inline error with action
            if (errorData?.code === 'PENDING_BOOKINGS_EXIST') {
                setPendingBookingsError({
                    message: errorData.message,
                    count: errorData.count || 0
                });
                // Also show toast as backup notification
                toast.error(errorData.message);
            } else {
                setPendingBookingsError(null);
                toast.error(errorData?.message || 'فشل في تفعيل وضع الإجازة');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDisableVacation = async () => {
        if (isReadOnly) return;

        setSaving(true);
        try {
            await api.patch('/teacher/me/vacation-mode', {
                isOnVacation: false
            });
            setStatus({
                isOnVacation: false,
                vacationStartDate: null,
                vacationEndDate: null,
                vacationReason: null
            });
            toast.success('تم إيقاف وضع الإجازة - أنت متاح الآن');
        } catch (err) {
            console.error('Failed to disable vacation mode', err);
            toast.error('فشل في إيقاف وضع الإجازة');
        } finally {
            setSaving(false);
        }
    };

    // Calculate remaining days
    const getRemainingDays = () => {
        if (!status?.vacationEndDate) return null;
        const endDate = new Date(status.vacationEndDate);
        const now = new Date();
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Calculate max date for picker
    const getMaxDate = () => {
        if (!settings?.maxVacationDays) return '';
        return format(addDays(new Date(), settings.maxVacationDays), 'yyyy-MM-dd');
    };

    // Get min date (tomorrow)
    const getMinDate = () => {
        return format(addDays(new Date(), 1), 'yyyy-MM-dd');
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    <span className="text-sm text-amber-700">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm">وضع الإجازة</h3>
                {status?.isOnVacation && (
                    <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">مفعّل</span>
                )}
            </div>

            {/* Vacation Active State */}
            {status?.isOnVacation ? (
                <div className="bg-amber-100 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-200 rounded-full">
                            <Palmtree className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-900">أنت في إجازة حالياً</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                الطلاب يرونك في البحث لكن لا يمكنهم الحجز معك
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                        <Calendar className="w-4 h-4" />
                        <div>
                            <p>
                                <span className="font-medium">بدأت:</span>{' '}
                                {status.vacationStartDate && format(new Date(status.vacationStartDate), 'dd MMMM yyyy', { locale: ar })}
                            </p>
                            <p>
                                <span className="font-medium">تنتهي:</span>{' '}
                                {status.vacationEndDate && format(new Date(status.vacationEndDate), 'dd MMMM yyyy', { locale: ar })}
                                {getRemainingDays() !== null && (
                                    <span className="text-amber-600 mr-1">({getRemainingDays()} يوم متبقي)</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleDisableVacation}
                        disabled={isReadOnly || saving}
                        className={cn(
                            "w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                            "bg-white border border-amber-300 text-amber-800 hover:bg-amber-50",
                            isReadOnly && "opacity-60 cursor-not-allowed",
                            saving && "opacity-60"
                        )}
                    >
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الإيقاف...
                            </span>
                        ) : (
                            'إنهاء الإجازة الآن'
                        )}
                    </button>
                </div>
            ) : (
                <>
                    {/* Info text */}
                    <div className="text-xs text-gray-600 space-y-1">
                        <p>عند تفعيل وضع الإجازة:</p>
                        <ul className="list-disc list-inside mr-2 space-y-0.5">
                            <li>ستظهر في نتائج البحث مع شارة "في إجازة"</li>
                            <li>زر الحجز سيكون معطلاً للطلاب</li>
                            <li>الحجوزات المؤكدة ستبقى كما هي</li>
                        </ul>
                    </div>

                    {/* Toggle Button / Enable Form */}
                    {!showEnableForm ? (
                        <button
                            onClick={() => setShowEnableForm(true)}
                            disabled={isReadOnly}
                            className={cn(
                                "flex items-center gap-3 w-full p-3 rounded-lg border transition-all",
                                "bg-gray-50 border-gray-200 hover:bg-gray-100",
                                isReadOnly && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                            <div className="flex-1 text-right">
                                <p className="font-medium text-sm text-gray-600">وضع الإجازة معطّل</p>
                                <p className="text-xs text-gray-500">اضغط لتفعيل وضع الإجازة</p>
                            </div>
                        </button>
                    ) : (
                        <div className="bg-white rounded-lg p-4 border border-amber-200 space-y-4">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-600" />
                                تفعيل وضع الإجازة
                            </h4>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    تاريخ العودة <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    min={getMinDate()}
                                    max={getMaxDate()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    dir="ltr"
                                />
                                {settings?.maxVacationDays && (
                                    <p className="text-xs text-gray-500">
                                        الحد الأقصى: {settings.maxVacationDays} يوم
                                    </p>
                                )}
                            </div>

                            {/* Pending Bookings Error Alert */}
                            {pendingBookingsError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-red-800 font-medium">
                                                {pendingBookingsError.message}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href="/teacher/requests"
                                        className="block w-full text-center py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                    >
                                        عرض الطلبات المعلقة ({pendingBookingsError.count})
                                    </a>
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-800">
                                    سيتم إيقاف وضع الإجازة تلقائياً في تاريخ العودة المحدد
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnableVacation}
                                    disabled={isReadOnly || saving || !returnDate}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                                        "bg-amber-500 text-white hover:bg-amber-600",
                                        (isReadOnly || !returnDate) && "opacity-60 cursor-not-allowed",
                                        saving && "opacity-60"
                                    )}
                                >
                                    {saving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            جاري التفعيل...
                                        </span>
                                    ) : (
                                        'تفعيل وضع الإجازة'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEnableForm(false);
                                        setReturnDate('');
                                    }}
                                    disabled={saving}
                                    className="py-2 px-4 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
