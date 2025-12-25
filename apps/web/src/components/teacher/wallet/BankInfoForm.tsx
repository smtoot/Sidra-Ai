'use client';

import { useForm } from 'react-hook-form';
import { UpsertBankInfoDto, walletApi } from '@/lib/api/wallet';
import { useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankInfoFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function BankInfoForm({ onSuccess, onCancel }: BankInfoFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<UpsertBankInfoDto>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: UpsertBankInfoDto) => {
        setLoading(true);
        setError(null);
        try {
            await walletApi.upsertBankInfo(data);
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save bank information');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">بيانات الحساب البنكي</h3>
                </div>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم البنك</label>
                        <input
                            {...register('bankName', { required: 'اسم البنك مطلوب' })}
                            className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                                errors.bankName ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-primary")}
                            placeholder="مثال: بنك الخرطوم"
                        />
                        {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الفرع (اختياري)</label>
                        <input
                            {...register('bankBranch')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="مثال: فرع الرياض"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم صاحب الحساب</label>
                        <input
                            {...register('accountHolderName', { required: 'اسم صاحب الحساب مطلوب' })}
                            className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                                errors.accountHolderName ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-primary")}
                            placeholder="الاسم كما يظهر في البنك"
                        />
                        {errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رقم الحساب</label>
                        <input
                            {...register('accountNumber', { required: 'رقم الحساب مطلوب' })}
                            className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                                errors.accountNumber ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-primary")}
                            dir="ltr"
                            placeholder="1234567890"
                        />
                        {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رمز السويفت (اختياري)</label>
                        <input
                            {...register('swiftCode')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            dir="ltr"
                            placeholder="BANKXSKH"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الآيبان (IBAN)</label>
                    <input
                        {...register('iban', {
                            minLength: { value: 15, message: 'رقم الآيبان يجب أن يكون 15 حرفاً على الأقل' }
                        })}
                        className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                            errors.iban ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-primary")}
                        dir="ltr"
                        placeholder="SD0000000000000000000000"
                    />
                    {errors.iban && <p className="text-red-500 text-xs mt-1">{errors.iban.message}</p>}
                    <p className="text-xs text-gray-500 mt-1">اختياري، لكن يفضل إضافته لضمان وصول التحويل.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <X className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'جاري الحفظ...' : (
                            <>
                                <Save className="w-4 h-4" />
                                حفظ البيانات
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
