'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { bookingApi, Booking } from '@/lib/api/booking';
import { walletApi, Wallet } from '@/lib/api/wallet';
import { X, Wallet as WalletIcon, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DepositModal from '../wallet/DepositModal';

interface PaymentModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentModal({ booking, isOpen, onClose, onSuccess }: PaymentModalProps) {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [showDepositSuccess, setShowDepositSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && booking) {
            loadWallet();
        }
    }, [isOpen, booking]);

    const loadWallet = async () => {
        setLoadingWallet(true);
        setShowDepositSuccess(false);
        try {
            const data = await walletApi.getMyBalance();
            setWallet(data);
        } catch (error) {
            console.error('Failed to load wallet:', error);
            toast.error('فشل في تحميل بيانات المحفظة');
        } finally {
            setLoadingWallet(false);
        }
    };

    const handlePayment = async () => {
        if (!booking || !wallet) return;

        const balance = Number(wallet.balance);
        const price = Number(booking.price);

        if (balance < price) {
            toast.error('رصيدك غير كافٍ');
            return;
        }

        setProcessing(true);
        try {
            await bookingApi.payBooking(booking.id);
            toast.success('تم الدفع بنجاح! ✅');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Payment failed:', error);
            toast.error(error?.response?.data?.message || 'فشل الدفع. حاول مرة أخرى.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDepositSuccess = () => {
        setIsDepositModalOpen(false);
        setShowDepositSuccess(true);
        loadWallet(); // Refresh wallet balance
    };

    const handleDepositClick = () => {
        setIsDepositModalOpen(true);
    };

    if (!isOpen || !booking) return null;

    const balance = wallet ? Number(wallet.balance) : 0;
    const price = Number(booking.price);
    const deficit = price - balance;
    const hasSufficientBalance = balance >= price;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-tajawal" dir="rtl">
                <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h3 className="font-bold text-2xl text-primary flex items-center gap-2">
                            <CreditCard className="w-6 h-6" />
                            تأكيد الدفع
                        </h3>
                        <Button variant="ghost" size="icon" onClick={onClose} disabled={processing}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Booking Details */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <h4 className="font-bold text-primary">تفاصيل الحجز</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-subtle">المعلم:</span>
                                    <span className="font-bold">{booking.teacherProfile?.user?.displayName || 'معلم'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-subtle">المادة:</span>
                                    <span className="font-bold">{booking.subject?.nameAr || 'مادة'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-subtle">التاريخ:</span>
                                    <span className="font-bold">
                                        {format(new Date(booking.startTime), 'EEEE، d MMMM yyyy', { locale: ar })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-subtle">الوقت:</span>
                                    <span className="font-bold">
                                        {format(new Date(booking.startTime), 'h:mm a', { locale: ar })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Wallet Balance */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-primary flex items-center gap-2">
                                    <WalletIcon className="w-5 h-5" />
                                    رصيد المحفظة
                                </h4>
                                {loadingWallet && (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-subtle">الرصيد المتاح:</span>
                                    <span className="font-bold text-xl">{balance.toFixed(2)} SDG</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-subtle">المبلغ المطلوب:</span>
                                    <span className="font-bold text-xl text-primary">{price.toFixed(2)} SDG</span>
                                </div>
                            </div>
                        </div>

                        {/* Insufficient Balance Warning */}
                        {!hasSufficientBalance && !loadingWallet && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 space-y-2">
                                        <p className="font-bold text-red-700">رصيدك الحالي غير كافٍ لإتمام الدفع</p>
                                        <p className="text-sm text-red-600">
                                            المبلغ المطلوب إضافته: <span className="font-bold">{deficit.toFixed(2)} SDG</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Deposit Success Message */}
                        {showDepositSuccess && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-blue-700">تم إرسال طلب الإيداع</p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            يمكنك إتمام الدفع بعد موافقة الإدارة على الإيداع (24-48 ساعة)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {hasSufficientBalance ? (
                                <Button
                                    onClick={handlePayment}
                                    disabled={processing || loadingWallet}
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-6 text-lg gap-3"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    {processing ? 'جاري الدفع...' : 'تأكيد الدفع'}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleDepositClick}
                                        disabled={loadingWallet}
                                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-6 text-lg gap-3"
                                    >
                                        <WalletIcon className="w-5 h-5" />
                                        إيداع رصيد الآن
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            onClose();
                                            window.location.href = '/parent/wallet';
                                        }}
                                        variant="outline"
                                        className="w-full border-2 border-gray-300 py-6 text-lg"
                                    >
                                        الانتقال للمحفظة
                                    </Button>
                                </>
                            )}

                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="w-full"
                                disabled={processing}
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deposit Modal (Nested) */}
            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                onSuccess={handleDepositSuccess}
            />
        </>
    );
}
