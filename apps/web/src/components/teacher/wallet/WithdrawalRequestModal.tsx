'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { walletApi, WithdrawalRequestDto, BankInfo } from '@/lib/api/wallet';
import { X, Wallet as WalletIcon, AlertCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WithdrawalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    maxAmount: number;
    bankInfo: BankInfo;
}

export function WithdrawalRequestModal({ isOpen, onClose, onSuccess, maxAmount, bankInfo }: WithdrawalRequestModalProps) {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<WithdrawalRequestDto>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const amount = watch('amount');

    if (!isOpen) return null;

    const onSubmit = async (data: WithdrawalRequestDto) => {
        setLoading(true);
        setError(null);
        try {
            await walletApi.requestWithdrawal({ amount: Number(data.amount) });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to request withdrawal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <WalletIcon className="w-5 h-5 text-primary" />
                        طلب سحب أرباح
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Bank Snapshot Preview */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                        <p className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            حساب الاستقبال (تأكد من البيانات)
                        </p>
                        <div className="space-y-1 text-gray-600">
                            <div className="flex justify-between">
                                <span>البنك:</span>
                                <span className="font-medium text-gray-900">{bankInfo.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>صاحب الحساب:</span>
                                <span className="font-medium text-gray-900">{bankInfo.accountHolder}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>رقم الحساب:</span>
                                <span className="font-medium text-gray-900" dir="ltr">{bankInfo.accountNumberMasked}</span>
                            </div>
                            {bankInfo.ibanMasked && (
                                <div className="flex justify-between">
                                    <span>IBAN:</span>
                                    <span className="font-medium text-gray-900" dir="ltr">{bankInfo.ibanMasked}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المراد سحبه (SDG)</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register('amount', {
                                    required: 'المبلغ مطلوب',
                                    min: { value: 1, message: 'المبلغ غير صحيح' },
                                    max: { value: maxAmount, message: 'رصيدك الحالي غير كافٍ' },
                                    valueAsNumber: true
                                })}
                                className={cn("w-full px-4 py-3 border rounded-xl text-lg font-bold outline-none transition-all",
                                    errors.amount ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary")}
                                placeholder="0"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">SDG</div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                            <span className="text-red-500 h-4">{errors.amount?.message}</span>
                            <span className="text-gray-500">متاح للسحب: <b className="text-green-600">{maxAmount.toLocaleString()} SDG</b></span>
                        </div>
                    </div>

                    {/* Terms / Warning */}
                    <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>
                            سيتم خصم المبلغ من رصيدك المتاح فوراً وتعليقه حتى تكتمل عملية التحويل. تستغرق المعالجة عادةً 3-5 أيام عمل.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <X className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'جاري المعالجة...' : (
                            <>
                                <ArrowUpRight className="w-5 h-5" />
                                تأكيد طلب السحب
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
