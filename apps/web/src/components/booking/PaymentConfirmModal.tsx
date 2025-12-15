'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi, Wallet } from '@/lib/api/wallet';
import { bookingApi, Booking } from '@/lib/api/booking';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PaymentConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onPaymentSuccess: () => void;
}

export function PaymentConfirmModal({
    isOpen,
    onClose,
    booking,
    onPaymentSuccess
}: PaymentConfirmModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchWallet();
        }
    }, [isOpen]);

    const fetchWallet = async () => {
        try {
            const data = await walletApi.getMyBalance();
            setWallet(data);
        } catch (err) {
            console.error('Failed to fetch wallet:', err);
            setError('فشل في تحميل بيانات المحفظة');
        }
    };

    if (!isOpen) return null;

    const price = Number(booking.price);
    const balance = wallet ? Number(wallet.balance) : 0;
    const hasSufficientBalance = balance >= price;

    const handlePay = async () => {
        if (!hasSufficientBalance) return;

        setIsLoading(true);
        setError(null);

        try {
            await bookingApi.payBooking(booking.id);
            onPaymentSuccess();
            onClose();
        } catch (err: any) {
            console.error('Payment failed:', err);
            setError(err.response?.data?.message || 'فشل في عملية الدفع، الرجاء المحاولة مرة أخرى');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-float max-w-md w-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined">payments</span>
                            تأكيد الدفع
                        </h2>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Summary */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">المعلم:</span>
                                <span className="font-bold text-gray-900">{booking.teacherProfile?.displayName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">المادة:</span>
                                <span className="font-bold text-gray-900">{booking.subject?.nameAr || booking.subjectId}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">التاريخ:</span>
                                <span className="font-bold text-gray-900">
                                    {format(new Date(booking.startTime), 'EEEE، d MMMM', { locale: ar })}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 my-4" />

                        {/* Payment Details */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">سعر الجلسة:</span>
                                <span className="text-lg font-bold text-primary font-sans">{price} ج.س</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">رصيد المحفظة:</span>
                                <span className={`text-lg font-bold font-sans ${hasSufficientBalance ? 'text-green-600' : 'text-red-500'}`}>
                                    {balance} ج.س
                                </span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                                <p>{error}</p>
                            </div>
                        )}

                        {!hasSufficientBalance && !error && wallet && (
                            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg mt-0.5">warning</span>
                                <p>رصيد المحفظة غير كافي. يرجى شحن المحفظة أولاً.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            إلغاء
                        </button>

                        {hasSufficientBalance ? (
                            <button
                                onClick={handlePay}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                                        جاري الدفع...
                                    </>
                                ) : (
                                    <>
                                        دفع الآن
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/parent/wallet')}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add_card</span>
                                شحن المحفظة
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </div >
    );
}
