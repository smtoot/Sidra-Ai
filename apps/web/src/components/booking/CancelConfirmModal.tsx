'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingApi, CancelEstimate } from '@/lib/api/booking';

interface CancelConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    onSuccess?: () => void;
}

export function CancelConfirmModal({ isOpen, onClose, bookingId, onSuccess }: CancelConfirmModalProps) {
    const [estimate, setEstimate] = useState<CancelEstimate | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && bookingId) {
            loadEstimate();
        }
    }, [isOpen, bookingId]);

    const loadEstimate = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await bookingApi.getCancelEstimate(bookingId);
            setEstimate(data);
        } catch (err: any) {
            console.error('Failed to get cancel estimate:', err);
            setError(err?.response?.data?.message || 'فشل في تحميل معلومات الإلغاء');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!estimate?.canCancel) return;

        try {
            setCancelling(true);
            setError(null);
            await bookingApi.cancelBooking(bookingId, reason || undefined);
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Cancel failed:', err);
            setError(err?.response?.data?.message || 'فشل في إلغاء الحجز');
        } finally {
            setCancelling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-100 to-red-100 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        إلغاء الحجز
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                            <p className="text-text-subtle">جاري التحميل...</p>
                        </div>
                    ) : error && !estimate ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                            {error}
                        </div>
                    ) : estimate && !estimate.canCancel ? (
                        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
                            <p className="font-bold mb-1">لا يمكن إلغاء هذا الحجز</p>
                            <p className="text-sm">{estimate.reason}</p>
                        </div>
                    ) : estimate ? (
                        <>
                            {/* Refund Info */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-blue-700">
                                            {estimate.message}
                                        </p>
                                        {estimate.policy && (
                                            <p className="text-sm text-blue-600 mt-1">
                                                سياسة الإلغاء: {estimate.policy === 'FLEXIBLE' ? 'مرنة' :
                                                    estimate.policy === 'MODERATE' ? 'معتدلة' : 'صارمة'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            {estimate.refundAmount > 0 || estimate.teacherCompAmount > 0 ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">المبلغ المدفوع</span>
                                        <span className="font-bold">{estimate.refundAmount + estimate.teacherCompAmount} SDG</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">سيتم استرداده</span>
                                        <span className="font-bold text-green-600">{estimate.refundAmount} SDG</span>
                                    </div>
                                    {estimate.teacherCompAmount > 0 && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">تعويض المعلم</span>
                                            <span className="font-bold text-orange-600">{estimate.teacherCompAmount} SDG</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                                        <span className="font-bold">نسبة الاسترداد</span>
                                        <span className="font-bold text-primary">{estimate.refundPercent}%</span>
                                    </div>
                                </div>
                            ) : null}

                            {/* Reason Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    سبب الإلغاء (اختياري)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="اذكر سبب الإلغاء..."
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    rows={2}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                    disabled={cancelling}
                                >
                                    تراجع
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                >
                                    {cancelling ? (
                                        <>
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            جاري الإلغاء...
                                        </>
                                    ) : (
                                        'تأكيد الإلغاء'
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
